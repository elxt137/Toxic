"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProductCard } from "@/components/product-card";
import type { ProductWithVariants } from "@/types/database";

import styles from "./home.module.css";

export function ProductCarousel({ title, products }: { title: string; products: ProductWithVariants[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  function updateEdges() {
    const element = track.current;
    if (element) setEdges({ previous: element.scrollLeft > 1, next: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 });
  }
  useEffect(() => {
    const frame = requestAnimationFrame(updateEdges);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateEdges);
    if (track.current) observer?.observe(track.current);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [products.length]);
  if (!products.length) return null;
  const scroll = (direction: number) => track.current?.scrollBy({ left: direction * track.current.clientWidth * .8, behavior: "smooth" });

  return (
    <section className={`${styles.productCarousel} shell`} aria-label={title}>
      <h2 className={styles.sectionTitle}>{title}<i aria-hidden="true" /></h2>
      <div className={styles.carouselFrame}>
        <button type="button" className={styles.trackArrow} disabled={!edges.previous} aria-label={`Anteriores en ${title}`} onClick={() => scroll(-1)}><ChevronLeft size={22} aria-hidden="true" /></button>
        <div className={styles.productTrack} ref={track} data-product-track onScroll={updateEdges}>{products.map((product, index) => <div key={product.id}><ProductCard product={product} index={index} /></div>)}</div>
        <button type="button" className={styles.trackArrow} disabled={!edges.next} aria-label={`Siguientes en ${title}`} onClick={() => scroll(1)}><ChevronRight size={22} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
