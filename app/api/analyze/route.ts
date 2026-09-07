import { NextResponse } from "next/server";
import { getKnowledge } from "@/lib/evidence";
import { analyze } from "@/lib/interaction-engine";
import { requestSchema } from "@/types/polyguard";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 20000)
      return NextResponse.json(
        { error: "The regimen is too large." },
        { status: 413 },
      );
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Send a valid JSON regimen." },
      { status: 400 },
    );
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Add at least one substance using valid medicine, herb, or product lists.",
      },
      { status: 400 },
    );
  try {
    return NextResponse.json(analyze(parsed.data, await getKnowledge()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Analysis is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
