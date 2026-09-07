# IMPPAT source drop

This directory is reserved for a team-supplied, normalized IMPPAT subset. PolyGuard does not scrape IMPPAT. Files must be used under the team's licensed or otherwise permission-compatible access terms.

The gold demo records are defined in `data/source/gold-records.ts` and imported by `npm run db:setup`. A supplied row should contain:

```json
{
  "imppatId": "…",
  "herb": { "canonicalName": "Turmeric", "botanicalName": "Curcuma longa" },
  "compound": { "canonicalName": "Curcumin", "pubchemCID": "969516", "inchiKey": "…" },
  "part": "rhizome",
  "sourceRecordId": "…",
  "sourceUrl": "https://cb.imsc.res.in/imppat/"
}
```

Names alone must not reconcile compounds. Prefer InChIKey, then PubChem CID or ChEMBL ID; unresolved and ambiguous rows stay in the reconciliation report.
