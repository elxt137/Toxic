import { beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, client, update, insert, result } = vi.hoisted(() => ({ authorize: vi.fn(), client: vi.fn(), update: vi.fn(), insert: vi.fn(), result: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: authorize }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveCommerceSettings, saveCustomer, saveCustomerGroup } from "./commerce-actions";
const id = "11111111-1111-4111-8111-111111111111";
const form = (values: Record<string, string>) => { const data = new FormData(); Object.entries(values).forEach(([key,value]) => data.set(key,value)); return data; };
beforeEach(() => {
  vi.clearAllMocks(); authorize.mockResolvedValue({}); result.mockResolvedValue({ data: { id }, error: null });
  const builder: Record<string, unknown> = { then: (resolve: (v: unknown) => void) => result().then(resolve), single: result };
  for (const key of ["eq", "select"]) builder[key] = () => builder;
  update.mockReturnValue(builder); insert.mockReturnValue(builder); client.mockResolvedValue({ from: () => ({ update, insert }) });
});
describe("admin commerce and CRM mutations", () => {
  it("saves cart rules without modifying password-protected WhatsApp", async () => {
    expect((await saveCommerceSettings({}, form({ free_shipping_threshold: "150000", free_shipping_enabled: "on", free_shipping_destination: "home", cart_whatsapp_enabled: "on" }))).success).toBe(true);
    expect(update).toHaveBeenCalledWith({ free_shipping_threshold: 150000, free_shipping_enabled: true, free_shipping_destination: "home", cart_whatsapp_enabled: true });
  });
  it("creates a normalized contact and updates group assignments", async () => {
    expect((await saveCustomer(null, {}, form({ name: "Ana", email: "ANA@example.invalid", phone: "", address: "", group_id: id }))).success).toBe(true);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ email: "ana@example.invalid", group_id: id }));
    expect((await saveCustomer(id, {}, form({ name: "Ana", email: "ana@example.invalid", phone: "123456", address: "Calle 123", group_id: id }))).success).toBe(true);
  });
  it("edits group discounts", async () => {
    expect((await saveCustomerGroup(id, {}, form({ name: "Profesionales", discount_percent: "15" }))).success).toBe(true);
    expect(update).toHaveBeenCalledWith({ name: "Profesionales", discount_percent: 15 });
  });
  it("creates additional pricing groups for customer tags", async () => {
    expect((await saveCustomerGroup(null,{},form({ name:"Talleres",discount_percent:"10" }))).success).toBe(true);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ name:"Talleres",discount_percent:10,slug:expect.stringMatching(/^custom-/) }));
  });
  it("rejects invalid shipping amounts and contact data before any database call", async () => {
    expect((await saveCommerceSettings({}, form({ free_shipping_threshold: "0", free_shipping_destination: "home" }))).success).toBe(false);
    expect((await saveCustomer(null, {}, form({ name: "X", email: "bad" }))).success).toBe(false);
    expect(client).not.toHaveBeenCalled();
  });
  it("protects every administrative mutation", async () => {
    authorize.mockRejectedValue(new Error("unauthorized"));
    for (const action of [() => saveCommerceSettings({}, form({})), () => saveCustomer(null, {}, form({})), () => saveCustomerGroup(id, {}, form({}))]) await expect(action()).rejects.toThrow("unauthorized");
    expect(client).not.toHaveBeenCalled();
  });
  it("returns a safe error instead of claiming a failed update succeeded", async () => {
    result.mockResolvedValue({ data: null, error: { message: "database failure" } });
    expect((await saveCustomerGroup(id, {}, form({ name: "Minorista", discount_percent: "10" }))).success).toBe(false);
  });
});
