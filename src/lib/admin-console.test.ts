import { describe, expect, it } from "vitest";
import { couponSchema, discountForCoupon, generateCode, privateProductSchema, orderWorkflowSchema, customerHistory, salesMetrics } from "./admin-console";

describe("premium admin business rules", () => {
  it("calculates collected sales by Argentina day and month, excluding unpaid orders", () => {
    const orders = [{ total: 100, status: "approved", created_at: "2026-11-01T02:00:00Z" }, { total: 200, status: "approved", created_at: "2026-11-01T04:00:00Z" }, { total: 500, status: "pending", created_at: "2026-11-01T05:00:00Z" }];
    expect(salesMetrics(orders, new Date("2026-11-01T06:00:00Z"))).toEqual({ dayTotal: 200, monthTotal: 200, dayCount: 1, monthCount: 1 });
    expect(salesMetrics([], new Date())).toEqual({ dayTotal: 0, monthTotal: 0, dayCount: 0, monthCount: 0 });
  });
  it("groups buyer history by normalized email and totals collected purchases only", () => {
    const rows = [{ id: "a", payer_email: "ANA@example.com", payer_name: "Ana", buyer_phone: "123", total: 100, status: "approved", created_at: "2026-10-01" }, { id: "b", payer_email: "ana@example.com", payer_name: "Ana", buyer_phone: "123", total: 500, status: "pending", created_at: "2026-10-02" }, { id: "c", payer_email: null, payer_name: null, buyer_phone: null, total: 1, status: "approved", created_at: "2026-10-03" }];
    expect(customerHistory(rows)[0]).toMatchObject({ email: "ana@example.com", total: 100, purchases: 1 });
    expect(customerHistory(rows)[0].orders).toHaveLength(2);
    expect(customerHistory([])).toEqual([]);
  });
  it("keeps private cost and assigned barcode inputs valid", () => {
    expect(privateProductSchema.parse({ cost_price: "12.53", barcode: "RC2-123456" })).toEqual({ cost_price: 12.53, barcode: "RC2-123456" });
    expect(privateProductSchema.parse({ cost_price: "", barcode: "" })).toEqual({ cost_price: null, barcode: null });
    expect(privateProductSchema.safeParse({ cost_price: -1, barcode: "<script>" }).success).toBe(false);
  });
  it("validates separate shipment and transaction workflows", () => {
    expect(orderWorkflowSchema.safeParse({ shipping_status: "in_transit", transaction_status: "processed", tracking_number: "ABC123" }).success).toBe(true);
    expect(orderWorkflowSchema.safeParse({ shipping_status: "unknown", transaction_status: "approved" }).success).toBe(false);
  });
  it("supports unlimited or limited percentage and fixed coupons", () => {
    expect(couponSchema.parse({ kind: "percent", value: 10, usage_limit: "", quantity: 1, expires_at: "" }).usage_limit).toBeNull();
    expect(couponSchema.parse({ kind: "fixed", value: 100, usage_limit: 2, quantity: 3, expires_at: "" }).usage_limit).toBe(2);
    for (const input of [{ kind: "percent", value: 100 }, { kind: "fixed", value: -1 }, { kind: "percent", value: 5, usage_limit: 0 }]) expect(couponSchema.safeParse({ quantity: 1, expires_at: "", ...input }).success).toBe(false);
  });
  it("calculates discounts in cents and rejects invalid, inactive, expired and exhausted coupons", () => {
    const coupon = { kind: "percent", value: 10, active: true, usage_limit: null, used_count: 0, expires_at: null };
    expect(discountForCoupon(coupon, 99.99)).toBe(10);
    expect(discountForCoupon({ ...coupon, kind: "fixed", value: 20 }, 100)).toBe(20);
    for (const change of [{ active: false }, { usage_limit: 1, used_count: 1 }, { expires_at: "2020-01-01" }, { kind: "fixed", value: 200 }]) expect(() => discountForCoupon({ ...coupon, ...change }, 100)).toThrow();
  });
  it("generates compact uppercase codes suitable for printed labels", () => {
    expect(generateCode("12345678-1234-1234-1234-123456789abc")).toBe("RC2-1234567812");
    expect(generateCode()).toMatch(/^RC2-[A-F0-9]{10}$/);
  });
});
