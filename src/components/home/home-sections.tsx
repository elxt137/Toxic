import { Armchair, Brush, Car, Droplets, Lightbulb, MessageCircle, Package, Phone, Shield, Sparkles, Tag, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { homeCategories, type CategoryIcon, type HomeCategory } from "@/lib/home-content";

import styles from "./home.module.css";

const icons: Record<CategoryIcon, LucideIcon> = { droplets: Droplets, armchair: Armchair, shield: Shield, sparkles: Sparkles, brush: Brush, lightbulb: Lightbulb, package: Package, tag: Tag, car: Car };

export function SideRail({ categories }: { categories: HomeCategory[] }) {
  return (
    <nav className={styles.rail} aria-label="Accesos por categoría">
      <Link href="/" aria-label="Inicio" title="Inicio"><Car size={22} aria-hidden="true" /></Link>
      {categories.map((category) => {
        const Icon = icons[category.icon];
        return <Link key={category.id} href={category.href} aria-label={category.label} title={category.label}><Icon size={21} aria-hidden="true" /><span>{category.label}</span></Link>;
      })}
    </nav>
  );
}

export function CategoryCircles({ categories }: { categories: HomeCategory[] }) {
  return (
    <section className={`${styles.categories} shell`} aria-labelledby="categorias-title">
      <h2 className={styles.sectionTitle} id="categorias-title">Todo lo que necesitás para</h2>
      <div className={styles.categoriesTrack}>
        {categories.map((category) => {
          const Icon = icons[category.icon];
          return <Link key={category.id} href={category.href} className={styles.categoryItem}><span><Icon size={46} strokeWidth={1.6} aria-hidden="true" /></span>{category.label}</Link>;
        })}
      </div>
    </section>
  );
}

export function PromoBanners() {
  return (
    <section className={`${styles.promos} shell`} aria-label="Promociones">
      <Link href="/#catalogo" className={`${styles.promo} ${styles.promoDark}`}><small>Línea profesional</small><strong>Hecho para quienes <em>viven el detalle</em></strong><span>Ver productos</span></Link>
      <Link href="/productos?categoria=lavado" className={`${styles.promo} ${styles.promoAccent}`}><small>Armá tu kit</small><strong>Lavado completo <em>en un solo pedido</em></strong><span>Elegí tus productos</span></Link>
    </section>
  );
}

export function WideBanner() {
  return (
    <section className="shell" aria-label="Protección">
      <Link href="/productos?categoria=proteccion" className={styles.wideBanner}><div><small>Subí tu nivel</small><strong>Para quienes <em>exigen resultados</em></strong></div><span>Descubrí la línea de protección</span></Link>
    </section>
  );
}

export function HowToBuy() {
  const steps = [
    { title: "Elegí tus productos", text: "Recorré el catálogo y sumá lo que necesitás a tu pedido." },
    { title: "Confirmá tu compra", text: "Pagá online o enviá el pedido por WhatsApp, como te quede más cómodo." },
    { title: "Recibilo o retiralo", text: "Coordinamos el envío o el retiro y te avisamos cuando esté listo." },
  ];
  return (
    <section className={`${styles.howTo} shell`} id="como-comprar" aria-labelledby="como-comprar-title">
      <h2 className={styles.sectionTitle} id="como-comprar-title">Cómo comprar</h2>
      <ol>{steps.map((step, index) => <li key={step.title}><b>{index + 1}</b><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    </section>
  );
}

export function SiteFooter({ whatsappNumber }: { whatsappNumber?: string }) {
  const digits = (whatsappNumber ?? "").replace(/\D/g, "");
  return (
    <footer className={styles.footer} id="contacto">
      <div className={styles.newsletter}>
        <div className="shell">
          <div className={styles.newsletterCopy}>
            <h2>Enterate primero de las novedades</h2>
            <p>Ingresos, ofertas y tips de detailing directo en tu WhatsApp.</p>
            {digits && <a href={`https://wa.me/${digits}?text=${encodeURIComponent("Hola, quiero recibir novedades de RC2 · Estética Vehicular.")}`} target="_blank" rel="noopener noreferrer">Quiero recibir novedades</a>}
          </div>
          <div className={styles.social}><p>Consultas y pedidos</p><div>{digits ? <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={20} aria-hidden="true" /></a> : <p>El canal de contacto se publicará próximamente.</p>}</div></div>
        </div>
      </div>
      <div className={`${styles.footerGrid} shell`} id="info">
        <div><h3>Institucional</h3><Link href="/#nosotros">Quiénes somos</Link><Link href="/#como-comprar">Cómo comprar</Link><Link href="/#envios">Envíos</Link><Link href="/#cambios">Cambios y devoluciones</Link><Link href="/#pagos">Medios de pago</Link></div>
        <div><h3>Categorías</h3>{homeCategories.map((category) => <Link key={category.id} href={category.href}>{category.label}</Link>)}</div>
        <div><h3>Contacto</h3>{digits ? <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer"><Phone size={15} aria-hidden="true" /> WhatsApp: +{digits}</a> : <p>Próximamente publicaremos nuestro contacto comercial.</p>}</div>
        <div className={styles.footerAbout} id="nosotros"><h3>RC2 · Estética Vehicular</h3><p>Somos un emprendimiento de productos para el cuidado del auto: ceras, shampoo, cepillos, luces LED, microfibras y accesorios.</p></div>
      </div>
      <div className={`${styles.footerGrid} shell`} aria-label="Información de compra">
        <div id="envios"><h3>Envíos y retiro</h3><p>Consultá la disponibilidad de envío o retiro y el costo para tu localidad antes de confirmar el pedido.</p></div>
        <div id="cambios"><h3>Cambios y devoluciones</h3><p>Si necesitás ayuda con una compra, contactanos con el número de pedido y el detalle del producto para revisar tu caso.</p></div>
        <div id="pagos"><h3>Medios de pago</h3><p>Podés iniciar la compra online desde tu carrito o coordinar tu pedido por WhatsApp cuando el canal esté disponible.</p></div>
      </div>
      <div className={styles.footerBottom}><span className={styles.footerLogo}>RC2</span><p>© {new Date().getFullYear()} RC2 · Estética Vehicular. Todos los derechos reservados.</p></div>
    </footer>
  );
}
