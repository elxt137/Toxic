import { describe, expect, it } from "vitest";
import { filterCatalogProducts } from "./catalog-navigation";
import { demoProducts } from "./products";

it("filters by the saved category instead of guessing from the name", () => {
  const product = { ...demoProducts[0], name: "Cera especial", category: "interior" as const };
  expect(filterCatalogProducts([product], { category: "interior" })).toEqual([product]);
  expect(filterCatalogProducts([product], { category: "brillo" })).toEqual([]);
});

describe("vehicle care catalog navigation", () => {
  it.each([
    ["lavado", ["Shampoo para autos"]],
    ["proteccion", ["Cera protectora"]],
    ["brillo", ["Cera protectora"]],
    ["cepillos", ["Cepillo de detailing", "Paño de microfibra"]],
    ["iluminacion", ["Luces LED"]],
    ["interior", []],
    ["kits", []],
  ])("shows only products matching %s", (category, names) => {
    expect(filterCatalogProducts(demoProducts, { category }).map((p) => p.name)).toEqual(names);
  });
  it("searches names, brands and descriptions without accent or case sensitivity", () => {
    expect(filterCatalogProducts(demoProducts, { query: "  PANO  " }).map((p) => p.name)).toEqual(["Paño de microfibra"]);
    expect(filterCatalogProducts(demoProducts, { query: "COMPATIBILIDAD" }).map((p) => p.name)).toEqual(["Luces LED"]);
  });
  it("combines category, search and brand filters", () => {
    expect(filterCatalogProducts(demoProducts, { category: "cepillos", query: "microfibra", brand: demoProducts[0].brand })).toHaveLength(1);
    expect(filterCatalogProducts(demoProducts, { category: "lavado", query: "cera" })).toEqual([]);
    expect(filterCatalogProducts(demoProducts, { brand: "Unknown" })).toEqual([]);
  });
  it("handles empty catalogs and unknown categories without inventing matches", () => {
    expect(filterCatalogProducts([], {})).toEqual([]);
    expect(filterCatalogProducts(demoProducts, { category: "unknown" })).toEqual([]);
    expect(filterCatalogProducts(demoProducts, {})).toHaveLength(5);
  });
});
