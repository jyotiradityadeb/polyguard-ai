# External data and provenance

Source checks: 2026-09-08. No importer auto-validates evidence. A download is not a clinical finding. All source records retain name, record ID, HTTPS URL, retrieval timestamp, import method, usage note, content hash, and available version/citation fields. Review decisions are stored separately and survive re-imports.

| Source | Adapter and permitted scope | Usage/access notes |
|---|---|---|
| [IMPPAT 2.0](https://cb.imsc.res.in/imppat/) | Permission-confirmed normalized JSON: botanical name, plant part, phytochemical and identifiers. Plant occurrence only. | Source states CC BY-NC 4.0. No whole-dataset scrape or redistribution is performed. File importer requires `--terms-confirmed`. Preserve original record IDs. |
| [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | Explicit CID properties; separately supplied BioAssay measurements with target and AID. Identity never establishes activity. | Respect the service's 5 requests/second maximum; this CLI issues small explicit requests. Contributor-specific terms may apply. Retain attribution. |
| [ChEMBL API](https://www.ebi.ac.uk/chembl/api/data/docs) | Explicit molecule/target activity query, bounded to 20 records. Always TESTED_AGAINST, never automatic inhibitor classification. | [ChEMBL data licensing](https://chembl.github.io/chembl-licensing/): CC BY-SA 3.0. Preserve attribution, API retrieval time and release if supplied. Software license is distinct from data license. |
| [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25497/) | Batched, explicit PMID retrieval, citation metadata, optional locally retained abstract. No automatic grade from indexing. | No more than 3 requests/second without a key. Bibliographic presence is not validation. [NCBI disclaimer](https://www.ncbi.nlm.nih.gov/About/disclaimer.html): abstracts may be copyrighted. Default importer omits abstracts. Optional `NCBI_EMAIL` identifies the developer for NCBI requests; no key is required. |
| [Flockhart Table](https://drug-interactions.medicine.iu.edu/) | Permission-confirmed team file containing drug/CYP relationships. No transporter import. | No clear bulk redistribution permission was established during this implementation. Do not scrape or bundle the table. File importer requires `--terms-confirmed` and record-specific usage notes. CYP substrate status alone does not establish a clinically important effect. |

## CLI

`npx tsx scripts/import-data.ts pubmed 15801937,17468862 "explicit literature review candidates"`

`npx tsx scripts/import-data.ts pubchem 969516`

`npx tsx scripts/import-data.ts chembl CHEMBL140 CHEMBL340`

The last command illustrates explicit identifiers, not an endorsement of target relevance. Resolve and inspect target identity before interpreting returned assays.

For restricted/file workflows consult the exact Zod input contracts in `lib/importers/files.ts`. No credentials or arbitrary server-side fetch URL are accepted through the web UI. CLI imports are bounded, explicit, and fail on unavailable sources. Re-running the same source record does not overwrite a review. Raw abstract/full-text archives are not bundled.

## Evidence boundary

IMPPAT occurrence, PubChem identity, assay activity, CYP drug relationships, and human interaction observations are different assertions. They must retain independent provenance and review. There is no automatic chemical-similarity inference, assay-to-clinical conversion, or plant-to-isolated-compound extrapolation.

## Review workflow

`npx tsx scripts/import-data.ts` accepts bounded, explicit source identifiers and writes candidate records with source metadata and `REVIEW_PENDING` status. `npx tsx scripts/seed-research.ts` imports checked-in candidates into the local SQLite review queue without overwriting prior decisions. Open `/research/curation` to inspect records and record a human review. This local hackathon interface has no authentication and must not be exposed publicly.
