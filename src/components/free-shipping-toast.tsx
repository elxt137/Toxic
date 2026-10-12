"use client";

import { Truck, X } from "lucide-react";

import { getFreeShippingProgress, defaultCommerceSettings, shippingDestinationLabel, type CommerceSettings } from "@/lib/shipping";
import styles from "./free-shipping-toast.module.css";

const money = (value: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(value);

export function FreeShippingToast({ total, onDismiss, settings = defaultCommerceSettings }: { total: number; onDismiss: () => void; settings?: CommerceSettings }) {
  if (!settings.freeShippingEnabled) return null;
  const shipping = getFreeShippingProgress(total,settings);
  const message = shipping.qualified
    ? `¡Tu pedido ya tiene envío gratis ${shippingDestinationLabel(settings)}!`
    : `Te faltan ${money(shipping.missing)} para el envío gratis ${shippingDestinationLabel(settings)}`;

  return <aside className={styles.toast} role="status" aria-live="polite">
    <div className={styles.header}><Truck size={17} /><strong>{message}</strong><button type="button" onClick={onDismiss} aria-label="Cerrar aviso de envío"><X size={16} /></button></div>
    <div className={styles.track} aria-label={`${Math.round(shipping.progress)}% para envío gratis`}><i style={{ width: `${shipping.progress}%` }} /></div>
  </aside>;
}
