# Optional AI evidence curation

`POST /api/research/ai-extract` produces a structured `AI_EXTRACTED_CANDIDATE` from supplied bibliographic metadata and an optional abstract. It never writes a validated record, changes graph eligibility, or enters the interaction decision path. A human reviewer must confirm the exact relationship, preparation, population, and source before validation.

The endpoint remains functional without an AI API key. It intentionally returns a review-ready candidate shell when no abstract is available.
