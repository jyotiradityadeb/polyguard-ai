import type {Knowledge} from '@/types/polyguard';
import {recordSchema,type ScientificRecord} from '@/types/scientific';
export function withScientificKnowledge(kb:Knowledge,raw:ScientificRecord[]):Knowledge{
 const records=raw.map(r=>recordSchema.parse(r));const result=structuredClone(kb);result.scientificRecords=records;result.extraNodes??=[];
 for(const r of records){
  // Identity is catalog information; pending observations are never interaction evidence.
  for(const n of [r.subject,r.object])if((n.kind==='drug'||n.kind==='herb')&&!result.entities.some(e=>e.id===n.id))result.entities.push({id:n.id,name:n.label,kind:n.kind,category:'Research catalog entry',aliases:[]});
  if(r.status!=='VALIDATED'||r.predicate!=='HERB_DRUG_INTERACTION'||r.interaction?.outcome!=='SIGNAL')continue;
  const pair=r.interaction;
  if(r.subject.kind!=='herb'||r.object.kind!=='drug'||r.subject.id!==pair.herbId||r.object.id!==pair.drugId)throw new Error('Scientific interaction endpoints mismatch');
  result.evidence.push({id:r.id,herbId:pair.herbId,drugId:pair.drugId,interactionType:r.predicate,potentialConcern:pair.potentialConcern,evidenceGrade:r.evidenceGrade,studyType:r.studyDesign,summary:r.summary,notes:`Preparation: ${pair.preparation}. ${r.limitations} Review: ${r.review?.notes}`,validated:true,isDemo:false,status:r.status,provenance:r.source,sourceTitle:r.source.title,sourceUrl:r.source.sourceUrl,publicationYear:r.source.publicationYear,pmid:r.source.pmid,doi:r.source.doi,timingRelevant:r.timingRelevant,timingNotes:r.timingNotes,reviewedBy:r.review?.reviewedBy,reviewedAt:r.review?.reviewedAt});
  const sourceId=`source:${r.source.id}`;if(!result.extraNodes.some(n=>n.id===sourceId))result.extraNodes.push({id:sourceId,label:`${r.source.sourceName} ${r.source.sourceRecordId}`,kind:'source'});
  result.links.push({id:`${r.id}:observation`,source:pair.herbId,target:pair.drugId,relationship:'Reviewed interaction observation',predicate:r.predicate,evidenceId:r.id,provenance:r.source,status:r.status},{id:`${r.id}:source`,source:sourceId,target:r.id,relationship:'Source provides evidence',predicate:'SOURCE_PROVIDES_EVIDENCE',evidenceId:r.id,provenance:r.source,status:r.status});
 }return result;
}
