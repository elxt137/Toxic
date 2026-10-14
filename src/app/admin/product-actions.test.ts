import { beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, client, rpc, upload, update, result } = vi.hoisted(() => ({ authorize: vi.fn(), client: vi.fn(), rpc: vi.fn(), upload: vi.fn(), update: vi.fn(), result: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: authorize }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
import { createProduct, updateProduct } from "./actions";
import { uploadProductImage } from "./image-actions";
import { saveAnalyticsSettings } from "./analytics-actions";
const id = "11111111-1111-4111-8111-111111111111";
function form() {
  const data = new FormData();
  Object.entries({ name: "Shampoo", brand: "RC2", description: "", category: "Decant", concentration: "", image_url: "", image_urls: "[]", price: "100", stock: "1", size_ml: "", sort_order: "0", variants: '[{"label":"500 ml","size_ml":500,"price":1000,"stock":3,"is_active":true}]' }).forEach(([key,value]) => data.set(key,value));
  return data;
}
beforeEach(() => {
  vi.clearAllMocks(); authorize.mockResolvedValue({}); rpc.mockResolvedValue({ data: id, error: null }); upload.mockResolvedValue({ error: null }); result.mockResolvedValue({ data: { id: true }, error: null });
  const builder: Record<string, unknown> = { maybeSingle: result };
  for (const key of ["eq", "select"]) builder[key] = () => builder;
  update.mockReturnValue(builder);
  client.mockResolvedValue({ rpc, storage: { from: () => ({ upload, getPublicUrl: () => ({ data: { publicUrl: "https://example.invalid/photo.jpg" } }) }) }, from: () => ({ update }) });
});
describe("authorized product management", () => {
  it("creates product and presentations in one atomic operation", async () => {
    await expect(createProduct(form())).rejects.toThrow("REDIRECT:/admin?section=products&success=created");
    expect(rpc).toHaveBeenCalledWith("save_catalog_product", expect.objectContaining({ p_id: null, p_product: expect.objectContaining({ price: 1000 }), p_variants: expect.any(Array) }));
  });
  it("updates a selected product atomically", async () => {
    await expect(updateProduct(id, form())).rejects.toThrow("success=updated");
    expect(rpc).toHaveBeenCalledWith("save_catalog_product", expect.objectContaining({ p_id: id }));
  });
  it("rejects invalid input and IDs before reaching storage", async () => {
    const invalid = form(); invalid.set("variants", "[]");
    await expect(createProduct(invalid)).rejects.toThrow(); await expect(updateProduct("invalid", form())).rejects.toThrow();
    expect(client).not.toHaveBeenCalled();
  });
  it("does not announce success on database failure or missing product", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "internal secret" } });
    await expect(updateProduct(id, form())).rejects.toThrow("No se pudo guardar el producto");
  });
  it("uploads validated bytes with a unique name", async () => {
    const data = new FormData(); data.set("file", new File([new Uint8Array([255,216,255,224])], "private name.jpg", { type: "image/jpeg" }));
    expect(await uploadProductImage(data)).toEqual({ url: "https://example.invalid/photo.jpg" });
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^catalog\/[\da-f-]+\.jpg$/), expect.any(Uint8Array), expect.objectContaining({ upsert: false, contentType: "image/jpeg" }));
    upload.mockResolvedValue({ error: { message: "secret" } }); expect((await uploadProductImage(data)).error).toContain("No se pudo subir");
  });
  it("rejects disguised photos and missing files without creating a client", async () => {
    expect((await uploadProductImage(new FormData())).error).toBeTruthy();
    const data = new FormData(); data.set("file", new File(["bad"], "fake.jpg", { type: "image/jpeg" }));
    expect((await uploadProductImage(data)).error).toBeTruthy(); expect(client).not.toHaveBeenCalled();
  });
  it("saves analytics, handles failures and validates IDs", async () => {
    const data = new FormData(); data.set("measurementId", "g-abc1234567"); data.set("enabled", "on");
    expect((await saveAnalyticsSettings({}, data)).success).toBe(true);
    expect(update).toHaveBeenCalledWith({ google_analytics_enabled: true, google_analytics_id: "G-ABC1234567" });
    result.mockResolvedValue({ data: null, error: null }); expect((await saveAnalyticsSettings({}, data)).success).toBe(false);
    client.mockClear(); data.set("measurementId", "UA-bad"); expect((await saveAnalyticsSettings({}, data)).success).toBe(false); expect(client).not.toHaveBeenCalled();
  });
  it("denies all mutations before any database or upload work", async () => {
    authorize.mockRejectedValue(new Error("unauthorized"));
    for (const action of [() => createProduct(form()), () => updateProduct(id, form()), () => uploadProductImage(new FormData()), () => saveAnalyticsSettings({}, new FormData())]) await expect(action()).rejects.toThrow("unauthorized");
    expect(client).not.toHaveBeenCalled();
  });
});
