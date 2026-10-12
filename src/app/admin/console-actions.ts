"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { couponSchema, generateCode, orderWorkflowSchema, privateProductSchema } from "@/lib/admin-console";

export async function savePrivateProduct(productId: string, form: FormData) {
  await requireAdmin();
  z.string().uuid().parse(productId);
  const data = privateProductSchema.parse({ cost_price: form.get("cost_price"), barcode: form.get("generate_barcode") === "on" ? generateCode() : form.get("barcode") ?? "" });
  const client = await createClient();
  const { error } = await client.from("product_admin_data").upsert({ product_id: productId, ...data });
  if (error) throw new Error("No se pudo guardar el costo o código. Comprobá que el código no esté asignado a otro producto.");
  revalidatePath("/admin");
  redirect("/admin?section=products&success=private");
}

export async function updateOrderWorkflow(id: string, form: FormData) {
  await requireAdmin();
  z.string().uuid().parse(id);
  const data = orderWorkflowSchema.parse({ shipping_status: form.get("shipping_status"), transaction_status: form.get("transaction_status"), tracking_number: form.get("tracking_number") ?? "" });
  const client = await createClient();
  const { error } = await client.from("orders").update(data).eq("id", id);
  if (error) throw new Error("No se pudo actualizar el seguimiento del pedido.");
  revalidatePath("/admin");
  redirect("/admin?section=sales&success=workflow");
}

export async function createCoupons(form: FormData) {
  await requireAdmin();
  const expiry = String(form.get("expires_at") ?? "");
  const data = couponSchema.parse({ kind: form.get("kind") ?? "percent", value: form.get("value"), usage_limit: form.get("usage_limit") ?? "", quantity: form.get("quantity") ?? 1, expires_at: expiry ? `${expiry}T23:59:59-03:00` : "" });
  if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) throw new Error("La fecha de vencimiento debe ser futura.");
  const client = await createClient();
  const { data: created, error } = await client.from("coupons").insert(Array.from({ length: data.quantity }, () => ({ code: generateCode(), kind: data.kind, value: data.value, usage_limit: data.usage_limit, expires_at: data.expires_at }))).select("id");
  if (error || !created?.length) throw new Error("No se pudieron generar los cupones.");
  revalidatePath("/admin");
  if (form.get("print") === "on") redirect(`/admin/labels?type=coupon&ids=${created.map((coupon) => coupon.id).join(",")}&auto=1`);
  redirect("/admin?section=marketing&success=coupons");
}

export async function toggleCoupon(id: string, form: FormData) {
  await requireAdmin();
  z.string().uuid().parse(id);
  const active = z.enum(["true", "false"]).parse(form.get("active")) === "true";
  const client = await createClient();
  const { error } = await client.from("coupons").update({ active }).eq("id", id);
  if (error) throw new Error("No se pudo cambiar el estado del cupón.");
  revalidatePath("/admin");
  redirect("/admin?section=marketing&success=coupon");
}
