import { writeFileSync, mkdirSync } from "node:fs";
import type { Knowledge, Entity } from "../types/polyguard";
const herbs = [
  ["ashwagandha", "Ashwagandha", "Withania somnifera", "Indian ginseng"],
  ["turmeric", "Turmeric", "Curcuma longa", "Haldi"],
  ["giloy", "Giloy", "Tinospora cordifolia", "Guduchi"],
  ["tulsi", "Tulsi", "Ocimum tenuiflorum", "Holy basil"],
  ["amla", "Amla", "Phyllanthus emblica", "Indian gooseberry"],
  ["ginger", "Ginger", "Zingiber officinale", "Adrak"],
  ["garlic", "Garlic", "Allium sativum", "Lahsun"],
  ["fenugreek", "Fenugreek", "Trigonella foenum-graecum", "Methi"],
  ["licorice", "Licorice", "Glycyrrhiza glabra", "Liquorice"],
  ["neem", "Neem", "Azadirachta indica", "Nimba"],
  ["brahmi", "Brahmi", "Bacopa monnieri", "Bacopa"],
  ["shatavari", "Shatavari", "Asparagus racemosus", "Shatavar"],
];
const drugs = [
  ["metformin", "Metformin", "Glucophage"],
  ["atorvastatin", "Atorvastatin", "Lipitor"],
  ["warfarin", "Warfarin", "Coumadin"],
  ["amlodipine", "Amlodipine", "Norvasc"],
  ["losartan", "Losartan", "Cozaar"],
  ["lisinopril", "Lisinopril", "Zestril"],
  ["aspirin", "Aspirin", "Acetylsalicylic acid"],
  ["clopidogrel", "Clopidogrel", "Plavix"],
  ["glimepiride", "Glimepiride", "Amaryl"],
  ["levothyroxine", "Levothyroxine", "Synthroid"],
  ["simvastatin", "Simvastatin", "Zocor"],
  ["metoprolol", "Metoprolol", "Lopressor"],
];
const entities: Entity[] = [
  ...herbs.map(([id, name, scientificName, alias]) => ({
    id,
    name,
    scientificName,
    kind: "herb" as const,
    category: "Medicinal herb",
    aliases: [alias],
  })),
  ...drugs.map(([id, name, alias]) => ({
    id,
    name,
    kind: "drug" as const,
    category: "Prescription / conventional medicine",
    aliases: [alias],
  })),
  {
    id: "demo-immunity",
    name: "Herbal Immunity Formula",
    kind: "product",
    category: "Demo formulation · illustrative ingredients",
    aliases: ["Immunity formula"],
    ingredients: ["tulsi", "giloy", "turmeric", "amla"],
  },
];
const kb: Knowledge = {
  entities,
  pathways: [
    {
      id: "demo-pathway-1",
      name: "Demo pathway α",
      type: "Synthetic pathway · no biological claim",
    },
    {
      id: "demo-pathway-2",
      name: "Demo pathway β",
      type: "Synthetic pathway · no biological claim",
    },
  ],
  phytochemicals: [],
  evidence: [],
  links: [],
};
// These pairings and attributes are synthetic software fixtures, not medical evidence.
for (let i = 0; i < 24; i++) {
  const herbId = herbs[Math.floor(i / 2)][0],
    drugId = drugs[i % 2][0],
    id = `DEMO-EVIDENCE-${String(i + 1).padStart(3, "0")}`,
    pathwayId = `demo-pathway-${(i % 2) + 1}`;
  kb.evidence.push({
    id,
    herbId,
    drugId,
    pathwayId,
    interactionType: "Synthetic shared-pathway example",
    potentialConcern: (["MODERATE", "HIGH", "LOW", "UNKNOWN"] as const)[i % 4],
    evidenceGrade: (["E", "D", "U", "C"] as const)[i % 4],
    studyType: "Synthetic fixture; no study was performed",
    summary:
      "This record demonstrates the evidence workflow only. The pairing, pathway, concern, and evidence grade are simulated and do not establish an interaction between these substances.",
    notes:
      "DEMO DATA — NOT SCIENTIFICALLY VALIDATED. Evidence grade is a UI fixture, not a classification of actual research.",
    validated: false,
    isDemo: true,
    signalType: "INSUFFICIENT",
    linkedNodeIds: [herbId, drugId, pathwayId],
  });
  kb.links.push(
    {
      id: `${id}-herb`,
      source: herbId,
      target: pathwayId,
      relationship: "demo association",
      evidenceId: id,
    },
    {
      id: `${id}-drug`,
      source: drugId,
      target: pathwayId,
      relationship: "demo association",
      evidenceId: id,
    },
    {
      id: `${id}-source`,
      source: pathwayId,
      target: id,
      relationship: "documented by demo fixture",
      evidenceId: id,
    },
  );
}
mkdirSync("data", { recursive: true });
writeFileSync("data/knowledge.json", JSON.stringify(kb, null, 2) + "\n");
