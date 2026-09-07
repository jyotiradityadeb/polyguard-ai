import { knowledgeSchema, type Knowledge } from "@/types/polyguard";
export function validateKnowledge(raw: unknown): Knowledge {
  const kb = knowledgeSchema.parse(raw);
  const ids = [
    ...kb.entities,
    ...kb.pathways,
    ...kb.phytochemicals,
    ...kb.evidence,
    ...(kb.extraNodes??[]),
  ].map((e) => e.id);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate entity IDs");
  const nodes = new Set(ids),
    evidence = new Set(kb.evidence.map((e) => e.id));
  for (const e of kb.evidence) {
    if (
      !kb.entities.some((x) => x.id === e.herbId && x.kind === "herb") ||
      !kb.entities.some((x) => x.id === e.drugId && x.kind === "drug")
    )
      throw new Error("Invalid evidence endpoints");
    if (e.pathwayId && !kb.pathways.some((p) => p.id === e.pathwayId))
      throw new Error("Invalid pathway");
    if (
      e.phytochemicalId &&
      !kb.phytochemicals.some((p) => p.id === e.phytochemicalId)
    )
      throw new Error("Invalid phytochemical");
    if (
      e.isDemo &&
      (e.validated || e.pmid || e.doi || e.sourceTitle || e.sourceUrl)
    )
      throw new Error("Demo evidence cannot contain validation or citations");
    if (e.validated && !e.sourceUrl)
      throw new Error("Validated evidence requires a reviewed source URL");
  }
  if (new Set(kb.links.map((l) => l.id)).size !== kb.links.length)
    throw new Error("Duplicate graph link IDs");
  for (const link of kb.links) {
    if (
      !nodes.has(link.source) ||
      !nodes.has(link.target) ||
      !evidence.has(link.evidenceId)
    )
      throw new Error("Dangling graph link");
    const record = kb.evidence.find((e) => e.id === link.evidenceId)!;
    const scope = new Set([
      record.id,
      record.herbId,
      record.drugId,
      record.pathwayId,
      record.phytochemicalId,
      record.provenance?`source:${record.provenance.id}`:undefined,
      ...record.linkedNodeIds,
    ]);
    if (!scope.has(link.source) || !scope.has(link.target))
      throw new Error("Graph link exceeds its evidence scope");
  }
  for (const product of kb.entities.filter((e) => e.kind === "product"))
    for (const id of product.ingredients ?? [])
      if (!kb.entities.some((e) => e.kind === "herb" && e.id === id))
        throw new Error("Unknown product ingredient");
  return kb;
}
