"use client";

import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./storefront-header.module.css";

type StoredCartItem = { quantity?: number };

const links = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/#info", label: "Contacto" },
  { href: "/#info", label: "Quiénes Somos" },
  { href: "/#como-comprar", label: "Cómo Comprar" },
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
  const [cartCount, setCartCount] = useState(0);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  function openCart() {
    window.dispatchEvent(new Event("notta-cart-open"));
  }

  return (
    <header data-scrolled={isScrolled} className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={`${styles.topRow} shell`}>
        <form className={styles.search} action="/productos" role="search">
          <label className={styles.visuallyHidden} htmlFor="storefront-search">Buscar productos</label>
          <Search aria-hidden="true" size={17} />
          <input id="storefront-search" name="q" type="search" placeholder="Buscar productos para tu auto" />
        </form>
        <Link className={styles.logo} href="/" aria-label="Toxic, inicio">TOXIC <span>AUTO CARE</span></Link>
        <div className={styles.actions}>
          <Link href="/login" aria-label="Iniciar sesión"><UserRound aria-hidden="true" size={20} /></Link>
          <Link className={styles.cart} href="/#pedido" aria-label={`Carrito de compras, ${cartCount} productos`} onClick={openCart}>
            <ShoppingBag aria-hidden="true" size={20} />
            {cartCount > 0 && <span aria-hidden="true">{cartCount}</span>}
          </Link>
          <button className={styles.menuToggle} type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}</button>
        </div>
      </div>
      <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`} aria-label="Navegación principal">
        {links.map((link) => <Link key={link.label} href={link.href} onClick={closeMenu}>{link.label}</Link>)}
      </nav>
    </header>
  );
}
