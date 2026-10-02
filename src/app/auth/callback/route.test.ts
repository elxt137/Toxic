import { afterEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();

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
  });

  it("opens the admin panel on the public domain after a successful Google sign in", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(callback("?code=abc"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe("https://tienda.example.com/admin");
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
