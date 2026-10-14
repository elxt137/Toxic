"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./home.module.css";

const storageKey = "toxic-cookie-notice";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let accepted = false;
    try { accepted = window.localStorage.getItem("rc2-analytics-consent") !== null; } catch { /* almacenamiento bloqueado */ }
    if (accepted) return;
    const timeoutId = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  function accept(analytics: boolean) {
    try { window.localStorage.setItem(storageKey, "accepted"); window.localStorage.setItem("rc2-analytics-consent", analytics ? "accepted" : "rejected"); } catch { /* almacenamiento bloqueado */ }
    window.dispatchEvent(new Event("rc2-analytics-consent"));
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <section className={styles.cookie} role="region" aria-label="Aviso de cookies">
      <p>Recordamos tu carrito. Con tu permiso, usamos Google Analytics para medir visitas y mejorar la tienda.</p>
      <button type="button" onClick={() => accept(false)}>Sólo necesarias</button>
      <button type="button" onClick={() => accept(true)}><Check size={15} aria-hidden="true" /> Acepto</button>
    </section>
  );
}
