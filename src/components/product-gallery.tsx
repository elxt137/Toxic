"use client";
import { useState } from "react";
export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [selected, setSelected] = useState(0);
  return <div className="product-gallery"><div className="product-detail-visual">
    {images.length ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[selected] ?? images[0]} alt={`Producto: ${name}`} />
    </> : <div className="card-bottle" aria-hidden="true"><i /></div>}
    </div>{images.length > 1 && <div className="product-gallery-thumbnails" aria-label="Fotos del producto">{images.map((src, index) => <button type="button" key={`${src}-${index}`} aria-label={`Ver foto ${index + 1}`} aria-pressed={index === selected} onClick={() => setSelected(index)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={64} height={64} loading="lazy" />
    </button>)}</div>}
  </div>;
}
