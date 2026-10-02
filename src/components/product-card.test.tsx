import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "@/components/product-card";
import type { ProductWithVariants } from "@/types/database";

const product: ProductWithVariants = {
  id: "product-1",
  name: "Torino 21",
  slug: "torino-21",
  brand: "Xerjoff",
  description: "",
  price: 16100,
  currency: "ARS",
  stock: 2,
  image_url: "https://example.com/torino-21.png",
  concentration: null,
  size_ml: 5,
  is_published: true,
  is_featured: false,
  sort_order: 0,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  category: "Decant",
  variants: [{ id: "five", product_id: "product-1", label: "5 ml", size_ml: 5, price: 16100, stock: 2, sort_order: 0, is_active: true, created_at: "2026-01-01", updated_at: "2026-01-01" }],
};

describe("ProductCard", () => {
  it("uses the reference card copy: uppercase name, three instalments, and Comprar action", () => {
    render(<ProductCard product={product} index={0} />);

    expect(screen.getByRole("heading", { name: "Xerjoff, Torino 21" }).className).toBe("product-title");
    expect(screen.getByText((_, element) => element?.textContent === "$\u00a016.100")).toBeTruthy();
    expect(screen.getByText((_, element) => element?.textContent === "3 cuotas sin interés de $\u00a05.366,67")).toBeTruthy();
    expect(screen.getByRole("link", { name: /comprar/i }).getAttribute("href")).toBe("/productos/torino-21");
    expect(screen.getByRole("img", { name: "Producto: Torino 21" }).getAttribute("src")).toBe(product.image_url);
  });
});
