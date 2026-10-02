import { describe, expect, it } from "vitest";

import { getFreeShippingProgress } from "@/lib/shipping";

describe("getFreeShippingProgress", () => {
  it("calculates the missing amount and percentage below the free-shipping threshold", () => {
    expect(getFreeShippingProgress(25_000)).toEqual({ threshold: 100_000, missing: 75_000, progress: 25, qualified: false });
  });

  it("caps progress and marks orders at the threshold as eligible", () => {
    expect(getFreeShippingProgress(120_000)).toEqual({ threshold: 100_000, missing: 0, progress: 100, qualified: true });
  });
});
