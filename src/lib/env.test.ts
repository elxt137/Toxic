import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl, getSupabaseConfig } from "@/lib/env";

describe("getSupabaseConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when a required public Supabase value is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");

    expect(getSupabaseConfig()).toBeNull();
  });

  it("returns the public connection values when both are present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");

    expect(getSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "public-key",
    });
  });
});

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the local URL when the public site URL is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("removes the trailing slash from the configured public site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://nottadecants.com/");

    expect(getSiteUrl()).toBe("https://nottadecants.com");
  });

  it("uses the public domain of the request when the site URL is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const headers = new Headers({ host: "127.0.0.1:3000", "x-forwarded-host": "tienda.example.com, proxy.internal" });

    expect(getSiteUrl(headers)).toBe("https://tienda.example.com");
  });

  it("falls back to the host header when there is no forwarded host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(getSiteUrl(new Headers({ host: "tienda.example.com" }))).toBe("https://tienda.example.com");
  });

  it("keeps http for a local request host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(getSiteUrl(new Headers({ host: "localhost:3100" }))).toBe("http://localhost:3100");
  });

  it("ignores a malformed request host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(getSiteUrl(new Headers({ host: "evil.com/phish?x=" }))).toBe("http://localhost:3000");
  });

  it("prefers the configured site URL over the request host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://nottadecants.com");

    expect(getSiteUrl(new Headers({ host: "tienda.example.com" }))).toBe("https://nottadecants.com");
  });
});
