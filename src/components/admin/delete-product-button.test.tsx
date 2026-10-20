import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const remove = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/actions", () => ({ deleteProduct: remove }));
import { DeleteProductButton } from "./delete-product-button";
afterEach(() => { cleanup(); vi.restoreAllMocks(); remove.mockReset(); });
it("cancels deletion when the administrator declines confirmation", () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<DeleteProductButton id="one" name="Shampoo" />);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar producto" }));
  expect(remove).not.toHaveBeenCalled();
});
it("confirms the product name and displays the server rejection", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  remove.mockRejectedValue(Error("Ocultalo para conservar el historial."));
  render(<DeleteProductButton id="one" name="Shampoo" />);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar producto" }));
  await waitFor(() => expect(remove).toHaveBeenCalledWith("one"));
  expect(confirm.mock.calls[0][0]).toContain("Shampoo");
  expect((await screen.findByRole("alert")).textContent).toContain("historial");
});
