import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { Catalog } from "@/components/catalog";
import { demoProducts } from "@/lib/products";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/env", () => ({ getSupabaseConfig: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => { cleanup(); window.localStorage.clear(); });

describe("Toxic vehicle care storefront", () => {
  it("presents vehicle care branding and demo products on the home page", async () => {
    const { container } = render(await Home());
    expect(screen.getByRole("link", { name: "Toxic, inicio" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Tu auto impecable");
    expect(screen.getByRole("searchbox", { name: "Buscar productos" })).toBeTruthy();
    expect(container.textContent).not.toMatch(/perfumes|fragancia|decants|notta/i);
    for (const name of ["Shampoo para autos", "Cera protectora", "Cepillo de detailing", "Paño de microfibra", "Luces LED"]) {
      expect(demoProducts.some((product) => product.name === name)).toBe(true);
    }
  });

  it("filters vehicle care supplies and accessories using customer-facing categories", () => {
    render(<Catalog products={demoProducts} />);
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "Frasco completo" } });
    expect(screen.getByRole("heading", { name: /Cepillo de detailing/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Shampoo para autos/ })).toBeNull();
    expect(screen.getByRole("option", { name: "Accesorios" })).toBeTruthy();
  });
});
