import { z } from "zod";
import type { ProductWithVariants } from "@/types/database";

export type CartItem = { product: ProductWithVariants; variantId: string; quantity: number };

const storedItem = z.object({
  product: z.object({
    id: z.string(), name: z.string(), brand: z.string(), slug: z.string(),
    currency: z.string(), image_url: z.string().nullable(),
    variants: z.array(z.object({ id: z.string(), label: z.string(), price: z.number().finite().nonnegative(), stock: z.number().int().nonnegative() }).passthrough()),
  }).passthrough(),
  variantId: z.string(), quantity: z.number().int().positive(),
});

export function readCart(stored: string | null): CartItem[] {
  try {
    const data: unknown = JSON.parse(stored ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      const parsed = storedItem.safeParse(item);
      if (!parsed.success) return [];
      const variant = parsed.data.product.variants.find((entry) => entry.id === parsed.data.variantId);
      if (!variant || !variant.stock) return [];
      return [{ ...parsed.data, quantity: Math.min(parsed.data.quantity, variant.stock) } as CartItem];
    });
  } catch { return []; }
}

export function addCartItem(cart: CartItem[], product: ProductWithVariants, variantId: string): CartItem[] {
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant || variant.stock <= 0) return cart;
  const existing = cart.find((item) => item.variantId === variantId);
  return existing ? cart.map((item) => item.variantId === variantId ? { ...item, product, quantity: Math.min(item.quantity + 1, variant.stock) } : item)
    : [...cart, { product, variantId, quantity: 1 }];
}
