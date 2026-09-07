"use client";
import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Position,
} from "@xyflow/react";
import type { ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SourceDetails } from "./scientific-evidence";
import type { Analysis } from "@/types/polyguard";
export default function EvidenceGraph({
  result,
  selected,
  onSelect,
}: {
  result: Analysis;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [inspected, setInspected] = useState<string | null>(null);
  const [edgeId,setEdgeId]=useState<string|null>(null);
  const [validatedOnly,setValidatedOnly]=useState(false);
  const [flow,setFlow]=useState<ReactFlowInstance | null>(null);
  const edgeDetail=result.graph.edges.find(e=>e.id===edgeId);
  const active = result.interactions.find((i) => i.id === selected);
  const colors: Record<string, string> = {
    herb: "#e8f5ec",
    drug: "#eaf0fb",
    pathway: "#e6f5f3",
    phytochemical: "#f2edfa",
    evidence: "#fff4e1",
  };
  const { nodes, edges } = useMemo(() => {
    const positions: Record<string, number> = {};
    const hasCompound = result.graph.nodes.some(
      (n) => n.kind === "phytochemical",
    );
    const columns: Record<string, number> = {
      herb: 0,
      drug: 0,
      phytochemical: 1,
      pathway: hasCompound ? 2 : 1,
      evidence: hasCompound ? 3 : 2,
    };
    const pathIds = new Set(active?.path.map((n) => n.id));
    const edgeIds = new Set(active?.edges.map((e) => e.id));
    return {
      nodes: result.graph.nodes.map((n) => {
        const col = columns[n.kind] ?? 0;
        const row = positions[col] ?? 0;
        positions[col] = row + 1;
        return {
          id: n.id,
          data: {
            label: (
              <div>
                <small>{n.kind.toUpperCase()}</small>
                <strong>{n.label}</strong>
              </div>
            ),
          },
          position: { x: col * 260, y: row * 120 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          style: {
            background: colors[n.kind] ?? "#fff",
            border: `${pathIds.has(n.id) ? 2 : 1}px solid ${pathIds.has(n.id) ? "#087f75" : "#ccdcdc"}`,
            borderRadius: 10,
            width: 205,
            padding: 14,
          opacity: active && !pathIds.has(n.id) ? 0.28 : 1,
          },
          ariaLabel: `${n.kind}: ${n.label}`,
        };
      }),
      edges: result.graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#648d86" },
        style: {
          stroke: edgeIds.has(e.id) ? "#087f75" : "#9bb6b1",
          strokeWidth: edgeIds.has(e.id) ? 2.5 : 1.3,
          opacity: validatedOnly && e.status !== "VALIDATED" ? 0.08 : active && !edgeIds.has(e.id) ? 0.12 : 0.85,
        },
        labelStyle: { fontSize: 10 },
        labelBgStyle: { fill: "#fff" },
      })),
    };
    // colors are fixed presentation tokens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, active, validatedOnly]);
  const detail = result.graph.nodes.find((n) => n.id === inspected);
  if (!result.graph.nodes.length)
    return (
      <div className="blank-note">
        No evidence graph is available for these selections. Missing evidence
        does not establish safety.
      </div>
    );
  return (
    <div className="graph-panel">
      <div className="graph-toolbar">
        <div>
          <h3>Mechanism-aware evidence graph</h3>
          <p>Validated edges retain source provenance. A path is mechanistic evidence unless a direct human signal is separately shown.</p>
        </div>
        <div className="graph-actions">
          <button type="button" onClick={() => flow?.fitView({ padding: 0.18 })}>Fit graph</button>
          <button type="button" onClick={() => { setInspected(null); setEdgeId(null); onSelect(null); flow?.fitView({ padding: 0.18 }); }}>Reset view</button>
          <button type="button" className={validatedOnly ? "active" : ""} onClick={() => setValidatedOnly((v) => !v)}>{validatedOnly ? "Show all" : "Validated only"}</button>
        </div>
        <label>
          Highlight interaction
          <select
            aria-label="Highlight interaction"
            value={selected ?? ""}
            onChange={(e) => onSelect(e.target.value || null)}
          >
            <option value="">All regimen connections</option>
            {result.interactions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.herb.name} ↔ {i.drug.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.25}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => setInspected(node.id)}
          onEdgeClick={(_,edge)=>setEdgeId(edge.id)}
          onInit={setFlow}
        >
          <Background color="#d8e3e2" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="graph-legend">
        <span>● Herb</span>
        <span>● Medicine</span>
        <span>● Pathway</span>
        <span>● Evidence</span>
      </div>
      {detail && (
        <div className="node-inspector">
          <strong>{detail.label}</strong>
          <p>
            {detail.kind} · Record ID: {detail.id}
          </p>
          <p>
            Linked evidence:{" "}
            {[
              ...new Set(
                result.graph.edges
                  .filter(
                    (e) => e.source === detail.id || e.target === detail.id,
                  )
                  .map((e) => e.evidenceId),
              ),
            ].join(", ")}
          </p>
        </div>
      )}
      {edgeDetail&&<div className="node-inspector"><strong>{edgeDetail.predicate??edgeDetail.label}</strong><p>Evidence record: {edgeDetail.evidenceId} · {edgeDetail.status??(result.demo?"DEMO":"VALIDATED")}</p>{edgeDetail.provenance?<SourceDetails source={edgeDetail.provenance}/>:<p>Synthetic regression edge; no scientific source.</p>}</div>}
      <p className="graph-note">
        {result.demo ? "DEMO DATA — NOT SCIENTIFICALLY VALIDATED. " : ""}Arrows
        show stored associations, not proof of biological causality.
        Phytochemicals appear only when evidence-backed links are recorded.
      </p>
    </div>
  );
}
