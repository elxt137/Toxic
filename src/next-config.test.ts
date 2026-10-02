import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("Next Server Actions configuration", () => {
  it("accepts actions forwarded from the production Hostinger domain", () => {
    expect(nextConfig.experimental?.serverActions?.allowedOrigins).toEqual([
      "darkseagreen-gaur-344770.hostingersite.com",
    ]);
  });
});
