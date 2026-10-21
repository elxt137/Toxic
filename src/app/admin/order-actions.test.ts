import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn(), rpc: vi.fn(), lookup: vi.fn(), upload: vi.fn(), update: vi.fn(), result: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.auth }));
vi.mock("@/lib/supabase/server", () => ({ createClient: m.client }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { approveBankTransfer, attachTransferReceipt, createBankTransferOrder } from "./order-actions";
const id = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "admin" }); m.rpc.mockResolvedValue({ data: true, error: null });
  m.lookup.mockResolvedValue({ data: { id, status: "pending", payment_method: "bank_transfer" }, error: null });
  m.upload.mockResolvedValue({ error: null }); m.result.mockResolvedValue({ data: { id }, error: null });
  const query = { select: () => query, eq: () => query, maybeSingle: m.lookup };
  const updated = { eq: () => updated, select: () => updated, maybeSingle: m.result };
  m.update.mockReturnValue(updated);
  m.client.mockResolvedValue({ rpc: m.rpc, from: () => ({ ...query, update: m.update }), storage: { from: () => ({ upload: m.upload }) } });
});
it("requires administrative authorization before any approval or file work", async () => {
  m.auth.mockRejectedValue(Error("unauthorized"));
  await expect(approveBankTransfer(id)).rejects.toThrow("unauthorized");
  await expect(attachTransferReceipt(id, new FormData())).rejects.toThrow("unauthorized");
  await expect(createBankTransferOrder(new FormData())).rejects.toThrow("unauthorized");
  expect(m.client).not.toHaveBeenCalled();
});
it("records a WhatsApp transfer using catalog prices and validated customer details", async () => {
  const form = new FormData();
  Object.entries({ request_id: id, name: "Lucía", email: "buyer@example.invalid", phone: "5492984000000", delivery: "pickup", address: "Retiro coordinado por WhatsApp", items: JSON.stringify([{ variant_id: id, quantity: 2 }]) }).forEach(([key, value]) => form.set(key, value));
  m.rpc.mockResolvedValue({ data: id, error: null });
  expect(await createBankTransferOrder(form)).toMatchObject({ success: true, orderId: id });
  expect(m.rpc).toHaveBeenCalledWith("create_bank_transfer_order", { p_request_id: id, p_customer: expect.objectContaining({ name: "Lucía", delivery: "pickup" }), p_items: [{ variant_id: id, quantity: 2 }] });
  m.client.mockClear(); form.set("items", "[]");
  expect((await createBankTransferOrder(form)).success).toBe(false); expect(m.client).not.toHaveBeenCalled();
  form.set("items", JSON.stringify([{ variant_id: id, quantity: 2 }])); form.set("email", "bad");
  expect((await createBankTransferOrder(form)).success).toBe(false);
});
it("approves atomically through the authenticated RPC", async () => {
  expect(await approveBankTransfer(id)).toEqual({ success: true, message: "Transferencia acreditada. El stock se actualizó una sola vez." });
  expect(m.rpc).toHaveBeenCalledWith("approve_bank_transfer", { p_order_id: id });
});
it.each([
  { items: "invalid" }, { items: "[]" },
  { items: JSON.stringify([{ variant_id: id, quantity: -1 }]) },
  { items: JSON.stringify([{ variant_id: id, quantity: 1 }, { variant_id: id, quantity: 2 }]) },
  { phone: "abc" }, { delivery: "unknown" }, { address: "" }, { name: "" },
])("rejects invalid manual-sale input before connecting: %j", async change => {
  const form = new FormData();
  Object.entries({ request_id: id, name: "Test buyer", email: "", phone: "5492984000000", delivery: "home", address: "Test street 123", items: JSON.stringify([{ variant_id: id, quantity: 1 }]), ...change }).forEach(([key, value]) => form.set(key, value));
  expect((await createBankTransferOrder(form)).success).toBe(false); expect(m.client).not.toHaveBeenCalled();
});
it("handles invalid IDs, concurrent changes and insufficient stock without claiming success", async () => {
  expect((await approveBankTransfer("bad")).success).toBe(false); expect(m.client).not.toHaveBeenCalled();
  m.rpc.mockResolvedValue({ data: false, error: null }); expect((await approveBankTransfer(id)).success).toBe(false);
  m.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "secret" } }); expect((await approveBankTransfer(id)).message).not.toContain("secret");
});
it("stores validated receipts privately and links only a pending bank order", async () => {
  const form = new FormData(); form.set("receipt", new File(["%PDF-1.7\n"], "personal.pdf", { type: "application/pdf" }));
  expect((await attachTransferReceipt(id, form)).success).toBe(true);
  expect(m.upload).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^${id}/[a-f0-9-]+\\.pdf$`)), expect.any(Uint8Array), expect.objectContaining({ upsert: false }));
  expect(m.update).toHaveBeenCalledWith({ transfer_receipt_path: expect.any(String) });
});
it("rejects missing files, non-transfer orders and storage or persistence failures", async () => {
  expect((await attachTransferReceipt(id, new FormData())).success).toBe(false);
  const form = new FormData(); form.set("receipt", new File(["%PDF-1.7"], "proof.pdf", { type: "application/pdf" }));
  m.lookup.mockResolvedValue({ data: { status: "pending", payment_method: "mercadopago" }, error: null });
  expect((await attachTransferReceipt(id, form)).success).toBe(false); expect(m.upload).not.toHaveBeenCalled();
  m.lookup.mockResolvedValue({ data: { status: "pending", payment_method: "bank_transfer" }, error: null });
  m.upload.mockResolvedValue({ error: {} }); expect((await attachTransferReceipt(id, form)).success).toBe(false);
  m.upload.mockResolvedValue({ error: null }); m.result.mockResolvedValue({ data: null, error: {} }); expect((await attachTransferReceipt(id, form)).success).toBe(false);
});
