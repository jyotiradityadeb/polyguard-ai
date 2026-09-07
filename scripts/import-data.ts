import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {importPubChem,parsePubChemAssay} from '../lib/importers/pubchem';
import {importChEMBL} from '../lib/importers/chembl';
import {importPubMed} from '../lib/importers/pubmed';
import {parseIMPPAT,parseFlockhart} from '../lib/importers/files';
import {importRecords} from '../lib/research/repository';
import {db} from '../lib/db';
const [adapter,...args]=process.argv.slice(2);
try{
 const rows=adapter==='pubchem'?await importPubChem(Number(args[0])):adapter==='chembl'?await importChEMBL(args[0],args[1]):adapter==='pubmed'?await importPubMed(args[0].split(','),args[1]??'Explicit PMID list supplied by researcher'):adapter==='imppat'?parseIMPPAT(JSON.parse(readFileSync(args[0],'utf8')),args.includes('--terms-confirmed')):adapter==='flockhart'?parseFlockhart(JSON.parse(readFileSync(args[0],'utf8')),args.includes('--terms-confirmed')):adapter==='pubchem-assay'?[parsePubChemAssay(JSON.parse(readFileSync(args[0],'utf8')))]:null;
 if(!rows)throw new Error('Usage: tsx scripts/import-data.ts pubmed <ids> <query> | pubchem <CID> | chembl <moleculeID> <targetID> | imppat/flockhart <file> --terms-confirmed | pubchem-assay <file>');
 mkdirSync('data/imported',{recursive:true});writeFileSync(`data/imported/${adapter}-${Date.now()}.json`,JSON.stringify(rows,null,2));console.log(await importRecords(rows));
}finally{await db.$disconnect();}
