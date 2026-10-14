import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/app/admin/image-actions", () => ({ uploadProductImage: vi.fn() }));
import { ProductForm } from "./product-form";
afterEach(cleanup);
it("keeps unsaved input after a rejected save and lets the administrator retry", async () => {
  const action = vi.fn().mockRejectedValueOnce(new Error("database failure")).mockResolvedValueOnce(undefined);
  const { container } = render(<ProductForm action={action} submitLabel="Crear producto" />);
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Shampoo nuevo" } });
  fireEvent.change(screen.getByLabelText("Marca"), { target: { value: "RC2" } });
  fireEvent.submit(container.querySelector("form")!);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Shampoo nuevo");
  fireEvent.submit(container.querySelector("form")!);
  await vi.waitFor(() => expect(action).toHaveBeenCalledTimes(2));
});
