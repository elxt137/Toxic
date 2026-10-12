import { describe, expect, it } from "vitest";
import { barcodeSvg } from "./barcode";
describe("scannable product and coupon codes", () => {
  it("renders Code 128 as vector lines", () => {
    const svg = barcodeSvg("RC2-1234567890");
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
    expect(svg).toContain("<path");
  });
  it("rejects unsupported characters before generating markup", () => { expect(() => barcodeSvg('<img src="x">')).toThrow(); });
});
