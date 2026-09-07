import type { Analysis } from "@/types/polyguard";
import type { GraphScenario } from "./counterfactual";
import type { PkSimulation } from "./pk-sandbox";

export function discussionReport(analysis: Analysis, scenarios: GraphScenario[] = [], pk?: PkSimulation) {
  const medicines = analysis.regimen.drugs.map((item) => item.name).join(", ") || "None recorded";
  const herbs = analysis.regimen.herbs.map((item) => item.name).join(", ") || "None recorded";
  const signals = analysis.interactions.map((item) => `${item.herb.name} ↔ ${item.drug.name} — concern ${item.potentialConcern}; evidence Grade ${item.evidenceGrade}; ${item.evidence.map((e) => e.id).join(", ")}`).join("\n") || "No interaction signals in the selected evidence mode.";
  const paths = analysis.sharedPathways.map((path) => `${path.name}: ${path.substances.join(", ")} [${path.evidenceIds.join(", ")}]`).join("\n") || "None recorded";
  const counterfactuals = scenarios.map((scenario) => `${scenario.names.join(" + ")} excluded from graph analysis: ${scenario.signalsBefore} → ${scenario.signalsAfter} signals; ${scenario.affectedEdges.length} edges affected.`).join("\n") || "No eligible graph scenarios.";
  const pkText = pk ? `PK research simulation: ${pk.status}; baseline AUC ${pk.baseline.auc.toFixed(3)}, scenario AUC ${pk.scenario.auc.toFixed(3)}. ${pk.disclaimer}` : "PK research simulation: unavailable — insufficient validated parameters.";
  return `POLYGUARD CLINICAL DISCUSSION SUMMARY\n\nCurrent regimen\nMedicines: ${medicines}\nHerbs/products: ${herbs}\n\nDetected evidence-supported interaction signals\n${signals}\n\nShared pathways\n${paths}\n\nCounterfactual graph scenarios\n${counterfactuals}\n\nPK research simulation\n${pkText}\n\nLimitations\n${analysis.limitations.join("\n")}${analysis.demo ? "\nSynthetic demo records are present and are not scientifically validated." : ""}\n\nQuestions for professional discussion\n- Does this evidence warrant clinical review in this specific patient context?\n- Is the pathway identified here clinically important for this medicine?\n- Is administration timing relevant to any interaction supported by the evidence?\n- Are there patient-specific factors that change the interpretation?\n\nThis is an educational discussion summary, not a treatment plan or clinical recommendation. Do not start, stop, replace, or change medication based solely on this report.`;
}

export function reportHtml(text: string) {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `<!doctype html><html><head><meta charset="utf-8"><title>PolyGuard Clinical Discussion Summary</title><style>body{font:16px/1.6 Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#17313b}pre{white-space:pre-wrap;font:inherit}h1{font-size:26px} @media print{button{display:none}}</style></head><body><button onclick="print()">Print / Save as PDF</button><h1>PolyGuard Clinical Discussion Summary</h1><pre>${escaped}</pre></body></html>`;
}
