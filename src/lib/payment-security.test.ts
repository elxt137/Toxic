// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPaymentSignature, paymentMatchesOrder, checkoutRateKey } from "./payment-security";
const secret = "synthetic-test-secret";
function headers(id = "123", ts = "1704908010") {
  const digest = createHmac("sha256",secret).update(`id:${id};request-id:test-request;ts:${ts};`).digest("hex");
  return new Headers({ "x-request-id":"test-request", "x-signature":`ts=${ts},v1=${digest}` });
}
describe("Mercado Pago authentication", () => {
  it("accepts the provider's HMAC manifest including valid delayed retries", () => {
    expect(verifyPaymentSignature(headers(), "123", secret)).toBe(true);
  });
  it("rejects tampered IDs, secrets, missing fields and ambiguous signatures", () => {
    expect(verifyPaymentSignature(headers(),"999",secret)).toBe(false); expect(verifyPaymentSignature(headers(),"123","wrong")).toBe(false);
    expect(verifyPaymentSignature(new Headers(),"123",secret)).toBe(false);
    for (const signature of ["ts=1,v1=bad", "ts=1,ts=2,v1="+"a".repeat(64), "ts=1,v1="+"a".repeat(64)+",v1="+"b".repeat(64)]) {
      expect(verifyPaymentSignature(new Headers({ "x-request-id":"test", "x-signature":signature }),"123",secret)).toBe(false);
    }
  });
});
describe("verified order payments", () => {
  const order = { id:"11111111-1111-4111-8111-111111111111", total:100.25, currency:"ARS", mercadopago_preference_id:"pref-test" };
  const payment = { id:123,external_reference:order.id,transaction_amount:100.25,currency_id:"ARS" };
  const merchant = { preference_id:"pref-test", external_reference:order.id, payments:[{ id:123 }] };
  it("requires the exact order, amount, currency and merchant preference", () => {
    expect(paymentMatchesOrder(payment,merchant,order,"123")).toBe(true);
    for (const modified of [{ ...payment,id:999 },{ ...payment,transaction_amount:1 },{ ...payment,currency_id:"USD" },{ ...payment,external_reference:"other" }]) expect(paymentMatchesOrder(modified,merchant,order,"123")).toBe(false);
    expect(paymentMatchesOrder(payment,{ ...merchant,preference_id:"other" },order,"123")).toBe(false);
    expect(paymentMatchesOrder(payment,{ ...merchant,payments:[] },order,"123")).toBe(false);
    expect(paymentMatchesOrder(payment,merchant,{ ...order,mercadopago_preference_id:null },"123")).toBe(false);
  });
  it("hashes client identifiers instead of persisting IP addresses", () => {
    const key = checkoutRateKey(new Headers({ "x-real-ip":"192.0.2.1" }));
    expect(key).toMatch(/^[0-9a-f]{64}$/); expect(key).not.toContain("192.0.2.1");
    expect(checkoutRateKey(new Headers())).toMatch(/^[0-9a-f]{64}$/);
  });
  it("rejects non-finite, fractional-cent and nonpositive payment amounts", () => {
    for (const amount of [NaN, Infinity, 0, -100.25, 100.251]) expect(paymentMatchesOrder({ ...payment,transaction_amount:amount },merchant,order,"123")).toBe(false);
  });
});
