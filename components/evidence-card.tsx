"use client";
import { useState } from "react";
import { ArrowRight, BookOpen, Network } from "lucide-react";
import type { Interaction } from "@/types/polyguard";
import { SourceDetails } from "./scientific-evidence";
import { gradeLabels } from "@/lib/interaction-engine";
export function EvidenceCard({
  interaction: i,
  research,
  onGraph,
}: {
  interaction: Interaction;
  research: boolean;
  onGraph?: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const node = (id: string) => i.path.find((n) => n.id === id);
  return (
    <details className="evidence-detail">
      <summary>
        <BookOpen size={16} /> Why was this flagged?
      </summary>
      <div className="evidence-content">
        <div className="evidence-title">
          <h4>Evidence Path</h4>
          {onGraph && (
            <button onClick={() => onGraph(i.id)}>
              <Network size={15} /> View in graph
            </button>
          )}
        </div>
        <p className="hint">
          Each row is a stored connection. Select a node to inspect it. Arrows
          describe recorded relationships, not a proven causal chain.
        </p>
        <div className="evidence-path">
          {i.edges.map((edge) => (
            <div className="path-row" key={edge.id}>
              <button onClick={() => setSelected(edge.source)}>
                <small>{node(edge.source)?.kind}</small>
                {node(edge.source)?.label}
              </button>
              <span>
                <small>{edge.predicate??edge.label}</small>
                <ArrowRight size={20} />
              </span>
              <button onClick={() => setSelected(edge.target)}>
                <small>{node(edge.target)?.kind}</small>
                {node(edge.target)?.label}
              </button>
              {edge.provenance&&<div className="edge-provenance"><SourceDetails source={edge.provenance}/></div>}
            </div>
          ))}
          {!i.edges.length && (
            <p>
              No mechanism links are recorded. Only the direct herb–medicine
              evidence is available.
            </p>
          )}
        </div>
        {selected && (
          <div className="node-inspector">
            <strong>{node(selected)?.label}</strong>
            <p>
              Type: {node(selected)?.kind}.{" "}
              {i.isDemo
                ? "This node is shown in a synthetic, unvalidated evidence context."
                : "Connections are limited to the stored evidence."}
            </p>
            <small>Record ID: {selected}</small>
          </div>
        )}
        {i.evidence.map((e) => (
          <section className="source-card" key={e.id}>
            <div className="source-heading">
              <strong>{e.id}</strong>
              <span className={`badge ${e.isDemo ? "moderate" : "neutral"}`}>
                {e.isDemo
                  ? "DEMO / UNVALIDATED"
                  : e.validated
                    ? "Literature Validated"
                    : "Unvalidated draft"}
              </span>
            </div>
            <dl>
              <div>
                <dt>Herb</dt>
                <dd>
                  {research
                    ? `${i.herb.name} (${i.herb.scientificName ?? "botanical name not recorded"})`
                    : i.herb.name}
                </dd>
              </div>
              <div>
                <dt>Medicine</dt>
                <dd>{i.drug.name}</dd>
              </div>
              <div>
                <dt>Potential concern</dt>
                <dd>
                  {e.potentialConcern}
                  {e.isDemo ? " · simulated" : ""}
                </dd>
              </div>
              <div>
                <dt>Evidence grade</dt>
                <dd>
                  {e.evidenceGrade} · {gradeLabels[e.evidenceGrade]}
                  {e.isDemo ? " · simulated" : ""}
                </dd>
              </div>
              <div>
                <dt>Study type</dt>
                <dd>{e.studyType}</dd>
              </div>
              <div>
                <dt>Mechanism</dt>
                <dd>{e.interactionType}</dd>
              </div>
              <div>
                <dt>Pathway</dt>
                <dd>
                  {e.pathwayId
                    ? (node(e.pathwayId)?.label ??
                      "Not present in the evidence links")
                    : "Not recorded"}
                </dd>
              </div>
              {research && (
                <div>
                  <dt>Phytochemical</dt>
                  <dd>
                    {e.phytochemicalId
                      ? (node(e.phytochemicalId)?.label ??
                        "Not present in the evidence links")
                      : "Not recorded; no intermediate compound inferred"}
                  </dd>
                </div>
              )}
            </dl>
            {e.reviewedBy&&<p>Reviewed by {e.reviewedBy} · {e.reviewedAt?.slice(0,10)}</p>}
            <h4>Evidence summary</h4>
            <p>{e.summary}</p>
            <h4>Source</h4>
            {e.sourceUrl ? (
              <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">
                {e.sourceTitle ?? "View reviewed source"} ↗
              </a>
            ) : (
              <p>
                No scientific source supplied.{" "}
                {e.isDemo
                  ? "This is a development fixture, not a study."
                  : "The source is not recorded."}
              </p>
            )}
            {e.publicationYear && <p>Publication year: {e.publicationYear}</p>}
            {e.pmid && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                PMID: {e.pmid}
              </a>
            )}
            {e.doi && <p>DOI: {e.doi}</p>}
            <h4>Interpretation</h4>
            <p>
              {e.isDemo
                ? "No clinical interpretation can be drawn from this synthetic record. The displayed concern and grade demonstrate separate dimensions only."
                : "This record describes an interaction signal. Its evidence grade does not establish the likelihood or magnitude of an effect for an individual."}
            </p>
            {research && (
              <>
                <h4>Curation notes</h4>
                <p>{e.notes}</p>
                <small>
                  Validated: {e.validated ? "Yes" : "No"} · Demo:{" "}
                  {e.isDemo ? "Yes" : "No"}
                </small>
              </>
            )}
          </section>
        ))}
        <div className="next-step">
          Do not change your medication based only on this result. Consider
          discussing the combination with a qualified healthcare professional.
        </div>
      </div>
    </details>
  );
}
