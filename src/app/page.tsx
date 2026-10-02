import { ArrowDown, AtSign, MapPin, MessageCircle } from "lucide-react";

import { Catalog } from "@/components/catalog";
import { StorefrontHeader } from "@/components/storefront-header";
import { getSupabaseConfig } from "@/lib/env";
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

  return (
    <main className="notta-page">
      {!getSupabaseConfig() && <div className="demo-banner">Vista demo · Configurá Supabase para cargar el catálogo real.</div>}
      <StorefrontHeader />
      <section className="notta-hero">
        <div className="shell notta-hero-inner"><p>Perfumes · Decants · Frascos completos</p><h1>Tu próxima fragancia,<br /><em>empieza acá.</em></h1><div><span>Descubrí perfumes árabes y de diseñador. Elegí tu tamaño y armá tu pedido por WhatsApp.</span><a href="#catalogo">Explorar perfumes <ArrowDown size={16} /></a></div></div>
      </section>
      {catalogUnavailable && <div className="catalog-notice shell" role="status">No pudimos cargar el catÃ¡logo en este momento. ProbÃ¡ de nuevo en unos minutos.</div>}
      <Catalog products={products} whatsappNumber={whatsappNumber} />
      <section className="notta-info" id="info"><div className="shell info-grid"><div><MapPin size={20} /><h2>Envíos y retiro</h2><p>Coordiná retiro o envío a través de WhatsApp una vez que armes tu pedido.</p></div><div><MessageCircle size={20} /><h2>Atención personalizada</h2><p>¿No sabés cuál elegir? Escribinos y te ayudamos a encontrar una fragancia para vos.</p></div><div><AtSign size={20} /><h2>Seguinos</h2><p>Novedades, ingresos y recomendaciones en nuestras redes.</p></div></div></section>
      <footer className="notta-footer shell"><div className="notta-logo">NOTTA <span>DECANTS</span></div><p>© {new Date().getFullYear()} Notta Decants</p></footer>
    </main>
  );
}
