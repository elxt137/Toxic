import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { cookie } = vi.hoisted(() => ({ cookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookie }) }));
import AdminLayout from "./layout";
beforeEach(() => cookie.mockReset());
describe("server-restored admin appearance", () => {
  it.each([undefined, "invalid", "light", "dark"])("renders the saved theme before hydration: %s", async (value) => {
    cookie.mockReturnValue(value ? { value } : undefined);
    const html = renderToStaticMarkup(await AdminLayout({ children: <p>Panel</p> }));
    expect(html).toContain(`data-admin-theme="${value === "dark" ? "dark" : "light"}"`);
    expect(cookie).toHaveBeenCalledWith("rc2_admin_theme");
  });
});
