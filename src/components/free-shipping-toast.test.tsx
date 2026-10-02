import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FreeShippingToast } from "@/components/free-shipping-toast";

describe("FreeShippingToast", () => {
  it("shows the amount still needed to unlock free shipping", () => {
    render(<FreeShippingToast total={37_900} onDismiss={vi.fn()} />);

    expect(screen.getByText(/Te faltan.*62\.100.*envío gratis/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cerrar aviso de envío" })).toBeTruthy();
  });
});
