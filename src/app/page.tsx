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
      {!getSupabaseConfig() && <div className="demo-banner">Catálogo de muestra · Productos y precios ilustrativos.</div>}
      <StorefrontHeader />
      <section className="notta-hero">
        <div className="shell notta-hero-inner"><p>Limpieza · Protección · Accesorios</p><h1>Tu auto impecable,<br /><em>empieza acá.</em></h1><div><span>Shampoo, ceras, cepillos, luces LED y microfibras para cuidar cada detalle de tu vehículo. Armá tu pedido por WhatsApp.</span><a href="#catalogo">Explorar productos <ArrowDown size={16} /></a></div></div>
      </section>
      {catalogUnavailable && <div className="catalog-notice shell" role="status">No pudimos cargar el catálogo en este momento. Probá de nuevo en unos minutos.</div>}
      <Catalog products={products} whatsappNumber={whatsappNumber} />
      <section className="notta-info" id="info"><div className="shell info-grid"><div><MapPin size={20} /><h2>Envíos y retiro</h2><p>Coordiná retiro o envío a través de WhatsApp una vez que armes tu pedido.</p></div><div><MessageCircle size={20} /><h2>Atención personalizada</h2><p>¿No sabés cuál elegir? Escribinos y te ayudamos a elegir los productos para tu auto.</p></div><div><AtSign size={20} /><h2>Seguinos</h2><p>Novedades, ingresos y recomendaciones en nuestras redes.</p></div></div></section>
      <footer className="notta-footer shell"><div className="notta-logo">TOXIC <span>AUTO CARE</span></div><p>© {new Date().getFullYear()} Toxic</p></footer>
    </main>
  );
}
