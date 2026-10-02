"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { HeroSlide } from "@/lib/home-content";

import styles from "./home.module.css";

export function HeroCarousel({ slides, interval = 7000 }: { slides: HeroSlide[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((index: number) => setActive((index + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => go(active + 1), interval);
    return () => window.clearTimeout(timer);
  }, [active, count, go, interval, paused]);

  return (
    <section className={styles.hero} aria-roledescription="carrusel" aria-label="Novedades destacadas" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {slides.map((slide, index) => {
        const Heading = index === 0 ? "h1" : "h2";
        return (
          <div key={slide.id} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${count}`} aria-hidden={index !== active} className={`${styles.heroSlide} ${styles[`theme_${slide.theme}`]} ${index === active ? styles.heroSlideActive : ""}`}>
            {slide.video && <video className={styles.heroMedia} src={slide.video} poster={slide.poster} autoPlay muted loop playsInline preload="metadata" />}
            <div className={styles.heroDots} aria-hidden="true" />
            <div className={styles.heroContent}>
              <p>{slide.kicker}</p>
              <Heading>{slide.title} <em>{slide.highlight}</em></Heading>
              <span>{slide.subtitle}</span>
              <Link href={slide.cta.href} tabIndex={index === active ? undefined : -1}>{slide.cta.label}</Link>
            </div>
          </div>
        );
      })}
      {count > 1 && <>
        <button className={`${styles.heroArrow} ${styles.heroPrev}`} type="button" aria-label="Anterior" onClick={() => go(active - 1)}><ChevronLeft size={26} aria-hidden="true" /></button>
        <button className={`${styles.heroArrow} ${styles.heroNext}`} type="button" aria-label="Siguiente" onClick={() => go(active + 1)}><ChevronRight size={26} aria-hidden="true" /></button>
        <div className={styles.dots}>{slides.map((slide, index) => <button key={slide.id} type="button" aria-label={`Ir a la diapositiva ${index + 1}`} aria-current={index === active} onClick={() => go(index)} />)}</div>
      </>}
    </section>
  );
}
