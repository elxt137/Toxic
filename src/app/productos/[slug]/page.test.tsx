import { beforeEach, expect, it, vi } from "vitest";
const { getProduct, getRedirect } = vi.hoisted(() => ({ getProduct: vi.fn(), getRedirect: vi.fn() }));
vi.mock("@/lib/products", () => ({ getPublishedProduct: getProduct, getProductRedirect: getRedirect }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); }, permanentRedirect: (url: string) => { throw new Error(`308:${url}`); } }));
import ProductPage from "./page";
beforeEach(() => { vi.clearAllMocks(); getProduct.mockResolvedValue(null); getRedirect.mockResolvedValue(null); });
it("keeps old color links working with a permanent redirect to the shared listing", async () => {
  getRedirect.mockResolvedValue("tapones");
  await expect(ProductPage({ params: Promise.resolve({ slug: "tapones-gris" }) })).rejects.toThrow("308:/productos/tapones");
  expect(getRedirect).toHaveBeenCalledWith("tapones-gris");
});
it("returns not found when no published product or alias exists", async () => {
  await expect(ProductPage({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow("NOT_FOUND");
});
