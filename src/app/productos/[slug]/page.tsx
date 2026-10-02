import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedProduct } from "@/lib/products";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { StorefrontHeader } from "@/components/storefront-header";

type ProductPageProps = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  return (
    <>
      <StorefrontHeader />
      <main className="product-detail-page">
      <div className="shell">
        <Link className="product-detail-back" href="/#catalogo"><ArrowLeft size={16} /> Volver al catálogo</Link>
        <div className="product-detail">
          <div className="product-detail-visual">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={`Frasco de ${product.name}`} />
            ) : <div className="card-bottle" aria-hidden="true"><i /></div>}
          </div>
          <div className="product-detail-copy">
            <p className="product-brand">{product.brand}</p>
            <h1>{product.name}</h1>
            <p className="product-detail-category">{product.category}{product.size_ml ? ` · ${product.size_ml} ml` : ""}</p>
            <p className="product-detail-description">{product.description || "Una fragancia para descubrir y disfrutar."}</p>
            <ProductDetailActions product={product} />
          </div>
        </div>
      </div>
      </main>
    </>
  );
}
