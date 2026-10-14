import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaymentSignature(headers: Headers, paymentId: string, secret: string) {
  const requestId = headers.get("x-request-id");
  const signature = headers.get("x-signature");
  if (!requestId || !/^[a-z0-9-]{1,128}$/i.test(requestId) || !signature || !secret || !/^\d{1,30}$/.test(paymentId)) return false;
  const parts = signature.split(",").map((value) => value.trim().split("="));
  if (parts.length !== 2 || parts.some((part) => part.length !== 2) || new Set(parts.map(([key]) => key)).size !== 2) return false;
  const values = Object.fromEntries(parts);
  if (!/^\d{1,20}$/.test(values.ts ?? "") || !/^[0-9a-f]{64}$/i.test(values.v1 ?? "")) return false;
  const digest = createHmac("sha256", secret).update(`id:${paymentId};request-id:${requestId};ts:${values.ts};`).digest();
  return timingSafeEqual(digest, Buffer.from(values.v1, "hex"));
}

type Order = { id: string; total: number; currency: string; mercadopago_preference_id: string | null };
type Payment = { id: number | string; external_reference: string; transaction_amount: number; currency_id: string };
type MerchantOrder = { preference_id: string; external_reference: string; payments: { id: number | string }[] };
export function paymentMatchesOrder(payment: Payment, merchant: MerchantOrder, order: Order, paymentId: string) {
  const amount = Math.round(payment.transaction_amount * 100);
  const total = Math.round(Number(order.total) * 100);
  return Number.isSafeInteger(amount) && amount > 0 && Math.abs(payment.transaction_amount * 100 - amount) < 0.000001 && amount === total &&
    String(payment.id) === paymentId && payment.external_reference === order.id && payment.currency_id === order.currency &&
    !!order.mercadopago_preference_id && merchant.preference_id === order.mercadopago_preference_id && merchant.external_reference === order.id &&
    merchant.payments.some((item) => String(item.id) === paymentId);
}
export function checkoutRateKey(headers: Headers) {
  // A global database limit also applies, so spoofed/absent proxy headers cannot remove the cap.
  const address = headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unavailable";
  return createHash("sha256").update(`rc2-checkout:${address.slice(0,128)}`).digest("hex");
}
