import { describe, expect, it, vi } from "vitest";
import { readCustomers } from "./admin-crm";
import type { createClient } from "@/lib/supabase/server";
describe("complete CRM contact retrieval", () => {
  it("loads all pages rather than truncating the customer base", async () => {
    const range=vi.fn().mockResolvedValueOnce({ data:Array.from({ length:500 },(_,index) => ({ id:String(index) })),error:null }).mockResolvedValueOnce({ data:[{ id:"last" }],error:null });
    const builder={ select:() => builder,order:() => builder,range };
    const client={ from:() => builder } as unknown as Awaited<ReturnType<typeof createClient>>;
    expect(await readCustomers(client)).toHaveLength(501);
    expect(range).toHaveBeenNthCalledWith(2,500,999);
  });
  it("reports a failed read instead of showing an empty customer base", async () => {
    const builder={ select:() => builder,order:() => builder,range:async () => ({ data:null,error:{} }) };
    await expect(readCustomers({ from:() => builder } as unknown as Awaited<ReturnType<typeof createClient>>)).rejects.toThrow("No se pudo cargar la base");
  });
});
