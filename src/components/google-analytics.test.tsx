import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { pathname } = vi.hoisted(() => ({ pathname: vi.fn(() => "/productos") }));
vi.mock("next/navigation", () => ({ usePathname: pathname }));
vi.mock("next/script", () => ({ default: ({ src, onReady }: { src: string; onReady: () => void }) => <button onClick={onReady} data-src={src}>Load analytics</button> }));
import { GoogleAnalytics } from "./google-analytics";
afterEach(() => { cleanup(); localStorage.clear(); pathname.mockReturnValue("/productos"); vi.unstubAllGlobals(); });
describe("storefront analytics", () => {
  it("does not load Google before consent or when disabled", () => {
    render(<GoogleAnalytics settings={{ enabled: true, measurementId: "G-ABC1234567" }} />);
    expect(screen.queryByRole("button")).toBeNull();
    cleanup(); localStorage.setItem("rc2-analytics-consent", "accepted");
    render(<GoogleAnalytics settings={{ enabled: false, measurementId: "G-ABC1234567" }} />); expect(screen.queryByRole("button")).toBeNull();
  });
  it("loads after explicit consent and excludes private routes", async () => {
    const { rerender } = render(<GoogleAnalytics settings={{ enabled: true, measurementId: "G-ABC1234567" }} />);
    await act(async () => { localStorage.setItem("rc2-analytics-consent", "accepted"); window.dispatchEvent(new Event("rc2-analytics-consent")); });
    expect(await screen.findByRole("button")).toBeTruthy();
    pathname.mockReturnValue("/admin"); rerender(<GoogleAnalytics settings={{ enabled: true, measurementId: "G-ABC1234567" }} />); expect(screen.queryByRole("button")).toBeNull();
  });
});
