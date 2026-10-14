import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@/app/admin/image-actions", () => ({ uploadProductImage: upload }));
import { ProductImageEditor } from "./product-image-editor";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("product photo editor", () => {
  it("uploads a local file and reports its public URL", async () => {
    upload.mockResolvedValue({ url: "https://example.invalid/photo.jpg" }); const change = vi.fn(); const busy = vi.fn();
    render(<ProductImageEditor images={[]} onChange={change} onBusy={busy} />);
    fireEvent.change(screen.getByLabelText("Subir fotos"), { target: { files: [new File(["photo"], "a.jpg", { type: "image/jpeg" })] } });
    await screen.findByText("Los cambios de la galería se aplican al guardar el producto.");
    await vi.waitFor(() => expect(change).toHaveBeenCalledWith(["https://example.invalid/photo.jpg"]));
    expect(busy.mock.calls).toEqual([[true], [false]]);
  });
  it("lets the administrator change cover or remove a photo", () => {
    const change = vi.fn(); render(<ProductImageEditor images={["https://example.invalid/a.jpg", "https://example.invalid/b.jpg"]} onChange={change} onBusy={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Usar de portada" })); expect(change).toHaveBeenLastCalledWith(["https://example.invalid/b.jpg", "https://example.invalid/a.jpg"]);
    fireEvent.click(screen.getByRole("button", { name: "Quitar foto 1" })); expect(change).toHaveBeenLastCalledWith(["https://example.invalid/b.jpg"]);
  });
  it("retains the existing gallery on upload failure", async () => {
    upload.mockResolvedValue({ error: "No se pudo subir" }); const change = vi.fn();
    render(<ProductImageEditor images={["https://example.invalid/a.jpg"]} onChange={change} onBusy={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Subir fotos"), { target: { files: [new File(["photo"], "a.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByRole("alert")).toBeTruthy(); expect(change).not.toHaveBeenCalled();
  });
});
