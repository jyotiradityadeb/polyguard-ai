import { NextResponse } from "next/server";
import { getKnowledge } from "@/lib/evidence";
export const runtime = "nodejs";
export async function GET() {
  try {
    return NextResponse.json({ entities: (await getKnowledge()).entities });
  } catch {
    return NextResponse.json(
      { error: "The knowledge base is unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
