import { describe, it, expect, vi, beforeEach } from "vitest";
import data from "../data/knowledge.json";
import { validateKnowledge } from "../lib/evidence-validation";
vi.mock("../lib/evidence", () => ({ getKnowledge: vi.fn() }));
import { getKnowledge } from "../lib/evidence";
import { POST } from "../app/api/analyze/route";
import { GET } from "../app/api/catalog/route";
const request = (body: string) =>
  new Request("http://localhost/api/analyze", { method: "POST", body });
beforeEach(() => {
  vi.mocked(getKnowledge).mockResolvedValue(validateKnowledge(data));
});
describe("API boundary", () => {
  it("returns normalized results", async () => {
    const r = await POST(
      request(JSON.stringify({ drugs: ["Glucophage"], herbs: ["Haldi"] })),
    );
    expect(r.status).toBe(200);
    expect((await r.json()).regimen.herbs[0].name).toBe("Turmeric");
    expect(r.headers.get("Cache-Control")).toBe("no-store");
  });
  it("rejects malformed JSON", async () =>
    expect((await POST(request("{"))).status).toBe(400));
  it("rejects empty regimen", async () =>
    expect((await POST(request('{"drugs":[],"herbs":[]}'))).status).toBe(400));
  it("rejects wrong types", async () =>
    expect(
      (await POST(request('{"drugs":"Metformin","herbs":[]}'))).status,
    ).toBe(400));
  it("bounds request size", async () =>
    expect((await POST(request(" ".repeat(20001)))).status).toBe(413));
  it("handles database failure without stack traces", async () => {
    vi.mocked(getKnowledge).mockRejectedValue(
      new Error("secret internal DB path"),
    );
    const r = await POST(request('{"drugs":["Metformin"],"herbs":[]}'));
    expect(r.status).toBe(503);
    expect(JSON.stringify(await r.json())).not.toContain("secret");
  });
  it("serves searchable catalog and handles outage", async () => {
    expect((await (await GET()).json()).entities).toHaveLength(25);
    vi.mocked(getKnowledge).mockRejectedValue(new Error("database failed"));
    expect((await GET()).status).toBe(503);
  });
});
