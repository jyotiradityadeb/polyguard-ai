import {XMLParser} from 'fast-xml-parser';
import {z} from 'zod';
import {candidate,node,source} from './common';
const list=(v:unknown):unknown[]=>v===undefined?[]:Array.isArray(v)?v:[v];
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):list(v).map(x=>Object.entries(object(x)).filter(([k])=>!k.startsWith('@_')).map(([,value])=>text(value)).join(' ')).join(' ').trim();
export function parsePubMed(xml:string,query:string,includeAbstract=false){
 if(xml.length>5000000||/<!ENTITY/i.test(xml))throw new Error('Unsupported XML');
 const root=object(new XMLParser({ignoreAttributes:false,parseTagValue:false,processEntities:false}).parse(xml));
 const articles=list(object(root.PubmedArticleSet).PubmedArticle);
 if(!articles.length)throw new Error('No PubMed articles in response');
 return articles.map(raw=>{
 const r=object(raw),citation=object(r.MedlineCitation),article=object(citation.Article),journal=object(article.Journal),date=object(object(journal.JournalIssue).PubDate);
 const pmid=z.string().regex(/^\d+$/).parse(text(citation.PMID)),title=text(article.ArticleTitle);
 const ids=list(object(r.PubmedData).ArticleIdList).flatMap(x=>list(object(x).ArticleId));
 const doi=ids.find(x=>object(x)['@_IdType']==='doi');const year=text(date.Year)||text(date.MedlineDate).match(/\d{4}/)?.[0];
 const s={...source('PubMed',pmid,`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,'NCBI EFetch XML',raw,'PubMed bibliographic metadata; abstracts may be copyrighted. See https://www.ncbi.nlm.nih.gov/About/disclaimer.html'),pmid,title,authors:list(object(article.AuthorList).Author).map(a=>[text(object(a).ForeName),text(object(a).LastName)||text(object(a).CollectiveName)].filter(Boolean).join(' ')),journal:text(journal.Title),publicationYear:year?Number(year):undefined,doi:doi?text(doi):undefined,query,abstract:includeAbstract?text(object(article.Abstract).AbstractText):undefined};
 return candidate({id:`pubmed-${pmid}`,source:s,subject:node(`publication:${pmid}`,title,'evidence'),predicate:'LITERATURE_CANDIDATE',object:node(`source:pubmed:${pmid}`,`PubMed ${pmid}`,'source'),summary:'Retrieved literature candidate. No relationship or evidence grade has been inferred from indexing or publication type.',limitations:'A PubMed entry is not validation of a drug interaction. Review the study, preparation, population, findings, and applicability.'});
 });
}
export async function importPubMed(pmids:string[],query:string,includeAbstract=false){if(!pmids.length||pmids.length>30||pmids.some(p=>!/^\d+$/.test(p)))throw new Error('Supply 1–30 PubMed IDs');const params=new URLSearchParams({db:'pubmed',id:pmids.join(','),retmode:'xml',tool:'PolyGuardResearch'});if(process.env.NCBI_EMAIL)params.set('email',process.env.NCBI_EMAIL);const response=await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${params}`,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`PubMed returned HTTP ${response.status}`);return parsePubMed(await response.text(),query,includeAbstract);}
