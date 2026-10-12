"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { readCart, type CartItem } from "@/lib/cart";
import { discountedPrice, type CustomerBenefit } from "@/lib/crm";
import { defaultCommerceSettings, type CommerceSettings } from "@/lib/shipping";
import { FreeShippingProgress } from "@/components/free-shipping-progress";

const cartStorageKey = "notta-cart";
function getStoredCart() {
  try {
    return readCart(window.localStorage.getItem(cartStorageKey));
  } catch { return []; }
}

const money = (value: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(value);

export function CheckoutForm({ settings = defaultCommerceSettings, benefit = null, benefitUnavailable = false }: { settings?: CommerceSettings; benefit?: CustomerBenefit | null; benefitUnavailable?: boolean }) {
  const [cart, setCart] = useState<CartItem[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setCart(getStoredCart()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const subtotal = useMemo(() => (cart ?? []).reduce((sum,item) => sum+(item.product.variants.find((variant) => variant.id === item.variantId)?.price ?? 0)*item.quantity,0),[cart]);
  const total = useMemo(() => (cart ?? []).reduce((sum, item) => sum + discountedPrice(item.product.variants.find((variant) => variant.id === item.variantId)?.price ?? 0,benefit?.percent ?? 0) * item.quantity, 0), [cart,benefit]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart?.length || submitting || benefitUnavailable) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ product, variantId, quantity }) => ({ productId: product.id, variantId, quantity })),
          customer: {
            firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), phone: form.get("phone"),
            street: form.get("street"), number: form.get("number"), apartment: form.get("apartment") || undefined,
            city: form.get("city"), province: form.get("province"), postalCode: form.get("postalCode"),
          },
        }),
      });
      const result = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error ?? "No se pudo iniciar el pago.");
      window.location.assign(result.checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo iniciar el pago.");
      setSubmitting(false);
    }
  }

  if (cart === null) return <div className="checkout-shell"><p>Cargando tu pedido…</p></div>;
  if (!cart.length) return <div className="checkout-shell checkout-empty"><h1>Tu pedido está vacío</h1><p>Agregá productos antes de continuar con el pago.</p><Link href="/productos">Ver productos</Link></div>;

  return <div className="checkout-shell checkout-layout">
    <section className="checkout-details"><p className="eyebrow">Checkout</p><h1>Datos de envío</h1><p className="checkout-intro">Completá los datos para preparar tu pedido. Luego te llevamos a Mercado Pago.</p>
      <form className="checkout-form" onSubmit={submit}>
        <div className="checkout-grid"><label>Nombre<input name="firstName" autoComplete="given-name" required minLength={2} maxLength={80} /></label><label>Apellido<input name="lastName" autoComplete="family-name" required minLength={2} maxLength={80} /></label></div>
        <div className="checkout-grid"><label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={benefit?.email ?? ""} readOnly={Boolean(benefit && benefit.percent>0)} /></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" required minLength={6} maxLength={30} /></label></div>
        <fieldset><legend>Dirección de envío</legend><div className="checkout-grid"><label>Calle<input name="street" autoComplete="address-line1" required minLength={2} maxLength={120} /></label><label>Número<input name="number" required maxLength={20} /></label></div>
          <label>Piso o departamento <span>(opcional)</span><input name="apartment" autoComplete="address-line2" maxLength={40} /></label>
          <div className="checkout-grid"><label>Ciudad<input name="city" autoComplete="address-level2" required minLength={2} maxLength={100} /></label><label>Provincia<input name="province" autoComplete="address-level1" required minLength={2} maxLength={100} /></label></div>
          <label>Código postal<input name="postalCode" autoComplete="postal-code" required minLength={3} maxLength={12} /></label>
        </fieldset>
        {error && <p className="checkout-error" role="alert">{error}</p>}
        {benefitUnavailable && <p role="alert">No se pudo verificar tu beneficio. Recargá la página antes de pagar.</p>}
        <button className="mercadopago-button" type="submit" disabled={submitting || benefitUnavailable}>{submitting ? "Preparando pago..." : "Ir a Mercado Pago"}</button>
      </form>
    </section>
    <aside className="checkout-summary"><p className="eyebrow">Resumen del pedido</p>{cart.map(({ product, variantId, quantity }) => { const variant = product.variants.find((item) => item.id === variantId); if (!variant) return null; const price=discountedPrice(variant.price,benefit?.percent ?? 0); return <div className="checkout-line" key={variant.id}><div><b>{product.brand}</b><span>{product.name} — {variant.label}</span><small>{quantity} × {money(price)}</small></div><strong>{money(price * quantity)}</strong></div>; })}{benefit && benefit.percent>0 && <p>Beneficio {benefit.groupName}: {benefit.percent}% · Ahorrás {money(subtotal-total)}</p>}<div className="checkout-total"><span>Total de productos</span><strong>{money(total)}</strong></div><FreeShippingProgress total={total} settings={settings} /><small>Los envíos que no califican para el beneficio se coordinan por separado.</small></aside>
  </div>;
}
