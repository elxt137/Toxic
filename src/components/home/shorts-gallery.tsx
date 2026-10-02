"use client";

import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { ShortVideo } from "@/lib/home-content";

import styles from "./home.module.css";

export function ShortsGallery({ shorts }: { shorts: ShortVideo[] }) {
  const [current, setCurrent] = useState<ShortVideo | null>(null);

  useEffect(() => {
    if (!current) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setCurrent(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [current]);

  return (
    <section className={styles.shorts} id="videos">
      <div className="shell">
        <h2 className={styles.sectionTitle}>Videos Toxic</h2>
        <p className={styles.sectionLead}>Tips de detailing en segundos: mirá, aprendé y aplicalo en tu auto.</p>
        <div className={styles.shortsTrack}>
          {shorts.map((short, index) => (
            <button key={short.id} type="button" className={`${styles.shortCard} ${styles[`shortTone${(index % 3) + 1}`]}`} aria-label={`Ver video: ${short.title}`} onClick={() => setCurrent(short)}>
              {short.video && <video src={short.video} poster={short.poster} muted playsInline preload="metadata" aria-hidden="true" />}
              <span className={styles.playBadge} aria-hidden="true"><Play size={26} fill="currentColor" /></span>
              <b>{short.title}</b>
            </button>
          ))}
        </div>
      </div>
      {current && (
        <div className={styles.videoModal} role="dialog" aria-modal="true" aria-label={current.title}>
          <button className={styles.modalBackdrop} type="button" tabIndex={-1} aria-hidden="true" onClick={() => setCurrent(null)} />
          <div className={styles.modalBody}>
            <button className={styles.modalClose} type="button" aria-label="Cerrar video" onClick={() => setCurrent(null)} autoFocus><X size={22} aria-hidden="true" /></button>
            {current.video ? <video src={current.video} poster={current.poster} controls autoPlay playsInline /> : <p className={styles.modalEmpty}>Video próximamente</p>}
            <strong>{current.title}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
