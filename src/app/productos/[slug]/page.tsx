import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound,permanentRedirect } from "next/navigation";

import { getPublishedProduct,getProductRedirect } from "@/lib/products";
import {ProductDetailContent} from "@/components/product-detail-content";
import { StorefrontHeader } from "@/components/storefront-header";

type ProductPageProps = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) {const target=await getProductRedirect(slug);if(target)permanentRedirect(`/productos/${target}`);notFound();}

  return (
    <>
      <StorefrontHeader />
      <main className="product-detail-page">
      <div className="shell">
        <Link className="product-detail-back" href="/#catalogo"><ArrowLeft size={16} /> Volver al catálogo</Link>
        <ProductDetailContent product={product}/>
      </div>
      </main>
    </>
  );
}
