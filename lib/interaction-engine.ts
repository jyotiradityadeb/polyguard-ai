import {
  requestSchema,
  type Analysis,
  type Knowledge,
  type GraphNode,
  type GraphEdge,
  type Interaction,
  type Evidence,
} from "@/types/polyguard";
import { resolve } from "./normalization";
import { interactionLoad } from "./interaction-load";
export const gradeLabels: Record<string, string> = {
  A: "Controlled human clinical",
  B: "Human observational / case-based",
  C: "Animal / preclinical",
  D: "In-vitro laboratory",
  E: "Mechanistic / theoretical",
  U: "Insufficient evidence",
};
export const noEvidence =
  "No known interaction signals were found in the current PolyGuard knowledge base.";
const gradeOrder = ["A", "B", "C", "D", "E", "U"];
export function analyze(raw: unknown, kb: Knowledge): Analysis {
  const input = requestSchema.parse(raw);
  const unknownEntities: string[] = [];
  const collect = (values: string[], kind: "herb" | "drug" | "product") => [
    ...new Map(
      values.flatMap((v) => {
        const e = resolve(v, kb.entities, kind);
        if (!e) {
          unknownEntities.push(v);
          return [];
        }
        return [[e.id, e] as const];
      }),
    ).values(),
  ];
  const drugs = collect(input.drugs, "drug"),
    products = collect(input.products, "product");
  const herbs = collect(
    [...input.herbs, ...products.flatMap((p) => p.ingredients ?? [])],
    "herb",
  );
  const allowed = kb.evidence.filter((e) =>
    e.isDemo ? input.includeDemo : e.validated && (!e.status||e.status==='VALIDATED'),
  );
  const validIds = new Set(allowed.map((e) => e.id));
  const links = kb.links.filter((l) => validIds.has(l.evidenceId));
  const allNodes: GraphNode[] = [
    ...(kb.extraNodes??[]),
    ...kb.entities.map((e) => ({ id: e.id, label: e.name, kind: e.kind })),
    ...kb.pathways.map((p) => ({ id: p.id, label: p.name, kind: "pathway" })),
    ...kb.phytochemicals.map((p) => ({
      id: p.id,
      label: p.name,
      kind: "phytochemical",
    })),
    ...allowed.map((e) => ({ id: e.id, label: e.id, kind: "evidence" })),
  ];
  const interactions: Interaction[] = [];
  const uncoveredPairs: string[] = [];
  for (const herb of herbs)
    for (const drug of drugs) {
      const records = allowed.filter(
        (e) => e.herbId === herb.id && e.drugId === drug.id,
      );
      if (!records.length) {
        uncoveredPairs.push(`${herb.name} + ${drug.name}`);
        continue;
      }
      const ids = new Set(records.map((e) => e.id));
      const relevant = links.filter((l) => ids.has(l.evidenceId));
      const edges: GraphEdge[] = relevant.map((l) => ({
        id: l.id,
        source: l.source,
        target: l.target,
        label: l.relationship,
        evidenceId: l.evidenceId,
        predicate:l.predicate,provenance:l.provenance,status:l.status,
      }));
      const nodeIds = new Set([
        herb.id,
        drug.id,
        ...records.map((e) => e.id),
        ...edges.flatMap((e) => [e.source, e.target]),
      ]);
      const path = allNodes.filter((n) => nodeIds.has(n.id));
      const rank: Evidence["potentialConcern"][] = [
        "UNKNOWN",
        "LOW",
        "MODERATE",
        "HIGH",
      ];
      interactions.push({
        id: `${herb.id}-${drug.id}`,
        herb,
        drug,
        evidence: records,
        potentialConcern: records
          .map((e) => e.potentialConcern)
          .sort((a, b) => rank.indexOf(b) - rank.indexOf(a))[0],
        evidenceGrade: records
          .map((e) => e.evidenceGrade)
          .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b))[0],
        isDemo: records.some((e) => e.isDemo),
        path,
        edges,
      });
    }
  const selected = new Set([...herbs, ...drugs].map((e) => e.id));
  const usedEdges = [
    ...new Map(
      interactions.flatMap((i) => i.edges).map((e) => [e.id, e]),
    ).values(),
  ];
  const sharedPathways = kb.pathways.flatMap((p) => {
    const connecting = links.filter(
      (l) => l.target === p.id && selected.has(l.source),
    );
    const substanceIds = [...new Set(connecting.map((l) => l.source))];
    if (
      substanceIds.length < 3 ||
      !substanceIds.some((id) => herbs.some((h) => h.id === id)) ||
      !substanceIds.some((id) => drugs.some((d) => d.id === id))
    )
      return [];
    return [
      {
        id: p.id,
        name: p.name,
        substances: substanceIds.map(
          (id) => kb.entities.find((e) => e.id === id)!.name,
        ),
        evidenceIds: [...new Set(connecting.map((l) => l.evidenceId))],
      },
    ];
  });
  return {
    regimen: { drugs, herbs, products },
    summary: {
      substancesAnalyzed: herbs.length + drugs.length,
      interactionCount: interactions.length,
      strongestEvidence:
        interactions
          .map((i) => i.evidenceGrade)
          .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b))[0] ??
        "U",
      interactionLoad: interactionLoad(
        interactions.map((i) => i.potentialConcern),
        sharedPathways.length,
      ),
    },
    interactions,
    sharedPathways,
    graph: {
      nodes: [
        ...new Map(
          interactions.flatMap((i) => i.path).map((n) => [n.id, n]),
        ).values(),
      ],
      edges: usedEdges,
    },
    unknownEntities: [...new Set(unknownEntities)],
    uncoveredPairs,
    limitations: [
      "This does not guarantee that the combination is risk-free. Some interactions may not yet have been studied or included.",
      "This prototype checks herb–drug pairs only; drug–drug and herb–herb interactions are not evaluated.",
      "Dose, preparation, duration, individual health, and ingredient quantities are not modeled.",
      "Shared pathways are mechanistic signals, not proof of harm.",
    ],
    demo: interactions.some((i) => i.isDemo),
    researchCandidates:kb.scientificRecords?.filter(r=>r.status!=='REJECTED'&&[r.subject.id,r.object.id].some(id=>selected.has(id))),
  };
}
