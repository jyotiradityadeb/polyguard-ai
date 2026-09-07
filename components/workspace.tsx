"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import {
  ShieldCheck,
  FlaskConical,
  ArrowRight,
  Leaf,
  Pill,
  Layers3,
  RotateCcw,
  CircleHelp,
  Activity,
  Network,
  BookOpen,
  Check,
  AlertCircle,
} from "lucide-react";
import type { Analysis, Entity } from "@/types/polyguard";
import { gradeLabels, noEvidence } from "@/lib/interaction-engine";
import { SubstanceInput } from "./substance-input";
import { Button } from "./ui/button";
import { EvidenceCard } from "./evidence-card";
import { WebMcpBridge } from "./webmcp-bridge";
import { ResearchOverview } from "./research-overview";
import { flushSync } from "react-dom";
import { PkSandbox } from "./pk-sandbox";
import { discussionReport, reportHtml } from "@/lib/discussion-report";
import { exploreCounterfactuals } from "@/lib/counterfactual";
const EvidenceGraph = dynamic(() => import("./evidence-graph"), {
  ssr: false,
  loading: () => <p className="blank-note">Loading evidence graph…</p>,
});
const CounterfactualExplorer=dynamic(()=>import("./counterfactual-explorer"),{ssr:false});
export default function Workspace() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [herbs, setHerbs] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [includeDemo, setIncludeDemo] = useState(false);
  const [tab, setTab] = useState("signals");
  const [research, setResearch] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const requestVersion = useRef(0);
  useEffect(() => {
    fetch("/api/catalog")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setEntities(data.entities);
      })
      .catch((e) => setError(e.message));
  }, []);
  const invalidate = () => {
    requestVersion.current++;
    setLoading(false);
    setResult(null);
    setError("");
  };
  async function run(
    d = drugs,
    h = herbs,
    p = products,
    useDemo = includeDemo,
  ) {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugs: d,
          herbs: h,
          products: p,
          includeDemo: useDemo,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (version !== requestVersion.current) return;
      flushSync(() => {
        setResult(body);
        setSelected(null);
        setTab("signals");
      });
      return body as Analysis;
    } catch (e) {
      if (version !== requestVersion.current) return;
      setError(
        e instanceof Error ? e.message : "Analysis could not be completed.",
      );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }
  function demo() {
    invalidate();
    setIncludeDemo(true);
    const d = ["Metformin", "Atorvastatin"],
      h = ["Ashwagandha", "Turmeric"];
    setDrugs(d);
    setHerbs(h);
    setProducts([]);
    setResult(null);
    setError("");
  }
  function openDiscussionReport() {
    if (!result) return;
    const scenarios = exploreCounterfactuals(result).singles;
    const report = window.open("", "_blank");
    if (!report) {
      setError("The report window was blocked. Allow pop-ups for this local app and try again.");
      return;
    }
    report.opener = null;
    report.document.write(reportHtml(discussionReport(result, scenarios)));
    report.document.close();
  }
  return (
    <>
      <WebMcpBridge
        onAnalyze={async (input) => {
          invalidate();
          setDrugs(input.drugs);
          setHerbs(input.herbs);
          setProducts(input.products ?? []);
          setIncludeDemo(input.includeDemo ?? true);
          const outcome = await run(
            input.drugs,
            input.herbs,
            input.products ?? [],
            input.includeDemo ?? true,
          );
          if (!outcome) throw new Error("Analysis unavailable or superseded.");
          return {
            summary: outcome.summary,
            unknownEntities: outcome.unknownEntities,
            demo: outcome.demo,
          };
        }}
      />
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <ShieldCheck size={25} />
          </span>
          <span>
            PolyGuard <b>AI</b>
            <small>EVIDENCE INTELLIGENCE</small>
          </span>
        </Link>
        <Link className="header-note" href="/research/curation">Research & curation →</Link>
        <span className="prototype">
          <span /> Research prototype
        </span>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">YOUR REGIMEN, EXPLAINED</div>
            <h1>A clearer view of mixed-medicine safety.</h1>
            <p>
              Check how your medicines and Ayurvedic/herbal products may
              interact.
            </p>
          </div>
          <a href="#method" className="text-link">
            <CircleHelp size={17} /> How it works
          </a>
        </div>
        <div className="demo-banner">
          <FlaskConical size={19} />
          <div>
            <strong>{includeDemo?"SYNTHETIC DEMO MODE — NOT SCIENTIFICALLY VALIDATED":"SCIENTIFIC DATA MODE — REVIEWED EVIDENCE ONLY"}</strong>
            <p>
              {includeDemo?"Synthetic pairings, pathways, concern levels, and grades illustrate the product; they are not medical findings.":"Only human-reviewed interaction findings enter signal analysis. Imported literature and assays remain separate until reviewed. No validated paths may be available yet."}
            </p>
          </div>
        </div>
        <div className="workspace">
          <aside className="regimen-panel">
            <div className="panel-title">
              <span className="step">01</span>
              <div>
                <h2>Build your regimen</h2>
                <p>Add everything you want to check.</p>
              </div>
            </div>
            <div className="input-section">
              <div className="section-icon">
                <Pill size={18} /> PRESCRIPTION MEDICINES
              </div>
              <SubstanceInput
                title="Medicines"
                kind="drug"
                entities={entities}
                values={drugs}
                onChange={(v) => {
                  setDrugs(v);
                  invalidate();
                }}
              />
            </div>
            <div className="input-section">
              <div className="section-icon herb">
                <Leaf size={18} /> HERBS & AYURVEDIC PRODUCTS
              </div>
              <SubstanceInput
                title="Herbs / manual ingredients"
                kind="herb"
                entities={entities}
                values={herbs}
                onChange={(v) => {
                  setHerbs(v);
                  invalidate();
                }}
              />
              <details className="product-entry">
                <summary>
                  <Layers3 size={16} /> Add a multi-herb product
                </summary>
                <SubstanceInput
                  title="Predefined formulations"
                  kind="product"
                  entities={entities}
                  values={products}
                  onChange={(v) => {
                    setProducts(v);
                    invalidate();
                  }}
                />
                {products.map((p) => {
                  const product = entities.find((e) => e.name === p);
                  return (
                    <p key={p} className="ingredient-note">
                      {product?.ingredients
                        ?.map(
                          (id) => entities.find((e) => e.id === id)?.name ?? id,
                        )
                        .join(" · ")}
                    </p>
                  );
                })}
                <p className="hint">
                  For your own product, add each label ingredient in the herb
                  field above.
                </p>
              </details>
            </div>
            <div className="regimen-actions">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={includeDemo}
                  onChange={(e) => {
                    setIncludeDemo(e.target.checked);
                    invalidate();
                  }}
                />{" "}
                Synthetic demo mode
              </label>
              <Button
                className="primary"
                disabled={
                  loading ||
                  (!drugs.length && !herbs.length && !products.length)
                }
                onClick={() => run()}
              >
                {loading ? "Analyzing regimen…" : "Analyze Regimen"}
                <ArrowRight size={18} />
              </Button>
              <div className="secondary-actions">
                <Button onClick={demo}>
                  <FlaskConical size={16} /> Try Demo
                </Button>
                <button
                  className="reset"
                  aria-label="Clear regimen"
                  onClick={() => {
                    setDrugs([]);
                    setHerbs([]);
                    setProducts([]);
                    invalidate();
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <p className="privacy">
                <ShieldCheck size={14} /> No account. Regimens are not stored.
              </p>
            </div>
          </aside>
          <section className="results" aria-live="polite" aria-busy={loading}>
            <div
              className="mode-toggle"
              role="group"
              aria-label="Explanation mode"
            >
              <button
                aria-pressed={!research}
                onClick={() => setResearch(false)}
              >
                Patient Mode
              </button>
              <button aria-pressed={research} onClick={() => setResearch(true)}>
                Research Mode
              </button>
            </div>
            {research&&<><ResearchOverview candidates={result?.researchCandidates}/><PkSandbox/></>}
            {error && (
              <div role="alert" className="error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            {!result ? (
              <div className="empty-state">
                <div className="empty-symbol">
                  <Network size={42} />
                </div>
                <span className="eyebrow">FROM A LIST TO AN EXPLANATION</span>
                <h2>Every signal should have a story.</h2>
                <p>
                  Add your medicines and herbs to explore interaction signals,
                  the pathways behind them, and the quality of the evidence.
                </p>
                <div className="empty-path">
                  <span>
                    <Leaf size={20} />
                    Herb
                  </span>
                  <ArrowRight />
                  <span>
                    <Activity size={20} />
                    Pathway
                  </span>
                  <ArrowRight />
                  <span>
                    <Pill size={20} />
                    Medicine
                  </span>
                  <ArrowRight />
                  <span>
                    <BookOpen size={20} />
                    Evidence
                  </span>
                </div>
                <div className="empty-footer">
                  <Check size={17} /> Deterministic analysis <span>·</span>{" "}
                  Transparent evidence
                </div>
              </div>
            ) : (
              <>
                <div className="results-heading">
                  <div>
                    <div className="eyebrow">ANALYSIS COMPLETE</div>
                    <h2>Regimen overview</h2>
                  </div>
                  <span className="badge neutral">
                    {result.demo
                      ? "Synthetic demo results"
                      : includeDemo
                        ? "Demo evidence included"
                        : "Validated evidence filter"}
                  </span>
                  <Button className="report-button" onClick={openDiscussionReport}>Generate Clinical Discussion Report</Button>
                </div>
                <div className="stats">
                  <div>
                    <span>Substances analyzed</span>
                    <strong>
                      {result.summary.substancesAnalyzed
                        .toString()
                        .padStart(2, "0")}
                    </strong>
                    <small>
                      {result.regimen.drugs.length} medicines ·{" "}
                      {result.regimen.herbs.length} herbs
                    </small>
                  </div>
                  <div>
                    <span>Interaction signals</span>
                    <strong>
                      {result.summary.interactionCount
                        .toString()
                        .padStart(2, "0")}
                    </strong>
                    <small>
                      {result.demo
                        ? "Illustrative pairings"
                        : "In this knowledge base"}
                    </small>
                  </div>
                  <div>
                    <span>Interaction Load</span>
                    <strong className="load">
                      {result.summary.interactionLoad.label}
                    </strong>
                    <small>
                      {result.summary.interactionLoad.score} informational
                      points
                    </small>
                  </div>
                  <div>
                    <span>
                      {result.demo
                        ? "Strongest demo grade"
                        : "Strongest evidence"}
                    </span>
                    <strong>
                      {result.summary.strongestEvidence === "U"
                        ? "U"
                        : `Grade ${result.summary.strongestEvidence}`}
                    </strong>
                    <small>
                      {gradeLabels[result.summary.strongestEvidence]}
                    </small>
                  </div>
                </div>
                <details className="load-detail">
                  <summary>How Interaction Load is calculated</summary>
                  <p>
                    LOW = 1, MODERATE = 2, HIGH = 3; each shared pathway = +1.
                    0–2: Low, 3–5: Moderate, 6+: Elevated. UNKNOWN concern makes
                    the load incomplete.
                  </p>
                  <p>
                    {result.summary.interactionLoad.pairPoints} pair points +{" "}
                    {result.summary.interactionLoad.overlapPoints} shared
                    pathway points.{" "}
                    {result.summary.interactionLoad.unknownCount}{" "}
                    unknown-concern pairs.
                  </p>
                  <strong>
                    PolyGuard Interaction Load is an informational measure
                    summarizing interaction signals found in the evidence graph.
                    It is not a validated clinical risk score.
                  </strong>
                </details>
                {result.unknownEntities.length > 0 && (
                  <div className="warning">
                    <strong>Unrecognized substances</strong>
                    <p>
                      {result.unknownEntities.join(", ")} — This substance is
                      not currently available in the PolyGuard knowledge base.
                    </p>
                  </div>
                )}
                {result.regimen.products.length > 0 && (
                  <div className="product-result">
                    <Layers3 size={18} />
                    <div>
                      <strong>Formulation ingredients included</strong>
                      {result.regimen.products.map((p) => (
                        <p key={p.id}>
                          {p.name}:{" "}
                          {p.ingredients
                            ?.map(
                              (id) =>
                                entities.find((e) => e.id === id)?.name ?? id,
                            )
                            .join(", ")}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="result-tabs">
                  <button
                    className={tab === "signals" ? "active" : ""}
                    onClick={() => setTab("signals")}
                  >
                    <Activity size={16} /> Interaction signals{" "}
                    <span>{result.interactions.length}</span>
                  </button>
                  <button
                    className={tab === "pathways" ? "active" : ""}
                    onClick={() => setTab("pathways")}
                  >
                    <Network size={16} /> Shared pathways{" "}
                    <span>{result.sharedPathways.length}</span>
                  </button>
                  <button
                    className={tab === "graph" ? "active" : ""}
                    onClick={() => setTab("graph")}
                  >
                    <Network size={16} /> Evidence graph
                  </button>
                </div>
                <p className="result-caption">
                  Potential concern and evidence strength are independent. High
                  concern does not establish clinically proven harm.
                </p>
                {tab === "signals" && (
                  <div className="interaction-list">
                    {result.interactions.map((i) => (
                      <article className="interaction-card" key={i.id}>
                        <div className="card-heading">
                          <span className="pair-icon">
                            <Leaf size={21} />
                          </span>
                          <h3>
                            {research
                              ? (i.herb.scientificName ?? i.herb.name)
                              : i.herb.name}{" "}
                            <span>↔</span> {i.drug.name}
                          </h3>
                        </div>
                        {i.isDemo && (
                          <span className="demo-label">
                            DEMO / UNVALIDATED EVIDENCE
                          </span>
                        )}
                        <div className="dimensions">
                          <div>
                            <span>Potential interaction concern</span>
                            <b
                              className={`badge ${i.potentialConcern.toLowerCase()}`}
                            >
                              {i.potentialConcern}
                            </b>
                          </div>
                          <div>
                            <span>
                              Evidence strength {i.isDemo ? "(simulated)" : ""}
                            </span>
                            <b className="badge evidence">
                              Grade {i.evidenceGrade} ·{" "}
                              {gradeLabels[i.evidenceGrade]}
                            </b>
                          </div>
                        </div>
                        <p>{i.evidence[0].summary}</p>
                        <div className="mechanism">
                          <Activity size={16} />
                          {i.path
                            .filter((n) => n.kind === "pathway")
                            .map((n) => n.label)
                            .join(", ") || "No pathway recorded"}
                        </div>
                        <EvidenceCard
                          interaction={i}
                          research={research}
                          onGraph={(id) => {
                            setSelected(id);
                            setTab("graph");
                          }}
                        />
                      </article>
                    ))}
                  </div>
                )}
                {tab === "graph" && (
                  <EvidenceGraph
                    result={result}
                    selected={selected}
                    onSelect={setSelected}
                  />
                )}
                {tab === "pathways" && (
                  <div className="pathway-list">
                    {result.sharedPathways.map((p) => (
                      <article className="interaction-card" key={p.id}>
                        <Network size={24} />
                        <h3>{p.name}</h3>
                        <p>
                          {p.substances.length} substances connected:{" "}
                          {p.substances.join(", ")}
                        </p>
                        <span className="demo-label">
                          {result.demo
                            ? "SYNTHETIC DEMO ASSOCIATIONS"
                            : "STORED EVIDENCE ASSOCIATIONS"}
                        </span>
                        <p>
                          A shared pathway does not automatically mean the
                          combination is harmful.
                        </p>
                        <small>Provenance: {p.evidenceIds.join(", ")}</small>
                      </article>
                    ))}
                    {!result.sharedPathways.length && (
                      <p className="blank-note">
                        No supported pathway shared by three or more selected
                        substances was found.
                      </p>
                    )}
                  </div>
                )}
                {(!result.interactions.length ||
                  result.uncoveredPairs.length > 0) && (
                  <div className="no-evidence">
                    <h3>
                      {result.interactions.length
                        ? "Pairs without evidence"
                        : noEvidence}
                    </h3>
                    {result.interactions.length > 0 && (
                      <p>
                        {noEvidence} This applies to:{" "}
                        {result.uncoveredPairs.join("; ")}.
                      </p>
                    )}
                    <p>{result.limitations[0]}</p>
                    {(!result.regimen.drugs.length ||
                      !result.regimen.herbs.length) && (
                      <p>
                        Add at least one recognized medicine and one recognized
                        herb to evaluate pairs.
                      </p>
                    )}
                  </div>
                )}
                <details className="research-feature"><summary>Explore Counterfactuals</summary><CounterfactualExplorer result={result}/></details>
                <details className="limitations">
                  <summary>Coverage & limitations</summary>
                  {result.limitations.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </details>
              </>
            )}
          </section>
        </div>
        <section id="method" className="method">
          <div>
            <span className="eyebrow">THE POLYGUARD PRINCIPLE</span>
            <h2>The evidence determines the result.</h2>
          </div>
          <p>
            Names resolve against a local catalog. A deterministic engine
            retrieves stored evidence and pathways. Every connection stays
            traceable; missing evidence stays visible.
          </p>
        </section>
        <footer>
          <ShieldCheck size={22} />
          <p>
            PolyGuard provides educational information based on available
            interaction evidence. It is not intended to diagnose, treat,
            prescribe, or replace advice from a qualified healthcare
            professional. Do not start, stop, or change medication based solely
            on PolyGuard results.
          </p>
        </footer>
      </main>
    </>
  );
}
