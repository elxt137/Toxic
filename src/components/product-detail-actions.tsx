"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FreeShippingProgress } from "@/components/free-shipping-progress";
import { addCartItem, readCart } from "@/lib/cart";
import type { ProductWithVariants } from "@/types/database";

const cartStorageKey = "notta-cart";


export function ProductDetailActions({ product }: { product: ProductWithVariants }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants.find((item) => item.stock > 0)?.id ?? product.variants[0]?.id ?? "");
  const [cartTotal, setCartTotal] = useState(0);
  const variant = product.variants.find((item) => item.id === variantId);
  const soldOut = !variant || variant.stock === 0;

  useEffect(() => {
    let timeoutId: number | undefined;
    try {
      const cart = readCart(window.localStorage.getItem(cartStorageKey));
      const total = cart.reduce((sum, item) => sum + (item.product.variants.find((entry) => entry.id === item.variantId)?.price ?? 0) * item.quantity, 0);
      timeoutId = window.setTimeout(() => setCartTotal(total), 0);
    } catch {
      timeoutId = window.setTimeout(() => setCartTotal(0), 0);
    }
    return () => { if (timeoutId !== undefined) window.clearTimeout(timeoutId); };
  }, []);

  function addToCart() {
    if (!variant || variant.stock <= 0) return;
    const savedCart = window.localStorage.getItem(cartStorageKey);
    const cart = readCart(savedCart);
    const nextCart = addCartItem(cart, product, variant.id);

    window.localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
    window.dispatchEvent(new Event("notta-cart-updated"));
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
