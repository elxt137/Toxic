import { describe, expect, it } from "vitest";
import { parseProductInput, validateProductImage } from "./product-editor";

export function productForm() {
  const form = new FormData();
  Object.entries({ name: "Shampoo", brand: "RC2", description: "", category: "Decant", concentration: "", image_url: "", image_urls: "[]", sort_order: "0", variants: JSON.stringify([{ label: "500 ml", size_ml: 500, price: 1000, stock: 3, is_active: true }]) }).forEach(([key, value]) => form.set(key, value));
  return form;
}
describe("product editing", () => {
  it("derives price and stock from the first presentation and defaults to draft", () => {
    expect(parseProductInput(productForm()).product).toMatchObject({ price: 1000, stock: 3, is_published: false, image_url: null, image_urls: [] });
  });
  it("stores gallery order and uses the first photo as cover", () => {
    const form = productForm(); form.set("image_urls", '["https://example.invalid/a.webp","https://example.invalid/b.png"]');
    expect(parseProductInput(form).product.image_url).toBe("https://example.invalid/a.webp");
  });
  it.each(["[]", '[{"label":"","price":-1,"stock":0,"size_ml":null,"is_active":true}]', "invalid"])("rejects invalid presentations %s", (value) => {
    const form = productForm(); form.set("variants", value); expect(() => parseProductInput(form)).toThrow();
  });
  it("rejects scripts in photo URLs and more than six photos", () => {
    const form = productForm(); form.set("image_urls", '["javascript:alert(1)"]'); expect(() => parseProductInput(form)).toThrow();
    form.set("image_urls", JSON.stringify(Array(7).fill("https://example.invalid/a.jpg"))); expect(() => parseProductInput(form)).toThrow();
  });
});
describe("product image uploads", () => {
  it("accepts JPEG PNG and WebP signatures", async () => {
    for (const [type, bytes] of [["image/jpeg", [255,216,255,224]], ["image/png", [137,80,78,71,13,10,26,10]], ["image/webp", [82,73,70,70,0,0,0,0,87,69,66,80]]] as const) {
      await expect(validateProductImage(new File([new Uint8Array(bytes)], "photo", { type }))).resolves.toMatchObject({ contentType: type });
    }
  });
  it("rejects empty, oversized, unsupported and disguised files", async () => {
    for (const file of [new File([], "empty.jpg", { type: "image/jpeg" }), new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }), new File(["<svg/>"], "photo.svg", { type: "image/svg+xml" }), new File(["<script/>"], "photo.jpg", { type: "image/jpeg" })]) await expect(validateProductImage(file)).rejects.toThrow();
  });
});
