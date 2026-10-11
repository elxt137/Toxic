import { describe, expect, it } from "vitest";
import { filterInventory, getInventoryStock, getStockStatus } from "./inventory";

describe("inventory search", () => {
  const products = [{ name: "Tapón Gris", brand: "RC2", slug: "tapon-gris" }, { name: "Microfibra", brand: "Otra", slug: "microfibra" }];
  it("matches names, brands and slugs without accents or case sensitivity", () => {
    expect(filterInventory(products, " TAPON gris ")).toEqual([products[0]]);
    expect(filterInventory(products, "rc2")).toEqual([products[0]]);
    expect(filterInventory(products, "tapon-gris")).toEqual([products[0]]);
  });
  it("handles empty queries, empty inventories and no matches", () => {
    expect(filterInventory(products, "  ")).toEqual(products);
    expect(filterInventory([], "LED")).toEqual([]);
    expect(filterInventory(products, "inexistente")).toEqual([]);
  });
});
describe("inventory availability", () => {
  it.each([[0, "empty"], [1, "low"], [2, "low"], [3, "good"], [42, "good"]])("classifies %s available units as %s", (stock, status) => {
    expect(getStockStatus(stock).id).toBe(status);
  });
  it("sums active variants rather than the stale product stock", () => {
    expect(getInventoryStock({ variants: [{ stock: 2, is_active: true }, { stock: 1, is_active: true }, { stock: 42, is_active: false }] })).toBe(3);
    expect(getInventoryStock({ variants: [] })).toBe(0);
    expect(getInventoryStock({ variants: [{ stock: 5, is_active: false }] })).toBe(0);
  });
});
