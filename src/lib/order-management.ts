import type { Database } from "@/types/database";
export type ManagedOrder = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export const paymentStatus = {
  approved: { label: "Pagado", tone: "paid" },
  pending: { label: "Pendiente de pago", tone: "pending" },
  rejected: { label: "Rechazado", tone: "failed" },
  cancelled: { label: "Cancelado", tone: "failed" },
} as const;
export const paymentTypeLabels: Record<string, string> = { credit_card: "Tarjeta de crédito", debit_card: "Tarjeta de débito", account_money: "Dinero en cuenta", bank_transfer: "Transferencia bancaria", ticket: "Pago en efectivo" };
export const orderDate = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha registrada";
export const canApproveTransfer = (order: ManagedOrder) => order.status === "pending" && order.payment_method === "bank_transfer";
export function whatsappLink(phone?: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return /^\d{10,15}$/.test(digits) ? `https://wa.me/${digits}` : null;
}
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export function filterOrders(orders: ManagedOrder[], filters: { query?: string; status?: string; method?: string }) {
  const query = normalize(filters.query ?? "");
  return orders.filter(order => (!filters.status || order.status === filters.status) && (!filters.method || (order.payment_method ?? "mercadopago") === filters.method) && normalize(`${order.id} ${order.payer_name ?? ""} ${order.payer_email ?? ""} ${order.buyer_phone ?? ""} ${order.mercadopago_payment_id ?? ""}`).includes(query));
}
export async function validateReceipt(file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024) throw Error("El comprobante debe pesar entre 1 byte y 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value);
  const extension = file.type === "application/pdf" && pdf ? "pdf" : file.type === "image/jpeg" && jpeg ? "jpg" : file.type === "image/png" && png ? "png" : null;
  if (!extension) throw Error("Elegí un comprobante PDF, JPG o PNG válido.");
  return { bytes, extension, contentType: file.type };
}
