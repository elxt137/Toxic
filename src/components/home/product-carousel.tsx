"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { ProductCard } from "@/components/product-card";
import type { ProductWithVariants } from "@/types/database";

import styles from "./home.module.css";

export function ProductCarousel({ title, products }: { title: string; products: ProductWithVariants[] }) {
  const track = useRef<HTMLDivElement>(null);
  if (!products.length) return null;
  const scroll = (direction: number) => track.current?.scrollBy({ left: direction * track.current.clientWidth * .8, behavior: "smooth" });

  return (
    <section className={`${styles.productCarousel} shell`} aria-label={title}>
      <h2 className={styles.sectionTitle}>{title}<i aria-hidden="true" /></h2>
      <div className={styles.carouselFrame}>
        <button type="button" className={styles.trackArrow} aria-label={`Anteriores en ${title}`} onClick={() => scroll(-1)}><ChevronLeft size={22} aria-hidden="true" /></button>
        <div className={styles.productTrack} ref={track}>{products.map((product, index) => <div key={product.id}><ProductCard product={product} index={index} /></div>)}</div>
        <button type="button" className={styles.trackArrow} aria-label={`Siguientes en ${title}`} onClick={() => scroll(1)}><ChevronRight size={22} aria-hidden="true" /></button>
      </div>
    </section>
  );
}
