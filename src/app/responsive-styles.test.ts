import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const globals = read("src/app/globals.css");
const header = read("src/components/storefront-header.module.css");
const toast = read("src/components/free-shipping-toast.module.css");

const mobileHeader = header.slice(header.indexOf("@media (max-width: 700px)"));
const responsiveGlobals = globals.slice(globals.indexOf("/* Responsive y accesibilidad táctil */"));
const mobileGlobals = responsiveGlobals.slice(responsiveGlobals.indexOf("@media (max-width: 800px)"));

describe("login on narrow phones", () => {
  it("keeps the login card inside a 320px viewport", () => {
    expect(responsiveGlobals).toMatch(/\.login-page \{[^}]*grid-template-columns: minmax\(0, 1fr\);/);
    expect(responsiveGlobals).toMatch(/\.login-card h1 \{[^}]*font-size: clamp\(34px, 10vw, 46px\);/);
  });
});

describe("storefront header and announcement bar", () => {
  it("places the header below the announcement bar until the visitor scrolls", () => {
    expect(globals).toMatch(/:root \{[^}]*--announcement-height: 33px;/);
    expect(responsiveGlobals).toMatch(/\.announcement-bar \{[^}]*height: var\(--announcement-height\);/);
    expect(header).toMatch(/\.header \{[^}]*top: var\(--announcement-height, 0px\);/);
    expect(header).toMatch(/\.scrolled \{[^}]*top: 0;/);
  });

  it("leaves room for the fixed header above the hero text", () => {
    expect(responsiveGlobals).toMatch(/\.notta-hero \{[^}]*padding-block: 120px 48px;/);
  });

  it("gives header icons a 44px touch area", () => {
    expect(header).toMatch(/\.actions > a, \.menuToggle \{[^}]*min-width: 44px; min-height: 44px;/);
  });

  it("uses a 16px search input on phones to avoid iOS zoom", () => {
    expect(mobileHeader).toMatch(/\.search input \{[^}]*font-size: 16px;/);
  });

  it("shows the mobile menu full width and hides it from keyboard navigation while closed", () => {
    expect(mobileHeader).toMatch(/\.nav \{[^}]*justify-content: normal;[^}]*visibility: hidden;/);
    expect(mobileHeader).toMatch(/\.nav\.open \{[^}]*visibility: visible;/);
  });
});

describe("touch targets and readable text", () => {
  it("gives secondary links and buttons a 44px touch area", () => {
    for (const selector of [".back-link", ".product-detail-back", ".checkout-header > a:last-child", ".add-more-products", ".order-header button", ".notta-page .buy-now"]) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\>]/g, "\\$&");
      expect(responsiveGlobals).toMatch(new RegExp(`${escaped}[^{]*\\{[^}]*min-height: 44px;`));
    }
    expect(toast).toMatch(/\.header button \{[^}]*width: 36px; height: 36px;/);
  });

  it("uses 16px form controls on phones to avoid iOS zoom", () => {
    expect(mobileGlobals).toMatch(/\.catalog-filters select, \.cart-recommendation select \{[^}]*font-size: 16px;/);
  });

  it("keeps informative text at 12px or larger", () => {
    for (const selector of [".announcement-bar", ".eyebrow", ".login-card small", ".notta-hero p", ".product-brand, .notta-page .product-brand", ".catalog-heading p", ".order-header p", ".notta-page .buy-now"]) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\>]/g, "\\$&");
      expect(responsiveGlobals).toMatch(new RegExp(`(^|\\n)${escaped} \\{[^}]*font-size: 12px;`));
    }
    expect(header).toMatch(/\.nav \{[^}]*font-size: 12px;/);
  });
});
