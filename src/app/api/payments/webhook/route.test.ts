// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
const { client, rpc, lookup } = vi.hoisted(() => ({ client:vi.fn(),rpc:vi.fn(),lookup:vi.fn() }));
vi.mock("@/lib/supabase/admin",()=>({ createAdminClient:client }));
import { POST } from "./route";
const id="11111111-1111-4111-8111-111111111111";
const fetchMock=vi.fn();
function request(valid=true) {
  const digest=createHmac("sha256","test-secret").update("id:123;request-id:request-test;ts:1704908010;").digest("hex");
  return new Request("https://www.rc2.com.ar/api/payments/webhook?data.id=123&type=payment",{ method:"POST",headers:{ "x-request-id":"request-test","x-signature":`ts=1704908010,v1=${valid?digest:"a".repeat(64)}` },body:JSON.stringify({ type:"payment",data:{ id:"123" } }) });
}
beforeEach(()=>{
  vi.clearAllMocks(); vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN","test-token");vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET","test-secret");vi.stubGlobal("fetch",fetchMock);
  rpc.mockResolvedValue({ data:true,error:null });lookup.mockResolvedValue({ data:{ id,total:100,currency:"ARS",mercadopago_preference_id:"pref-test" },error:null });
  const query:Record<string,unknown>={ maybeSingle:lookup };for(const key of ["select","eq"])query[key]=()=>query;
  client.mockReturnValue({ rpc,from:()=>query });
  fetchMock.mockImplementation(async (url:string)=>new Response(JSON.stringify(url.includes("/v1/payments/")?{ id:123,external_reference:id,status:"approved",transaction_amount:100,currency_id:"ARS",order:{ id:456 } }:{ preference_id:"pref-test",external_reference:id,payments:[{ id:123 }] })));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it("rejects an unsigned or tampered notification before fetching or mutating",async()=>{
  expect((await POST(request(false))).status).toBe(401);expect(fetchMock).not.toHaveBeenCalled();expect(client).not.toHaveBeenCalled();
});
it("fails closed when the webhook secret is absent",async()=>{
  vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET","");expect((await POST(request())).status).toBe(503);expect(fetchMock).not.toHaveBeenCalled();
});
it("checks payment and merchant order then applies a verified atomic confirmation",async()=>{
  expect((await POST(request())).status).toBe(200);
  expect(rpc).toHaveBeenCalledWith("record_verified_payment",expect.objectContaining({ p_order_id:id,p_payment_id:"123",p_amount:100,p_currency:"ARS",p_preference_id:"pref-test",p_status:"approved",p_payment_type:null,p_paid_at:null }));
});
it("records only payment metadata fetched from the verified provider",async()=>{
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id:123,external_reference:id,status:"approved",transaction_amount:100,currency_id:"ARS",order:{id:456},payment_type_id:"credit_card",date_approved:"2026-10-20T12:30:00.000Z" })));
  expect((await POST(request())).status).toBe(200);
  expect(rpc).toHaveBeenCalledWith("record_verified_payment",expect.objectContaining({p_payment_type:"credit_card",p_paid_at:"2026-10-20T12:30:00.000Z"}));
});
it("rejects mismatched amounts and never changes the order",async()=>{
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id:123,external_reference:id,status:"approved",transaction_amount:1,currency_id:"ARS",order:{ id:456 } })));
  expect((await POST(request())).status).toBe(409);expect(rpc).not.toHaveBeenCalled();
});
it("returns retryable failures instead of acknowledging an unconfirmed order",async()=>{
  rpc.mockResolvedValue({ data:false,error:null });expect((await POST(request())).status).toBe(409);
  fetchMock.mockRejectedValueOnce(new Error("network"));expect((await POST(request())).status).toBe(502);
});
