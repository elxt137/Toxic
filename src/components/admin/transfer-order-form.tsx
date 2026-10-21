"use client";
import { useRef, useState, useTransition } from "react";
import { createBankTransferOrder, type OrderActionResult } from "@/app/admin/order-actions";
import { adminMoney } from "@/lib/admin-console";
import type { ProductWithVariants } from "@/types/database";
export function TransferOrderForm({ products, onCreated }: { products: ProductWithVariants[]; onCreated: (id: string) => void }) {
  const variants = products.filter(product => product.currency === "ARS").flatMap(product => product.variants.filter(variant => variant.is_active && variant.stock > 0).map(variant => ({ ...variant, name: product.name })));
  const [lines, setLines] = useState([{ variant_id: variants[0]?.id ?? "", quantity: 1 }]);
  const requestId = useRef("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<OrderActionResult>();
  const locked = pending || result?.success;
  const total = lines.reduce((sum, line) => sum + (variants.find(variant => variant.id === line.variant_id)?.price ?? 0) * line.quantity, 0);
  if (!variants.length) return <p>No hay presentaciones activas con stock. Agregá stock al inventario antes de registrar una venta.</p>;
  return <form className="sales-create-form" onSubmit={event => {
    event.preventDefault(); if (locked) return;
    const form = new FormData(event.currentTarget);
    requestId.current ||= crypto.randomUUID(); form.set("request_id", requestId.current); form.set("items", JSON.stringify(lines));
    start(async () => {
      try { const response = await createBankTransferOrder(form); setResult(response); if (response.success && response.orderId) onCreated(response.orderId); }
      catch { setResult({ success: false, message: "No se pudo registrar. Verificá tu sesión y volvé a intentar." }); }
    });
  }}><p className="sales-note">Para ventas acordadas por WhatsApp. Quedan pendientes hasta que confirmes la acreditación bancaria; el stock se descuenta al aprobar.</p>
    <fieldset disabled={locked}><legend>Datos del cliente</legend><label>Nombre del cliente<input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label><label>Correo (opcional)<input name="email" type="email" maxLength={254} autoComplete="email" /></label><label>Teléfono / WhatsApp<input name="phone" required minLength={10} maxLength={25} autoComplete="tel" placeholder="Ej.: +54 9 298 4000000" /></label><label>Método de entrega<select name="delivery" defaultValue="pickup"><option value="pickup">Retiro en el local</option><option value="home">Entrega a domicilio</option><option value="branch">Envío a sucursal</option></select></label><label className="sales-full">Entrega o retiro<textarea name="address" required minLength={5} maxLength={400} placeholder="Dirección completa o datos del retiro acordado" /></label></fieldset>
    <fieldset disabled={locked}><legend>Productos y cantidades</legend>{lines.map((line, index) => <div className="sales-create-line" key={index}><label>Producto {index + 1}<select value={line.variant_id} required onChange={event => setLines(values => values.map((value, i) => i === index ? { ...value, variant_id: event.target.value } : value))}>{variants.map(variant => <option key={variant.id} value={variant.id}>{variant.name} · {variant.label} · {adminMoney(variant.price)} · Stock {variant.stock}</option>)}</select></label><label>Cantidad<input type="number" min={1} max={Math.min(999, variants.find(variant => variant.id === line.variant_id)?.stock ?? 999)} value={line.quantity} required onChange={event => setLines(values => values.map((value, i) => i === index ? { ...value, quantity: Number(event.target.value) } : value))} /></label>{lines.length > 1 && <button type="button" className="sales-text-button" onClick={() => setLines(values => values.filter((_, i) => i !== index))}>Quitar</button>}</div>)}<button type="button" className="sales-text-button" disabled={lines.length >= Math.min(50, variants.length)} onClick={() => setLines(values => [...values, { variant_id: variants.find(variant => !values.some(line => line.variant_id === variant.id))?.id ?? "", quantity: 1 }])}>Agregar producto</button></fieldset>
    <div className="sales-create-total"><strong>Total: {adminMoney(total)}</strong><button className="admin-button" disabled={locked}>{pending ? "Registrando…" : result?.success ? "Venta registrada" : "Registrar venta pendiente"}</button></div>
    {result && <p role={result.success ? "status" : "alert"}>{result.message}</p>}
  </form>;
}
