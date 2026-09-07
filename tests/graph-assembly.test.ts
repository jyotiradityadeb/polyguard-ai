import { describe, expect, it } from 'vitest';
import { goldRecords } from '@/data/source/gold-records';
import { withScientificKnowledge } from '@/lib/research/projection';
import { validateKnowledge } from '@/lib/evidence-validation';
import { reconcileCompounds } from '@/lib/research/identity';

const base = { entities: [
  { id: 'turmeric', name: 'Turmeric', kind: 'herb' as const, category: 'herb', aliases: [] },
  { id: 'licorice', name: 'Licorice', kind: 'herb' as const, category: 'herb', aliases: [] },
  { id: 'garlic', name: 'Garlic', kind: 'herb' as const, category: 'herb', aliases: [] },
  { id: 'alprazolam', name: 'Alprazolam', kind: 'drug' as const, category: 'drug', aliases: [] },
  { id: 'midazolam', name: 'Midazolam', kind: 'drug' as const, category: 'drug', aliases: [] },
  { id: 'saquinavir', name: 'Saquinavir', kind: 'drug' as const, category: 'drug', aliases: [] },
], pathways: [], phytochemicals: [], evidence: [], links: [] };

describe('validated multi-source graph assembly', () => {
  it('composes herb, compound, target, and drug records without creating a clinical claim', () => {
    const kb = validateKnowledge(withScientificKnowledge(base, goldRecords));
    const mechanism = kb.evidence.find((e) => e.signalType === 'MECHANISTIC' && e.herbId === 'turmeric' && e.drugId === 'alprazolam');
    expect(mechanism).toBeTruthy();
    expect(mechanism?.linkedNodeIds).toEqual(expect.arrayContaining(['turmeric', 'pubchem:969516', 'CYP3A4', 'alprazolam']));
    expect(kb.evidence.find((e) => e.id === mechanism?.id)?.signalType).toBe('MECHANISTIC');
    expect(kb.evidence.find((e) => e.signalType === 'DIRECT_CLINICAL')?.herbId).toBe('garlic');
  });
  it('preserves provenance on every composed edge', () => {
    const kb = validateKnowledge(withScientificKnowledge(base, goldRecords));
    const mech = kb.evidence.find((e) => e.signalType === 'MECHANISTIC')!;
    const links = kb.links.filter((l) => l.evidenceId === mech.id);
    expect(links.length).toBe(3);
    expect(links.every((l) => l.provenance?.sourceUrl.startsWith('https://'))).toBe(true);
  });
  it('does not join compounds by display name when identifiers conflict', () => {
    const rows = [goldRecords[0], { ...goldRecords[0], id: 'ambiguous', object: { ...goldRecords[0].object, label: 'Different label' } }];
    const report = reconcileCompounds(rows).report;
    expect(report.some((r) => r.outcome === 'AMBIGUOUS')).toBe(true);
  });
});
