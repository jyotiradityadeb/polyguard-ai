import type { ScientificRecord } from '@/types/scientific';

export type IdentityOutcome = 'MATCHED' | 'AMBIGUOUS' | 'UNRESOLVED';
export type ReconciliationRow = { recordId: string; label: string; outcome: IdentityOutcome; canonicalId?: string; reason: string };

export function reconcileCompounds(records: ScientificRecord[]) {
  const compounds = new Map<string, { id: string; canonicalName: string; pubchemCid?: string; chemblId?: string; imppatId?: string; inchiKey?: string; smiles?: string; synonyms: string[]; identityStatus: IdentityOutcome }>();
  const report: ReconciliationRow[] = [];
  for (const r of records) for (const n of [r.subject, r.object]) if (n.kind === 'phytochemical') {
    const i = n.identifiers; const key = i.inchiKey ? `inchi:${i.inchiKey}` : i.pubchemCID ? `pubchem:${i.pubchemCID}` : i.chemblId ? `chembl:${i.chemblId}` : undefined;
    if (!key) { report.push({ recordId: r.id, label: n.label, outcome: 'UNRESOLVED', reason: 'No identifier-backed identity supplied.' }); continue; }
    const id = key.replaceAll(':', '-').toLowerCase(); const current = compounds.get(id);
    if (current && current.canonicalName.toLowerCase() !== n.label.toLowerCase()) { current.identityStatus = 'AMBIGUOUS'; report.push({ recordId: r.id, label: n.label, outcome: 'AMBIGUOUS', canonicalId: id, reason: 'Identifier was observed with conflicting labels.' }); continue; }
    compounds.set(id, { id, canonicalName: current?.canonicalName ?? n.label, pubchemCid: i.pubchemCID, chemblId: i.chemblId, imppatId: i.imppatId, inchiKey: i.inchiKey, smiles: i.smiles, synonyms: [...new Set([...(current?.synonyms ?? []), n.label])], identityStatus: 'MATCHED' });
    report.push({ recordId: r.id, label: n.label, outcome: 'MATCHED', canonicalId: id, reason: 'Identifier-backed match.' });
  }
  return { compounds: [...compounds.values()], report };
}
