import {NextResponse} from 'next/server';
import {z} from 'zod';
import {extractCandidate} from '@/lib/ai-curation';
const inputSchema=z.object({abstract:z.string().max(100000).optional(),pmid:z.string().regex(/^\d+$/).optional(),doi:z.string().max(300).optional(),title:z.string().max(1000).optional()});
export const runtime='nodejs';
export async function POST(request:Request){try{const body=inputSchema.parse(await request.json()); return NextResponse.json(extractCandidate(body),{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Could not create an AI_EXTRACTED_CANDIDATE.'},{status:400});}}
