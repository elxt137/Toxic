import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ approve: vi.fn(), attach: vi.fn(), create: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/admin/order-actions", () => ({ approveBankTransfer: m.approve, attachTransferReceipt: m.attach, createBankTransferOrder: m.create }));
vi.mock("@/app/admin/console-actions", () => ({ updateOrderWorkflow: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: m.refresh }) }));
import { OrdersPanel } from "./orders-panel";
import type { ManagedOrder, OrderItem } from "@/lib/order-management";
const bank = { id: "11111111-1111-4111-8111-111111111111", status: "pending", payment_method: "bank_transfer", total: 18000, subtotal: 18000, discount_amount: 0, payer_name: "Lucía", payer_email: "buyer@example.invalid", buyer_phone: "+54 9 298 4000000", currency: "ARS", created_at: "2026-10-20T15:30:00Z", shipping_destination: "home", shipping_street: "Calle de prueba", shipping_number: "123", shipping_city: "Roca", shipping_status: "preparing", transaction_status: "pending", transfer_receipt_path: "private-proof.pdf" } as ManagedOrder;
const mp = { ...bank, id: "22222222-2222-4222-8222-222222222222", payer_name: "Juan", payment_method: "mercadopago", status: "approved", mercadopago_payment_id: "123456", payment_type: "credit_card", paid_at: "2026-10-20T15:31:00Z" } as ManagedOrder;
const item = { id: "line", order_id: bank.id, product_id: "product", product_name: "Shampoo Atomic", variant_label: "600 ml", quantity: 2, unit_price: 9000 } as OrderItem;
beforeEach(() => {
  m.approve.mockResolvedValue({ success: true, message: "Transferencia acreditada." });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function () { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function () { this.open = false; } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });
it("renders a semantic order table with payment badges, contact and local dates", () => {
  render(<OrdersPanel orders={[bank, mp]} items={[item]} />);
  expect(screen.getByRole("table", { name: "Pedidos y ventas" })).toBeTruthy();
  expect(screen.getAllByText("Mercado Pago").length).toBeGreaterThan(0);
  expect(within(screen.getByRole("table")).getByText("Pagado")).toBeTruthy();
  expect(screen.getByRole("link", { name: /WhatsApp de Lucía/ }).getAttribute("href")).toBe("https://wa.me/5492984000000");
  expect(screen.getAllByText(/12:30/).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("button", { name: "Aprobar transferencia" })).toHaveLength(1);
});
it("filters the table by search, payment method and status", () => {
  render(<OrdersPanel orders={[bank, mp]} items={[]} />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "lucia" } });
  expect(screen.queryByText("Juan")).toBeNull();
  fireEvent.change(screen.getByLabelText("Estado del pago"), { target: { value: "approved" } });
  expect(screen.getByText("No encontramos pedidos con esos filtros.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
  expect(screen.getByText("Juan")).toBeTruthy();
});
it("shows the order detail, snapshot variant and totals, delivery and private proof links", () => {
  render(<OrdersPanel orders={[bank]} items={[item]} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("Shampoo Atomic")).toBeTruthy();
  expect(within(dialog).getByText("600 ml")).toBeTruthy();
  expect(within(dialog).getByText(/Calle de prueba/)).toBeTruthy();
  expect(within(dialog).getByRole("link", { name: "Ver comprobante" }).getAttribute("href")).toContain(`/admin/orders/${bank.id}/receipt`);
  fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar detalle" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("keeps Mercado Pago read-only and shows the verified method and payment ID", () => {
  render(<OrdersPanel orders={[mp]} items={[]} selectedOrder={mp.id} />);
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("123456")).toBeTruthy();
  expect(within(dialog).getByText("Tarjeta de crédito")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Aprobar transferencia" })).toBeNull();
});
it("distinguishes pickup from delivery to a carrier branch", () => {
  render(<OrdersPanel orders={[{ ...bank, delivery_method: "pickup", shipping_destination: null }]} items={[]} selectedOrder={bank.id} />);
  expect(within(screen.getByRole("dialog")).getByRole("heading", { name: "Retiro en el local" })).toBeTruthy();
});
it("does not approve without confirmation and reports successful approval", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<OrdersPanel orders={[bank]} items={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Aprobar transferencia" }));
  expect(m.approve).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Aprobar transferencia" }));
  expect(await screen.findByText("Transferencia acreditada.")).toBeTruthy();
  expect(m.approve).toHaveBeenCalledWith(bank.id);
});
it("shows approval failures without changing the payment badge", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  m.approve.mockResolvedValue({ success: false, message: "No hay stock suficiente." });
  render(<OrdersPanel orders={[bank]} items={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Aprobar transferencia" }));
  expect((await screen.findByRole("alert")).textContent).toContain("stock");
  expect(within(screen.getByRole("table")).getByText("Pendiente de pago")).toBeTruthy();
});
