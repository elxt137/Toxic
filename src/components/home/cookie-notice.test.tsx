import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CookieNotice } from "@/components/home/cookie-notice";

afterEach(() => { cleanup(); window.localStorage.clear(); });

describe("CookieNotice", () => {
  it("is shown until the visitor accepts it and stays hidden afterwards", async () => {
    render(<CookieNotice />);
    fireEvent.click(await screen.findByRole("button", { name: "Acepto" }));
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
    cleanup();
    render(<CookieNotice />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
  });

  it("appears for new visitors", async () => {
    render(<CookieNotice />);
    expect(await screen.findByRole("region", { name: "Aviso de cookies" })).toBeTruthy();
  });
});
