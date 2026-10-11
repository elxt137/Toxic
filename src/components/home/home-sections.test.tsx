import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SideRail, SiteFooter } from "./home-sections";
import { homeCategories } from "@/lib/home-content";

afterEach(cleanup);
describe("category shortcuts", () => {
  it("links every category to its own catalog filter", () => {
    render(<SideRail categories={homeCategories} />);
    const nav = screen.getByRole("navigation", { name: "Accesos por categoría" });
    for (const category of homeCategories) {
      expect(within(nav).getByRole("link", { name: category.label }).getAttribute("href"))
        .toBe(category.id === "todos" ? "/productos" : `/productos?categoria=${category.id}`);
    }
  });
  it("links institutional information to readable sections and does not fake Instagram", () => {
    const { container } = render(<SiteFooter />);
    for (const id of ["nosotros", "envios", "cambios", "pagos"]) {
      expect(container.querySelector(`#${id}`)).toBeTruthy();
      expect(container.querySelector(`a[href="/#${id}"]`)).toBeTruthy();
    }
    expect(screen.queryByRole("link", { name: "Instagram" })).toBeNull();
    expect(container.textContent).toContain("RC2");
  });
});
