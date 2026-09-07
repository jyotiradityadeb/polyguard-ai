import type {Analysis} from '@/types/polyguard';
import {interactionLoad} from './interaction-load';
export const counterfactualDisclaimer='THIS IS A HYPOTHETICAL NETWORK SCENARIO, NOT A RECOMMENDATION TO DISCONTINUE ANY SUBSTANCE.';
export type GraphScenario={id:string;scenario:string[];names:string[];signalsBefore:number;signalsAfter:number;affectedSignals:string[];affectedEdges:string[];sharedPathwaysChanged:string[];evidenceStrengths:Record<string,number>;evidenceStatuses:Record<string,number>;result:Analysis};
export function graphScenario(original:Analysis,exclude:string[]):GraphScenario{
 const eligible=new Set(original.regimen.herbs.map(h=>h.id));
 if(!exclude.length||exclude.some(id=>!eligible.has(id)))throw new Error('Only selected herb nodes are eligible for automatic scenarios');
 const removed=new Set(exclude);const result=structuredClone(original);
 const affected=original.interactions.filter(i=>removed.has(i.herb.id));
 result.interactions=result.interactions.filter(i=>!removed.has(i.herb.id));
 result.regimen.herbs=result.regimen.herbs.filter(h=>!removed.has(h.id));
 // Filter the already-expanded herb nodes. Product expansion must not reintroduce excluded ingredients.
 const edges=[...new Map(result.interactions.flatMap(i=>i.edges).map(e=>[e.id,e])).values()];
 const retainedEdgeIds=new Set(edges.map(e=>e.id));
 const affectedEdges=original.graph.edges.filter(e=>!retainedEdgeIds.has(e.id)).map(e=>e.id);
 const remainingHerbNames=new Set(result.regimen.herbs.map(h=>h.name));const remainingNames=new Set([...remainingHerbNames,...result.regimen.drugs.map(d=>d.name)]);
 result.sharedPathways=result.sharedPathways.flatMap(p=>{const substances=p.substances.filter(n=>remainingNames.has(n));return substances.length>=3&&substances.some(n=>remainingHerbNames.has(n))?[{...p,substances}]:[];});
 result.graph={nodes:[...new Map(result.interactions.flatMap(i=>i.path).map(n=>[n.id,n])).values()],edges};
 result.summary.interactionCount=result.interactions.length;
 result.summary.substancesAnalyzed=result.regimen.herbs.length+result.regimen.drugs.length;
 result.summary.interactionLoad=interactionLoad(result.interactions.map(i=>i.potentialConcern),result.sharedPathways.length);
 result.summary.strongestEvidence=result.interactions.map(i=>i.evidenceGrade).sort((a,b)=>'ABCDEU'.indexOf(a)-'ABCDEU'.indexOf(b))[0]??'U';
 const evidence=[...new Map(affected.flatMap(i=>i.evidence).map(e=>[e.id,e])).values()];
 const count=(values:string[])=>values.reduce<Record<string,number>>((a,v)=>({...a,[v]:(a[v]??0)+1}),{});
 return {id:[...removed].sort().join('+'),scenario:[...removed].sort(),names:original.regimen.herbs.filter(h=>removed.has(h.id)).map(h=>h.name),signalsBefore:original.interactions.length,signalsAfter:result.interactions.length,affectedSignals:affected.map(i=>i.id),affectedEdges,sharedPathwaysChanged:original.sharedPathways.filter(p=>{const next=result.sharedPathways.find(x=>x.id===p.id);return !next||next.substances.length!==p.substances.length;}).map(p=>p.name),evidenceStrengths:count(evidence.map(e=>e.evidenceGrade)),evidenceStatuses:count(evidence.map(e=>e.isDemo?'DEMO':e.status??'VALIDATED')),result};
}
export function exploreCounterfactuals(original:Analysis){
 const eligible=original.regimen.herbs.filter(h=>original.interactions.some(i=>i.herb.id===h.id));
 const singles=eligible.map(h=>graphScenario(original,[h.id])).sort((a,b)=>a.signalsAfter-b.signalsAfter||a.id.localeCompare(b.id));
 // Exact subset enumeration up to 16 involved herbs. Larger networks use an explicitly bounded k<=3 search.
 const exact=eligible.length<=16;const maxSize=exact?eligible.length:Math.min(3,eligible.length);
 const frontier:GraphScenario[]=[];let minimumCover:GraphScenario|null=null;let enumerated=0;
 for(let size=1;size<=maxSize;size++){
  let bestIds:string[]|null=null;let bestRemaining=Infinity;
  function visit(start:number,ids:string[]){if(ids.length===size){enumerated++;const excluded=new Set(ids);const remaining=original.interactions.filter(i=>!excluded.has(i.herb.id)).length;if(remaining<bestRemaining||(remaining===bestRemaining&&ids.join('+').localeCompare(bestIds?.join('+')??'')<0)){bestIds=ids;bestRemaining=remaining;}return;}for(let i=start;i<=eligible.length-(size-ids.length);i++)visit(i+1,[...ids,eligible[i].id]);}
  visit(0,[]);
  if(bestIds){const winner=graphScenario(original,bestIds);frontier.push(winner);if(winner.signalsAfter===0){minimumCover=winner;break;}}
 }
 const centrality = original.graph.nodes.filter(n=>['pathway','phytochemical'].includes(n.kind)).map(n=>({id:n.id,name:n.label,kind:n.kind,edges:original.graph.edges.filter(e=>e.source===n.id||e.target===n.id).length,signalCount:new Set(original.graph.edges.filter(e=>e.source===n.id||e.target===n.id).map(e=>e.evidenceId)).size})).sort((a,b)=>b.signalCount-a.signalCount||b.edges-a.edges);
 return {disclaimer:counterfactualDisclaimer,participation:singles.map(s=>{const affected=original.interactions.filter(i=>s.scenario.includes(i.herb.id)); const nodes=[...new Set(affected.flatMap(i=>i.path.filter(n=>['pathway','phytochemical'].includes(n.kind)).map(n=>n.label)))]; return {herbId:s.scenario[0],name:s.names[0],signals:s.signalsBefore-s.signalsAfter,edges:s.affectedEdges.length,mechanismNodes:nodes,signalTypes:[...new Set(affected.flatMap(i=>i.evidence.map(e=>e.signalType)))]};}),bottlenecks:centrality.slice(0,5),singles,frontier,minimumCover,exact,enumerated,searchLimit:exact?16:3};
}
