"use client";

import { Truck } from "lucide-react";

import { getFreeShippingProgress, defaultCommerceSettings, shippingDestinationLabel, type CommerceSettings } from "@/lib/shipping";
import styles from "./free-shipping-progress.module.css";

const money = (value: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(value);

export function FreeShippingProgress({ total, settings = defaultCommerceSettings }: { total: number; settings?: CommerceSettings }) {
  if (!settings.freeShippingEnabled) return null;
  const shipping = getFreeShippingProgress(total,settings);
  const message = shipping.qualified
    ? "¡Tu pedido tiene envío gratis!"
    : `Te faltan ${money(shipping.missing)} para el envío gratis ${shippingDestinationLabel(settings)} 🚚`;

  return <section className={`${styles.shipping} ${shipping.qualified ? styles.qualified : ""}`} aria-live="polite">
    <p><Truck size={17} /> Envío gratis {shippingDestinationLabel(settings)} desde {money(shipping.threshold)}</p>
    <div className={styles.card}>
      <strong className={styles.message}>{message}</strong>
      <div className={styles.track} aria-label={`${Math.round(shipping.progress)}% para envío gratis`}><i style={{ width: `${shipping.progress}%` }} /></div>
    </div>
  </section>;
}
