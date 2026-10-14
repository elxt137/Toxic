"use server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validateProductImage } from "@/lib/product-editor";

export async function uploadProductImage(form: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "Elegí una foto para subir." };
  let image;
  try { image = await validateProductImage(file); } catch (error) { return { error: error instanceof Error ? error.message : "Foto inválida." }; }
  const client = await createClient();
  const path = `catalog/${crypto.randomUUID()}.${image.extension}`;
  const bucket = client.storage.from("product-images");
  const { error } = await bucket.upload(path, image.bytes, { contentType: image.contentType, cacheControl: "31536000", upsert: false });
  if (error) return { error: "No se pudo subir la foto. Revisá la conexión y volvé a intentar." };
  return { url: bucket.getPublicUrl(path).data.publicUrl };
}
