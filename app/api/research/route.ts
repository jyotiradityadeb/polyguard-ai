import {NextResponse} from 'next/server';
import {getResearchRecords,qualitySummary,saveReview} from '@/lib/research/repository';
import {localResearchRequest} from '@/lib/research/local-access';
export const runtime='nodejs';
export async function GET(){try{const records=await getResearchRecords();return NextResponse.json({records,quality:qualitySummary(records)},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Research data are temporarily unavailable.'},{status:503});}}
export async function POST(request:Request){
 if(!localResearchRequest(request))return NextResponse.json({error:'Curation is available only in the local research interface.'},{status:403});
 try{const raw=await request.text();if(raw.length>16000)return NextResponse.json({error:'Review is too large.'},{status:413});return NextResponse.json(await saveReview(JSON.parse(raw)));}catch(e){const message=e instanceof Error?e.message:'';return NextResponse.json({error:message==='STALE_REVIEW'?'This record changed. Reload before reviewing.':'Review was not saved. Check required fields, source confirmation, and relationship scope.'},{status:message==='STALE_REVIEW'?409:400});}
}
