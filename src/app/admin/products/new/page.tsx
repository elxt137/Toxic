import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";
import { ProductEditorShell } from "@/components/admin/product-editor-shell";
import { createProduct } from "../../actions";
export default async function NewProductPage() {
  await requireAdmin();
  return <ProductEditorShell title="Agregar producto"><ProductForm action={createProduct} submitLabel="Crear producto" /></ProductEditorShell>;
}
