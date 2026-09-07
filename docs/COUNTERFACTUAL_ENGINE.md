# Counterfactual engine

`lib/counterfactual.ts` performs graph-only exclusion scenarios. Automatic candidates are selected from herb nodes that participate in detected signals; prescription drugs are never proposed for exclusion. Product ingredients are already decomposed into herb nodes.

For each scenario, the engine clones the analysis, removes the selected herb nodes and their evidence interactions, recomputes graph edges, shared pathways, interaction load, affected evidence grades, and affected status counts. The original analysis is not mutated.

For the small regimen sizes used in the demo, exact enumeration evaluates every subset. Larger regimens are bounded to subsets of at most three herbs. The result describes structural coverage only: signals before/after, affected edges, and pathways changed. It is never a treatment optimizer or a recommendation to discontinue anything.
