import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/storefront", () => ({ getStoreWhatsappNumber: async () => "5491112345678" }));
vi.mock("@/lib/env", () => ({ getSupabaseConfig: () => null }));
vi.mock("@/lib/products", () => ({ getPublishedProducts: async () => [] }));
vi.mock("@/components/storefront-header", () => ({ StorefrontHeader: () => null }));
vi.mock("@/components/catalog", () => ({ Catalog: ({ whatsappNumber }: { whatsappNumber: string }) => <div data-testid="catalog-phone">{whatsappNumber}</div> }));
import Home from "./page";
import ProductsPage from "./productos/page";
afterEach(cleanup);
describe("customized WhatsApp across public routes", () => {
  it("uses the persisted contact in the home order drawer and floating link", async () => {
    render(await Home());
    expect(screen.getByTestId("catalog-phone").textContent).toBe("5491112345678");
    expect(screen.getByRole("link", { name: "Escribinos por WhatsApp" }).getAttribute("href")).toBe("https://wa.me/5491112345678");
  });
  it("uses the persisted contact for catalog orders", async () => {
    render(await ProductsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("catalog-phone").textContent).toBe("5491112345678");
  });
});
