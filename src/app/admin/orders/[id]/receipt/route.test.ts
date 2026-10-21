// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn(), lookup: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.auth }));
vi.mock("@/lib/supabase/server", () => ({ createClient: m.client }));
import { GET } from "./route";
const id = "11111111-1111-4111-8111-111111111111";
const path = `${id}/22222222-2222-4222-8222-222222222222.pdf`;
const context = { params: Promise.resolve({ id }) };
beforeEach(() => {
  vi.resetAllMocks(); m.lookup.mockResolvedValue({ data: { transfer_receipt_path: path }, error: null });
  m.download.mockResolvedValue({ data: new Blob(["%PDF-1.7"], { type: "application/pdf" }), error: null });
  const query = { select: () => query, eq: () => query, maybeSingle: m.lookup };
  m.client.mockResolvedValue({ from: () => query, storage: { from: () => ({ download: m.download }) } });
});
it("requires admin access before reading any private receipt", async () => {
  m.auth.mockRejectedValue(Error("unauthorized"));
  await expect(GET(new Request("https://example.invalid/receipt"), context)).rejects.toThrow("unauthorized");
  expect(m.client).not.toHaveBeenCalled();
});
it("serves a private no-store receipt inline or as an attachment", async () => {
  const inline = await GET(new Request("https://example.invalid/receipt"), context);
  expect(inline.status).toBe(200); expect(inline.headers.get("cache-control")).toContain("no-store");
  expect(inline.headers.get("content-disposition")).toContain("inline");
  const download = await GET(new Request("https://example.invalid/receipt?download=1"), context);
  expect(download.headers.get("content-disposition")).toContain("attachment");
  expect(m.download).toHaveBeenCalledWith(path);
});
it("rejects invalid IDs and paths outside the selected order", async () => {
  expect((await GET(new Request("https://example.invalid/receipt"), { params: Promise.resolve({ id: "bad" }) })).status).toBe(400);
  m.lookup.mockResolvedValue({ data: { transfer_receipt_path: "other/proof.pdf" }, error: null });
  expect((await GET(new Request("https://example.invalid/receipt"), context)).status).toBe(404);
  expect(m.download).not.toHaveBeenCalled();
});
it("returns a useful failure when the attachment is missing from storage", async () => {
  m.download.mockResolvedValue({ data: null, error: {} });
  expect((await GET(new Request("https://example.invalid/receipt"), context)).status).toBe(404);
});
