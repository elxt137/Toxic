import Link from "next/link";
import { saveCustomer, saveCustomerGroup } from "@/app/admin/commerce-actions";
import { purchaseCycle } from "@/lib/crm";
import { adminMoney, paymentLabels } from "@/lib/admin-console";
import type { Database } from "@/types/database";
import { AdminMutationForm } from "./mutation-form";
type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Group = Database["public"]["Tables"]["customer_groups"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type Item = Database["public"]["Tables"]["order_items"]["Row"];
const date = (value: string) => new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "medium" }).format(new Date(value));
function CustomerFields({ customer, groups }: { customer?: Customer; groups: Group[] }) {
  return <><label>Nombre<input name="name" required minLength={2} maxLength={160} defaultValue={customer?.name ?? ""} /></label><label>Email<input name="email" type="email" required maxLength={254} defaultValue={customer?.email ?? ""} /></label><label>Teléfono<input name="phone" type="tel" maxLength={40} defaultValue={customer?.phone ?? ""} /></label><label>Dirección<textarea name="address" maxLength={500} rows={2} defaultValue={customer?.address ?? ""} /></label><label>Grupo<select name="group_id" required defaultValue={customer?.group_id ?? groups.find((group) => group.slug === "retail")?.id}>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label></>;
}
export function CrmPanel({ customers, groups, orders, items, query }: { customers: Customer[]; groups: Group[]; orders: Order[]; items: Item[]; query: string }) {
  const matches = customers.filter((customer) => `${customer.name} ${customer.email} ${customer.phone} ${customer.address} ${groups.find((group) => group.id === customer.group_id)?.name}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <>
    <details className="crm-new-customer"><summary>Agregar grupo de clientes</summary><AdminMutationForm action={saveCustomerGroup.bind(null,null)} submitLabel="Crear grupo"><label>Nombre del grupo<input name="name" required minLength={2} maxLength={100} /></label><label>Descuento (%)<input name="discount_percent" type="number" min="0" max="99" step="0.01" defaultValue="0" required /></label></AdminMutationForm></details>
    <section className="console-panel"><h2>Grupos y descuentos automáticos</h2><p className="console-note">Asigná cada ficha a un grupo. El descuento se aplica en Mercado Pago cuando el comprador verifica con Google el correo de su ficha. 0% mantiene el precio de lista.</p><div className="crm-groups">{groups.map((group) => <AdminMutationForm key={group.id} action={saveCustomerGroup.bind(null,group.id)} submitLabel="Guardar grupo"><label>Nombre del grupo<input name="name" defaultValue={group.name} minLength={2} maxLength={100} required /></label><label>Descuento (%)<input name="discount_percent" type="number" min="0" max="99" step="0.01" defaultValue={group.discount_percent} required /></label></AdminMutationForm>)}</div></section>
    <section className="console-panel"><div className="panel-heading"><h2>Base de clientes</h2><span>{matches.length} contactos</span></div><p className="console-note">Los pedidos pagados registran la ficha automáticamente. También podés cargar contactos antes de su primera compra.</p><details className="crm-new-customer"><summary>Agregar cliente</summary><AdminMutationForm action={saveCustomer.bind(null,null)} submitLabel="Crear cliente" className="crm-contact-form"><CustomerFields groups={groups} /></AdminMutationForm></details>
      <form action="/admin" className="console-form customer-search"><input type="hidden" name="section" value="clients" /><label>Buscar cliente<input name="q" defaultValue={query} placeholder="Nombre, correo, teléfono, dirección o grupo" /></label><button className="admin-button">Buscar</button></form>
      {!matches.length && <p className="console-empty">No hay clientes que coincidan con la búsqueda.</p>}
      {matches.map((customer) => {
        const history = orders.filter((order) => order.customer_id === customer.id || (!order.customer_id && order.payer_email?.toLowerCase().trim() === customer.email));
        const paid = history.filter((order) => order.status === "approved");
        const cycle = purchaseCycle(history);
        return <details key={customer.id} className="console-customer"><summary><div className="customer-avatar" aria-hidden="true">{customer.name.slice(0,1)}</div><div><b>{customer.name}</b><small>{customer.email}</small></div><span className="console-status">{groups.find((group) => group.id === customer.group_id)?.name}</span><span>{paid.length} compras</span><strong>{adminMoney(paid.reduce((sum,order) => sum+Number(order.total),0))}</strong></summary>
          <div className="customer-history"><p>Registro: {date(customer.registered_at)} · {cycle === null ? "Todavía no hay compras suficientes para estimar reposición." : `Reposición estimada cada ${cycle} días (según compras pagadas).`}</p><AdminMutationForm action={saveCustomer.bind(null,customer.id)} submitLabel="Guardar ficha" className="crm-contact-form"><CustomerFields customer={customer} groups={groups} /></AdminMutationForm><h3>Historial de compras</h3>{history.length ? history.map((order) => <article className="crm-purchase" key={order.id}><Link href={`/admin?section=sales&order=${order.id}`}><span>{date(order.created_at)} · #{order.id.slice(0,8)}</span><span>{paymentLabels[order.status]}</span><strong>{adminMoney(order.total)}</strong></Link><ul>{items.filter((item) => item.order_id === order.id).map((item) => <li key={item.id}>{item.quantity} × {item.product_name} — {adminMoney(item.quantity*item.unit_price)}</li>)}</ul></article>) : <p className="console-empty">Este cliente todavía no tiene pedidos.</p>}</div>
        </details>;
      })}
    </section>
  </>;
}
