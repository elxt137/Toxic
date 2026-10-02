import { describe, expect, it } from "vitest";

import { presentationSizeSchema } from "@/lib/presentation-size";

describe("presentationSizeSchema", () => {
  it("accepts one-decimal decant presentations such as 1.2 ml", () => {
    expect(presentationSizeSchema.parse(1.2)).toBe(1.2);
  });

  it("rejects a size with more precision than the database allows", () => {
    expect(() => presentationSizeSchema.parse(1.25)).toThrow();
  });
});
