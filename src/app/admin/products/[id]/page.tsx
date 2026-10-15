import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/product-form";
import { PrivateProductFields } from "@/components/admin/private-product-fields";
import { ProductEditorShell } from "@/components/admin/product-editor-shell";
import { updateProduct } from "../../actions";

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const client = await createClient();
  const [product, variants, metadata] = await Promise.all([
    client.from("products").select("*").eq("id", id).maybeSingle(),
    client.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
    client.from("product_admin_data").select("*").eq("product_id", id).maybeSingle(),
  ]);
  if (product.error || variants.error || metadata.error) throw new Error("No se pudo cargar el producto. Volvé a intentar.");
  if (!product.data) notFound();
  if (product.data.merged_into) redirect(`/admin/products/${product.data.merged_into}`);
  const editable = { ...product.data, variants: variants.data ?? [] };
  return <ProductEditorShell title="Editar producto"><ProductForm product={editable} action={updateProduct.bind(null, id)} submitLabel="Guardar cambios" /><PrivateProductFields id={id} salePrice={editable.price} metadata={metadata.data ?? undefined} /></ProductEditorShell>;
}
