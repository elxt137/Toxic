import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, client, upsert, insert, update, redirect } = vi.hoisted(() => ({ authorize: vi.fn(), client: vi.fn(), upsert: vi.fn(), insert: vi.fn(), update: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: authorize }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));
import { savePrivateProduct, updateOrderWorkflow, createCoupons, toggleCoupon } from "./console-actions";
const id = "11111111-1111-4111-8111-111111111111";
function form(values: Record<string, string>) { const f = new FormData(); for (const [key, value] of Object.entries(values)) f.set(key, value); return f; }
beforeEach(() => {
  vi.clearAllMocks(); authorize.mockResolvedValue({ email: "admin@example.invalid" });
  const result = { data: [{ id }], error: null };
  const builder: Record<string, unknown> = { then: (resolve: (r: unknown) => void) => resolve(result) };
  for (const name of ["select", "eq"]) builder[name] = () => builder;
  for (const [name, fn] of Object.entries({ upsert, insert, update })) { fn.mockReturnValue(builder); builder[name] = fn; }
  client.mockResolvedValue({ from: () => builder });
});
afterEach(() => vi.restoreAllMocks());
describe("private admin mutations", () => {
  it("keeps costs in the admin-only table and generates an assignable barcode", async () => {
    await savePrivateProduct(id, form({ cost_price: "2419.53", barcode: "", generate_barcode: "on" }));
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ product_id: id, cost_price: 2419.53, barcode: expect.stringMatching(/^RC2-[A-F0-9]{10}$/) }));
  });
  it("stores validated workflow states without changing payment approval", async () => {
    await updateOrderWorkflow(id, form({ shipping_status: "in_transit", transaction_status: "processed", tracking_number: "ABC" }));
    expect(update).toHaveBeenCalledWith({ shipping_status: "in_transit", transaction_status: "processed", tracking_number: "ABC" });
    expect(update.mock.calls[0][0]).not.toHaveProperty("status");
  });
  it("creates percentage coupons before opening the printable label page", async () => {
    await createCoupons(form({ kind: "percent", value: "15", quantity: "2", usage_limit: "", expires_at: "", print: "on" }));
    expect(insert.mock.calls[0][0]).toHaveLength(2);
    expect(insert.mock.calls[0][0][0]).toMatchObject({ kind: "percent", value: 15, usage_limit: null });
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("/admin/labels?type=coupon"));
  });
  it("rejects invalid costs, workflow states and coupon limits before touching the database", async () => {
    await expect(savePrivateProduct(id, form({ cost_price: "-1", barcode: "" }))).rejects.toThrow();
    await expect(updateOrderWorkflow(id, form({ shipping_status: "unknown", transaction_status: "completed" }))).rejects.toThrow();
    await expect(createCoupons(form({ value: "120", quantity: "1" }))).rejects.toThrow();
    expect(client).not.toHaveBeenCalled();
  });
  it("protects every mutation with requireAdmin", async () => {
    authorize.mockRejectedValue(new Error("unauthorized"));
    for (const action of [() => savePrivateProduct(id, form({})), () => updateOrderWorkflow(id, form({})), () => createCoupons(form({})), () => toggleCoupon(id, form({ active: "false" }))]) await expect(action()).rejects.toThrow("unauthorized");
    expect(client).not.toHaveBeenCalled();
  });
});
