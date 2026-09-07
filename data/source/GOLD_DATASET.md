# PolyGuard Gold Dataset

The limited gold subset is defined in `gold-records.ts` and loaded by `npm run db:setup`. It contains reviewed provenance records for five herbs, real phytochemical identities, CYP3A4 mechanism records, probe-drug substrate records, and one direct human garlic–saquinavir signal.

The application keeps these counts separate:

- Gold validated records and composed mechanistic paths
- Review-pending imported candidates
- Synthetic regression fixtures

Gold status means the relationship and source scope were reviewed for this demonstration subset. A composed path is mechanistic evidence only; it is never promoted to a clinical claim without a separately reviewed human interaction record.
