import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminThemeProvider, AdminThemeToggle } from "./admin-theme";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function mount(theme: "light" | "dark" = "light") {
  return render(<><div data-testid="storefront">Tienda</div><AdminThemeProvider initialTheme={theme}><AdminThemeToggle /><input aria-label="Campo del panel" /></AdminThemeProvider></>);
}
describe("admin-only theme switch", () => {
  it("slides from light to dark and back without changing the storefront or document", () => {
    const { container } = mount();
    const toggle = screen.getByRole("switch", { name: "Modo oscuro" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(container.querySelector(".admin-layout")?.getAttribute("data-admin-theme")).toBe("dark");
    expect(screen.getByTestId("storefront").hasAttribute("data-admin-theme")).toBe(false);
    expect(document.documentElement.hasAttribute("data-admin-theme")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });
  it("starts with the preference restored by the server", () => {
    mount("dark");
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });
  it("persists both choices in a cookie scoped to the admin routes", () => {
    const cookie = vi.spyOn(document, "cookie", "set");
    mount();
    fireEvent.click(screen.getByRole("switch"));
    expect(cookie).toHaveBeenLastCalledWith("rc2_admin_theme=dark; Path=/admin; Max-Age=31536000; SameSite=Lax");
    fireEvent.click(screen.getByRole("switch"));
    expect(cookie).toHaveBeenLastCalledWith("rc2_admin_theme=light; Path=/admin; Max-Age=31536000; SameSite=Lax");
  });
  it("still switches when the browser blocks preference storage", () => {
    vi.spyOn(document, "cookie", "set").mockImplementation(() => { throw new Error("blocked"); });
    mount();
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });
});
