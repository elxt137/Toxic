import { describe, expect, it } from "vitest";
import { parseProductInput, validateProductImage } from "./product-editor";

export function productForm() {
  const form = new FormData();
  Object.entries({ name: "Shampoo", brand: "RC2", description: "", category: "Decant", concentration: "", image_url: "", image_urls: "[]", sort_order: "0", variants: JSON.stringify([{ label: "500 ml", size_ml: 500, price: 1000, stock: 3, is_active: true }]) }).forEach(([key, value]) => form.set(key, value));
  return form;
}
describe("product editing", () => {
  it("accepts an empty brand and stores color labels and their images", () => {
    const form=productForm();form.set("brand","");form.set("option_name","Color");form.set("variants",JSON.stringify([{label:"Rojo",size_ml:null,price:8000,stock:2,is_active:true,image_url:"https://example.invalid/red.avif"}]));
    const result=parseProductInput(form);expect(result.product.brand).toBe("");expect(result.product.option_name).toBe("Color");expect(result.variants[0].image_url).toContain("red.avif");
  });
  it("keeps video order and rejects more than three videos or duplicate variant labels", () => {
    const form=productForm();form.set("video_urls",JSON.stringify(["https://example.invalid/demo.mp4"]));expect(parseProductInput(form).product.video_urls).toEqual(["https://example.invalid/demo.mp4"]);
    form.set("video_urls",JSON.stringify(Array(4).fill("https://example.invalid/demo.mp4")));expect(()=>parseProductInput(form)).toThrow();
    form.set("video_urls","[]");const variants=JSON.parse(String(form.get("variants")));form.set("variants",JSON.stringify([...variants,...variants]));expect(()=>parseProductInput(form)).toThrow();
  });
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
  it("accepts AVIF and GIF signatures and rejects misleading types",async()=>{
    const avif=new Uint8Array([0,0,0,24,102,116,121,112,97,118,105,102,0,0,0,0,97,118,105,102,109,105,102,49]);
    await expect(validateProductImage(new File([avif],"photo.avif",{type:"image/avif"}))).resolves.toMatchObject({extension:"avif"});
    await expect(validateProductImage(new File(["GIF89a"],"photo.gif",{type:"image/gif"}))).resolves.toMatchObject({extension:"gif"});
    await expect(validateProductImage(new File([avif],"fake.png",{type:"image/png"}))).rejects.toThrow();
  });
  it("accepts JPEG PNG and WebP signatures", async () => {
    for (const [type, bytes] of [["image/jpeg", [255,216,255,224]], ["image/png", [137,80,78,71,13,10,26,10]], ["image/webp", [82,73,70,70,0,0,0,0,87,69,66,80]]] as const) {
      await expect(validateProductImage(new File([new Uint8Array(bytes)], "photo", { type }))).resolves.toMatchObject({ contentType: type });
    }
  });
  it("rejects empty, oversized, unsupported and disguised files", async () => {
    for (const file of [new File([], "empty.jpg", { type: "image/jpeg" }), new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }), new File(["<svg/>"], "photo.svg", { type: "image/svg+xml" }), new File(["<script/>"], "photo.jpg", { type: "image/jpeg" })]) await expect(validateProductImage(file)).rejects.toThrow();
  });
});
