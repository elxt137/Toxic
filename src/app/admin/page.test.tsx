import { cleanup, render as renderComponent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "./page";
import { demoProducts } from "@/lib/products";
import { AdminThemeProvider } from "@/components/admin/admin-theme";

const render = (node: React.ReactNode) => renderComponent(<AdminThemeProvider initialTheme="light">{node}</AdminThemeProvider>);

const { authorize, client } = vi.hoisted(() => ({ authorize: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: authorize }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("./actions", () => ({ createProduct: vi.fn(), updateProduct: vi.fn(), updateAnnouncement: vi.fn() }));
vi.mock("@/components/product-form", () => ({ ProductForm: () => <div>Formulario de producto</div> }));

beforeEach(() => {
  authorize.mockReset().mockResolvedValue({ email: "admin@example.invalid" });
  client.mockReset().mockResolvedValue({ from: (table: string) => {
    const data = table === "products" ? demoProducts : table === "product_variants" ? demoProducts.flatMap((p) => p.variants) : table === "storefront_settings" ? null : [];
    const result = { data, error: null };
    const builder: Record<string, unknown> = { then: (resolve: (value: unknown) => void) => resolve(result) };
    for (const key of ["select", "order", "eq", "maybeSingle", "limit", "range"]) builder[key] = () => builder;
    return builder;
  } });
});
afterEach(cleanup);

describe("authorized inventory route", () => {
  it("offers a password-protected WhatsApp form in customization", async () => {
    render(await AdminPage({ searchParams: Promise.resolve({ section: "customization" }) }));
    expect(screen.getByRole("heading", { name: "WhatsApp de la tienda" })).toBeTruthy();
    expect(screen.getByLabelText("Número de WhatsApp").getAttribute("type")).toBe("tel");
    expect(screen.getByLabelText("Contraseña de personalización").getAttribute("type")).toBe("password");
    expect(screen.getByLabelText("Contraseña de personalización").hasAttribute("required")).toBe(true);
    expect(screen.getByRole("button", { name: "Guardar WhatsApp" })).toBeTruthy();
  });
  it("passes the requested query to inventory while retaining the products section", async () => {
    render(await AdminPage({ searchParams: Promise.resolve({ section: "products", q: "cera" }) }));
    expect(screen.getByRole("heading", { name: "Productos e inventario" })).toBeTruthy();
    expect(screen.getByText("Cera protectora")).toBeTruthy();
    expect(screen.queryByText("Shampoo para autos")).toBeNull();
    expect(authorize).toHaveBeenCalledOnce();
  });
  it("rejects unauthorized users before loading inventory", async () => {
    authorize.mockRejectedValueOnce(new Error("unauthorized"));
    await expect(AdminPage({ searchParams: Promise.resolve({ section: "products", q: "cera" }) })).rejects.toThrow("unauthorized");
    expect(client).not.toHaveBeenCalled();
  });
  it("ignores repeated query parameters rather than crashing", async () => {
    render(await AdminPage({ searchParams: Promise.resolve({ section: "products", q: ["cera", "led"] }) }));
    expect(screen.getByText("Shampoo para autos")).toBeTruthy();
  });
});
