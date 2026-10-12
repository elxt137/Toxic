import { describe, expect, it } from "vitest";

import { getFreeShippingProgress } from "@/lib/shipping";

describe("getFreeShippingProgress", () => {
  it("uses the configured amount and qualifies at the exact threshold", () => {
    expect(getFreeShippingProgress(150_000, { freeShippingEnabled: true, freeShippingThreshold: 150_000, freeShippingDestination: "home", cartWhatsappEnabled: true })).toMatchObject({ threshold: 150_000, qualified: true, progress: 100 });
  });
  it("does not grant disabled shipping or propagate invalid totals", () => {
    expect(getFreeShippingProgress(200_000, { freeShippingEnabled: false, freeShippingThreshold: 100_000, freeShippingDestination: "branch", cartWhatsappEnabled: true }).qualified).toBe(false);
    expect(getFreeShippingProgress(NaN).progress).toBe(0);
  });
  it("calculates the missing amount and percentage below the free-shipping threshold", () => {
    expect(getFreeShippingProgress(25_000)).toEqual({ threshold: 100_000, missing: 75_000, progress: 25, qualified: false });
  });

  it("caps progress and marks orders at the threshold as eligible", () => {
    expect(getFreeShippingProgress(120_000)).toEqual({ threshold: 100_000, missing: 0, progress: 100, qualified: true });
  });
});
