"use client";
import { useState } from "react";
import type { ProductWithVariants } from "@/types/database";

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  product?: ProductWithVariants;
  submitLabel: string;
};
type EditableVariant = { id?: string; label: string; size_ml: number | null; price: number; stock: number; is_active: boolean };

export function ProductForm({ action, product, submitLabel }: ProductFormProps) {
  const [variants, setVariants] = useState<EditableVariant[]>(product?.variants?.map(({ id, label, size_ml, price, stock, is_active }) => ({ id, label, size_ml, price, stock, is_active })) ?? [{ label: product?.size_ml ? `${product.size_ml} ml` : "", size_ml: product?.size_ml ?? null, price: product?.price ?? 0, stock: product?.stock ?? 0, is_active: true }]);
  const first = variants[0];
  return (
    <form action={action} className="product-form">
      <label>Nombre<input name="name" defaultValue={product?.name} required maxLength={120} /></label>
      <label>Marca<input name="brand" defaultValue={product?.brand} required maxLength={100} /></label>
      <label>Categoría<select name="category" defaultValue={product?.category ?? "Decant"}><option value="Decant">Limpieza y protección</option><option value="Frasco completo">Accesorios</option></select></label>
      <label className="wide">Descripción<textarea name="description" defaultValue={product?.description} rows={3} maxLength={800} /></label>
      <input type="hidden" name="price" value={first?.price ?? 0} /><input type="hidden" name="stock" value={first?.stock ?? 0} /><input type="hidden" name="size_ml" value={first?.size_ml ?? ""} /><input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <div className="wide variant-editor"><div><b>Presentaciones, precio y stock</b><button type="button" onClick={() => setVariants((items) => [...items, { label: "", size_ml: null, price: 0, stock: 0, is_active: true }])}>Agregar presentación</button></div>{variants.map((variant, index) => <div className="variant-row" key={variant.id ?? index}><input aria-label="Presentación" placeholder="Ej. 500 ml o pack de 3" value={variant.label} required onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><input aria-label="Mililitros" type="number" min="0.1" step="0.1" placeholder="ml" value={variant.size_ml ?? ""} onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, size_ml: event.target.value ? Number(event.target.value) : null } : item))} /><input aria-label="Precio" type="number" min="0" step="0.01" placeholder="Precio" value={variant.price} required onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(event.target.value) } : item))} /><input aria-label="Stock" type="number" min="0" step="1" placeholder="Stock" value={variant.stock} required onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, stock: Number(event.target.value) } : item))} /><label><input type="checkbox" checked={variant.is_active} onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, is_active: event.target.checked } : item))} /> Activa</label>{variants.length > 1 && <button type="button" onClick={() => setVariants((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Quitar</button>}</div>)}</div>
      <label>Especificación<input name="concentration" defaultValue={product?.concentration ?? ""} /></label>
      <label className="wide">URL de imagen<input name="image_url" type="url" placeholder="https://..." defaultValue={product?.image_url ?? ""} /></label>
      <label>Orden<input name="sort_order" type="number" step="1" defaultValue={product?.sort_order ?? 0} /></label>
      <div className="check-group">
        <label><input name="is_published" type="checkbox" defaultChecked={product?.is_published} /> Publicado</label>
        <label><input name="is_featured" type="checkbox" defaultChecked={product?.is_featured} /> Destacado</label>
      </div>
      <button className="save-button" type="submit">{submitLabel}</button>
    </form>
  );
}
