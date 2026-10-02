import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const productId = "11111111-1111-4111-8111-111111111111";
const variantId = "22222222-2222-4222-8222-222222222222";
const tableData: Record<string, unknown> = {
  products: [{ id: productId, name: "Sauvage", brand: "Dior", price: 6240, currency: "ARS", stock: 5, image_url: null }],
  product_variants: [{ id: variantId, product_id: productId, label: "1.2 ml", price: 6240, stock: 5, is_active: true }],
  orders: { id: "order-1" },
  order_items: null,
};

// Builder encadenable que resuelve con los datos de la tabla consultada.
function query(table: string) {
  const result = { data: tableData[table], error: null };
  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  for (const method of ["select", "in", "eq", "insert", "update", "single"]) builder[method] = () => builder;
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: query }) }));

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
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "test-token");
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
});
