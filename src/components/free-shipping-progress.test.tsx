import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FreeShippingProgress } from "./free-shipping-progress";
import { defaultCommerceSettings } from "@/lib/shipping";
afterEach(cleanup);
describe("configured cart shipping", () => {
  it("shows the configured minimum, remaining amount and destination", () => {
    render(<FreeShippingProgress total={100000} settings={{ ...defaultCommerceSettings, freeShippingThreshold: 150000,freeShippingDestination: "home" }} />);
    expect(screen.getByText(/desde.*150\.000/)).toBeTruthy();
    expect(screen.getByText(/Te faltan.*50\.000.*domicilio/)).toBeTruthy();
  });
  it("removes free shipping promises when the benefit is disabled", () => {
    const { container }=render(<FreeShippingProgress total={200000} settings={{ ...defaultCommerceSettings,freeShippingEnabled: false }} />);
    expect(container.textContent).toBe("");
  });
});
