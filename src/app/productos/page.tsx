import { Catalog } from "@/components/catalog";
import { StorefrontHeader } from "@/components/storefront-header";
import { getPublishedProducts } from "@/lib/products";
import { getStoreWhatsappNumber, getCommerceSettings } from "@/lib/storefront";
import { getCustomerBenefit } from "@/lib/customer-benefit";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ categoria?: string | string[]; q?: string | string[] }> }) {
  const params = await searchParams;
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  let unavailable = false;
  try { products = await getPublishedProducts(); } catch { unavailable = true; }
  const whatsappNumber = await getStoreWhatsappNumber();
  const [settings,benefit] = await Promise.all([getCommerceSettings(),getCustomerBenefit().catch(() => null)]);

  return (
    <main className="notta-page rc2-catalog-page">
      <StorefrontHeader />
      {unavailable && <p className="catalog-notice shell" role="status">No pudimos cargar el catálogo. Probá de nuevo en unos minutos.</p>}
      <Catalog key={`${params.categoria ?? ""}:${params.q ?? ""}`} products={products} whatsappNumber={whatsappNumber} settings={settings} benefit={benefit}
        initialCategory={typeof params.categoria === "string" ? params.categoria : ""}
        initialQuery={typeof params.q === "string" ? params.q : ""} />
    </main>
  );
}
