"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canApproveTransfer, validateReceipt } from "@/lib/order-management";
export type OrderActionResult = { success: boolean; message: string };
const customerSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.union([z.literal(""), z.email().max(254)]), phone: z.string().regex(/^\+?[\d\s()-]{10,25}$/).refine(value => /^\d{10,15}$/.test(value.replace(/\D/g, ""))), delivery: z.enum(["home", "branch", "pickup"]), address: z.string().trim().min(5).max(400) });
const linesSchema = z.array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(999) })).min(1).max(50).refine(lines => new Set(lines.map(line => line.variant_id)).size === lines.length);
export async function createBankTransferOrder(form: FormData): Promise<OrderActionResult & { orderId?: string }> {
  await requireAdmin();
  const requestId = z.string().uuid().safeParse(form.get("request_id"));
  const customer = customerSchema.safeParse(Object.fromEntries(["name", "email", "phone", "delivery", "address"].map(key => [key, form.get(key) ?? ""])));
  let lines;
  try { lines = linesSchema.safeParse(JSON.parse(String(form.get("items") ?? "[]"))); } catch { return { success: false, message: "Revisá los productos y cantidades." }; }
  if (!requestId.success || !customer.success || !lines.success) return { success: false, message: "Completá los datos del cliente, la entrega y al menos un producto con cantidad válida." };
  const client = await createClient();
  const { data, error } = await client.rpc("create_bank_transfer_order", { p_request_id: requestId.data, p_customer: customer.data, p_items: lines.data });
  if (error || !data) return { success: false, message: "No se pudo registrar la venta. Revisá el stock y que los productos sigan disponibles." };
  revalidatePath("/admin");
  return { success: true, message: "Venta registrada como pendiente de pago. Podés adjuntar el comprobante y acreditar la transferencia.", orderId: data };
}

export async function approveBankTransfer(id: string): Promise<OrderActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { success: false, message: "El pedido no es válido." };
  const client = await createClient();
  const { data, error } = await client.rpc("approve_bank_transfer", { p_order_id: id });
  if (error || !data) return { success: false, message: "No se pudo acreditar. Actualizá el pedido, comprobá que sea una transferencia pendiente y revisá el stock disponible." };
  revalidatePath("/admin"); revalidatePath("/", "layout");
  return { success: true, message: "Transferencia acreditada. El stock se actualizó una sola vez." };
}
export async function attachTransferReceipt(id: string, form: FormData): Promise<OrderActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { success: false, message: "El pedido no es válido." };
  const file = form.get("receipt");
  if (!(file instanceof File)) return { success: false, message: "Elegí un comprobante PDF, JPG o PNG de hasta 5 MB." };
  let photo;
  try { photo = await validateReceipt(file); } catch { return { success: false, message: "Elegí un comprobante PDF, JPG o PNG válido de hasta 5 MB." }; }
  const client = await createClient();
  const { data: order, error } = await client.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !order || !canApproveTransfer(order)) return { success: false, message: "Sólo podés adjuntar comprobantes a transferencias pendientes." };
  const path = `${id}/${crypto.randomUUID()}.${photo.extension}`;
  const { error: uploadError } = await client.storage.from("transfer-receipts").upload(path, photo.bytes, { contentType: photo.contentType, upsert: false });
  if (uploadError) return { success: false, message: "No se pudo guardar el comprobante. Volvé a intentar." };
  const { data, error: saveError } = await client.from("orders").update({ transfer_receipt_path: path }).eq("id", id).eq("payment_method", "bank_transfer").eq("status", "pending").select("id").maybeSingle();
  if (saveError || !data) return { success: false, message: "El pedido cambió o no se pudo vincular el comprobante. Actualizá la vista y volvé a intentar." };
  revalidatePath("/admin");
  return { success: true, message: "Comprobante adjuntado. Revisá la acreditación bancaria antes de aprobar el pago." };
}
