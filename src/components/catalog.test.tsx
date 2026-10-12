import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Catalog } from "@/components/catalog";
import type { ProductWithVariants } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const product = { id: "product-1", name: "Blanche Absolu", slug: "blanche", brand: "Byredo", description: "", price: 23500, currency: "ARS", stock: 1, image_url: "https://example.com/blanche.png", concentration: null, size_ml: 1.2, is_published: true, is_featured: false, sort_order: 0, created_at: "2026-01-01", updated_at: "2026-01-01", category: "Decant", variants: [{ id: "variant-1", product_id: "product-1", label: "1.2 ml", size_ml: 1.2, price: 23500, stock: 1, sort_order: 0, is_active: true, created_at: "2026-01-01", updated_at: "2026-01-01" }] } satisfies ProductWithVariants;

describe("Catalog cart", () => {
  it("hides WhatsApp ordering when disabled in personalization", async () => {
    window.localStorage.setItem("notta-cart",JSON.stringify([{ product,variantId:"variant-1",quantity:1 }]));
    render(<Catalog products={[product]} whatsappNumber="5491100000000" settings={{ freeShippingEnabled:false,freeShippingThreshold:100000,freeShippingDestination:"branch",cartWhatsappEnabled:false }} />);
    fireEvent.click(screen.getByRole("button",{ name:/Pedido/ }));
    await waitFor(() => expect(screen.getByLabelText("Tu pedido").textContent).toContain("Blanche"));
    expect(screen.queryByRole("button",{ name:"Enviar pedido por WhatsApp" })).toBeNull();
    expect(screen.queryByText(/envío gratis/i)).toBeNull();
  });
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(cleanup);

  it("uses incoming search filters and lets visitors clear them", () => {
    render(<Catalog products={[product]} initialQuery="missing product" />);
    expect(screen.queryByRole("heading", { name: /Blanche/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByRole("heading", { name: /Blanche/ })).toBeTruthy();
  });

  it("does not increase cart quantities above available stock", async () => {
    window.localStorage.setItem("notta-cart", JSON.stringify([{ product, variantId: "variant-1", quantity: 1 }]));
    render(<Catalog products={[product]} />);
    fireEvent.click(screen.getByRole("button", { name: /Pedido/ }));
    const increase = await screen.findByRole("button", { name: "Sumar Blanche Absolu" });
    expect((increase as HTMLButtonElement).disabled).toBe(true);
  });

  it("ignores malformed stored carts instead of breaking the storefront", async () => {
    window.localStorage.setItem("notta-cart", JSON.stringify({ invalid: true }));
    render(<Catalog products={[product]} />);
    fireEvent.click(screen.getByRole("button", { name: /Pedido/ }));
    await waitFor(() => expect(within(screen.getByLabelText("Tu pedido")).getByText("Todavía no agregaste productos a tu pedido.")).toBeTruthy());
  });

  it("closes the order with Escape", () => {
    render(<Catalog products={[product]} />);
    fireEvent.click(screen.getByRole("button", { name: /Pedido/ }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByLabelText("Tu pedido").getAttribute("aria-hidden")).toBe("true");
  });

  it("shows the product image next to each cart item", async () => {
    window.localStorage.setItem("notta-cart", JSON.stringify([{ product, variantId: "variant-1", quantity: 1 }]));
    render(<Catalog products={[product]} />);
    const drawer = screen.getByLabelText("Tu pedido");
    await waitFor(() => expect(drawer.querySelector('img[alt="Producto: Blanche Absolu"]')?.getAttribute("src")).toBe(product.image_url));
  });

  it("keeps the closed order drawer out of keyboard navigation", async () => {
    render(<Catalog products={[product]} />);
    const drawer = screen.getByLabelText("Tu pedido");
    expect(drawer.hasAttribute("inert")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Pedido/ }));

    await waitFor(() => expect(drawer.hasAttribute("inert")).toBe(false));
  });

  it("hides the free shipping notice while the order drawer is open so it does not cover the order", async () => {
    window.sessionStorage.setItem("notta-shipping-toast", "true");
    window.localStorage.setItem("notta-cart", JSON.stringify([{ product, variantId: "variant-1", quantity: 1 }]));
    render(<Catalog products={[product]} />);
    await screen.findByRole("button", { name: "Cerrar aviso de envío" });

    fireEvent.click(screen.getByRole("button", { name: /Pedido/ }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Cerrar aviso de envío" })).toBeNull());
  });
});
