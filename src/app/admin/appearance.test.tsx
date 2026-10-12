// @vitest-environment node
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/lib/products";
import { AdminThemeProvider } from "@/components/admin/admin-theme";

vi.mock("@/lib/auth", () => ({ requireAdmin: async () => ({ email: "admin@example.invalid" }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: (table: string) => {
  const data = table === "products" ? demoProducts : table === "product_variants" ? demoProducts.flatMap((p) => p.variants) : table === "storefront_settings" ? null : table === "orders" ? [{ id: "11111111-1111-4111-8111-111111111111", status: "approved", total: 6500, created_at: "2026-10-11T12:00:00Z", payer_name: "Cliente de prueba", payer_email: "buyer@example.invalid", shipping_status: "preparing", transaction_status: "processed" }] : table === "coupons" ? [{ id: "11111111-1111-4111-8111-111111111111", code: "RC2-TEST", kind: "percent", value: 15, active: true, usage_limit: 1, used_count: 0, expires_at: null }] : [];
  const builder: Record<string, unknown> = { then: (resolve: (value: unknown) => void) => resolve({ data, error: null }) };
  for (const key of ["select", "order", "eq", "in", "maybeSingle", "range"]) builder[key] = () => builder;
  return builder;
} }) }));
vi.mock("./actions", () => ({ createProduct: () => {}, updateProduct: () => {}, updateAnnouncement: () => {} }));
vi.mock("./whatsapp-actions", () => ({ updateWhatsappNumber: async () => ({ success: true }) }));
import AdminPage from "./page";
import LabelsPage from "./labels/page";

let browser: Browser;
beforeAll(async () => { browser = await chromium.launch({ headless: true, channel: process.env.RC2_BROWSER_CHANNEL || "msedge" }); });
afterAll(async () => { await browser?.close(); });
const css = ["node_modules/tailwindcss/preflight.css", "src/app/globals.css", "src/app/admin/admin.css"].map((path) => readFileSync(resolve(path), "utf8")).join("\n");

describe("admin appearance in a real browser", () => {
  it("prints black labels on white paper even with dark admin mode", async () => {
    const markup = renderToStaticMarkup(<AdminThemeProvider initialTheme="dark">{await LabelsPage({ searchParams: Promise.resolve({ type: "coupon", ids: "11111111-1111-4111-8111-111111111111" }) })}</AdminThemeProvider>);
    const page = await browser.newPage();
    await page.setContent(`<html><head><style>${css}</style></head><body>${markup}</body></html>`);
    await page.emulateMedia({ media: "print" });
    expect(await page.locator(".labels-page").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");
    expect(await page.locator(".physical-label").evaluate((element) => getComputedStyle(element).color)).toBe("rgb(0, 0, 0)");
    expect(await page.locator(".label-controls").isVisible()).toBe(false);
    await page.close();
  });
  it.each((["light", "dark"] as const).flatMap((theme) => ["products", "dashboard", "sales", "clients", "marketing", "customization"].map((section) => ({ theme, section }))))("keeps $theme $section readable at desktop and phone widths", async ({ theme, section }) => {
    const markup = renderToStaticMarkup(<AdminThemeProvider initialTheme={theme}>{await AdminPage({ searchParams: Promise.resolve({ section }) })}</AdminThemeProvider>);
    const page = await browser.newPage();
    mkdirSync(resolve(".npm-cache/admin-theme-qa"), { recursive: true });
    await page.route("**/*", (route) => route.abort());
    await page.setContent(`<html><head><style>${css}</style></head><body style="margin:0">${markup}</body></html>`);
    await page.locator(".inventory-item, .console-order, .console-customer").first().evaluateAll((elements) => elements.forEach((element) => element.setAttribute("open", "")));
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: resolve(`.npm-cache/admin-theme-qa/${section}-${theme}-${width}.png`), fullPage: true });
      const overflow = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 && box.width > 0; }).map((element) => `${element.tagName}.${element.getAttribute("class")}: ${Math.round(element.getBoundingClientRect().right)} (${getComputedStyle(element).boxSizing})`).slice(-10));
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `Overflow at ${width}: ${overflow.join(", ")}`).toBeLessThanOrEqual(width);
    }
    const ratios = await page.locator(".product-form input:not([type=hidden]):not([type=checkbox]), .inventory-name b, .inventory-stock, .admin-title h1, .console-form input:not([type=hidden]), .console-form select, .console-panel h2, .console-note, .console-kpis strong, .console-status, .coupon-card code, .console-customer b").evaluateAll((elements) => {
      function rgb(value: string) { return (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number); }
      function luminance(color: number[]) { return color.map((value) => { const c = value / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0); }
      return elements.map((element) => {
        let parent: Element | null = element;
        let background = "rgba(0, 0, 0, 0)";
        while (parent && background === "rgba(0, 0, 0, 0)") { background = getComputedStyle(parent).backgroundColor; parent = parent.parentElement; }
        const a = luminance(rgb(getComputedStyle(element).color));
        const b = luminance(rgb(background));
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      });
    });
    expect(ratios.length).toBeGreaterThan(0);
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    mkdirSync(resolve(".npm-cache/admin-theme-qa"), { recursive: true });
    await page.close();
  });
});
