'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {ScientificRecord} from '@/types/scientific';
import {ScientificEvidence} from './scientific-evidence';
export function ResearchOverview({candidates}:{candidates?:ScientificRecord[]}){
 const [records,setRecords]=useState<ScientificRecord[]>([]),[error,setError]=useState('');
 useEffect(()=>{fetch('/api/research').then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error);setRecords(b.records);}).catch(e=>setError(e.message));},[]);
 return <section className="research-overview"><div className="evidence-title"><h3>Knowledge base status</h3><Link href="/research/curation" className="text-link">Open curation queue →</Link></div>{error&&<p role="alert">{error}</p>}<div className="quality-grid"><div><strong>{records.filter(r=>r.status==='VALIDATED'&&r.interaction?.outcome==='SIGNAL').length}</strong><span>Validated interaction paths</span></div><div><strong>{records.filter(r=>['IMPORTED','REVIEW_PENDING'].includes(r.status)).length}</strong><span>Imported / pending review</span></div><div><strong>24</strong><span>Synthetic regression records</span></div></div><p>Imported sources: {[...new Set(records.map(r=>r.source.sourceName))].join(' · ')||'None loaded'}. Dataset records do not automatically establish interactions.</p>{candidates&&<details><summary>Related research records ({candidates.length})</summary><p>These observations include pending and null-effect evidence. They are separate from the validated signal count and Interaction Load.</p>{candidates.map(r=><article className="source-card" key={r.id}><ScientificEvidence record={r}/></article>)}</details>}</section>;
}
