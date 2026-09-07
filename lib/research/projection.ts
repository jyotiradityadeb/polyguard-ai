import type { Knowledge, Evidence } from '@/types/polyguard';
import { recordSchema, type ScientificRecord } from '@/types/scientific';

const gradeRank: Record<Evidence['evidenceGrade'], number> = { A: 0, B: 1, C: 2, D: 3, E: 4, U: 5 };
function sourceNode(id: string, label: string, result: Knowledge) { result.extraNodes ??= []; if (!result.extraNodes.some((n) => n.id === id)) result.extraNodes.push({ id, label, kind: 'source' }); }
function addLink(result: Knowledge, link: Knowledge['links'][number]) { result.links.push(link); }

/** Projects reviewed research records and composes independent validated edges into mechanism-only signals. */
export function withScientificKnowledge(kb: Knowledge, raw: ScientificRecord[]): Knowledge {
  const records = raw.map((r) => recordSchema.parse(r));
  const result = structuredClone(kb); result.scientificRecords = records; result.extraNodes ??= [];
  const validated = records.filter((r) => r.status === 'VALIDATED');
  for (const r of records) for (const n of [r.subject, r.object]) {
    if ((n.kind === 'drug' || n.kind === 'herb') && !result.entities.some((e) => e.id === n.id)) result.entities.push({ id: n.id, name: n.label, kind: n.kind, category: 'Research catalog entry', aliases: [] });
    if (n.kind === 'phytochemical' && !result.phytochemicals.some((p) => p.id === n.id)) result.phytochemicals.push({ id: n.id, name: n.label, externalIds: Object.entries(n.identifiers).map(([k, v]) => `${k}:${v}`) });
    if (n.kind === 'target' && !result.pathways.some((p) => p.id === n.id)) result.pathways.push({ id: n.id, name: n.label, type: 'enzyme_or_transporter' });
  }
  for (const r of validated) {
    const sourceId = `source:${r.source.id}`; sourceNode(sourceId, `${r.source.sourceName} ${r.source.sourceRecordId}`, result);
    const herbId = r.interaction?.herbId ?? (r.subject.kind === 'herb' ? r.subject.id : undefined);
    const drugId = r.interaction?.drugId ?? (r.object.kind === 'drug' ? r.object.id : undefined);
    if (!herbId || !drugId) continue;
    const direct = r.predicate === 'HERB_DRUG_INTERACTION' && r.interaction?.outcome === 'SIGNAL';
    result.evidence.push({ id: r.id, herbId, drugId, interactionType: r.predicate, potentialConcern: r.interaction?.potentialConcern ?? 'UNKNOWN', evidenceGrade: r.evidenceGrade, studyType: r.studyDesign, summary: r.summary, notes: r.interaction ? `Preparation: ${r.interaction.preparation}. ${r.limitations}` : r.limitations, validated: true, isDemo: false, status: r.status, signalType: direct ? 'DIRECT_CLINICAL' : 'EXPERIMENTAL', linkedNodeIds: [r.subject.id, r.object.id], provenance: r.source, sourceTitle: r.source.title, sourceUrl: r.source.sourceUrl, publicationYear: r.source.publicationYear, pmid: r.source.pmid, doi: r.source.doi, timingRelevant: r.timingRelevant, timingNotes: r.timingNotes, reviewedBy: r.review?.reviewedBy, reviewedAt: r.review?.reviewedAt });
    addLink(result, { id: `${r.id}:relation`, source: r.subject.id, target: r.object.id, relationship: r.predicate.replaceAll('_', ' '), predicate: r.predicate, evidenceId: r.id, provenance: r.source, status: r.status });
    addLink(result, { id: `${r.id}:source`, source: sourceId, target: r.id, relationship: 'Source provides evidence', predicate: 'SOURCE_PROVIDES_EVIDENCE', evidenceId: r.id, provenance: r.source, status: r.status });
  }
  const contains = validated.filter((r) => r.predicate === 'HERB_CONTAINS_PHYTOCHEMICAL' && r.subject.kind === 'herb' && r.object.kind === 'phytochemical');
  const targets = validated.filter((r) => ['PHYTOCHEMICAL_INHIBITS_TARGET', 'PHYTOCHEMICAL_INDUCES_TARGET', 'PHYTOCHEMICAL_TESTED_AGAINST_TARGET'].includes(r.predicate) && r.subject.kind === 'phytochemical');
  const substrates = validated.filter((r) => r.predicate === 'DRUG_IS_SUBSTRATE_OF' && r.subject.kind === 'drug');
  for (const c of contains) for (const t of targets.filter((x) => x.subject.id === c.object.id)) for (const d of substrates.filter((x) => x.object.id === t.object.id)) {
    const id = `MECH:${c.id}:${t.id}:${d.id}`; if (result.evidence.some((e) => e.id === id)) continue;
    const grade = [c, t, d].map((x) => x.evidenceGrade).sort((a, b) => gradeRank[a] - gradeRank[b])[2];
    result.evidence.push({ id, herbId: c.subject.id, drugId: d.subject.id, interactionType: 'MECHANISTIC_PATH', potentialConcern: 'UNKNOWN', evidenceGrade: grade, studyType: 'Composed independent evidence', summary: `${c.subject.label} contains ${c.object.label}; ${c.object.label} has a validated ${t.predicate.replaceAll('_', ' ').toLowerCase()} record for ${t.object.label}; ${d.subject.label} is a validated substrate of ${d.object.label}.`, notes: 'Mechanistic path only. A graph path does not establish a clinically significant interaction.', validated: true, isDemo: false, status: 'VALIDATED', signalType: 'MECHANISTIC', linkedNodeIds: [c.subject.id, c.object.id, t.object.id, d.subject.id], provenance: c.source, sourceTitle: 'Composed multi-source evidence path', sourceUrl: c.source.sourceUrl });
    for (const r of [c, t, d]) addLink(result, { id: `${id}:${r.id}`, source: r.subject.id, target: r.object.id, relationship: r.predicate.replaceAll('_', ' '), predicate: r.predicate, evidenceId: id, provenance: r.source, status: r.status });
  }
  return result;
}
