import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductCarousel } from "./product-carousel";
import { demoProducts } from "@/lib/products";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("product carousel controls", () => {
  it("disables arrows when the complete shelf fits in its track", () => {
    render(<ProductCarousel title="Productos" products={demoProducts} />);
    expect((screen.getByRole("button", { name: "Anteriores en Productos" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Siguientes en Productos" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("scrolls overflow and disables the forward button at the end", async () => {
    const { container } = render(<ProductCarousel title="Productos" products={demoProducts} />);
    const track = container.querySelector('[data-product-track]') as HTMLElement;
    expect(track).toBeTruthy();
    Object.defineProperties(track, { clientWidth: { value: 200 }, scrollWidth: { value: 600 }, scrollLeft: { value: 0, writable: true } });
    track.scrollBy = vi.fn();
    fireEvent.scroll(track);
    const next = screen.getByRole("button", { name: "Siguientes en Productos" }) as HTMLButtonElement;
    await waitFor(() => expect(next.disabled).toBe(false));
    fireEvent.click(next);
    expect(track.scrollBy).toHaveBeenCalledWith({ left: 160, behavior: "smooth" });
    track.scrollLeft = 400;
    fireEvent.scroll(track);
    expect(next.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Anteriores en Productos" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
