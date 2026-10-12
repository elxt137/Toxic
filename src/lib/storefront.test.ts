import { beforeEach, describe, expect, it, vi } from "vitest";
const { config, client, result } = vi.hoisted(() => ({ config: vi.fn(), client: vi.fn(), result: vi.fn() }));
vi.mock("@/lib/env", () => ({ getSupabaseConfig: config }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("@/lib/store-contact", () => ({ getWhatsappNumber: () => "5491100000000" }));
import { getStoreWhatsappNumber } from "./storefront";
beforeEach(() => {
  vi.clearAllMocks(); config.mockReturnValue({});
  client.mockResolvedValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: result }) }) }) });
  result.mockResolvedValue({ data: { whatsapp_number: "5491112345678" }, error: null });
});
describe("persisted store WhatsApp", () => {
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
