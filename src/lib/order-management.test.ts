import { describe, expect, it } from "vitest";
import { canApproveTransfer, filterOrders, paymentStatus, whatsappLink, validateReceipt } from "./order-management";
import type { ManagedOrder } from "./order-management";
const order = (changes: Partial<ManagedOrder> = {}) => ({ id: "11111111-1111-4111-8111-111111111111", payer_name: "Lucía Pérez", payer_email: "buyer@example.invalid", buyer_phone: "+54 9 298 4000000", status: "pending", payment_method: "bank_transfer", total: 9000, created_at: "2026-10-20T12:00:00Z", ...changes }) as ManagedOrder;
describe("order management", () => {
  it("offers manual approval only for pending bank transfers", () => {
    expect(canApproveTransfer(order())).toBe(true);
    for (const changes of [{ status: "approved" }, { status: "rejected" }, { status: "cancelled" }, { payment_method: "mercadopago" }, { payment_method: undefined }]) expect(canApproveTransfer(order(changes as Partial<ManagedOrder>))).toBe(false);
  });
  it.each([["approved", "Pagado"], ["pending", "Pendiente de pago"], ["rejected", "Rechazado"], ["cancelled", "Cancelado"]] as const)("labels %s accessibly", (status, label) => expect(paymentStatus[status].label).toBe(label));
  it("combines accent-insensitive search with payment and status filters", () => {
    const rows = [order(), order({ id: "two", payer_name: "Juan", payment_method: "mercadopago", status: "approved" })];
    expect(filterOrders(rows, { query: "LUCIA", status: "pending", method: "bank_transfer" })).toEqual([rows[0]]);
    expect(filterOrders(rows, { query: "example.invalid", status: "approved" })).toEqual([rows[1]]);
    expect(filterOrders(rows, { query: "11111111" })).toEqual([rows[0]]);
    expect(filterOrders(rows, { method: "bank_transfer", status: "approved" })).toEqual([]);
    expect(filterOrders([], {})).toEqual([]);
  });
  it("creates WhatsApp links only for usable international phone numbers", () => {
    expect(whatsappLink("+54 9 298 4000000")).toBe("https://wa.me/5492984000000");
    expect(whatsappLink(null)).toBeNull(); expect(whatsappLink("123")).toBeNull();
  });
  it("validates real receipt signatures, sizes and allowed formats", async () => {
    await expect(validateReceipt(new File(["%PDF-1.7\n"], "proof.pdf", { type: "application/pdf" }))).resolves.toMatchObject({ extension: "pdf", contentType: "application/pdf" });
    await expect(validateReceipt(new File(["fake"], "proof.pdf", { type: "application/pdf" }))).rejects.toThrow();
    await expect(validateReceipt(new File(["<svg/>"], "proof.svg", { type: "image/svg+xml" }))).rejects.toThrow();
    await expect(validateReceipt(new File([], "empty.pdf", { type: "application/pdf" }))).rejects.toThrow();
    await expect(validateReceipt(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.pdf", { type: "application/pdf" }))).rejects.toThrow();
    await expect(validateReceipt(new File([new Uint8Array([255,216,255,224])], "proof.jpg", { type: "image/jpeg" }))).resolves.toMatchObject({ extension: "jpg" });
    await expect(validateReceipt(new File([new Uint8Array([137,80,78,71,13,10,26,10])], "proof.png", { type: "image/png" }))).resolves.toMatchObject({ extension: "png" });
  });
});
