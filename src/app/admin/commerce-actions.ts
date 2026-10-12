"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { commerceSchema, customerSchema, groupSchema } from "@/lib/crm";
type State = { success?: boolean; message?: string };
const failed = { success: false, message: "No se pudo guardar. Revisá los datos e intentá de nuevo." };
function values(form: FormData) { return Object.fromEntries(form.entries()); }
export async function saveCommerceSettings(_previous: State, form: FormData): Promise<State> {
  await requireAdmin();
  const parsed = commerceSchema.safeParse({ ...values(form), free_shipping_enabled: form.get("free_shipping_enabled") === "on", cart_whatsapp_enabled: form.get("cart_whatsapp_enabled") === "on" });
  if (!parsed.success) return { success: false, message: "Ingresá un monto mayor a cero y un destino válido." };
  try {
    const client = await createClient();
    const { error, data } = await client.from("storefront_settings").update(parsed.data).eq("id",true).select("id").single();
    if (error || !data) return failed;
  } catch { return failed; }
  revalidatePath("/", "layout"); revalidatePath("/admin");
  return { success: true, message: "Configuración del carrito guardada." };
}
export async function saveCustomer(id: string | null, _previous: State, form: FormData): Promise<State> {
  await requireAdmin();
  const parsed = customerSchema.safeParse(values(form));
  if (!parsed.success || (id && !z.string().uuid().safeParse(id).success)) return { success: false, message: "Revisá el nombre, correo y grupo del cliente." };
  try {
    const client = await createClient();
    const query = id ? client.from("customers").update(parsed.data).eq("id",id) : client.from("customers").insert(parsed.data);
    const { error, data } = await query.select("id").single();
    if (error || !data) return failed;
  } catch { return failed; }
  revalidatePath("/admin"); revalidatePath("/checkout");
  return { success: true, message: "Ficha de cliente guardada." };
}
export async function saveCustomerGroup(id: string | null, _previous: State, form: FormData): Promise<State> {
  await requireAdmin();
  const parsed = groupSchema.safeParse(values(form));
  if (!parsed.success || (id && !z.string().uuid().safeParse(id).success)) return { success: false, message: "Ingresá un nombre y un descuento entre 0 y 99%." };
  try {
    const client = await createClient();
    const query=id ? client.from("customer_groups").update(parsed.data).eq("id",id) : client.from("customer_groups").insert({ ...parsed.data,slug:`custom-${crypto.randomUUID()}` });
    const { error, data } = await query.select("id").single();
    if (error || !data) return failed;
  } catch { return failed; }
  revalidatePath("/admin"); revalidatePath("/checkout");
  return { success: true, message: "Grupo y descuento guardados." };
}
