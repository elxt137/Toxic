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

export async function updateAnnouncement(formData: FormData) {
  await requireAdmin();
  const announcement_text = z.string().trim().min(1).max(240).parse(formData.get("announcement_text"));
  const supabase = await createClient();
  const { error } = await supabase.from("storefront_settings").update({ announcement_text }).eq("id", true);
  if (error) throw new Error("No se pudo actualizar el anuncio.");
  revalidatePath("/", "layout"); revalidatePath("/admin");
  redirect("/admin?section=customization&success=announcement");
}
