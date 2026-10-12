import { beforeEach, describe, expect, it, vi } from "vitest";
const { config, client, result } = vi.hoisted(() => ({ config: vi.fn(), client: vi.fn(), result: vi.fn() }));
vi.mock("@/lib/env", () => ({ getSupabaseConfig: config }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("@/lib/store-contact", () => ({ getWhatsappNumber: () => "5491100000000" }));
import { getStoreWhatsappNumber, getCommerceSettings } from "./storefront";
beforeEach(() => {
  vi.clearAllMocks(); config.mockReturnValue({});
  client.mockResolvedValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: result }) }) }) });
  result.mockResolvedValue({ data: { whatsapp_number: "5491112345678" }, error: null });
});
describe("persisted store WhatsApp", () => {
  it("reads configured shipping and cart rules", async () => {
    result.mockResolvedValue({ data: { free_shipping_enabled: true, free_shipping_threshold: 150000, free_shipping_destination: "home", cart_whatsapp_enabled: false }, error: null });
    expect(await getCommerceSettings()).toEqual({ freeShippingEnabled: true, freeShippingThreshold: 150000, freeShippingDestination: "home", cartWhatsappEnabled: false });
  });
  it("hides shipping promises when configured data is unavailable", async () => {
    result.mockResolvedValue({ data: null,error: { message: "unavailable" } });
    expect((await getCommerceSettings()).freeShippingEnabled).toBe(false);
  });
  it("uses the number saved in customization", async () => {
    expect(await getStoreWhatsappNumber()).toBe("5491112345678");
  });
  it("uses the deployment fallback without a configured database", async () => {
    config.mockReturnValue(null);
    expect(await getStoreWhatsappNumber()).toBe("5491100000000");
    expect(client).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: null },
    { data: { whatsapp_number: null }, error: null },
    { data: null, error: { message: "unavailable" } },
  ])("retains the fallback when the stored contact is unavailable", async (value) => {
    result.mockResolvedValue(value);
    expect(await getStoreWhatsappNumber()).toBe("5491100000000");
  });
});
