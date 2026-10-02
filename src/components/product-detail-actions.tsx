"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FreeShippingProgress } from "@/components/free-shipping-progress";
import type { ProductWithVariants } from "@/types/database";

const cartStorageKey = "notta-cart";

type CartItem = { product: ProductWithVariants; variantId: string; quantity: number };

export function ProductDetailActions({ product }: { product: ProductWithVariants }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [cartTotal, setCartTotal] = useState(0);
  const variant = product.variants.find((item) => item.id === variantId);
  const soldOut = !variant || variant.stock === 0;

  useEffect(() => {
    let timeoutId: number | undefined;
    try {
      const cart: CartItem[] = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? "[]");
      const total = cart.reduce((sum, item) => sum + (item.product.variants.find((entry) => entry.id === item.variantId)?.price ?? 0) * item.quantity, 0);
      timeoutId = window.setTimeout(() => setCartTotal(total), 0);
    } catch {
      timeoutId = window.setTimeout(() => setCartTotal(0), 0);
    }
    return () => { if (timeoutId !== undefined) window.clearTimeout(timeoutId); };
  }, []);

  function addToCart() {
    if (!variant) return;
    const savedCart = window.localStorage.getItem(cartStorageKey);
    const cart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
    const existing = cart.find((item) => item.variantId === variant.id);
    const nextCart = existing
      ? cart.map((item) => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { product, variantId: variant.id, quantity: 1 }];

    window.localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
    window.sessionStorage.setItem("notta-shipping-toast", "true");
    setCartTotal(nextCart.reduce((total, item) => total + (item.product.variants.find((entry) => entry.id === item.variantId)?.price ?? 0) * item.quantity, 0));
    router.push("/#pedido");
  }

  return (
    <div className="product-detail-actions"><FreeShippingProgress total={cartTotal} /><div className="variant-picker" role="group" aria-label="Presentación"><span>Presentación</span><div>{product.variants.map((item) => <button key={item.id} className="variant-option" type="button" aria-pressed={item.id === variantId} disabled={item.stock === 0} onClick={() => setVariantId(item.id)}>{item.label}{item.stock === 0 ? " · Sin stock" : ""}</button>)}</div></div><strong className="product-detail-price">{variant && new Intl.NumberFormat("es-AR", { style: "currency", currency: product.currency, maximumFractionDigits: 0 }).format(variant.price)}</strong><button className="product-detail-add" type="button" disabled={soldOut} onClick={addToCart}>
      <ShoppingBag size={16} /> {soldOut ? "Sin stock" : "Añadir al carrito"}
    </button></div>
  );
}
