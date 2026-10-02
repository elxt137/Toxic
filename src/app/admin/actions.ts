"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { presentationSizeSchema } from "@/lib/presentation-size";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().min(2).max(100),
  description: z.string().trim().max(800).default(""),
  category: z.enum(["Decant", "Frasco completo"]).default("Decant"),
  price: z.coerce.number().nonnegative().max(999_999_999),
  stock: z.coerce.number().int().nonnegative().max(999_999),
  size_ml: z.preprocess((value) => (value === "" ? null : value), z.coerce.number().pipe(presentationSizeSchema).nullable()),
  concentration: z.string().trim().max(80).nullable(),
  image_url: z.preprocess((value) => (value === "" ? null : value), z.string().url().nullable()),
  sort_order: z.coerce.number().int().default(0),
  is_published: z.boolean(),
  is_featured: z.boolean(),
});

const announcementSchema = z.object({
  announcement_text: z.string().trim().min(1).max(240),
});
const variantsSchema = z.array(z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(40),
  size_ml: presentationSizeSchema.nullable(),
  price: z.number().nonnegative().max(999_999_999),
  stock: z.number().int().nonnegative().max(999_999),
  is_active: z.boolean(),
})).min(1);

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseProduct(formData: FormData) {
  return productSchema.parse({
    name: formData.get("name"), brand: formData.get("brand"),
    description: formData.get("description"), category: formData.get("category"), price: formData.get("price"),
    stock: formData.get("stock"), size_ml: formData.get("size_ml"),
    concentration: formData.get("concentration") || null,
    image_url: formData.get("image_url"), sort_order: formData.get("sort_order") || 0,
    is_published: formData.get("is_published") === "on",
    is_featured: formData.get("is_featured") === "on",
  });
}

function parseVariants(formData: FormData) {
  const raw = formData.get("variants");
  if (typeof raw !== "string") throw new Error("Faltan las presentaciones.");
  return variantsSchema.parse(JSON.parse(raw));
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const product = parseProduct(formData);
  const variants = parseVariants(formData);
  const supabase = await createClient();
  const firstVariant = variants[0];
  const { data: created, error } = await supabase.from("products").insert({
    ...product, price: firstVariant.price, stock: firstVariant.stock, size_ml: firstVariant.size_ml, slug: `${slugify(product.name)}-${crypto.randomUUID().slice(0, 6)}`, currency: "ARS",
  }).select("id").single();
  if (error) throw new Error(`No se pudo crear el producto: ${error.message}`);
  const { error: variantsError } = await supabase.from("product_variants").insert(variants.map((variant, index) => ({ ...variant, id: undefined, product_id: created.id, sort_order: index })));
  if (variantsError) throw new Error(`No se pudieron crear las presentaciones: ${variantsError.message}`);
  revalidatePath("/"); revalidatePath("/admin");
  redirect("/admin?section=products&success=created");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const product = parseProduct(formData);
  const variants = parseVariants(formData);
  const supabase = await createClient();
  const firstVariant = variants[0];
  const { error } = await supabase.from("products").update({ ...product, price: firstVariant.price, stock: firstVariant.stock, size_ml: firstVariant.size_ml }).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar el producto: ${error.message}`);
  const existingIds = variants.flatMap((variant) => variant.id ? [variant.id] : []);
  const { error: deactivateError } = await supabase.from("product_variants").update({ is_active: false }).eq("product_id", id).not("id", "in", `(${existingIds.join(",") || "00000000-0000-0000-0000-000000000000"})`);
  if (deactivateError) throw new Error(`No se pudieron actualizar las presentaciones: ${deactivateError.message}`);
  const { error: variantsError } = await supabase.from("product_variants").upsert(variants.map((variant, index) => ({ ...variant, product_id: id, sort_order: index })), { onConflict: "id" });
  if (variantsError) throw new Error(`No se pudieron guardar las presentaciones: ${variantsError.message}`);
  revalidatePath("/"); revalidatePath("/admin");
  redirect("/admin?section=products&success=updated");
}

export async function updateAnnouncement(formData: FormData) {
  await requireAdmin();
  const { announcement_text } = announcementSchema.parse({ announcement_text: formData.get("announcement_text") });
  const supabase = await createClient();
  const { error } = await supabase.from("storefront_settings").update({ announcement_text }).eq("id", true);
  if (error) throw new Error(`No se pudo actualizar el anuncio: ${error.message}`);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  redirect("/admin?section=customization&success=announcement");
}
