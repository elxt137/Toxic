"use client";
import { useId, useState } from "react";
import { uploadProductImage } from "@/app/admin/image-actions";
import { maxProductImageBytes } from "@/lib/product-editor";

export function ProductImageEditor({ images, onChange, onBusy }: { images: string[]; onChange: (images: string[]) => void; onBusy: (busy: boolean) => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  async function upload(files: File[]) {
    setError("");
    if (images.length + files.length > 6) { setError("Podés guardar hasta 6 fotos por producto."); return; }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > maxProductImageBytes)) { setError("Elegí fotos JPG, PNG o WebP de hasta 5 MB cada una."); return; }
    setBusy(true); onBusy(true);
    const uploaded = [...images];
    try {
      for (const file of files) {
        const form = new FormData(); form.set("file", file);
        const result = await uploadProductImage(form);
        if (!result.url) { setError(result.error ?? "No se pudo subir la foto."); break; }
        uploaded.push(result.url); onChange([...uploaded]);
      }
    } catch { setError("No se pudo subir la foto. Revisá tu conexión y volvé a intentar."); }
    finally { setBusy(false); onBusy(false); }
  }
  function addUrl() {
    if (!/^https?:\/\//i.test(url) || !URL.canParse(url)) { setError("Ingresá una URL HTTP o HTTPS válida."); return; }
    if (images.length >= 6) { setError("Podés guardar hasta 6 fotos por producto."); return; }
    onChange([...images, url.trim()]); setUrl(""); setError("");
  }
  return <fieldset className="wide product-image-editor" disabled={busy}>
    <legend>Fotos del producto</legend>
    <p>La primera foto es la portada. Hasta 6 fotos, de 5 MB cada una.</p>
    <input type="hidden" name="image_urls" value={JSON.stringify(images)} />
    <div className="product-image-grid">{images.map((image, index) => <figure key={`${image}-${index}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={`Foto ${index + 1} del producto`} width={140} height={140} />
      <figcaption>{index === 0 ? "Portada" : `Foto ${index + 1}`}</figcaption>
      <div>{index > 0 && <button type="button" onClick={() => onChange([image, ...images.filter((_, i) => i !== index)])}>Usar de portada</button>}<button type="button" onClick={() => onChange(images.filter((_, i) => i !== index))} aria-label={`Quitar foto ${index + 1}`}>Quitar</button></div>
    </figure>)}</div>
    <label htmlFor={id}>Subir fotos<input id={id} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void upload(files); }} /></label>
    <div className="image-url-entry"><label htmlFor={`${id}-url`}>O agregar por URL<input id={`${id}-url`} type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label><button type="button" onClick={addUrl}>Agregar foto</button></div>
    {busy && <p role="status">Subiendo fotos…</p>}{error && <p className="form-message error" role="alert">{error}</p>}
    <small>Los cambios de la galería se aplican al guardar el producto.</small>
  </fieldset>;
}
