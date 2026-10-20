import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn(), result: vi.fn(), remove: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw Error(url); } }));
import { deleteProduct } from "./actions";
const id = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.result.mockResolvedValue({ data: { id }, error: null });
  const query = { eq: mocks.eq, select: () => query, maybeSingle: mocks.result };
  mocks.eq.mockReturnValue(query); mocks.remove.mockReturnValue(query);
  mocks.client.mockResolvedValue({ from: () => ({ delete: mocks.remove }) });
});
it("deletes only the selected product and returns to inventory", async () => {
  await expect(deleteProduct(id)).rejects.toThrow("success=deleted");
  expect(mocks.eq).toHaveBeenCalledWith("id", id);
});
it("rejects non-admins and invalid IDs before connecting", async () => {
  mocks.auth.mockRejectedValueOnce(Error("unauthorized"));
  await expect(deleteProduct(id)).rejects.toThrow("unauthorized");
  await expect(deleteProduct("bad")).rejects.toThrow();
  expect(mocks.client).not.toHaveBeenCalled();
});
it("explains that products referenced in orders must be hidden", async () => {
  mocks.result.mockResolvedValue({ data: null, error: { code: "23503" } });
  await expect(deleteProduct(id)).resolves.toEqual({ error: expect.stringContaining("Ocultalo") });
});
it("reports missing products and database errors without claiming success", async () => {
  for (const error of [null, { code: "unknown", message: "secret" }]) {
    mocks.result.mockResolvedValue({ data: null, error });
    await expect(deleteProduct(id)).resolves.toEqual({ error: expect.stringContaining("No se pudo eliminar") });
  }
});
