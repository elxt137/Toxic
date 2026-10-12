import { z } from "zod";

const optionalNumber = z.preprocess((value) => value === "" || value === null || value === undefined ? null : value, z.coerce.number().nonnegative().max(999_999_999).nullable());
export const privateProductSchema = z.object({
  cost_price: optionalNumber,
  barcode: z.preprocess((value) => value === "" || value === undefined ? null : value, z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,32}$/).nullable()),
});
export const orderWorkflowSchema = z.object({
  shipping_status: z.enum(["preparing", "in_transit", "delivered"]),
  transaction_status: z.enum(["pending", "processed", "completed"]),
  tracking_number: z.string().trim().max(120).default(""),
});
export const couponSchema = z.object({
  kind: z.enum(["percent", "fixed"]).default("percent"),
  value: z.coerce.number().positive().max(999_999_999),
  usage_limit: z.preprocess((value) => value === "" || value === undefined ? null : value, z.coerce.number().int().positive().max(1_000_000).nullable()),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  expires_at: z.preprocess((value) => value === "" || value === undefined ? null : value, z.string().datetime({ offset: true }).nullable()),
}).refine((coupon) => coupon.kind !== "percent" || coupon.value < 100, { message: "El porcentaje debe ser mayor a 0 y menor a 100.", path: ["value"] });

export function generateCode(seed = crypto.randomUUID()) { return `RC2-${seed.replace(/-/g, "").slice(0, 10).toUpperCase()}`; }
export type Coupon = { kind: string; value: number; active: boolean; usage_limit: number | null; used_count: number; expires_at: string | null };
export function discountForCoupon(coupon: Coupon, subtotal: number, now = new Date()) {
  if (!coupon.active || (coupon.expires_at && Date.parse(coupon.expires_at) < now.getTime()) || (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit)) throw new Error("El cupón no está disponible.");
  const cents = Math.round(subtotal * 100);
  const discount = coupon.kind === "percent" ? Math.round(cents * Number(coupon.value) / 100) : Math.round(Number(coupon.value) * 100);
  if (discount <= 0 || discount >= cents) throw new Error("El descuento no es válido para este pedido.");
  return discount / 100;
}

type Sale = { status: string; total: number; created_at: string };
function argentinaDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function salesMetrics(orders: Sale[], now = new Date()) {
  const today = argentinaDate(now);
  return orders.reduce((result, order) => {
    if (order.status !== "approved") return result;
    const day = argentinaDate(new Date(order.created_at));
    if (day.startsWith(today.slice(0, 7))) { result.monthTotal += Number(order.total); result.monthCount++; }
    if (day === today) { result.dayTotal += Number(order.total); result.dayCount++; }
    return result;
  }, { dayTotal: 0, monthTotal: 0, dayCount: 0, monthCount: 0 });
}
type BuyerOrder = Sale & { id: string; payer_email: string | null; payer_name: string | null; buyer_phone: string | null };
export function customerHistory<T extends BuyerOrder>(orders: T[]) {
  const customers = new Map<string, { email: string; name: string; phone: string; total: number; purchases: number; orders: T[] }>();
  for (const order of orders) {
    if (!order.payer_email) continue;
    const email = order.payer_email.trim().toLowerCase();
    const customer = customers.get(email) ?? { email, name: order.payer_name ?? "Sin nombre", phone: order.buyer_phone ?? "", total: 0, purchases: 0, orders: [] };
    customer.orders.push(order);
    if (order.status === "approved") { customer.total += Number(order.total); customer.purchases++; }
    customers.set(email, customer);
  }
  return [...customers.values()];
}

export const shippingLabels = { preparing: "Preparando", in_transit: "En tránsito", delivered: "Entregado" };
export const transactionLabels = { pending: "Pendiente", processed: "Procesado", completed: "Completado" };
export const paymentLabels = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado", cancelled: "Cancelado" };
export const adminMoney = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(Number(amount));
