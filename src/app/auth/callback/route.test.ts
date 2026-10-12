import { afterEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const { cookie,clearCookie }=vi.hoisted(() => ({ cookie:vi.fn(),clearCookie:vi.fn() }));
vi.mock("next/headers",() => ({ cookies:async () => ({ get:cookie,delete:clearCookie }) }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

import { GET } from "@/app/auth/callback/route";

const callback = (query: string) => new Request(`http://127.0.0.1:3000/auth/callback${query}`, {
  headers: { host: "127.0.0.1:3000", "x-forwarded-host": "tienda.example.com" },
});

describe("Google auth callback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    exchangeCodeForSession.mockReset();
    cookie.mockReset();clearCookie.mockClear();
  });

  it("opens the admin panel on the public domain after a successful Google sign in", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(callback("?code=abc"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe("https://tienda.example.com/admin");
  });
  it("returns a customer verification to checkout using the one-time cookie",async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL","");cookie.mockReturnValue({ value:"1" });exchangeCodeForSession.mockResolvedValue({ error:null });
    expect((await GET(callback("?code=abc"))).headers.get("location")).toBe("https://tienda.example.com/checkout");
    expect(clearCookie).toHaveBeenCalledWith("rc2_customer_checkout");
  });

  it("returns to login on the public domain when the code cannot be exchanged", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid code") });

    const response = await GET(callback("?code=bad"));

    expect(response.headers.get("location")).toBe("https://tienda.example.com/login?error=callback");
  });

  it("does not redirect to another site through the next parameter", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(callback("?code=abc&next=//evil.com"));

    expect(response.headers.get("location")).toBe("https://tienda.example.com/admin");
  });
});
