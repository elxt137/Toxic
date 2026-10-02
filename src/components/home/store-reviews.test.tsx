import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StoreReviews } from "@/components/home/store-reviews";

afterEach(cleanup);

describe("StoreReviews", () => {
  it("is not rendered while there are no real reviews loaded", () => {
    const { container } = render(<StoreReviews reviews={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("lists customer reviews with their rating", () => {
    render(<StoreReviews reviews={[{ id: "1", author: "Ana", city: "Rosario", date: "2026-09-01", rating: 4, text: "Llegó rápido" }]} />);
    expect(screen.getByRole("heading", { name: "Opiniones de clientes" })).toBeTruthy();
    expect(screen.getByLabelText("4 de 5 estrellas")).toBeTruthy();
    expect(screen.getByText("Llegó rápido")).toBeTruthy();
  });
});
