import { Catalog } from "@/components/catalog";
import { StorefrontHeader } from "@/components/storefront-header";
import { getPublishedProducts } from "@/lib/products";

export default async function ProductsPage() {
  const products = await getPublishedProducts();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <main className="notta-page">
      <StorefrontHeader />
      <Catalog products={products} whatsappNumber={whatsappNumber} />
    </main>
  );
}
