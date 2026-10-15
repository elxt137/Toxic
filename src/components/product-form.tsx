"use client";
import { startTransition, useActionState, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { ProductImageEditor } from "@/components/admin/product-image-editor";
import {ProductVideoEditor} from "@/components/admin/product-video-editor";
import type { ProductWithVariants } from "@/types/database";

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  product?: ProductWithVariants;
  submitLabel: string;
};
type EditableVariant = { id?: string; label: string; image_url?:string|null;size_ml: number | null; price: number; stock: number; is_active: boolean };

export function ProductForm({ action, product, submitLabel }: ProductFormProps) {
  const [images, setImages] = useState(product?.image_urls?.length ? product.image_urls : product?.image_url ? [product.image_url] : []);
  const [videos,setVideos]=useState(product?.video_urls??[]);
  const [uploadCount,setUploadCount]=useState(0);const uploading=uploadCount>0;
  function setUploading(busy:boolean){setUploadCount(count=>Math.max(0,count+(busy?1:-1)));}
  const [message, submitAction, pending] = useActionState(async (_previous: string, form: FormData) => {
    try { await action(form); return ""; } catch (error) {
      unstable_rethrow(error);
      return "No se pudieron guardar los cambios. Revisá los campos y volvé a intentar.";
    }
  }, "");
  const [variants, setVariants] = useState<EditableVariant[]>(product?.variants?.map(({ id, label,image_url, size_ml, price, stock, is_active }) => ({ id, label,image_url, size_ml, price, stock, is_active })) ?? [{ label: product?.size_ml ? `${product.size_ml} ml` : "", size_ml: product?.size_ml ?? null, price: product?.price ?? 0, stock: product?.stock ?? 0, is_active: true }]);
  const first = variants[0];
  return (
    <form className="product-form" onSubmit={(event) => { event.preventDefault(); if (pending || uploading) return; const form = new FormData(event.currentTarget); startTransition(() => submitAction(form)); }}>
      <label>Nombre<input name="name" defaultValue={product?.name} required maxLength={120} /></label>
      <label>Marca<input name="brand" defaultValue={product?.brand} maxLength={100} placeholder="Opcional" /></label>
      <label>Tipo de variante<input name="option_name" defaultValue={product?.option_name??"Presentación"} required maxLength={30} placeholder="Ej. Color, tamaño o presentación"/></label>
      <label>Categoría<select name="category" defaultValue={product?.category ?? "Decant"}><option value="Decant">Limpieza y protección</option><option value="Frasco completo">Accesorios</option></select></label>
      <label className="wide">Descripción<textarea name="description" defaultValue={product?.description} rows={3} maxLength={800} /></label>
      <input type="hidden" name="price" value={first?.price ?? 0} /><input type="hidden" name="stock" value={first?.stock ?? 0} /><input type="hidden" name="size_ml" value={first?.size_ml ?? ""} /><input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <div className="wide variant-editor"><div><b>Presentaciones, precio y stock</b><button type="button" onClick={() => setVariants((items) => [...items, { label: "", size_ml: null, price: 0, stock: 0, is_active: true }])}>Agregar presentación</button></div>{variants.map((variant, index) => <div className="variant-row" key={variant.id ?? index}><input aria-label="Presentación" placeholder="Ej. 500 ml o pack de 3" value={variant.label} required onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><input aria-label="Mililitros" type="number" min="0.1" step="0.1" placeholder="ml" value={variant.size_ml ?? ""} onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, size_ml: event.target.value ? Number(event.target.value) : null } : item))} /><input aria-label="Precio" type="number" min="0" step="0.01" placeholder="Precio" value={variant.price} required onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(event.target.value) } : item))} /><input aria-label="Stock" type="number" min="0" step="1" placeholder="Stock" value={variant.stock} required onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, stock: Number(event.target.value) } : item))} /><label><input type="checkbox" checked={variant.is_active} onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, is_active: event.target.checked } : item))} /> Activa</label>{variants.length > 1 && <button type="button" onClick={() => setVariants((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Quitar</button>}</div>)}</div>
      <label>Especificación<input name="concentration" defaultValue={product?.concentration ?? ""} /></label>
      <ProductImageEditor images={images} onChange={setImages} onBusy={setUploading} />
      <div className="wide variant-image-settings"><h3>Foto de cada variante</h3><p>Elegí una foto cargada para mostrarla al seleccionar el color o la presentación.</p>{variants.map((variant,index)=><label key={variant.id??index}>{variant.label||`Variante ${index+1}`}<select aria-label={`Foto de variante ${index+1}`} value={images.includes(variant.image_url??"")?variant.image_url??"":""} onChange={event=>setVariants(items=>items.map((item,i)=>i===index?{...item,image_url:event.target.value||null}:item))}><option value="">Usar portada</option>{images.map((url,i)=><option key={url} value={url}>Foto {i+1}</option>)}</select></label>)}</div>
      <ProductVideoEditor videos={videos} onChange={setVideos} onBusy={setUploading}/>
      <label>Orden<input name="sort_order" type="number" step="1" defaultValue={product?.sort_order ?? 0} /></label>
      <div className="check-group">
        <label><input name="is_published" type="checkbox" defaultChecked={product?.is_published} /> Publicado</label>
        <label><input name="is_featured" type="checkbox" defaultChecked={product?.is_featured} /> Destacado</label>
      </div>
      {message && <p className="wide form-message error" role="alert">{message}</p>}
      <button className="save-button" type="submit" disabled={pending || uploading}>{pending ? "Guardando…" : uploading ? "Esperá a que terminen de subir las fotos" : submitLabel}</button>
    </form>
  );
}
