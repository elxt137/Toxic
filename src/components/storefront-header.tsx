"use client";

import { Flame, Menu, MessageCircle, Package, Search, ShoppingCart, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./storefront-header.module.css";

type StoredCartItem = { quantity?: number };

const categoryLinks = [
  { href: "/#catalogo", label: "Lavado" },
  { href: "/#catalogo", label: "Interior" },
  { href: "/#catalogo", label: "Protección" },
  { href: "/#catalogo", label: "Accesorios" },
  { href: "/#catalogo", label: "Kits" },
];

const moreLinks = [
  { href: "/productos", label: "Todos los productos" },
  { href: "/#info", label: "Quiénes somos" },
  { href: "/#como-comprar", label: "Cómo comprar" },
  { href: "/#info", label: "Envíos" },
  { href: "/#contacto", label: "Contacto" },
];

function getCartCount() {
  try {
    const cart = JSON.parse(window.localStorage.getItem("notta-cart") ?? "[]") as StoredCartItem[];
    return Array.isArray(cart) ? cart.reduce((total, item) => total + (Number.isFinite(item.quantity) ? Number(item.quantity) : 0), 0) : 0;
  } catch {
    return 0;
  }
}

export function StorefrontHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 0);
    const updateCartCount = () => setCartCount(getCartCount());
    updateScrolled();
    updateCartCount();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("notta-cart-updated", updateCartCount);
    return () => {
      window.removeEventListener("scroll", updateScrolled);
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("notta-cart-updated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => { if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMoreOpen(false); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  function closeMenus() {
    setMenuOpen(false);
    setMoreOpen(false);
  }

  function openCart() {
    window.dispatchEvent(new Event("notta-cart-open"));
  }

  const showSearch = searchOpen || isScrolled;

  return (
    <header data-scrolled={isScrolled} className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={`${styles.bar} shell`}>
        <button className={styles.menuToggle} type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}</button>
        <Link className={styles.logo} href="/" aria-label="Toxic, inicio">Toxic<span>auto care</span></Link>
        <form className={`${styles.search} ${showSearch ? styles.searchOpen : ""}`} action="/productos" role="search">
          <label className={styles.visuallyHidden} htmlFor="storefront-search">Buscar productos</label>
          <input id="storefront-search" name="q" type="search" placeholder="Buscá acá" />
          <button type="submit" aria-label="Buscar"><Search aria-hidden="true" size={17} /></button>
        </form>
        {!showSearch && <button className={styles.searchToggle} type="button" aria-label="Abrir buscador" onClick={() => setSearchOpen(true)}><Search aria-hidden="true" size={19} /></button>}
        <nav className={`${styles.nav} ${menuOpen ? styles.open : ""} ${showSearch ? styles.navHidden : ""}`} aria-label="Navegación principal">
          {categoryLinks.map((link) => <Link key={link.label} href={link.href} onClick={closeMenus}>{link.label}</Link>)}
          {menuOpen && <div className={styles.mobileMore}>{moreLinks.map((link) => <Link key={link.label} href={link.href} onClick={closeMenus}>{link.label}</Link>)}</div>}
        </nav>
        <div className={styles.more} ref={moreRef}>
          <button type="button" aria-expanded={moreOpen} aria-controls="header-more" onClick={() => setMoreOpen((open) => !open)}><Menu aria-hidden="true" size={16} /><span>Ver más</span></button>
          {moreOpen && <div className={styles.morePanel} id="header-more">{moreLinks.map((link) => <Link key={link.label} href={link.href} onClick={closeMenus}>{link.label}</Link>)}</div>}
        </div>
        <div className={styles.actions}>
          <Link className={styles.hideSmall} href="/#catalogo" aria-label="Ofertas"><Flame aria-hidden="true" size={20} /></Link>
          <Link className={styles.hideSmall} href="/#como-comprar" aria-label="Seguí tu pedido"><Package aria-hidden="true" size={20} /></Link>
          <Link className={styles.hideSmall} href="/#contacto" aria-label="Atención al cliente"><MessageCircle aria-hidden="true" size={20} /></Link>
          <Link href="/login" aria-label="Iniciar sesión"><UserRound aria-hidden="true" size={20} /></Link>
          <Link className={styles.cart} href="/#pedido" aria-label={`Carrito de compras, ${cartCount} productos`} onClick={openCart}>
            <ShoppingCart aria-hidden="true" size={20} />
            <span aria-hidden="true">{cartCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
