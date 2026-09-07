import {createHash} from 'node:crypto';
import {recordSchema,type ScientificRecord,type SourceRecord} from '@/types/scientific';
export function candidate(fields:Partial<ScientificRecord>&Pick<ScientificRecord,'id'|'source'|'subject'|'predicate'|'object'|'summary'|'limitations'>):ScientificRecord{return recordSchema.parse({...fields,status:'REVIEW_PENDING',review:undefined,revision:0,evidenceGrade:'U'});}
export function source(name:SourceRecord['sourceName'],id:string,url:string,method:string,raw:unknown,usageNote:string):SourceRecord{return {id:`${name}:${id}`,sourceName:name,sourceRecordId:id,sourceUrl:url,retrievedAt:new Date().toISOString(),usageNote,importMethod:method,authors:[],contentHash:createHash('sha256').update(JSON.stringify(raw)).digest('hex')};}
export async function getJson(url:string){const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`Source request returned HTTP ${response.status}`);return response.json();}
export const node=(id:string,label:string,kind:ScientificRecord['subject']['kind'])=>({id,label,kind,identifiers:{}});
