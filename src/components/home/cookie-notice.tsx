"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./home.module.css";

const storageKey = "toxic-cookie-notice";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let accepted = false;
    try { accepted = window.localStorage.getItem(storageKey) === "accepted"; } catch { /* almacenamiento bloqueado */ }
    if (accepted) return;
    const timeoutId = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  function accept() {
    try { window.localStorage.setItem(storageKey, "accepted"); } catch { /* almacenamiento bloqueado */ }
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <section className={styles.cookie} role="region" aria-label="Aviso de cookies">
      <p>Usamos cookies para recordar tu carrito y mejorar tu experiencia en la tienda.</p>
      <button type="button" onClick={accept}><Check size={15} aria-hidden="true" /> Acepto</button>
    </section>
  );
}
