import { z } from "zod";
import { presentationSizeSchema } from "./presentation-size";

const photoUrl = z.string().url().refine((value) => /^https?:\/\//i.test(value), "Usá una URL HTTP o HTTPS.");
const variantSchema = z.object({ id: z.string().uuid().optional(), label: z.string().trim().min(1).max(40), size_ml: presentationSizeSchema.nullable(), price: z.number().nonnegative().max(999_999_999), stock: z.number().int().nonnegative().max(999_999), is_active: z.boolean() });
const productSchema = z.object({
  name: z.string().trim().min(2).max(120), brand: z.string().trim().min(2).max(100), description: z.string().trim().max(800), category: z.enum(["Decant", "Frasco completo"]),
  concentration: z.string().trim().max(80).nullable(), sort_order: z.coerce.number().int(), is_published: z.boolean(), is_featured: z.boolean(), image_urls: z.array(photoUrl).max(6),
});

export function parseProductInput(form: FormData) {
  const variants = z.array(variantSchema).min(1).max(50).parse(JSON.parse(String(form.get("variants") ?? "[]")));
  const rawImages = form.get("image_urls");
  const imageUrls = rawImages ? JSON.parse(String(rawImages)) : form.get("image_url") ? [form.get("image_url")] : [];
  const product = productSchema.parse({ name: form.get("name"), brand: form.get("brand"), description: form.get("description") ?? "", category: form.get("category") ?? "Decant", concentration: form.get("concentration") || null, sort_order: form.get("sort_order") || 0, is_published: form.get("is_published") === "on", is_featured: form.get("is_featured") === "on", image_urls: imageUrls });
  return { product: { ...product, image_url: product.image_urls[0] ?? null, price: variants[0].price, stock: variants[0].stock, size_ml: variants[0].size_ml }, variants };
}

export const maxProductImageBytes = 5 * 1024 * 1024;
export async function validateProductImage(file: File) {
  if (!file.size || file.size > maxProductImageBytes) throw new Error("La foto debe pesar entre 1 byte y 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
  const webp = String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  const extension = file.type === "image/jpeg" && jpeg ? "jpg" : file.type === "image/png" && png ? "png" : file.type === "image/webp" && webp ? "webp" : null;
  if (!extension) throw new Error("Elegí una foto JPG, PNG o WebP válida.");
  return { bytes, extension, contentType: file.type };
}
