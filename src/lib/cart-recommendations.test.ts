import { describe, expect, it } from "vitest";

import { getCartRecommendations } from "@/lib/cart-recommendations";
import type { ProductWithVariants } from "@/types/database";

const product = (id: string, stock = 1): ProductWithVariants => ({
  id, name: id, slug: id, brand: "Notta", description: "", price: 10_000, currency: "ARS", stock,
  image_url: null, concentration: null, size_ml: 5, is_published: true, is_featured: false, sort_order: 0,
  created_at: "2026-01-01", updated_at: "2026-01-01", category: "Decant",
  variants: [{ id: `${id}-5`, product_id: id, label: "5 ml", size_ml: 5, price: 10_000, stock, sort_order: 0, is_active: true, created_at: "2026-01-01", updated_at: "2026-01-01" }],
});

describe("getCartRecommendations", () => {
  it("excludes products already in the cart and unavailable products", () => {
    const items = getCartRecommendations([product("in-cart"), product("available"), product("sold-out", 0)], new Set(["in-cart"]));

    expect(items.map((item) => item.id)).toEqual(["available"]);
  });
});
