import { ExternalLink, LogOut, Package, Palette, Plus, ReceiptText } from "lucide-react";
import Link from "next/link";

import { ProductForm } from "@/components/product-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { defaultAnnouncement } from "@/lib/storefront";
import type { Database, Product } from "@/types/database";

import { createProduct, updateAnnouncement, updateProduct } from "./actions";

const sections = {
  sales: { label: "Ventas", icon: ReceiptText },
  products: { label: "Productos e inventario", icon: Package },
  customization: { label: "Personalización de la web", icon: Palette },
} as const;

type Section = keyof typeof sections;
type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type AdminPageProps = { searchParams: Promise<{ success?: string; section?: string }> };

function getSection(value?: string): Section {
  return value === "products" || value === "customization" ? value : "sales";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [admin, params] = await Promise.all([requireAdmin(), searchParams]);
  const section = getSection(params.section);
  const supabase = await createClient();
  const [{ data: products, error: productsError }, { data: variants, error: variantsError }, { data: storefront }, { data: orders, error: ordersError }, { data: orderItems, error: orderItemsError }] = await Promise.all([
    supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false }),
    supabase.from("product_variants").select("*").order("sort_order").order("created_at"),
    supabase.from("storefront_settings").select("announcement_text").eq("id", true).maybeSingle(),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("order_items").select("*").order("created_at"),
  ]);
  if (productsError || variantsError) throw new Error(`No se pudo cargar el inventario: ${productsError?.message ?? variantsError?.message}`);
  if (ordersError || orderItemsError) throw new Error(`No se pudieron cargar los pedidos: ${ordersError?.message ?? orderItemsError?.message}`);

  const productsWithVariants = (products ?? []).map((product) => ({ ...product, variants: (variants ?? []).filter((variant) => variant.product_id === product.id) }));
  const units = (variants ?? []).filter((variant) => variant.is_active).reduce((total, variant) => total + variant.stock, 0);
  const published = products.filter((product) => product.is_published).length;
  const currentSection = sections[section];

  return <main className="admin-page">
    <header className="admin-header"><div><Link className="brand-mark" href="/">TOXIC <span>admin</span></Link><p>{admin.email}</p></div><div className="admin-nav"><Link href="/" target="_blank">Ver vidriera <ExternalLink size={15} /></Link><form action="/auth/signout" method="post"><button type="submit">Salir <LogOut size={15} /></button></form></div></header>
    <div className="admin-content admin-workspace">
      <aside className="admin-sections" aria-label="Secciones de administración"><p>Administración</p>{Object.entries(sections).map(([key, item]) => { const Icon = item.icon; return <Link className={section === key ? "active" : ""} href={`/admin?section=${key}`} key={key}><Icon size={17} />{item.label}</Link>; })}</aside>
      <section className="admin-main">
        <div className="admin-title"><div><p className="eyebrow">Panel privado</p><h1>{currentSection.label}</h1></div>{section === "products" && <div className="metrics"><span><b>{products.length}</b> productos</span><span><b>{units}</b> unidades</span><span><b>{published}</b> publicados</span></div>}</div>
        {params.success && <div className="form-message success">Cambios guardados correctamente.</div>}
        {section === "sales" && <SalesSection orders={orders ?? []} orderItems={orderItems ?? []} />}
        {section === "products" && <ProductsSection products={productsWithVariants} />}
        {section === "customization" && <section className="announcement-editor customization-panel"><div><p className="eyebrow">Barra superior</p><h2>Mensaje en movimiento</h2><p>Editalo desde acá y guardá los cambios sin modificar código.</p></div><form action={updateAnnouncement}><input name="announcement_text" defaultValue={storefront?.announcement_text ?? defaultAnnouncement} required maxLength={240} aria-label="Mensaje promocional" /><button className="save-button" type="submit">Guardar mensaje</button></form></section>}
      </section>
    </div>
  </main>;
}

function SalesSection({ orders, orderItems }: { orders: Order[]; orderItems: OrderItem[] }) {
  return <section className="orders-panel"><div className="orders-panel-heading"><div><p className="eyebrow">Ventas</p><h2>Ventas recientes</h2><p>Consultá cada operación y abrí el detalle cuando lo necesites.</p></div><ReceiptText size={28} /></div>{!orders.length ? <p className="orders-empty">Todavía no hay ventas registradas.</p> : <div className="orders-list">{orders.map((order) => {
    const address = [`${order.shipping_street ?? ""} ${order.shipping_number ?? ""}`.trim(), order.shipping_apartment, [order.shipping_city, order.shipping_province].filter(Boolean).join(", "), order.shipping_postal_code].filter(Boolean).join(" · ");
    const items = orderItems.filter((item) => item.order_id === order.id);
    return <article className="order-record" key={order.id}><div className="order-record-title"><div><span>Pedido #{order.id.slice(0, 8)}</span><b>{order.payer_name ?? "Comprador sin datos"}</b><small>{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))}</small></div><div className="order-record-summary"><strong>{new Intl.NumberFormat("es-AR", { style: "currency", currency: order.currency, maximumFractionDigits: 0 }).format(order.total)}</strong><span className={`order-status ${order.status}`}>{order.status}</span></div></div><details className="order-detail"><summary>Ver detalle</summary><div className="order-record-grid"><div><b>Contacto</b><span>{order.payer_email ?? "Sin correo"}</span><span>{order.buyer_phone ?? "Sin teléfono"}</span></div><div><b>Envío</b><span>{address || "Sin dirección"}</span></div><div><b>Pago</b><span>{order.mercadopago_payment_id ? `MP ${order.mercadopago_payment_id}` : "Pendiente de pago"}</span></div></div><div className="order-record-items">{items.map((item) => <span key={item.id}>{item.quantity} × {item.product_name}</span>)}</div></details></article>;
  })}</div>}</section>;
}

function ProductsSection({ products }: { products: (Product & { variants: Database["public"]["Tables"]["product_variants"]["Row"][] })[] }) {
  return <><details className="new-product-panel"><summary><Plus size={18} /> Agregar producto</summary><ProductForm action={createProduct} submitLabel="Crear producto" /></details><section className="inventory-list">{products.length === 0 && <div className="admin-empty"><Package size={32} /><h2>Inventario vacío</h2><p>Agregá el primer producto desde el botón superior.</p></div>}{products.map((product) => { const update = updateProduct.bind(null, product.id); return <details className="inventory-item" key={product.id}><summary><span className={`status-dot ${product.is_published ? "live" : "draft"}`} /><span className="inventory-name"><b>{product.name}</b><small>{product.brand}</small></span><span className="inventory-stock"><b>{product.stock}</b><small>unidades</small></span><span className={product.is_published ? "published" : "unpublished"}>{product.is_published ? "Publicado" : "Oculto"}</span></summary><ProductForm action={update} product={product} submitLabel="Guardar cambios" /></details>; })}</section></>;
}
