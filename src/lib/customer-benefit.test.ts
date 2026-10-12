import { beforeEach, describe, expect, it, vi } from "vitest";
const { config, client, getUser, rpc } = vi.hoisted(() => ({ config: vi.fn(), client: vi.fn(), getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/env", () => ({ getSupabaseConfig: config }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
import { getCustomerBenefit } from "./customer-benefit";
beforeEach(() => {
  vi.clearAllMocks(); config.mockReturnValue({}); client.mockResolvedValue({ auth: { getUser },rpc });
  getUser.mockResolvedValue({ data: { user: { email: "ANA@example.invalid", email_confirmed_at: "2026-01-01" } } });
  rpc.mockResolvedValue({ data: { group_id: "11111111-1111-4111-8111-111111111111", group_name: "Profesional", discount_percent: 15 },error: null });
});
describe("verified customer benefits", () => {
  it("uses the confirmed session and server RPC", async () => {
    expect(await getCustomerBenefit()).toMatchObject({ email: "ana@example.invalid", groupName: "Profesional", percent: 15 });
    expect(rpc).toHaveBeenCalledWith("get_my_customer_benefit",{});
  });
  it.each([null,{ email: "ana@example.invalid",email_confirmed_at: null }])("never grants discounts without a verified user", async (user) => {
    getUser.mockResolvedValue({ data: { user } });
    expect(await getCustomerBenefit()).toBeNull(); expect(rpc).not.toHaveBeenCalled();
  });
  it("keeps new verified customers at list price", async () => {
    rpc.mockResolvedValue({ data: null,error: null });
    expect(await getCustomerBenefit()).toMatchObject({ percent: 0,groupId: null });
  });
  it("fails closed when entitlement validation is unavailable", async () => {
    rpc.mockResolvedValue({ data: null,error: { message: "private details" } });
    await expect(getCustomerBenefit()).rejects.toThrow("No se pudo verificar el beneficio");
  });
});
