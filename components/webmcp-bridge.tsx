"use client";
import { useEffect, useRef } from "react";
import { requestSchema, type RegimenInput } from "@/types/polyguard";
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<unknown>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function WebMcpBridge({
  onAnalyze,
}: {
  onAnalyze: (input: RegimenInput) => Promise<unknown>;
}) {
  const action = useRef(onAnalyze);
  useEffect(() => {
    action.current = onAnalyze;
  }, [onAnalyze]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "analyze_polyguard_regimen",
            description:
              "Analyze medicine, herb, and product names using the local evidence database and display the results. Synthetic demo evidence is clearly labeled; results are educational and do not guide treatment.",
            inputSchema: {
              type: "object",
              properties: {
                drugs: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 20,
                },
                herbs: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 30,
                },
                products: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 10,
                },
                includeDemo: { type: "boolean", default: true },
              },
              required: ["drugs", "herbs"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (raw) => action.current(requestSchema.parse(raw)),
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional browser integration must not affect the application. */
      });
    } catch {
      /* Unsupported registration must not affect the application. */
    }
    return () => lifecycle.abort();
  }, []);
  return null;
}
