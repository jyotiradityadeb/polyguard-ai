"use client";
import { FlaskConical } from "lucide-react";
import { unavailablePkStatus } from "@/lib/pk-sandbox";
export function PkSandbox() { const state = unavailablePkStatus(); return <section className="pk-sandbox"><div className="evidence-title"><h3><FlaskConical size={18}/> Mechanistic PK Sandbox</h3><span className="badge neutral">{state.status}</span></div><p>{state.message}</p><p className="pk-label">{state.disclaimer}</p><small>No model is enabled because the project has no complete, reviewed parameter set with units and provenance. A curve will only appear after every required parameter is reviewed and sourced.</small></section>; }
