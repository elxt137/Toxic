import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("@/app/admin/whatsapp-actions", () => ({ updateWhatsappNumber: save }));
import { WhatsappSettings } from "./whatsapp-settings";
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
describe("WhatsApp customization form", () => {
  it.each([true, false])("shows the save result and clears the password (success=%s)", async (success) => {
    save.mockResolvedValue({ success, message: success ? "Número de WhatsApp actualizado." : "La contraseña es incorrecta." });
    const { container } = render(<WhatsappSettings currentNumber="5491100000000" />);
    fireEvent.change(screen.getByLabelText("Número de WhatsApp"), { target: { value: "5491112345678" } });
    const password = screen.getByLabelText("Contraseña de personalización") as HTMLInputElement;
    fireEvent.change(password, { target: { value: "test-password" } });
    await act(async () => { fireEvent.submit(container.querySelector("form")!); });
    await waitFor(() => expect(screen.getByRole(success ? "status" : "alert").textContent).toBe(success ? "Número de WhatsApp actualizado." : "La contraseña es incorrecta."));
    expect(password.value).toBe("");
    expect((screen.getByLabelText("Número de WhatsApp") as HTMLInputElement).value).toBe("5491112345678");
    const form = save.mock.calls[0][1] as FormData;
    expect(form.get("whatsapp_number")).toBe("5491112345678");
    expect(form.get("password")).toBe("test-password");
  });
});
