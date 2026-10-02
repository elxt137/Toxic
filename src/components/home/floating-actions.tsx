"use client";

import { ChevronUp, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./home.module.css";

export function FloatingActions({ whatsappNumber }: { whatsappNumber?: string }) {
  const [showTop, setShowTop] = useState(false);
  const digits = (whatsappNumber ?? "").replace(/\D/g, "");

  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 600);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className={styles.floating}>
      {showTop && <button type="button" aria-label="Volver arriba" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ChevronUp size={24} aria-hidden="true" /></button>}
      {digits && <a className={styles.whatsappFloat} href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" aria-label="Escribinos por WhatsApp"><MessageCircle size={26} aria-hidden="true" /></a>}
    </div>
  );
}
