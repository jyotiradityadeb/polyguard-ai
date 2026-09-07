import { PrismaClient } from "@prisma/client";
import data from "../data/knowledge.json";
import { validateKnowledge } from "../lib/evidence-validation";
const db = new PrismaClient();
const kb = validateKnowledge(data);
try {
  await db.$transaction(async (tx) => {
    for (const entity of kb.entities) {
      const { aliases, ingredients, ...base } = entity;
      void ingredients;
      await tx.entity.upsert({
        where: { id: base.id },
        create: base,
        update: base,
      });
      await tx.alias.deleteMany({ where: { entityId: base.id } });
      await tx.alias.createMany({
        data: aliases.map((value) => ({ entityId: base.id, value })),
      });
    }
    for (const p of kb.entities.filter((e) => e.kind === "product")) {
      await tx.productIngredient.deleteMany({ where: { productId: p.id } });
      await tx.productIngredient.createMany({
        data: (p.ingredients ?? []).map((herbId) => ({
          productId: p.id,
          herbId,
        })),
      });
    }
    for (const p of kb.pathways)
      await tx.pathway.upsert({ where: { id: p.id }, create: p, update: p });
    for (const p of kb.phytochemicals) {
      const row = { ...p, externalIds: JSON.stringify(p.externalIds) };
      await tx.phytochemical.upsert({
        where: { id: p.id },
        create: row,
        update: row,
      });
    }
    for (const e of kb.evidence)
      await tx.interactionEvidence.upsert({
        where: { id: e.id },
        create: e,
        update: e,
      });
    for (const l of kb.links)
      await tx.evidenceLink.upsert({
        where: { id: l.id },
        create: l,
        update: l,
      });
  });
  console.log(
    `Seeded ${kb.entities.length} catalog entities and ${kb.evidence.length} clearly labeled demo evidence records. No validated medical evidence.`,
  );
} finally {
  await db.$disconnect();
}
