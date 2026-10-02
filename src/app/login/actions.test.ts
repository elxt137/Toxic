import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();
const requestHeaders = new Headers({ host: "tienda.example.com" });

vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithOAuth } }),
}));

import { signInWithGoogle } from "@/app/login/actions";

describe("signInWithGoogle", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
    signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.com/o/oauth2" }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    signInWithOAuth.mockReset();
  });

  it("returns from Google to the storefront domain instead of localhost when the site URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    await expect(signInWithGoogle()).rejects.toThrow("REDIRECT:https://accounts.google.com/o/oauth2");
    expect(signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
      provider: "google",
      options: expect.objectContaining({ redirectTo: "https://tienda.example.com/auth/callback" }),
    }));
  });

  it("sends the visitor back to login with an error when Google cannot start", async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: null }, error: new Error("provider disabled") });

    await expect(signInWithGoogle()).rejects.toThrow("REDIRECT:/login?error=oauth");
  });
});
