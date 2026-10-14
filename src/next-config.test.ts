import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("Next Server Actions configuration", () => {
  it("accepts actions forwarded from the production Hostinger domain", () => {
    expect(nextConfig.experimental?.serverActions?.allowedOrigins).toEqual([
      "rc2.com.ar",
      "www.rc2.com.ar",
      "goldenrod-cassowary-586867.hostingersite.com",
    ]);
  });
  it("accepts a 5 MB product photo with multipart overhead", () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe("6mb");
  });
});
