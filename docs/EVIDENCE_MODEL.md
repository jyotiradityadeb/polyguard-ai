# Evidence model

PolyGuard keeps four layers distinct:

1. **Data**: an imported source record, assay, identity, plant-part observation, or reviewed interaction.
2. **Inference**: deterministic graph calculations such as shared-pathway counts and counterfactual edge participation.
3. **Simulation**: a model scenario with explicit parameter units, sources, assumptions, and a validation status.
4. **Clinical discussion**: a printable evidence summary with neutral questions for a qualified professional.

The status lifecycle is `DEMO`, `IMPORTED`, `REVIEW_PENDING`, `VALIDATED`, or `REJECTED`. Import always creates `REVIEW_PENDING`; a source record or PubMed presence cannot become `VALIDATED` automatically. Only a reviewed, non-demo `HERB_DRUG_INTERACTION` record with an explicit outcome is projected into interaction analysis.

Graph predicates distinguish plant occurrence, identity, tested-against assay records, explicit target activity, drug CYP relationships, literature support, and source provenance. An assay is never upgraded to inhibition by chemical similarity. Every projected edge carries its evidence ID and, when available, its source record.

Evidence grades derive from explicit study design: A controlled human, B observational/case, C animal/preclinical, D in-vitro, E mechanistic, U unspecified. Grade is evidence type, not clinical risk.

The current repository includes public-source candidate metadata and imported records under `data/imported/`, but no validated production interaction paths. The synthetic graph remains available only as clearly labeled regression/demo data.
