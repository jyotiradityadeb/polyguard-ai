import { db } from '@/lib/db';
import { recordSchema,reviewRecord,type ScientificRecord } from '@/types/scientific';
export async function getResearchRecords(){return (await db.researchRecord.findMany({orderBy:{id:'asc'}})).map(r=>recordSchema.parse({...JSON.parse(r.payload),status:r.status,revision:r.revision}));}
export async function importRecords(records:ScientificRecord[], preserveStatus = false){
 const parsed=records.map(r=>recordSchema.parse(preserveStatus ? r : {...r,status:'REVIEW_PENDING',review:undefined,revision:0,timingRelevant:false,recommendedIntervalFromSource:undefined}));
 return db.$transaction(async tx=>{
 let inserted=0;
 for(const r of parsed){
  if(await tx.researchRecord.findUnique({where:{id:r.id}}))continue; // Never overwrite human decisions on re-import.
  const s=r.source;
  await tx.researchSource.upsert({where:{id:s.id},create:{id:s.id,sourceName:s.sourceName,sourceRecordId:s.sourceRecordId,sourceUrl:s.sourceUrl,retrievedAt:s.retrievedAt,payload:JSON.stringify(s)},update:{}});
  await tx.researchRecord.create({data:{id:r.id,sourceId:s.id,status:r.status,predicate:r.predicate,payload:JSON.stringify(r)}});inserted++;
 }return {inserted,skipped:parsed.length-inserted};
 });
}
export async function saveReview(input:unknown){
 const {reviewSchema}=await import('@/types/scientific');const decision=reviewSchema.parse(input);
 return db.$transaction(async tx=>{
 const row=await tx.researchRecord.findUnique({where:{id:decision.id}});if(!row)throw new Error('NOT_FOUND');
 const current=recordSchema.parse({...JSON.parse(row.payload),status:row.status,revision:row.revision});const updated=reviewRecord(current,decision);
 const count=await tx.researchRecord.updateMany({where:{id:current.id,revision:current.revision},data:{status:updated.status,revision:updated.revision,payload:JSON.stringify(updated)}});if(count.count!==1)throw new Error('STALE_REVIEW');
 await tx.researchReview.create({data:{recordId:current.id,fromStatus:current.status,toStatus:updated.status,reviewer:updated.review!.reviewedBy,reviewedAt:updated.review!.reviewedAt,notes:updated.review!.notes,revision:updated.revision}});
 return updated;
 });
}
export function qualitySummary(records:ScientificRecord[]){return {counts:Object.fromEntries(['DEMO','IMPORTED','REVIEW_PENDING','VALIDATED','REJECTED'].map(status=>[status,records.filter(r=>r.status===status).length])),validatedPaths:records.filter(r=>r.status==='VALIDATED'&&r.interaction?.outcome==='SIGNAL').length,sources:[...new Set(records.map(r=>r.source.sourceName))],herbs:new Set(records.filter(r=>r.subject.kind==='herb').map(r=>r.subject.id)).size,medicines:new Set(records.filter(r=>r.object.kind==='drug').map(r=>r.object.id)).size};}
