import { describe, expect, it } from "vitest";

import { demoProducts, formatPrice } from "@/lib/products";

describe("formatPrice", () => {
  it("formats Argentine peso amounts without decimal cents", () => {
    expect(formatPrice(6500)).toBe("$ 6.500");
  });
});

describe("demoProducts", () => {
  it("only exposes published products in the fallback catalog", () => {
    expect(demoProducts).toHaveLength(5);
    expect(demoProducts.every((product) => product.is_published)).toBe(true);
  });
});
