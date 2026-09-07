import { db } from "./db";
import { validateKnowledge } from "./evidence-validation";
import { getResearchRecords } from './research/repository';
import { withScientificKnowledge } from './research/projection';
export async function getKnowledge() {
  const [entities, pathways, phytochemicals, evidence, links] =
    await Promise.all([
      db.entity.findMany({ include: { aliases: true, ingredients: true } }),
      db.pathway.findMany(),
      db.phytochemical.findMany(),
      db.interactionEvidence.findMany(),
      db.evidenceLink.findMany(),
    ]);
  if (!entities.length) throw new Error("Knowledge base has not been seeded");
  const base=validateKnowledge({
    entities: entities.map((e) => ({
      ...e,
      scientificName: e.scientificName ?? undefined,
      aliases: e.aliases.map((a) => a.value),
      ingredients: e.ingredients.map((i) => i.herbId),
    })),
    pathways,
    phytochemicals: phytochemicals.map((p) => ({
      ...p,
      externalIds: JSON.parse(p.externalIds),
    })),
    evidence: evidence.map((e) =>
      Object.fromEntries(
        Object.entries(e).map(([k, v]) => [k, v === null ? undefined : v]),
      ),
    ),
    links,
  });
  return validateKnowledge(withScientificKnowledge(base,await getResearchRecords()));
}
