"use client";
/* eslint-disable @next/next/no-img-element -- Las imágenes de Supabase se ajustan al formato compacto del pedido. */

import { CreditCard, Minus, Send, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { FreeShippingProgress } from "@/components/free-shipping-progress";
import { FreeShippingToast } from "@/components/free-shipping-toast";
import { getCartRecommendations } from "@/lib/cart-recommendations";
import type { ProductWithVariants } from "@/types/database";

type CartItem = { product: ProductWithVariants; variantId: string; quantity: number };
const cartStorageKey = "notta-cart";

const money = (value: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(value);

export function Catalog({ products, whatsappNumber }: { products: ProductWithVariants[]; whatsappNumber?: string }) {
  const [brand, setBrand] = useState("Todas las marcas");
  const [category, setCategory] = useState("Todos los tipos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [showShippingToast, setShowShippingToast] = useState(false);
  const skipInitialCartSave = useRef(true);
  const router = useRouter();

  useEffect(() => {
    const savedCart = window.localStorage.getItem(cartStorageKey);
    const timeoutIds: number[] = [];
    const openCart = () => setOpen(true);
    const openCartFromHash = () => {
      if (window.location.hash === "#pedido") openCart();
    };
    if (window.location.hash === "#pedido") timeoutIds.push(window.setTimeout(openCart, 0));
    window.addEventListener("notta-cart-open", openCart);
    window.addEventListener("hashchange", openCartFromHash);
    if (window.sessionStorage.getItem("notta-shipping-toast") === "true") {
      window.sessionStorage.removeItem("notta-shipping-toast");
      timeoutIds.push(window.setTimeout(() => setShowShippingToast(true), 0));
    }
    if (savedCart) {
      try {
        const savedItems = JSON.parse(savedCart) as CartItem[];
        timeoutIds.push(window.setTimeout(() => setCart(savedItems), 0));
      } catch {
        window.localStorage.removeItem(cartStorageKey);
      }
    }
    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.removeEventListener("notta-cart-open", openCart);
      window.removeEventListener("hashchange", openCartFromHash);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (skipInitialCartSave.current) {
      skipInitialCartSave.current = false;
      return;
    }
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    window.dispatchEvent(new Event("notta-cart-updated"));
  }, [cart]);

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
  const filtered = products.filter((product) =>
    (brand === "Todas las marcas" || product.brand === brand) &&
    (category === "Todos los tipos" || product.category === category),
  );
  const featured = filtered.filter((product) => product.is_featured);
  const total = cart.reduce((sum, item) => sum + (item.product.variants.find((variant) => variant.id === item.variantId)?.price ?? 0) * item.quantity, 0);
  const unitCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const recommendations = getCartRecommendations(products, new Set(cart.map((item) => item.product.id)));

  function changeQuantity(id: string, amount: number) {
    setCart((items) => items.flatMap((item) => {
      if (item.variantId !== id) return [item];
      const quantity = item.quantity + amount;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }

  function addRecommendation(product: ProductWithVariants, variantId: string) {
    setCart((items) => {
      const existing = items.find((item) => item.variantId === variantId);
      return existing
        ? items.map((item) => item.variantId === variantId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { product, variantId, quantity: 1 }];
    });
  }

  function addMoreProducts() {
    setOpen(false);
    window.setTimeout(() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function sendOrder() {
    const digits = (whatsappNumber ?? "").replace(/\D/g, "");
    if (!digits || !cart.length) return;
    const lines = cart.map(({ product, variantId, quantity }) => { const variant = product.variants.find((item) => item.id === variantId); return `• ${quantity} × ${product.brand} ${product.name} — ${variant?.label ?? "Presentación"} — ${money((variant?.price ?? 0) * quantity)}`; });
    const message = ["Hola, quiero hacer este pedido:", "", ...lines, "", `Total: ${money(total)}`].join("\n");
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  // Los accesos del catálogo llevan al detalle para elegir presentación antes de comprar.
  void whatsappNumber;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function buy(product: ProductWithVariants) {
    const digits = (whatsappNumber ?? "").replace(/\D/g, "");
    const variant = product.variants.find((item) => item.stock > 0);
    if (!digits || !variant) return;
    const message = `Hola, quiero comprar ${product.brand} ${product.name} — ${variant.label} por ${money(variant.price)}.`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <section className="catalog-section shell" id="catalogo">
        <div className="catalog-heading"><div><p>Limpieza · Protección · Accesorios</p><h2>Todo para cuidar tu vehículo.</h2></div><button className="cart-trigger" type="button" onClick={() => setOpen(true)}><ShoppingBag size={18} /> Pedido <b>{unitCount}</b></button></div>
        <div className="catalog-filters" aria-label="Filtros de catálogo"><span><SlidersHorizontal size={16} /> Filtros</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>Todos los tipos</option><option value="Decant">Limpieza y protección</option><option value="Frasco completo">Accesorios</option></select><select value={brand} onChange={(event) => setBrand(event.target.value)}><option>Todas las marcas</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></div>
        {featured.length > 0 && <CatalogShelf eyebrow="Destacados / más elegidos" products={featured} />}
        <CatalogShelf eyebrow="Todo el catálogo" products={filtered} empty={products.length ? "No encontramos productos con esos filtros." : "El catálogo se está preparando."} />
      </section>
      <aside className={`order-drawer ${open ? "is-open" : ""}`} id="pedido" aria-label="Tu pedido" aria-hidden={!open} inert={!open}>
        <div className="order-header"><div><p>Tu pedido</p><strong>{unitCount} producto{unitCount === 1 ? "" : "s"}</strong></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar pedido"><X size={20} /></button></div>
        <div className="order-lines">{cart.length === 0 ? <p className="order-empty">Todavía no agregaste productos a tu pedido.</p> : cart.map(({ product, variantId, quantity }) => { const variant = product.variants.find((item) => item.id === variantId); return <div className="order-line" key={variantId}><div className="order-line-image">{product.image_url ? <img src={product.image_url} alt={`Producto: ${product.name}`} /> : <div aria-hidden="true" />}</div><div className="order-line-details"><b>{product.brand}</b><span>{product.name} — {variant?.label}</span><small>{money(variant?.price ?? 0)}</small></div><div className="quantity"><button type="button" onClick={() => changeQuantity(variantId, -1)}><Minus size={13} /></button><span>{quantity}</span><button type="button" onClick={() => changeQuantity(variantId, 1)}><span>+</span></button></div></div>; })}</div>
        <div className="order-form"><div className="order-total"><span>Total</span><strong>{money(total)}</strong></div>{cart.length > 0 && <FreeShippingProgress total={total} />}<button className="mercadopago-button" type="button" onClick={() => router.push("/checkout")} disabled={!cart.length}><CreditCard size={16} /> Iniciar compra</button><button className="add-more-products" type="button" onClick={addMoreProducts}>Agregar más productos</button><button className="whatsapp-button" type="button" onClick={sendOrder} disabled={!cart.length || !whatsappNumber}><Send size={16} /> Enviar pedido por WhatsApp</button>{!whatsappNumber && <small>Falta configurar el número comercial de WhatsApp.</small>}</div>
        {cart.length > 0 && <CartRecommendations products={recommendations} onAdd={addRecommendation} />}
      </aside>
      {open && <button className="drawer-backdrop" type="button" aria-label="Cerrar pedido" onClick={() => setOpen(false)} />}
      {showShippingToast && !open && cart.length > 0 && <FreeShippingToast total={total} onDismiss={() => setShowShippingToast(false)} />}
    </>
  );
}

function CartRecommendations({ products, onAdd }: { products: ProductWithVariants[]; onAdd: (product: ProductWithVariants, variantId: string) => void }) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  if (!products.length) return null;

  return <section className="cart-recommendations" aria-label="También te puede interesar"><h3>También te puede interesar</h3>{products.map((product) => {
    const available = product.variants.filter((variant) => variant.stock > 0);
    const selectedVariant = available.find((variant) => variant.id === selectedVariants[product.id]) ?? available[0];
    if (!selectedVariant) return null;
    return <article className="cart-recommendation" key={product.id}>{product.image_url ? <img src={product.image_url} alt="" /> : <div className="cart-recommendation-image" aria-hidden="true" />}<div><b>{product.brand} {product.name}</b><div><select aria-label={`Presentación para ${product.name}`} value={selectedVariant.id} onChange={(event) => setSelectedVariants((items) => ({ ...items, [product.id]: event.target.value }))}>{available.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</select><strong>{money(selectedVariant.price)}</strong></div></div><button type="button" onClick={() => onAdd(product, selectedVariant.id)}>Agregar</button></article>;
  })}</section>;
}

function CatalogShelf({ eyebrow, products, empty }: { eyebrow: string; products: ProductWithVariants[]; empty?: string }) {
  return <section className="catalog-shelf"><div className="shelf-title"><h3>{eyebrow}</h3><span>{products.length} opciones</span></div>{products.length ? <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <p className="empty-catalog">{empty}</p>}</section>;
}
