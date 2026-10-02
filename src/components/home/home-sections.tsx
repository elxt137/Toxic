import { Armchair, AtSign, Brush, Car, Clock, Droplets, Lightbulb, Mail, MessageCircle, Package, Phone, Shield, Sparkles, Tag, type LucideIcon } from "lucide-react";
import Link from "next/link";

import type { CategoryIcon, HomeCategory } from "@/lib/home-content";

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
      <Link href="/#catalogo" className={`${styles.promo} ${styles.promoAccent}`}><small>Armá tu kit</small><strong>Lavado completo <em>en un solo pedido</em></strong><span>Elegí tus productos</span></Link>
    </section>
  );
}

export function WideBanner() {
  return (
    <section className="shell" aria-label="Protección">
      <Link href="/#catalogo" className={styles.wideBanner}><div><small>Subí tu nivel</small><strong>Para quienes <em>exigen resultados</em></strong></div><span>Descubrí la línea de protección</span></Link>
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
            {digits && <a href={`https://wa.me/${digits}?text=${encodeURIComponent("Hola, quiero recibir novedades de Toxic.")}`} target="_blank" rel="noopener noreferrer">Quiero recibir novedades</a>}
          </div>
          <div className={styles.social}><p>Seguinos en redes</p><div><a href="#contacto" aria-label="Instagram"><AtSign size={20} aria-hidden="true" /></a>{digits && <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={20} aria-hidden="true" /></a>}</div></div>
        </div>
      </div>
      <div className={`${styles.footerGrid} shell`} id="info">
        <div><h3>Institucional</h3><Link href="/#info">Quiénes somos</Link><Link href="/#como-comprar">Cómo comprar</Link><Link href="/#info">Envíos</Link><Link href="/#info">Cambios y devoluciones</Link><Link href="/#info">Medios de pago</Link></div>
        <div><h3>Categorías</h3><Link href="/#catalogo">Lavado</Link><Link href="/#catalogo">Interior</Link><Link href="/#catalogo">Protección</Link><Link href="/#catalogo">Accesorios</Link><Link href="/#catalogo">Kits</Link></div>
        <div><h3>Contacto</h3>{digits && <p><Phone size={15} aria-hidden="true" /> WhatsApp: +{digits}</p>}<p><Mail size={15} aria-hidden="true" /> Escribinos por nuestras redes</p><p><Clock size={15} aria-hidden="true" /> Lunes a viernes de 9 a 18 h · Sábados de 9 a 13 h</p></div>
        <div className={styles.footerAbout}><h3>Toxic Auto Care</h3><p>Productos de limpieza, protección y accesorios para el cuidado de tu vehículo. Envíos a todo el país.</p></div>
      </div>
      <div className={styles.footerBottom}><span className={styles.footerLogo}>Toxic</span><p>© {new Date().getFullYear()} Toxic Auto Care. Todos los derechos reservados.</p></div>
    </footer>
  );
}
