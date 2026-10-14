import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";
describe("browser security headers", () => {
  it("prevents framing, MIME sniffing and sensitive referrer disclosure", () => {
    expect(securityHeaders(false)).toEqual(expect.arrayContaining([
      { key: "X-Frame-Options", value: "DENY" }, { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ]));
  });
  it("permits Next and GA4 resources while limiting frames and object execution", () => {
    const policy = securityHeaders(true).find((header) => header.key === "Content-Security-Policy")!.value;
    expect(policy).toContain("frame-ancestors 'none'"); expect(policy).toContain("object-src 'none'"); expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("https://www.googletagmanager.com"); expect(policy).not.toContain("'unsafe-eval'");
  });
  it("enables HSTS in production only, without assuming sibling subdomain HTTPS", () => {
    expect(securityHeaders(false)).not.toEqual(expect.arrayContaining([expect.objectContaining({ key: "Strict-Transport-Security" })]));
    expect(securityHeaders(true)).toEqual(expect.arrayContaining([{ key: "Strict-Transport-Security", value: "max-age=31536000" }]));
  });
});
