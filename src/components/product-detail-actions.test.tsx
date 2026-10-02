import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductDetailActions } from "@/components/product-detail-actions";
import type { ProductWithVariants } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const product: ProductWithVariants = {
  id: "product-1",
  name: "Perfume de prueba",
  slug: "perfume-de-prueba",
  brand: "Notta",
  description: "",
  price: 6500,
  currency: "ARS",
  stock: 2,
  image_url: null,
  concentration: null,
  size_ml: 5,
  is_published: true,
  is_featured: false,
  sort_order: 0,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  category: "Decant",
  variants: [
    { id: "five", product_id: "product-1", label: "5 ml", size_ml: 5, price: 6500, stock: 2, sort_order: 0, is_active: true, created_at: "2026-01-01", updated_at: "2026-01-01" },
    { id: "ten", product_id: "product-1", label: "10 ml", size_ml: 10, price: 11000, stock: 1, sort_order: 1, is_active: true, created_at: "2026-01-01", updated_at: "2026-01-01" },
  ],
};

describe("ProductDetailActions", () => {
  it("shows presentation buttons and updates the single displayed price", () => {
    render(<ProductDetailActions product={product} />);

    expect(screen.getByRole("button", { name: "5 ml" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText((_, element) => element?.textContent === "$\u00a06.500")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "10 ml" }));

    expect(screen.getByRole("button", { name: "10 ml" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText((_, element) => element?.textContent === "$\u00a011.000")).toBeTruthy();
  });
});
