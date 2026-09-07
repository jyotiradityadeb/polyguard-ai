import { z } from "zod";

export const pkParameterSchema = z.object({
  value: z.number().finite().positive(),
  unit: z.string().min(1),
  source: z.string().min(1),
  reviewed: z.boolean(),
});

export const pkModelSchema = z.object({
  id: z.string().min(1),
  drug: z.string().min(1),
  baselineDoseForModel: pkParameterSchema,
  bioavailability: pkParameterSchema,
  absorptionRateConstant: pkParameterSchema,
  volumeOfDistribution: pkParameterSchema,
  baselineClearance: pkParameterSchema,
  halfLife: pkParameterSchema,
  enzymeContributionFraction: pkParameterSchema,
  inhibitionConstantKi: pkParameterSchema.optional(),
  inhibitorConcentrationAssumption: pkParameterSchema.optional(),
  modelType: z.literal("ONE_COMPARTMENT_ORAL"),
  parameterAssumptions: z.array(z.string().min(1)),
  validationStatus: z.enum(["DEMO MODEL", "PARTIALLY SOURCED MODEL", "RESEARCH MODEL", "VALIDATED MODEL"]),
});

export type PkModel = z.infer<typeof pkModelSchema>;
export type PkPoint = { time: number; baseline: number; scenario: number };
export type PkSimulation = {
  status: PkModel["validationStatus"];
  modelType: PkModel["modelType"];
  points: PkPoint[];
  baseline: { auc: number; cmax: number; clearance: number; halfLife: number };
  scenario: { auc: number; cmax: number; clearance: number; halfLife: number };
  assumptions: string[];
  disclaimer: string;
};

export const pkUnavailable = "Insufficient validated pharmacokinetic parameters for simulation.";
export const pkDisclaimer = "SIMULATED · MODEL-DEPENDENT · NOT PATIENT-SPECIFIC · NOT A CLINICAL PREDICTION";

function assertReady(model: PkModel) {
  const parsed = pkModelSchema.safeParse(model);
  if (!parsed.success) throw new Error(pkUnavailable);
  const parameters = Object.values(parsed.data).filter((value): value is z.infer<typeof pkParameterSchema> => Boolean(value && typeof value === "object" && "unit" in value));
  if (parsed.data.validationStatus !== "VALIDATED MODEL" || parameters.some((parameter) => !parameter.reviewed || !parameter.source)) {
    throw new Error(pkUnavailable);
  }
  if (parsed.data.bioavailability.value > 1 || parsed.data.enzymeContributionFraction.value > 1) {
    throw new Error("PK fractions must be between 0 and 1.");
  }
  return parsed.data;
}

export function simulatePk(model: unknown, inhibitorConcentration?: number): PkSimulation {
  const m = assertReady(model as PkModel);
  const dose = m.baselineDoseForModel.value;
  const f = m.bioavailability.value;
  const ka = m.absorptionRateConstant.value;
  const vd = m.volumeOfDistribution.value;
  const cl = m.baselineClearance.value;
  const fraction = m.enzymeContributionFraction.value;
  const ki = m.inhibitionConstantKi?.value;
  const concentration = inhibitorConcentration ?? m.inhibitorConcentrationAssumption?.value;
  const inhibition = ki && concentration ? concentration / (ki + concentration) : 0;
  const scenarioCl = cl * (1 - fraction * inhibition);
  if (scenarioCl <= 0) throw new Error("PK scenario clearance must remain positive.");
  const points: PkPoint[] = Array.from({ length: 49 }, (_, index) => {
    const time = index * 0.5;
    const baseline = (f * dose * ka) / (vd * (ka - cl / vd)) * (Math.exp(-(cl / vd) * time) - Math.exp(-ka * time));
    const scenario = (f * dose * ka) / (vd * (ka - scenarioCl / vd)) * (Math.exp(-(scenarioCl / vd) * time) - Math.exp(-ka * time));
    return { time, baseline: Math.max(0, baseline), scenario: Math.max(0, scenario) };
  });
  const auc = (clearance: number) => f * dose / clearance;
  const cmax = (key: "baseline" | "scenario") => Math.max(...points.map((point) => point[key]));
  return { status: m.validationStatus, modelType: m.modelType, points, baseline: { auc: auc(cl), cmax: cmax("baseline"), clearance: cl, halfLife: m.halfLife.value }, scenario: { auc: auc(scenarioCl), cmax: cmax("scenario"), clearance: scenarioCl, halfLife: Math.log(2) * vd / scenarioCl }, assumptions: m.parameterAssumptions, disclaimer: pkDisclaimer };
}

export function unavailablePkStatus() { return { ready: false, status: "RESEARCH MODEL" as const, message: pkUnavailable, disclaimer: pkDisclaimer }; }
