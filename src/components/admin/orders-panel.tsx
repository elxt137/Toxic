"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Check, CheckCircle2, Clock3, Download, Landmark, MessageCircle, MoreHorizontal, Package, Search, X, XCircle } from "lucide-react";
import { approveBankTransfer, attachTransferReceipt, type OrderActionResult } from "@/app/admin/order-actions";
import { updateOrderWorkflow } from "@/app/admin/console-actions";
import { adminMoney, shippingLabels, transactionLabels } from "@/lib/admin-console";
import { canApproveTransfer, filterOrders, orderDate, paymentStatus, paymentTypeLabels, whatsappLink, type ManagedOrder, type OrderItem } from "@/lib/order-management";
import type { ProductWithVariants } from "@/types/database";
import { TransferOrderForm } from "./transfer-order-form";

export function PaymentBadge({ status }: { status: ManagedOrder["status"] }) {
  const value = paymentStatus[status];
  const Icon = status === "approved" ? CheckCircle2 : status === "pending" ? Clock3 : XCircle;
  return <span className={`sales-badge sales-${value.tone}`}><Icon size={14} aria-hidden="true" />{value.label}</span>;
}
function MethodBadge({ order }: { order: ManagedOrder }) {
  const bank = order.payment_method === "bank_transfer";
  return <span className={`sales-badge sales-method ${bank ? "sales-bank" : "sales-mp"}`}>{bank ? <Landmark size={14} aria-hidden="true" /> : <Banknote size={14} aria-hidden="true" />}{bank ? "Transferencia" : "Mercado Pago"}</span>;
}
function ApproveTransfer({ order }: { order: ManagedOrder }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<OrderActionResult>();
  const router = useRouter();
  if (!canApproveTransfer(order)) return null;
  return <div className="sales-approval"><button type="button" className="sales-approve" disabled={pending || result?.success} onClick={() => {
    if (!window.confirm(`¿Confirmás que recibiste ${adminMoney(order.total)} de ${order.payer_name ?? "este comprador"} en tu cuenta bancaria? Se acreditará el pedido #${order.id.slice(0, 8)} y se descontará stock.`)) return;
    start(async () => {
      try { const response = await approveBankTransfer(order.id); setResult(response); if (response.success) router.refresh(); }
      catch { setResult({ success: false, message: "No se pudo acreditar el pago. Verificá tu sesión y volvé a intentar." }); }
    });
  }}><Check size={15} aria-hidden="true" />{pending ? "Acreditando…" : result?.success ? "Pago acreditado" : "Aprobar transferencia"}</button>{result && <p role={result.success ? "status" : "alert"} className="sales-feedback">{result.message}</p>}</div>;
}
function ReceiptSection({ order }: { order: ManagedOrder }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<OrderActionResult>();
  const router = useRouter();
  return <section className="sales-detail-section"><h3>Comprobante de transferencia</h3>{order.transfer_receipt_path ? <div className="sales-proof-links"><a target="_blank" rel="noopener noreferrer" href={`/admin/orders/${order.id}/receipt`}>Ver comprobante</a><a href={`/admin/orders/${order.id}/receipt?download=1`}><Download size={15} aria-hidden="true" />Descargar</a></div> : <p>No hay comprobante adjunto.</p>}
    {canApproveTransfer(order) && <><form onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      start(async () => {
        try { const response = await attachTransferReceipt(order.id, form); setResult(response); if (response.success) router.refresh(); }
        catch { setResult({ success: false, message: "No se pudo adjuntar el comprobante. Volvé a intentar." }); }
      });
    }}><label>Adjuntar comprobante<input type="file" name="receipt" accept="application/pdf,image/jpeg,image/png" required disabled={pending} /></label><small>PDF, JPG o PNG · Hasta 5 MB · Acceso privado</small><button className="admin-button secondary" disabled={pending}>{pending ? "Guardando…" : "Guardar comprobante"}</button></form>{result && <p role={result.success ? "status" : "alert"}>{result.message}</p>}<p className="sales-note">El comprobante no confirma la acreditación. Verificá el ingreso en tu cuenta bancaria.</p><ApproveTransfer order={order} /></>}
  </section>;
}
type Props = { orders: ManagedOrder[]; items: OrderItem[]; selectedOrder?: string; products?: ProductWithVariants[]; barcodes?: Record<string, string> };
export function OrdersPanel({ orders, items, selectedOrder, products = [], barcodes = {} }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [selected, setSelected] = useState<string | null>(selectedOrder ?? null);
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const order = orders.find(item => item.id === selected);
  const filtered = filterOrders(orders, { query, status, method });
  useEffect(() => {
    if (order && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!order && dialog.current?.open) dialog.current.close();
  }, [order]);
  function close() { dialog.current?.close(); setSelected(null); }
  return <section className="sales-panel" aria-label="Gestión de pedidos y ventas">
    <div className="sales-heading"><div><h2>Pedidos y ventas</h2><p>Revisá cada compra y confirmá las transferencias acreditadas.</p></div><span>{orders.length} operaciones</span></div>
    <details className="sales-create"><summary>Registrar venta por transferencia</summary><TransferOrderForm products={products} onCreated={id => { setSelected(id); router.refresh(); }} /></details>
    <div className="sales-filters"><label className="sales-search"><Search size={17} aria-hidden="true" /><span className="sales-sr">Buscar pedidos</span><input type="search" placeholder="Pedido, cliente, correo o teléfono" value={query} onChange={event => setQuery(event.target.value)} /></label><label>Estado del pago<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos los estados</option>{Object.entries(paymentStatus).map(([id, value]) => <option key={id} value={id}>{value.label}</option>)}</select></label><label>Método de pago<select value={method} onChange={event => setMethod(event.target.value)}><option value="">Todos los métodos</option><option value="mercadopago">Mercado Pago</option><option value="bank_transfer">Transferencia bancaria</option></select></label>{(query || status || method) && <button type="button" className="sales-text-button" onClick={() => { setQuery(""); setStatus(""); setMethod(""); }}>Limpiar filtros</button>}</div>
    <p className="sales-results" role="status">{filtered.length} de {orders.length} pedidos</p>
    {filtered.length ? <div className="sales-table-wrap"><table className="sales-table" aria-label="Pedidos y ventas"><thead><tr><th scope="col">Pedido / fecha</th><th scope="col">Cliente</th><th scope="col">Método</th><th scope="col">Pago</th><th scope="col" className="sales-total">Total</th><th scope="col">Acciones</th></tr></thead><tbody>{filtered.map(row => {
      const wa = whatsappLink(row.buyer_phone);
      return <tr key={row.id}><td data-label="Pedido"><strong title={row.id}>#{row.id.slice(0, 8)}</strong><time dateTime={row.created_at}>{orderDate(row.created_at)}</time></td><td data-label="Cliente"><strong>{row.payer_name || "Comprador sin nombre"}</strong>{row.payer_email ? <a href={`mailto:${row.payer_email}`}>{row.payer_email}</a> : <span>Sin correo</span>}{wa ? <a className="sales-whatsapp" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de ${row.payer_name ?? "comprador"}`}><MessageCircle size={13} aria-hidden="true" />{row.buyer_phone}</a> : <span>{row.buyer_phone || "Sin teléfono"}</span>}</td><td data-label="Método"><MethodBadge order={row} /></td><td data-label="Pago"><PaymentBadge status={row.status} /></td><td data-label="Total" className="sales-total"><strong>{adminMoney(row.total)}</strong></td><td data-label="Acciones"><div className="sales-actions"><button type="button" className="sales-detail-button" onClick={() => setSelected(row.id)}>Ver detalle</button><details className="sales-quick"><summary aria-label={`Acciones del pedido ${row.id.slice(0, 8)}`}><MoreHorizontal size={18} aria-hidden="true" /></summary><div><button type="button" onClick={() => setSelected(row.id)}>Revisar pedido</button><ApproveTransfer order={row} />{wa && <a href={wa} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a>}</div></details></div></td></tr>;
    })}</tbody></table></div> : <div className="sales-empty"><Package size={30} aria-hidden="true" /><h3>{orders.length ? "No encontramos pedidos con esos filtros." : "Todavía no hay pedidos registrados."}</h3><p>{orders.length ? "Probá con otro nombre o limpiá los filtros." : "Las compras aparecerán acá con su estado de pago y datos de entrega."}</p></div>}
    <dialog ref={dialog} className="sales-dialog" aria-labelledby="sales-detail-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {order && <div className="sales-dialog-body" key={order.id}><header className="sales-detail-heading"><div><h2 id="sales-detail-title">Pedido #{order.id.slice(0, 8)}</h2><time dateTime={order.created_at}>{orderDate(order.created_at)}</time></div><button type="button" className="sales-close" aria-label="Cerrar detalle" onClick={close}><X size={22} /></button></header>
        <div className="sales-detail-badges"><PaymentBadge status={order.status} /><MethodBadge order={order} /><span>#{order.id}</span></div>
        <section className="sales-detail-section"><h3>Productos comprados</h3><ul className="sales-items">{items.filter(item => item.order_id === order.id).map(item => {
          const product = products.find(product => product.id === item.product_id);
          const image = product?.variants.find(variant => variant.id === item.variant_id)?.image_url || product?.image_url;
          return <li key={item.id}>{image ? (
            // Catalog photos are external and the sold variant identifies the image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={item.product_name} width={64} height={72} />
          ) : <div className="sales-image-placeholder"><Package size={25} aria-hidden="true" /></div>}<div className="sales-item-copy"><h4>{item.product_name}</h4><span>{item.variant_label || "Sin variante registrada"}</span><small>{item.quantity} × {adminMoney(item.unit_price)} por unidad</small><small>SKU: {barcodes[item.product_id] || item.product_id}</small>{product?.description && <p title="Descripción actual del catálogo">{product.description}</p>}</div><strong>{adminMoney(item.unit_price * item.quantity)}</strong></li>;
        })}</ul>{!items.some(item => item.order_id === order.id) && <p>Este pedido no tiene artículos registrados.</p>}<dl className="sales-totals"><div><dt>Subtotal</dt><dd>{adminMoney(order.subtotal ?? order.total)}</dd></div>{order.discount_amount > 0 && <div><dt>Descuento {order.coupon_code ?? order.customer_group_name}</dt><dd>−{adminMoney(order.discount_amount)}</dd></div>}<div><dt>Total del pedido</dt><dd>{adminMoney(order.total)}</dd></div></dl></section>
        <section className="sales-detail-section"><h3>Detalle del pago</h3><dl className="sales-data"><div><dt>Método</dt><dd>{order.payment_method === "bank_transfer" ? "Transferencia bancaria" : "Mercado Pago"}</dd></div>{order.payment_method !== "bank_transfer" && <><div><dt>ID del pago</dt><dd>{order.mercadopago_payment_id ?? "Esperando confirmación de Mercado Pago"}</dd></div><div><dt>Medio de pago</dt><dd>{order.payment_type ? paymentTypeLabels[order.payment_type] ?? order.payment_type : "No informado por Mercado Pago"}</dd></div></>}<div><dt>Fecha de acreditación</dt><dd>{orderDate(order.paid_at)}</dd></div></dl>{order.payment_method !== "bank_transfer" && <p className="sales-note">La confirmación de Mercado Pago es automática. No requiere aprobación manual.</p>}</section>
        {order.payment_method === "bank_transfer" && <ReceiptSection order={order} />}
        <section className="sales-detail-section"><h3>Cliente y entrega</h3><p><strong>{order.payer_name ?? "Sin nombre registrado"}</strong></p><p>{order.payer_email ?? "Sin correo"}</p><p>{order.buyer_phone ?? "Sin teléfono"}</p><h4>{order.delivery_method === "pickup" ? "Retiro en el local" : order.shipping_destination === "home" ? "Entrega a domicilio" : order.shipping_destination === "branch" ? "Envío a sucursal" : "Método de entrega no registrado"}</h4><address>{[order.shipping_street, order.shipping_number, order.shipping_apartment, order.shipping_city, order.shipping_province, order.shipping_postal_code].filter(Boolean).join(", ") || "Sin dirección registrada"}</address><p>{order.shipping_destination && (order.free_shipping_qualified ? "Envío gratis" : "Costo de envío a coordinar")}</p></section>
        <section className="sales-detail-section"><h3>Seguimiento del pedido</h3><form className="console-form workflow-form" action={updateOrderWorkflow.bind(null, order.id)}><label>Estado del envío<select name="shipping_status" defaultValue={order.shipping_status}>{Object.entries(shippingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Registro de la transacción<select name="transaction_status" defaultValue={order.transaction_status}>{Object.entries(transactionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Número de seguimiento<input name="tracking_number" maxLength={120} defaultValue={order.tracking_number ?? ""} /></label><button className="admin-button">Guardar seguimiento</button></form><p className="sales-note">El seguimiento es independiente del pago. Cambiarlo no acredita una transferencia ni modifica stock.</p></section>
      </div>}
    </dialog>
  </section>;
}
