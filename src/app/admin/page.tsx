import { ExternalLink, Gauge, LogOut, Package, Palette, Plus, Truck, Users, Ticket } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { AdminInventory } from "@/components/admin-inventory";
import { DashboardPanel, OrdersPanel, CustomersPanel, MarketingPanel } from "@/components/admin/console-panels";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { readAllOrders, readAllOrderItems } from "@/lib/admin-orders";
import { defaultAnnouncement } from "@/lib/storefront";
import { createProduct, updateAnnouncement, updateProduct } from "./actions";

const sections = {
  dashboard: { label: "Dashboard", icon: Gauge },
  products: { label: "Productos e inventario", icon: Package },
  sales: { label: "Pedidos, envíos y pagos", icon: Truck },
  clients: { label: "Clientes", icon: Users },
  marketing: { label: "Marketing y cupones", icon: Ticket },
  customization: { label: "Personalización", icon: Palette },
} as const;
type Section = keyof typeof sections;
type Params = { success?: string; section?: string; q?: string | string[]; order?: string };
function getSection(value?: string): Section {
  return value && Object.hasOwn(sections, value) ? value as Section : "dashboard";
}
export default async function AdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [admin, params] = await Promise.all([requireAdmin(), searchParams]);
  const section = getSection(params.section);
  const client = await createClient();
  const [productResult, variantResult, settings, orders, items, metadata, coupons] = await Promise.all([
    client.from("products").select("*").order("sort_order").order("created_at", { ascending: false }),
    client.from("product_variants").select("*").order("sort_order").order("created_at"),
    client.from("storefront_settings").select("announcement_text").eq("id", true).maybeSingle(),
    readAllOrders(client),
    readAllOrderItems(client),
    client.from("product_admin_data").select("*"),
    client.from("coupons").select("*").order("created_at", { ascending: false }),
  ]);
  if (productResult.error || variantResult.error || settings.error || metadata.error || coupons.error) throw new Error("No se pudo cargar el panel de administración.");
  const products = (productResult.data ?? []).map((product) => ({ ...product, variants: (variantResult.data ?? []).filter((variant) => variant.product_id === product.id) }));
  const query = typeof params.q === "string" ? params.q : "";
  return <main className="admin-page premium-admin">
    <header className="admin-header"><div><Link className="brand-mark" href="/">RC2 <span>Estética Vehicular</span></Link></div><div className="admin-nav"><span className="admin-identity">{admin.email}</span><Link href="/" target="_blank" rel="noopener noreferrer">Ver tienda <ExternalLink size={15} /></Link><form action="/auth/signout" method="post"><button type="submit"><LogOut size={16} /> Salir</button></form></div></header>
    <div className="admin-content admin-workspace">
      <aside className="admin-sections" aria-label="Secciones de administración"><p>Tu negocio</p>{Object.entries(sections).map(([key, item]) => { const Icon = item.icon; return <Link className={section === key ? "active" : ""} aria-current={section === key ? "page" : undefined} href={`/admin?section=${key}`} key={key}><Icon size={18} />{item.label}</Link>; })}<div className="sidebar-bottom"><span className="online-dot" /> Panel de RC2</div></aside>
      <section className="admin-main">
        <div className="admin-title"><div><p className="console-eyebrow">Administración</p><h1>{sections[section].label}</h1><p className="admin-subtitle">{section === "dashboard" ? "Ventas, pedidos y disponibilidad, en un solo lugar." : section === "products" ? "Controlá tu catálogo, los costos y el stock disponible." : section === "marketing" ? "Descuentos que podés generar, imprimir y compartir." : "Gestioná la operación de tu tienda."}</p></div>{section === "products" && <span className="count-pill">{products.length} productos</span>}</div>
        {params.success && <div className="form-message success" role="status">Cambios guardados correctamente.</div>}
        {section === "dashboard" && <DashboardPanel products={products} orders={orders} />}
        {section === "sales" && <OrdersPanel orders={orders} items={items} selectedOrder={params.order} />}
        {section === "clients" && <CustomersPanel orders={orders} query={query} />}
        {section === "marketing" && <MarketingPanel coupons={coupons.data ?? []} />}
        {section === "products" && <><details className="new-product-panel"><summary><Plus size={18} /> Agregar producto</summary><ProductForm action={createProduct} submitLabel="Crear producto" /></details><AdminInventory products={products} query={query} updateAction={updateProduct} privateData={metadata.data ?? []} /></>}
        {section === "customization" && <section className="console-panel"><h2>Mensaje de la barra superior</h2><p className="console-note">Actualizá la promoción que ven tus clientes al entrar a la tienda.</p><form className="console-form" action={updateAnnouncement}><label>Mensaje promocional<input name="announcement_text" defaultValue={settings.data?.announcement_text ?? defaultAnnouncement} required maxLength={240} /></label><button className="admin-button" type="submit">Guardar mensaje</button></form></section>}
      </section>
    </div>
  </main>;
}
