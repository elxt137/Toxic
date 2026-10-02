import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StorefrontHeader } from "@/components/storefront-header";

describe("StorefrontHeader", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("shows the category menu and changes its visual state after scrolling", () => {
    render(<StorefrontHeader />);

    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    for (const label of ["Lavado", "Interior", "Protección", "Accesorios", "Kits"]) {
      expect(within(nav).getByRole("link", { name: label })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: "Toxic, inicio" })).toBeTruthy();
    expect(screen.getByRole("banner").getAttribute("data-scrolled")).toBe("false");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 12 });
    fireEvent.scroll(window);

    expect(screen.getByRole("banner").getAttribute("data-scrolled")).toBe("true");
  });

  it("reveals the institutional links from Ver más", () => {
    render(<StorefrontHeader />);

    const toggle = screen.getByRole("button", { name: "Ver más" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    for (const label of ["Quiénes somos", "Cómo comprar", "Envíos", "Contacto"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }

    fireEvent.mouseDown(document.body);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens the complete menu from the mobile toggle", () => {
    render(<StorefrontHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    expect(screen.getByRole("button", { name: "Cerrar menú" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Cerrar/ }).getAttribute("aria-expanded")).toBe("true");
  });

  it("updates the cart badge when the cart changes in this tab", () => {
    render(<StorefrontHeader />);

    window.localStorage.setItem("notta-cart", JSON.stringify([{ quantity: 3 }, { quantity: 2 }]));
    act(() => {
      window.dispatchEvent(new Event("notta-cart-updated"));
    });

    expect(screen.getByLabelText(/Carrito/).textContent).toContain("5");
  });

  it("asks the storefront to open the cart when its cart icon is clicked", () => {
    const openCart = () => undefined;
    window.addEventListener("notta-cart-open", openCart);
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<StorefrontHeader />);
    fireEvent.click(screen.getByLabelText(/Carrito/));

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "notta-cart-open" }));
    window.removeEventListener("notta-cart-open", openCart);
    dispatchSpy.mockRestore();
  });
});
