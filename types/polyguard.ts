import { z } from "zod";
import { sourceSchema, statusSchema, recordSchema } from './scientific';
export const entitySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["herb", "drug", "product"]),
  scientificName: z.string().optional(),
  category: z.string(),
  aliases: z.array(z.string()),
  ingredients: z.array(z.string()).optional(),
});
export const evidenceSchema = z.object({
  id: z.string(),
  herbId: z.string(),
  drugId: z.string(),
  pathwayId: z.string().optional(),
  phytochemicalId: z.string().optional(),
  interactionType: z.string(),
  potentialConcern: z.enum(["LOW", "MODERATE", "HIGH", "UNKNOWN"]),
  evidenceGrade: z.enum(["A", "B", "C", "D", "E", "U"]),
  studyType: z.string(),
  summary: z.string(),
  notes: z.string(),
  validated: z.boolean(),
  isDemo: z.boolean(),
  status: statusSchema.optional(),
  provenance: sourceSchema.optional(),
  timingRelevant: z.boolean().optional(),
  timingNotes: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  signalType: z.enum(["DIRECT_CLINICAL", "MECHANISTIC", "EXPERIMENTAL", "INSUFFICIENT"]).default("DIRECT_CLINICAL"),
  linkedNodeIds: z.array(z.string()).default([]),
  sourceTitle: z.string().optional(),
  publicationYear: z.number().int().optional(),
  pmid: z.string().regex(/^\d+$/).optional(),
  doi: z.string().optional(),
  sourceUrl: z
    .string()
    .url()
    .refine((v) => v.startsWith("https://"), "HTTPS required")
    .optional(),
});
export const linkSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  relationship: z.string(),
  evidenceId: z.string(),
  predicate: z.string().optional(),
  provenance: sourceSchema.optional(),
  status: statusSchema.optional(),
});
export const knowledgeSchema = z.object({
  entities: z.array(entitySchema),
  pathways: z.array(
    z.object({ id: z.string(), name: z.string(), type: z.string() }),
  ),
  phytochemicals: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      externalIds: z.array(z.string()),
    }),
  ),
  evidence: z.array(evidenceSchema),
  links: z.array(linkSchema),
  scientificRecords: z.array(recordSchema).optional(),
  extraNodes: z.array(z.object({id:z.string(),label:z.string(),kind:z.string()})).optional(),
});
export const requestSchema = z
  .object({
    drugs: z.array(z.string().trim().min(1).max(120)).max(20),
    herbs: z.array(z.string().trim().min(1).max(120)).max(30),
    products: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
    includeDemo: z.boolean().default(true),
  })
  .refine(
    (v) => v.drugs.length + v.herbs.length + v.products.length > 0,
    "Add at least one substance.",
  );
export type Entity = z.infer<typeof entitySchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Knowledge = z.infer<typeof knowledgeSchema>;
export type RegimenInput = z.input<typeof requestSchema>;
export type GraphNode = { id: string; label: string; kind: string };
export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  evidenceId: string;
  predicate?: string;
  provenance?: z.infer<typeof sourceSchema>;
  status?: z.infer<typeof statusSchema>;
};
export type Interaction = {
  id: string;
  herb: Entity;
  drug: Entity;
  evidence: Evidence[];
  potentialConcern: Evidence["potentialConcern"];
  evidenceGrade: Evidence["evidenceGrade"];
  isDemo: boolean;
  path: GraphNode[];
  edges: GraphEdge[];
  signalType: Evidence["signalType"];
};
export type Analysis = {
  regimen: { drugs: Entity[]; herbs: Entity[]; products: Entity[] };
  summary: {
    substancesAnalyzed: number;
    interactionCount: number;
    strongestEvidence: string;
    interactionLoad: {
      score: number;
      label: string;
      pairPoints: number;
      overlapPoints: number;
      unknownCount: number;
    };
  };
  interactions: Interaction[];
  sharedPathways: {
    id: string;
    name: string;
    substances: string[];
    evidenceIds: string[];
  }[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  unknownEntities: string[];
  uncoveredPairs: string[];
  limitations: string[];
  demo: boolean;
  knowledgeBaseStatus?: {
    goldValidatedPaths: number;
    mechanisticPaths: number;
    pendingCandidates: number;
    syntheticFixtures: number;
  };
  researchCandidates?: z.infer<typeof recordSchema>[];
};
