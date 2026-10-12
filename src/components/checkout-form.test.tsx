import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CheckoutForm } from "./checkout-form";
import { demoProducts } from "@/lib/products";
import { defaultCommerceSettings } from "@/lib/shipping";
beforeEach(() => { const product=demoProducts[0];window.localStorage.setItem("notta-cart",JSON.stringify([{ product,variantId:product.variants[0].id,quantity:1 }])); });
afterEach(() => { cleanup();window.localStorage.clear(); });
describe("verified checkout summary", () => {
  it("ignores malformed cached prices instead of breaking checkout",async () => {
    const product={ ...demoProducts[0],variants:[{ ...demoProducts[0].variants[0],price:"invalid" }] };
    window.localStorage.setItem("notta-cart",JSON.stringify([{ product,variantId:product.variants[0].id,quantity:1 }]));
    render(<CheckoutForm />);
    await waitFor(() => expect(screen.getByRole("heading",{ name:"Tu pedido está vacío" })).toBeTruthy());
  });
  it("shows the group discount and locks the verified email", async () => {
    render(<CheckoutForm benefit={{ email:"buyer@example.invalid",groupId:"group",groupName:"Profesional",percent:15 }} settings={{ ...defaultCommerceSettings,freeShippingThreshold:150000 }} />);
    await waitFor(() => expect(screen.getByText(/Beneficio Profesional: 15%/)).toBeTruthy());
    expect((screen.getByLabelText("Correo electrónico") as HTMLInputElement).readOnly).toBe(true);
    expect(screen.getByText(/desde.*150\.000/)).toBeTruthy();
  });
  it("blocks payment if a verified benefit cannot be checked", async () => {
    render(<CheckoutForm benefitUnavailable />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No se pudo verificar tu beneficio"));
    expect((screen.getByRole("button",{ name:"Ir a Mercado Pago" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
