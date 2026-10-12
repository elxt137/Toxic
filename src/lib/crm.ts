import { z } from "zod";
export const customerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).default(""),
  address: z.string().trim().max(500).default(""),
  group_id: z.string().uuid(),
});
export const groupSchema = z.object({ name: z.string().trim().min(2).max(100), discount_percent: z.coerce.number().finite().min(0).max(99) });
export const commerceSchema = z.object({
  free_shipping_enabled: z.boolean(), free_shipping_threshold: z.coerce.number().finite().positive().max(999_999_999),
  free_shipping_destination: z.enum(["branch", "home"]), cart_whatsapp_enabled: z.boolean(),
});
export function discountedPrice(price: number, percent: number) {
  z.number().finite().nonnegative().parse(price); z.number().finite().min(0).max(99).parse(percent);
  return price === 0 ? 0 : Math.max(1, Math.round(Math.round(price * 100) * (100 - percent) / 100)) / 100;
}
export function purchaseCycle(orders: { status: string; created_at: string }[]) {
  const days = [...new Set(orders.filter((order) => order.status === "approved").map((order) => Math.floor(Date.parse(order.created_at) / 86_400_000)).filter(Number.isFinite))].sort((a,b) => a-b);
  return days.length < 2 ? null : Math.round((days.at(-1)! - days[0]) / (days.length - 1));
}
export type CustomerBenefit = { email: string; groupId: string | null; groupName: string; percent: number };
