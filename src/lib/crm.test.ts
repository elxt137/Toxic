import { describe, expect, it } from "vitest";
import { customerSchema, groupSchema, discountedPrice, purchaseCycle } from "./crm";
describe("CRM business rules", () => {
  it("normalizes contact data and validates optional addresses", () => {
    expect(customerSchema.parse({ name: " Ana ", email: "ANA@example.invalid", phone: "", address: "", group_id: "11111111-1111-4111-8111-111111111111" })).toMatchObject({ name: "Ana", email: "ana@example.invalid" });
    expect(customerSchema.safeParse({ name: "A", email: "invalid", group_id: "invalid" }).success).toBe(false);
  });
  it.each([-1, 100, "invalid"])("rejects unsafe group discounts: %s", (discount_percent) => {
    expect(groupSchema.safeParse({ name: "Minorista", discount_percent }).success).toBe(false);
  });
  it("rounds discounts per unit in cents and keeps a positive payable price", () => {
    expect(discountedPrice(99.99, 15)).toBe(84.99);
    expect(discountedPrice(100, 0)).toBe(100);
    expect(discountedPrice(.01, 99)).toBe(.01);
    expect(() => discountedPrice(100, 100)).toThrow();
  });
  it("estimates replenishment from distinct approved purchase days only", () => {
    expect(purchaseCycle([{ status: "approved", created_at: "2026-01-01T12:00:00Z" }, { status: "approved", created_at: "2026-01-31T12:00:00Z" }, { status: "pending", created_at: "2026-02-01" }])).toBe(30);
    expect(purchaseCycle([])).toBeNull();
    expect(purchaseCycle([{ status: "approved", created_at: "2026-01-01T12:00:00Z" }])).toBeNull();
  });
});
