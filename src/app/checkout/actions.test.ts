import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { oauth, setCookie }=vi.hoisted(() => ({ oauth: vi.fn(),setCookie:vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "shop.example.com" }),cookies:async () => ({ set:setCookie }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithOAuth: oauth } }) }));
import { signInCustomer } from "./actions";
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://example.supabase.co");vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","public-test");vi.stubEnv("NEXT_PUBLIC_SITE_URL","");oauth.mockResolvedValue({ data: { url:"https://accounts.google.com/test" },error:null }); });
afterEach(() => { vi.unstubAllEnvs();vi.clearAllMocks(); });
describe("customer identity verification", () => {
  it("returns verified buyers to checkout instead of the admin panel", async () => {
    await expect(signInCustomer()).rejects.toThrow("REDIRECT:https://accounts.google.com/test");
    expect(oauth).toHaveBeenCalledWith({ provider:"google",options:{ redirectTo:"https://shop.example.com/auth/callback" } });
    expect(setCookie).toHaveBeenCalledWith("rc2_customer_checkout","1",expect.objectContaining({ httpOnly:true,sameSite:"lax",maxAge:600 }));
  });
  it("returns an actionable checkout error when OAuth is unavailable", async () => {
    oauth.mockResolvedValue({ data: { url:null },error:{} });
    await expect(signInCustomer()).rejects.toThrow("REDIRECT:/checkout?error=oauth");
  });
});
