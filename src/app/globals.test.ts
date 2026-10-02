import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("storefront buy button", () => {
  it("uses a deeper green for the Comprar action", () => {
    expect(styles).toMatch(/\.notta-page \.buy-now \{[^}]*background: #0f432e;/);
    expect(styles).toMatch(/\.notta-page \.buy-now:hover \{[^}]*background: #0b3524;/);
  });
});
