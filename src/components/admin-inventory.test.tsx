import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminInventory } from "./admin-inventory";
import { demoProducts } from "@/lib/products";

vi.mock("@/components/product-form", () => ({ ProductForm: ({ product }: { product: { name: string } }) => <div>Editar {product.name}</div> }));
afterEach(cleanup);
const updateAction = vi.fn(async () => {});
describe("admin inventory", () => {
  it("shows a compact product photo alongside the inventory name", () => {
    const product = { ...demoProducts[0], image_url: "https://example.invalid/product.jpg" };
    render(<AdminInventory products={[product]} updateAction={updateAction} />);
    const image = screen.getByRole("img", { name: product.name });
    expect(image.getAttribute("src")).toBe(product.image_url);
    expect(image.getAttribute("width")).toBe("48");
    expect(image.getAttribute("height")).toBe("48");
  });
  it("shows a placeholder when a product has no photo", () => {
    render(<AdminInventory products={[{ ...demoProducts[0], image_url: null }]} updateAction={updateAction} />);
    expect(screen.getByLabelText("Producto sin foto")).toBeTruthy();
    expect(screen.getByRole("img").tagName).toBe("SPAN");
  });
  it("searches the inventory while retaining the products section and edit forms", () => {
    const { container } = render(<AdminInventory products={demoProducts} query="cera" updateAction={updateAction} />);
    expect((screen.getByRole("searchbox", { name: "Buscar productos del inventario" }) as HTMLInputElement).value).toBe("cera");
    expect(screen.getByRole("search").getAttribute("action")).toBe("/admin");
    expect(container.querySelector('input[name="section"]')?.getAttribute("value")).toBe("products");
    expect(screen.getByText("Cera protectora")).toBeTruthy();
    expect(screen.queryByText("Shampoo para autos")).toBeNull();
    expect(container.textContent).toContain("Editar Cera protectora");
  });
  it("shows an explicit no-match state with a reset link", () => {
    render(<AdminInventory products={demoProducts} query="missing" updateAction={updateAction} />);
    expect(screen.getByText("No encontramos productos con esa búsqueda.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Limpiar búsqueda" }).getAttribute("href")).toBe("/admin?section=products");
  });
  it("marks stock levels independently from publication", () => {
    const products = demoProducts.slice(0, 3).map((p, i) => ({ ...p, stock: 99, is_published: i !== 0, variants: [{ ...p.variants[0], stock: [3, 2, 0][i] }] }));
    const { container } = render(<AdminInventory products={products} updateAction={updateAction} />);
    for (const status of ["good", "low", "empty"]) expect(container.querySelector(`[data-stock-status="${status}"]`)).toBeTruthy();
    expect(screen.getByText("Stock disponible")).toBeTruthy();
    expect(screen.getByText("Stock bajo")).toBeTruthy();
    expect(screen.getByText("Sin stock")).toBeTruthy();
    expect(screen.getByText("Oculto")).toBeTruthy();
  });
  it("shows the empty inventory separately from unsuccessful searches", () => {
    render(<AdminInventory products={[]} updateAction={updateAction} />);
    expect(screen.getByRole("heading", { name: "Inventario vacío" })).toBeTruthy();
  });
});
