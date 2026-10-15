import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { demoProducts } from "@/lib/products";
const { authorize, client } = vi.hoisted(() => ({ authorize: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: authorize }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); }, redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); }, unstable_rethrow: () => {} }));
import ProductEditorPage from "./[id]/page";
import NewProductPage from "./new/page";
beforeEach(() => {
  vi.clearAllMocks(); authorize.mockResolvedValue({});
  client.mockResolvedValue({ from: (table: string) => {
    const builder: Record<string, unknown> = { then: (resolve: (value: unknown) => void) => resolve({ data: table === "products" ? demoProducts[0] : table === "product_variants" ? demoProducts[0].variants : null, error: null }) };
    for (const key of ["select", "eq", "order", "maybeSingle"]) builder[key] = () => builder; return builder;
  } });
});
afterEach(cleanup);
it("opens the consolidated editor when following an archived color listing", async () => {
  client.mockResolvedValue({ from: (table: string) => {
    const builder: Record<string, unknown> = { then: (resolve: (value: unknown) => void) => resolve({ data: table === "products" ? { ...demoProducts[0], merged_into: "canonical" } : [], error: null }) };
    for (const key of ["select", "eq", "order", "maybeSingle"]) builder[key] = () => builder;
    return builder;
  } });
  await expect(ProductEditorPage({ params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) })).rejects.toThrow("REDIRECT:/admin/products/canonical");
});
it("opens a complete editor for the selected product", async () => {
  render(await ProductEditorPage({ params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) }));
  expect(screen.getByRole("heading", { name: "Editar producto" })).toBeTruthy();
  expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe(demoProducts[0].name);
  expect(screen.getByLabelText("Subir fotos")).toBeTruthy(); expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeTruthy();
});
it("starts new products as drafts", async () => {
  render(await NewProductPage()); expect((screen.getByLabelText("Publicado") as HTMLInputElement).checked).toBe(false);
});
it("rejects invalid IDs before querying data", async () => {
  await expect(ProductEditorPage({ params: Promise.resolve({ id: "invalid" }) })).rejects.toThrow("NOT_FOUND"); expect(client).not.toHaveBeenCalled();
});
it("denies both editor routes outside the whitelist", async () => {
  authorize.mockRejectedValue(new Error("unauthorized"));
  await expect(NewProductPage()).rejects.toThrow("unauthorized");
  await expect(ProductEditorPage({ params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) })).rejects.toThrow("unauthorized"); expect(client).not.toHaveBeenCalled();
});
