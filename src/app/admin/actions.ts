"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseProductInput } from "@/lib/product-editor";

async function persistProduct(id: string | null, form: FormData) {
  await requireAdmin();
  if (id !== null) z.string().uuid().parse(id);
  const { product, variants } = parseProductInput(form);
  const client = await createClient();
  const { data, error } = await client.rpc("save_catalog_product", { p_id: id, p_product: product, p_variants: variants });
  if (error || !data) throw new Error("No se pudo guardar el producto. Revisá los datos y volvé a intentar.");
  revalidatePath("/", "layout"); revalidatePath("/admin");
  redirect(`/admin?section=products&success=${id ? "updated" : "created"}`);
}
export async function createProduct(form: FormData) { await persistProduct(null, form); }
export async function updateProduct(id: string, form: FormData) { await persistProduct(id, form); }

export async function deleteProduct(id: string) {
  await requireAdmin();
  z.string().uuid().parse(id);
  const client = await createClient();
  const { data, error } = await client.from("products").delete().eq("id", id).select("id").maybeSingle();
  if (error?.code === "23503") return { error: "El producto tiene pedidos o productos asociados. Ocultalo desmarcando Publicado para conservar el historial." };
  if (error || !data) return { error: "No se pudo eliminar el producto. Actualizá el inventario y volvé a intentar." };
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  redirect("/admin?section=products&success=deleted");
}

export async function updateAnnouncement(formData: FormData) {
  await requireAdmin();
  const announcement_text = z.string().trim().min(1).max(240).parse(formData.get("announcement_text"));
  const supabase = await createClient();
  const { error } = await supabase.from("storefront_settings").update({ announcement_text }).eq("id", true);
  if (error) throw new Error("No se pudo actualizar el anuncio.");
  revalidatePath("/", "layout"); revalidatePath("/admin");
  redirect("/admin?section=customization&success=announcement");
}
