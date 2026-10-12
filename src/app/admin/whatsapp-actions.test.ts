import { beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, client, rpc, revalidate } = vi.hoisted(() => ({ authorize: vi.fn(), client: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: authorize }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
import { updateWhatsappNumber } from "./whatsapp-actions";
function form(number = "+54 9 (11) 1234-5678", password = "test-password") {
  const data = new FormData(); data.set("whatsapp_number", number); data.set("password", password); return data;
}
beforeEach(() => {
  vi.clearAllMocks(); authorize.mockResolvedValue({ email: "admin@example.invalid" });
  client.mockResolvedValue({ rpc }); rpc.mockResolvedValue({ data: true, error: null });
});
describe("protected WhatsApp updates", () => {
  it("saves a normalized international number through the password-protected RPC", async () => {
    expect(await updateWhatsappNumber({}, form())).toEqual({ success: true, message: "Número de WhatsApp actualizado." });
    expect(rpc).toHaveBeenCalledWith("update_store_whatsapp", { p_number: "5491112345678", p_password: "test-password" });
    expect(revalidate).toHaveBeenCalledWith("/", "layout");
    expect(revalidate).toHaveBeenCalledWith("/admin");
  });
  it("rejects users outside the admin allowlist before accessing the database", async () => {
    authorize.mockRejectedValueOnce(new Error("unauthorized"));
    await expect(updateWhatsappNumber({}, form())).rejects.toThrow("unauthorized");
    expect(client).not.toHaveBeenCalled();
  });
  it.each(["", "123", "phone5491112345678", "0".repeat(16)])("rejects invalid numbers without writing: %s", async (number) => {
    expect((await updateWhatsappNumber({}, form(number))).success).toBe(false);
    expect(client).not.toHaveBeenCalled();
  });
  it("requires a password before accessing the database", async () => {
    expect((await updateWhatsappNumber({}, form("5491112345678", ""))).success).toBe(false);
    expect(client).not.toHaveBeenCalled();
  });
  it("reports a wrong password without refreshing or claiming success", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await updateWhatsappNumber({}, form())).toEqual({ success: false, message: "La contraseña es incorrecta." });
    expect(revalidate).not.toHaveBeenCalled();
  });
  it("does not expose internal errors or the password when the database fails", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "internal database details" } });
    expect(await updateWhatsappNumber({}, form())).toEqual({ success: false, message: "No se pudo actualizar el WhatsApp. Probá de nuevo." });
    expect(revalidate).not.toHaveBeenCalled();
  });
  it("shows a retry message when the database connection throws", async () => {
    rpc.mockRejectedValueOnce(new Error("connection unavailable"));
    expect(await updateWhatsappNumber({}, form())).toEqual({ success: false, message: "No se pudo actualizar el WhatsApp. Probá de nuevo." });
    expect(revalidate).not.toHaveBeenCalled();
  });
});
