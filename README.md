# PolyGuard AI

**Evidence Intelligence for Mixed-Medicine Safety**

A local, demoable biomedical informatics prototype. PolyGuard normalizes a mixed regimen, retrieves structured herb–drug evidence, shows concern independently from evidence strength, and exposes the recorded mechanism graph.

## Scientific status

**DEMO DATA — NOT SCIENTIFICALLY VALIDATED**

The seed contains **12 herbs, 12 medicines, one illustrative four-herb formulation, 24 synthetic interaction records, and two synthetic pathways**. There are **zero validated medical interaction records**. All interaction pairings, concern levels, evidence grades, and pathway associations are software fixtures. They are not claims about the named medicines or herbs. No publications, PMIDs, DOIs, clinical findings, CYP associations, or phytochemical relationships have been invented. There are no seeded phytochemicals.

Catalog names and aliases identify entries; they do not establish pharmacological equivalence across preparations. Brahmi resolves specifically to the catalog's Bacopa monnieri entry. Brand aliases are illustrative and are not an exhaustive regional product catalog.

## Run locally

Node.js 22.18 or newer compatible Node 22; npm. No cloud account or AI key is required.

```powershell
npm ci
Copy-Item .env.example .env  # First setup only; preserve an existing .env
npm run db:setup
npm run dev
```

Open **http://127.0.0.1:3000**. The only environment variable is:

```dotenv
DATABASE_URL="file:./dev.db"
```

Relative SQLite paths resolve from `prisma/`. The setup script creates the file when needed for Windows compatibility, generates Prisma Client, applies the checked-in migration, and seeds the database. Stop the server before regenerating Prisma Client on Windows, where the loaded database library can be locked.

Production:

```powershell
npm run build
npm start
```

Run one server on port 3000 at a time. `npm start -- --port 3001` selects another port. This application uses a Node server and a local SQLite file; it is not a static export or a Cloudflare Workers deployment. Hosting requires a persistent writable disk and an appropriate deployment plan. Nothing has been publicly deployed.

## One-minute demo

1. Click **Try Demo**. This loads Metformin, Atorvastatin, Ashwagandha, and Turmeric and enables synthetic evidence.
2. Click **Analyze Regimen**. See four synthetic pair signals and two shared synthetic pathways.
3. Compare the separate concern and simulated evidence badges. One fixture has UNKNOWN concern, so the load is **Incomplete**, with eight known informational points.
4. Open **Why was this flagged?**. Inspect the actual stored connection rows and click their nodes.
5. Switch to **Research Mode** for botanical names, study type, source availability, and curation notes.
6. Click **View in graph** to highlight the selected interaction's nodes and links.
7. Try Warfarin with Turmeric: no record is available. The result states that missing evidence does not guarantee a risk-free combination.
8. Add **Herbal Immunity Formula** to expand Amla, Giloy, Tulsi, and Turmeric. For another product, enter its ingredients manually.

## Architecture and modules

Checkpoint **D5** is implemented incrementally: A (core flow), B (evidence paths and modes), C (React Flow graph), D1 (provenance/import infrastructure), D2 (review-pending source candidates and curation), D3 (counterfactual explorer), D4 (PK sandbox contract), and D5 (printable clinical discussion report). No validated interaction path or validated PK model is claimed or shipped.

| Area           | Files                                                           | Responsibility                                                                             |
| -------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| App            | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`             | Single-page workspace, metadata, responsive theme                                          |
| Inputs/results | `components/workspace.tsx`, `components/substance-input.tsx`    | Search, keyboard selection, chips, product expansion, result views, race-safe analysis     |
| Evidence views | `components/evidence-card.tsx`, `components/evidence-graph.tsx` | Expandable source cards, stored edge paths, regimen-only graph and highlighting            |
| UI primitive   | `components/ui/button.tsx`                                      | Local shadcn-style composable Radix Slot button                                            |
| Domain         | `types/polyguard.ts`                                            | Zod schemas and typed API/domain objects                                                   |
| Normalization  | `lib/normalization.ts`                                          | Unicode normalization, exact canonical/alias matching, punctuation and whitespace handling |
| Engine         | `lib/interaction-engine.ts`, `lib/interaction-load.ts`          | Deterministic retrieval, deduplication, shared paths, coverage, configurable load          |
| Data access    | `lib/db.ts`, `lib/evidence.ts`, `lib/evidence-validation.ts`    | Prisma access, parsing, provenance validation and curation gates                           |
| Database       | `prisma/schema.prisma`, `prisma/migrations/`                    | SQLite schema and repeatable migrations                                                    |
| Evidence       | `data/knowledge.json`, `scripts/seed.ts`                        | Structured data independent of UI; transactional upsert seed                               |
| Tests          | `tests/interaction-engine.test.ts`, `tests/api.test.ts`         | Engine, normalization, provenance, API validation and outage coverage                      |

| Research layer | `lib/importers/*`, `lib/research/*`, `lib/pk-sandbox.ts`, `lib/discussion-report.ts` | Bounded public-source imports, human review, gated PK model, and printable discussion summary |

The stack is Next.js App Router, React, TypeScript, Tailwind CSS, a local shadcn-style UI primitive, Zod, Prisma 6/SQLite, React Flow, and Vitest. Prisma is pinned to 6.12.0 to avoid the dependency advisory present in the initially installed 6.19.3 tooling. The final lockfile is the tested dependency baseline.

### APIs

- `GET /api/catalog`: catalog entities and aliases; 503 when the database is unavailable.
- `POST /api/analyze`: bounded JSON regimen; 400 for invalid input, 413 for excessive payload length, 503 for database failure. Results are `no-store`; no submitted regimen is persisted.

```json
{
  "drugs": ["Glucophage", "Atorvastatin"],
  "herbs": ["Haldi", "Ashwagandha"],
  "products": [],
  "includeDemo": true
}
```

Returns normalized `regimen`, `summary`, `interactions`, `sharedPathways`, `graph`, `unknownEntities`, `uncoveredPairs`, `limitations`, and `demo`. Raw database rows are mapped to domain objects before use.

### Deterministic behavior

Normalization applies Unicode NFKC, lowercase, punctuation-to-space conversion, trimming, and whitespace collapse. Canonical names, IDs, botanical names, and explicit aliases match exactly after normalization. There is no fuzzy conversion or free-text LLM extraction. Duplicate aliases and product ingredients collapse by canonical ID. Unknown names remain visible and are never silently mapped.

For every herb × medicine pair, the engine retrieves eligible direct evidence, copies stored grades and concerns, and projects only explicitly stored, provenance-linked graph edges. It does not manufacture a new pairwise interaction solely from pathway similarity. Shared pathways separately summarize recorded associations involving at least three selected substances, including a herb and a medicine. Each shared pathway lists supporting evidence IDs. No biological causality is inferred.

Interaction Load adds LOW = 1, MODERATE = 2, HIGH = 3 per detected pair, plus 1 per qualifying shared pathway. Thresholds are Low 0–2, Moderate 3–5, Elevated 6+. UNKNOWN contributes no invented weight and marks the load Incomplete. The UI exposes the calculation and explicitly states it is not a validated clinical risk score. Missing pairs and unrecognized substances are separately disclosed; a low or zero load is not a safety conclusion.

Evidence Path displays actual edge directions as labeled connection rows, instead of inventing a linear causal chain. Missing compounds/pathways are omitted. The React Flow graph uses the same nodes and edges, supports zoom/pan and interaction highlighting, and provides node provenance. The evidence-card controls provide a keyboard-friendly alternative to graph exploration.

### Data model and curation

`Entity` stores herbs, drugs, and products with separate `Alias` and `ProductIngredient` relations. `Pathway` and `Phytochemical` store mechanism nodes. `InteractionEvidence` stores pair endpoints, optional mechanism identifiers, independent concern and grade, study type, source fields, notes, and validation/demo flags. `EvidenceLink` stores typed relationship text and provenance for herb–compound, compound–pathway, herb–pathway, drug–pathway, and source associations without fabricating missing links.

Schema validation rejects dangling or duplicate IDs, unknown formulation ingredients, evidence endpoints with incorrect entity kinds, and links extending beyond their evidence record's scope. Demo records cannot be validated or contain citations. Non-demo unvalidated drafts are excluded from analysis. Validated records require an HTTPS source URL; **human scientific review remains necessary**—schema validation cannot verify a paper's truth or relevance.

To add team-reviewed evidence, edit `data/knowledge.json`, assign real reviewed source metadata and correctly classified evidence, add only supported links, then run the tests and `npm run db:seed`. Seeding uses upserts and preserves unrelated existing database records. To retire a previously seeded record, explicitly mark it non-demo and unvalidated; deleting it from JSON alone does not delete the database row. Back up the database before curation changes.

`scripts/create-demo.ts` generated the initial fixtures. It is a development-only generator; do not rerun it over curated evidence. Phytochemical records and relationship types are supported but deliberately left empty until supplied with evidence.

### AI and privacy

No LLM is used. All explanations are deterministic templates or stored summaries. No `/api/explain` endpoint, AI dependency, or secret is needed. This makes the app functional without an API key, rate limits, or an external provider. An optional future explanation layer must accept only structured evidence and preserve the safety constraints.

A feature-detected WebMCP bridge exposes the same local analysis flow to supporting browsers. It validates inputs with the same schema and updates the visible workspace. Unsupported browsers simply use the standard UI. It is not an autonomous agent or a medical recommendation system.

### Research workflow

Research Mode adds a knowledge-base status panel, review-pending candidate records, a local curation queue at `/research/curation`, the Counterfactual Regimen Explorer, the gated Mechanistic PK Sandbox, and **Generate Clinical Discussion Report**. Counterfactuals exclude herb/supplement graph nodes only and report structural edge changes; they never propose medication changes. The report opens as printable HTML and contains neutral questions for professional discussion. It is not a treatment plan.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm audit
```

Unit/API tests cover known synthetic interactions, unknown/no-evidence cases, aliases, multiple substances, deduplication, product decomposition, shared pathways, load thresholds, demo filtering, missing mechanisms, invalid input, citation guards, dangling links, request size, and sanitized database errors. Browser checks cover the full demo, keyboard aliases, modes, evidence expansion, graph highlighting/node inspection, unknown ingredients, product decomposition, and mobile layout.

## Remaining optional work

Human-reviewed scientific evidence is the most important next step. Optional checkpoint D work includes authenticated evidence curation, exportable reports, OCR with manual confirmation, multilingual presentation, and a strictly constrained LLM explanation layer. Clinical validation, comprehensive interaction coverage, dose/preparation modeling, and drug–drug/herb–herb analysis are outside this prototype.

PolyGuard provides educational information based on available interaction evidence. It is not intended to diagnose, treat, prescribe, or replace advice from a qualified healthcare professional. Do not start, stop, or change medication based solely on PolyGuard results.
