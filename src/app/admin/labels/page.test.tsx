import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorize, client } = vi.hoisted(() => ({ authorize: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: authorize }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("@/lib/barcode", () => ({ barcodeSvg: () => "<svg />" }));
vi.mock("@/components/admin/print-labels", () => ({ PrintLabels: () => null }));
import LabelsPage from "./page";

const id = "11111111-1111-4111-8111-111111111111";
const params = { ids: id, type: "product" };
beforeEach(() => {
  vi.clearAllMocks();
  authorize.mockResolvedValue({ email: "admin@example.invalid" });
  client.mockResolvedValue({ from: (table: string) => ({ select: () => ({ in: async () => table === "products"
    ? { data: null, error: { message: "database unavailable" } }
    : { data: [{ product_id: id, barcode: "RC2-123456" }], error: null } }) }) });
});

describe("private printable labels", () => {
  it("rejects unauthorized users before reading label data", async () => {
    authorize.mockRejectedValueOnce(new Error("unauthorized"));
    await expect(LabelsPage({ searchParams: Promise.resolve(params) })).rejects.toThrow("unauthorized");
    expect(client).not.toHaveBeenCalled();
  });
  it("rejects invalid product identifiers before querying the database", async () => {
    await expect(LabelsPage({ searchParams: Promise.resolve({ ...params, ids: "invalid" }) })).rejects.toThrow();
    expect(client).not.toHaveBeenCalled();
  });
  it("reports a failed product lookup instead of printing an incomplete label", async () => {
    await expect(LabelsPage({ searchParams: Promise.resolve(params) })).rejects.toThrow("No se pudieron cargar los códigos.");
  });
});
