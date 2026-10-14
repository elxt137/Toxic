import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { benefit, writes, rate } = vi.hoisted(() => ({ benefit: vi.fn(), writes: vi.fn(), rate: vi.fn() }));
vi.mock("@/lib/customer-benefit", () => ({ getCustomerBenefit: benefit }));

const productId = "11111111-1111-4111-8111-111111111111";
const variantId = "22222222-2222-4222-8222-222222222222";
const tableData: Record<string, unknown> = {
  products: [{ id: productId, name: "Sauvage", brand: "Dior", price: 6240, currency: "ARS", stock: 5, image_url: null }],
  product_variants: [{ id: variantId, product_id: productId, label: "1.2 ml", price: 6240, stock: 5, is_active: true }],
  orders: { id: "order-1" },
  order_items: null,
  storefront_settings: { free_shipping_enabled: true, free_shipping_threshold: 100000, free_shipping_destination: "branch", cart_whatsapp_enabled: true },
};

// Builder encadenable que resuelve con los datos de la tabla consultada.
function query(table: string) {
  const result = { data: tableData[table], error: null };
  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  for (const method of ["select", "in", "eq", "update", "single", "maybeSingle"]) builder[method] = () => builder;
  builder.insert = (value: unknown) => { writes(table,value); return builder; };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: query, rpc:rate }) }));

import { POST } from "@/app/api/payments/create-preference/route";

const checkoutRequest = () => new Request("http://127.0.0.1:3000/api/payments/create-preference", {
  method: "POST",
  headers: { host: "127.0.0.1:3000", "x-forwarded-host": "tienda.example.com", "content-type": "application/json" },
  body: JSON.stringify({
    items: [{ productId, variantId, quantity: 1 }],
    customer: { firstName: "Ana", lastName: "Pérez", email: "ana@example.com", phone: "1122334455", street: "Calle", number: "123", city: "CABA", province: "Buenos Aires", postalCode: "1000" },
  }),
});

describe("Mercado Pago preference", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    benefit.mockReset().mockResolvedValue(null); writes.mockClear();
    rate.mockReset().mockResolvedValue({ data:true,error:null });
    tableData.storefront_settings={ free_shipping_enabled:true,free_shipping_threshold:100000,free_shipping_destination:"branch",cart_whatsapp_enabled:true };
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "test-token");
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "pref-1", init_point: "https://mp.example/checkout" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("sends the buyer back to the storefront domain instead of localhost after paying", async () => {
    const response = await POST(checkoutRequest());

    expect(response.status).toBe(200);
    const preference = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(preference.back_urls.success).toBe("https://tienda.example.com/pago/resultado?status=success");
    expect(preference.back_urls.failure).toBe("https://tienda.example.com/pago/resultado?status=failure");
    expect(preference.notification_url).toBe("https://tienda.example.com/api/payments/webhook");
  });
  it("rejects excessive checkout attempts before creating orders or provider requests", async () => {
    rate.mockResolvedValue({ data:false,error:null });
    const response=await POST(checkoutRequest());expect(response.status).toBe(429);expect(response.headers.get("retry-after")).toBe("300");
    expect(writes).not.toHaveBeenCalled();expect(fetchMock).not.toHaveBeenCalled();
  });
  it("keeps checkout disabled until signed webhook verification is configured", async () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "");
    expect((await POST(checkoutRequest())).status).toBe(503); expect(writes).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fails closed when the shared request limiter cannot be checked", async () => {
    rate.mockResolvedValue({ data:null,error:{ message:"database details" } });
    const response=await POST(checkoutRequest());expect(response.status).toBe(503);expect(writes).not.toHaveBeenCalled();expect(fetchMock).not.toHaveBeenCalled();
  });
  it("applies the verified customer's group discount to the payment and persisted item prices", async () => {
    benefit.mockResolvedValue({ email: "ana@example.com", groupId: productId, groupName: "Profesional", percent: 15 });
    expect((await POST(checkoutRequest())).status).toBe(200);
    const preference = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(preference.items[0].unit_price).toBe(5304);
    expect(writes).toHaveBeenCalledWith("orders",expect.objectContaining({ subtotal: 6240, total: 5304, discount_amount: 936, group_discount_percent: 15, free_shipping_qualified: false }));
    expect(writes).toHaveBeenCalledWith("order_items",[expect.objectContaining({ list_unit_price: 6240, unit_price: 5304 })]);
  });
  it("rejects a mismatch between the verified discount identity and the submitted email", async () => {
    benefit.mockResolvedValue({ email: "other@example.invalid", groupId: productId, groupName: "Profesional", percent: 15 });
    expect((await POST(checkoutRequest())).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(writes).not.toHaveBeenCalled();
  });
  it("does not infer discounts from the guest's submitted email", async () => {
    expect((await POST(checkoutRequest())).status).toBe(200);
    const preference = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(preference.items[0].unit_price).toBe(6240);
    expect(writes).toHaveBeenCalledWith("orders",expect.objectContaining({ group_discount_percent: 0 }));
  });
  it("persists the configured free-shipping eligibility and destination", async () => {
    tableData.storefront_settings={ free_shipping_enabled:true,free_shipping_threshold:6240,free_shipping_destination:"home",cart_whatsapp_enabled:true };
    expect((await POST(checkoutRequest())).status).toBe(200);
    expect(writes).toHaveBeenCalledWith("orders",expect.objectContaining({ free_shipping_qualified:true,free_shipping_threshold:6240,shipping_destination:"home" }));
  });
  it("does not grant disabled free shipping even above the minimum", async () => {
    tableData.storefront_settings={ free_shipping_enabled:false,free_shipping_threshold:100,free_shipping_destination:"branch",cart_whatsapp_enabled:true };
    expect((await POST(checkoutRequest())).status).toBe(200);
    expect(writes).toHaveBeenCalledWith("orders",expect.objectContaining({ free_shipping_qualified:false }));
  });
});
