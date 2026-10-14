import { describe, expect, it } from "vitest";
import { analyticsSchema, canTrackPath } from "./analytics";
describe("Google Analytics configuration", () => {
  it("normalizes a GA4 ID and permits disabling without an ID", () => {
    expect(analyticsSchema.parse({ enabled: true, measurementId: " g-abc1234567 " }).measurementId).toBe("G-ABC1234567");
    expect(analyticsSchema.parse({ enabled: false, measurementId: "" }).measurementId).toBeNull();
  });
  it.each(["", "UA-12345", "<script>alert(1)</script>"])("rejects enabling with invalid ID %s", (measurementId) => {
    expect(analyticsSchema.safeParse({ enabled: true, measurementId }).success).toBe(false);
  });
  it("excludes admin, authentication, checkout and internal endpoints", () => {
    for (const path of ["/admin", "/admin/products/new", "/auth/callback", "/login", "/checkout", "/api/payments", "/_next/x"]) expect(canTrackPath(path)).toBe(false);
    for (const path of ["/", "/productos", "/productos/shampoo"]) expect(canTrackPath(path)).toBe(true);
  });
});
