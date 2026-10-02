import type { ProductWithVariants } from "@/types/database";

export function getCartRecommendations(products: ProductWithVariants[], cartProductIds: Set<string>) {
  return products.filter((product) => !cartProductIds.has(product.id) && product.variants.some((variant) => variant.stock > 0)).slice(0, 4);
}
