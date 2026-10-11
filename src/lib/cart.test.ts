import { describe, expect, it } from "vitest";
import { readCart, addCartItem } from "./cart";
import { demoProducts } from "./products";

describe("cart storage and stock", () => {
  it.each([null, "not json", "{}", "[null]", '[{"product":{}}]'])("rejects malformed storage %s", (stored) => {
    expect(readCart(stored)).toEqual([]);
  });
  it("adds available variants and caps repeat additions at stock", () => {
    const product = { ...demoProducts[0], variants: [{ ...demoProducts[0].variants[0], stock: 1 }] };
    const cart = addCartItem([], product, product.variants[0].id);
    expect(cart[0].quantity).toBe(1);
    expect(addCartItem(cart, product, product.variants[0].id)[0].quantity).toBe(1);
    expect(readCart(JSON.stringify(cart))).toEqual(cart);
  });
  it("rejects missing and sold out variants", () => {
    expect(addCartItem([], demoProducts[0], "unknown")).toEqual([]);
    expect(addCartItem([], demoProducts[4], demoProducts[4].variants[0].id)).toEqual([]);
  });
  it("drops missing variants and invalid quantities when restoring", () => {
    const product = demoProducts[0];
    for (const quantity of [0, -1, 1.5, "2"]) {
      expect(readCart(JSON.stringify([{ product, variantId: product.variants[0].id, quantity }]))).toEqual([]);
    }
    expect(readCart(JSON.stringify([{ product, variantId: "missing", quantity: 1 }]))).toEqual([]);
  });
});
