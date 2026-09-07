import { describe, it, expect } from "vitest";
import data from "../data/knowledge.json";
import { validateKnowledge } from "../lib/evidence-validation";
import { analyze, noEvidence } from "../lib/interaction-engine";
import { normalize, resolve } from "../lib/normalization";
import { interactionLoad } from "../lib/interaction-load";
const kb = validateKnowledge(data);
const run = (
  drugs: string[],
  herbs: string[],
  products: string[] = [],
  includeDemo = true,
) => analyze({ drugs, herbs, products, includeDemo }, kb);
describe("normalization", () => {
  it("normalizes case, whitespace and punctuation", () =>
    expect(normalize("  WITHANIA---somnifera  ")).toBe("withania somnifera"));
  it("resolves botanical and common herb aliases", () => {
    expect(resolve("Indian ginseng", kb.entities, "herb")?.id).toBe(
      "ashwagandha",
    );
    expect(resolve("HALDI", kb.entities, "herb")?.id).toBe("turmeric");
  });
  it("resolves medicine aliases", () =>
    expect(resolve("Glucophage", kb.entities, "drug")?.id).toBe("metformin"));
  it("does not fuzzy convert unknown names", () =>
    expect(resolve("metfornin", kb.entities, "drug")).toBeUndefined());
});
describe("analysis", () => {
  it("retrieves known synthetic record and stored grade", () => {
    const r = run(["Metformin"], ["Ashwagandha"]);
    expect(r.interactions).toHaveLength(1);
    expect(r.interactions[0].evidenceGrade).toBe("E");
    expect(r.interactions[0].potentialConcern).toBe("MODERATE");
  });
  it("reports unknown entities", () =>
    expect(run(["Mystery drug"], ["Turmeric"]).unknownEntities).toEqual([
      "Mystery drug",
    ]));
  it("reports missing evidence without claiming safe", () => {
    const r = run(["Warfarin"], ["Turmeric"]);
    expect(r.interactions).toHaveLength(0);
    expect(r.uncoveredPairs).toHaveLength(1);
    expect(noEvidence).not.toMatch(/safe/i);
    expect(r.limitations[0]).toContain("does not guarantee");
  });
  it("handles multiple drugs and herbs", () =>
    expect(
      run(["Metformin", "Atorvastatin"], ["Ashwagandha", "Turmeric"])
        .interactions,
    ).toHaveLength(4));
  it("deduplicates across aliases and product ingredients", () => {
    const r = run(
      ["Metformin", "Glucophage"],
      ["Haldi", "Turmeric"],
      ["Immunity formula"],
    );
    expect(r.regimen.drugs).toHaveLength(1);
    expect(r.regimen.herbs).toHaveLength(4);
  });
  it("detects supported shared pathways", () => {
    const r = run(["Metformin", "Atorvastatin"], ["Ashwagandha", "Turmeric"]);
    expect(r.sharedPathways).toHaveLength(2);
    expect(r.sharedPathways[0].substances).toHaveLength(3);
  });
  it("excludes synthetic records when demo is disabled", () => {
    const r = run(["Metformin"], ["Turmeric"], [], false);
    expect(r.interactions).toHaveLength(0);
    expect(r.graph.edges).toHaveLength(0);
    expect(r.sharedPathways).toHaveLength(0);
  });
  it("marks synthetic results and contains no fabricated citations", () => {
    const r = run(["Metformin"], ["Turmeric"]);
    expect(r.demo).toBe(true);
    expect(
      kb.evidence.every(
        (e) => e.isDemo && !e.validated && !e.pmid && !e.doi && !e.sourceTitle,
      ),
    ).toBe(true);
  });
  it("uses only stored edges and does not invent phytochemicals", () => {
    const r = run(["Metformin"], ["Ashwagandha"]);
    expect(
      r.graph.edges.every((e) =>
        kb.links.some(
          (l) =>
            l.id === e.id && l.source === e.source && l.target === e.target,
        ),
      ),
    ).toBe(true);
    expect(r.graph.nodes.some((n) => n.kind === "phytochemical")).toBe(false);
  });
  it("handles evidence with no mechanism", () => {
    const fixture = structuredClone(kb);
    fixture.links = [];
    fixture.evidence[0].pathwayId = undefined;
    const r = analyze(
      { drugs: ["Metformin"], herbs: ["Ashwagandha"] },
      fixture,
    );
    expect(r.interactions).toHaveLength(1);
    expect(r.graph.edges).toHaveLength(0);
  });
  it("rejects empty/malformed requests", () => {
    expect(() => analyze({ drugs: [], herbs: [] }, kb)).toThrow();
    expect(() => analyze({ drugs: "Metformin" }, kb)).toThrow();
  });
});
describe("interaction load", () => {
  it("uses transparent weights and overlaps", () =>
    expect(interactionLoad(["LOW", "MODERATE", "HIGH"], 2)).toMatchObject({
      score: 8,
      pairPoints: 6,
      overlapPoints: 2,
      label: "Elevated",
    }));
  it("handles boundaries and unknown concern honestly", () => {
    expect(interactionLoad([], 0).label).toBe("Low");
    expect(interactionLoad(["HIGH"], 0).label).toBe("Moderate");
    expect(interactionLoad(["UNKNOWN"], 0).label).toBe("Incomplete");
  });
});
describe("curation safety", () => {
  it("rejects citations in demo records", () => {
    const k = structuredClone(kb);
    k.evidence[0].pmid = "123";
    expect(() => validateKnowledge(k)).toThrow();
  });
  it("rejects dangling graph edges", () => {
    const k = structuredClone(kb);
    k.links[0].target = "invented";
    expect(() => validateKnowledge(k)).toThrow();
  });
  it("excludes unvalidated non-demo drafts", () => {
    const k = structuredClone(kb);
    k.evidence.forEach((e) => (e.isDemo = false));
    expect(
      analyze({ drugs: ["Metformin"], herbs: ["Ashwagandha"] }, k).interactions,
    ).toHaveLength(0);
  });
});
