import { describe, expect, it } from "vitest";
import { discussionReport, reportHtml } from "../lib/discussion-report";
import { pkUnavailable, simulatePk, unavailablePkStatus } from "../lib/pk-sandbox";
import data from "../data/knowledge.json";
import { validateKnowledge } from "../lib/evidence-validation";
import { analyze } from "../lib/interaction-engine";

const analysis = analyze({ drugs: ["Metformin"], herbs: ["Ashwagandha"] }, validateKnowledge(data));

describe("PK sandbox boundaries", () => {
  it("reports unavailable status instead of inventing a model", () => {
    expect(unavailablePkStatus().message).toBe(pkUnavailable);
    expect(() => simulatePk({})).toThrow(pkUnavailable);
  });
  it("rejects unreviewed parameters", () => {
    expect(() => simulatePk({ validationStatus: "VALIDATED" })).toThrow();
  });
  it("simulates only a complete reviewed model", () => {
    const p = (value: number, unit: string) => ({ value, unit, source: "reviewed fixture source", reviewed: true });
    const result = simulatePk({ id: "fixture", drug: "Example", baselineDoseForModel: p(100, "mg"), bioavailability: p(.8, "fraction"), absorptionRateConstant: p(1, "1/h"), volumeOfDistribution: p(50, "L"), baselineClearance: p(5, "L/h"), halfLife: p(6.93, "h"), enzymeContributionFraction: p(.5, "fraction"), inhibitionConstantKi: p(10, "nM"), inhibitorConcentrationAssumption: p(10, "nM"), modelType: "ONE_COMPARTMENT_ORAL", parameterAssumptions: ["One compartment; oral dose; linear kinetics."], validationStatus: "VALIDATED MODEL" });
    expect(result.points.length).toBe(49);
    expect(result.scenario.auc).toBeGreaterThan(result.baseline.auc);
    expect(result.disclaimer).toContain("NOT PATIENT-SPECIFIC");
  });
});

describe("discussion report", () => {
  it("contains neutral discussion sections and no treatment directives", () => {
    const text = discussionReport(analysis);
    expect(text).toContain("POLYGUARD CLINICAL DISCUSSION SUMMARY");
    expect(text).toContain("Questions for professional discussion");
    expect(text).toContain("PK research simulation");
    expect(text.toLowerCase()).not.toContain("stop this herb");
    expect(text.toLowerCase()).not.toContain("take ");
  });
  it("escapes printable report HTML", () => {
    expect(reportHtml("a < b & c")).toContain("a &lt; b &amp; c");
  });
});
