import { Catalog } from "@/components/catalog";
import { CookieNotice } from "@/components/home/cookie-notice";
import { FloatingActions } from "@/components/home/floating-actions";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { CategoryCircles, HowToBuy, PromoBanners, SideRail, SiteFooter, WideBanner } from "@/components/home/home-sections";
import { ProductCarousel } from "@/components/home/product-carousel";
import { ShortsGallery } from "@/components/home/shorts-gallery";
import { StoreReviews } from "@/components/home/store-reviews";
import { StorefrontHeader } from "@/components/storefront-header";
import { getSupabaseConfig } from "@/lib/env";
import { heroSlides, homeCategories, shortVideos, storeReviews } from "@/lib/home-content";
import { getPublishedProducts } from "@/lib/products";
import type { ProductWithVariants } from "@/types/database";

export default async function Home() {
  let products: ProductWithVariants[] = [];
  let catalogUnavailable = false;

  try {
    products = await getPublishedProducts();
  } catch {
    catalogUnavailable = true;
  }
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const featured = products.filter((product) => product.is_featured);
  const available = products.filter((product) => product.variants.some((variant) => variant.stock > 0));

  return (
    <main className="notta-page tx-store">
      {!getSupabaseConfig() && <div className="demo-banner">Catálogo de muestra · Productos y precios ilustrativos.</div>}
      <SideRail categories={homeCategories} />
      <StorefrontHeader />
      <HeroCarousel slides={heroSlides} />
      {catalogUnavailable && <div className="catalog-notice shell" role="status">No pudimos cargar el catálogo en este momento. Probá de nuevo en unos minutos.</div>}
      <CategoryCircles categories={homeCategories} />
      <PromoBanners />
      <ProductCarousel title="Lo más vendido" products={available} />
      <WideBanner />
      <ProductCarousel title="Destacados" products={featured.length >= 3 ? featured : products} />
      <ShortsGallery shorts={shortVideos} />
      <Catalog products={products} whatsappNumber={whatsappNumber} />
      <HowToBuy />
      <StoreReviews reviews={storeReviews} />
      <SiteFooter whatsappNumber={whatsappNumber} />
      <FloatingActions whatsappNumber={whatsappNumber} />
      <CookieNotice />
    </main>
  );
}
