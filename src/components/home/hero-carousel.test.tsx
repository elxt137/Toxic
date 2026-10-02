import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroCarousel } from "@/components/home/hero-carousel";
import type { HeroSlide } from "@/lib/home-content";

const slides: HeroSlide[] = [
  { id: "a", kicker: "Uno", title: "Primer", highlight: "slide", subtitle: "Texto uno", cta: { label: "Ir uno", href: "/#a" }, theme: "amber" },
  { id: "b", kicker: "Dos", title: "Segundo", highlight: "slide", subtitle: "Texto dos", cta: { label: "Ir dos", href: "/#b" }, video: "/videos/b.mp4", poster: "/videos/b.jpg", theme: "steel" },
];

const activeSlide = () => screen.getAllByRole("group").find((slide) => slide.getAttribute("aria-hidden") === "false");

describe("HeroCarousel", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("shows the first slide as the page heading and marks only one slide as visible", () => {
    render(<HeroCarousel slides={slides} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Primer slide");
    expect(activeSlide()?.getAttribute("aria-label")).toBe("1 de 2");
  });

  it("moves between slides with the arrows and the dots", () => {
    render(<HeroCarousel slides={slides} />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(activeSlide()?.getAttribute("aria-label")).toBe("2 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(activeSlide()?.getAttribute("aria-label")).toBe("1 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(activeSlide()?.getAttribute("aria-label")).toBe("2 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Ir a la diapositiva 1" }));
    expect(activeSlide()?.getAttribute("aria-label")).toBe("1 de 2");
  });

  it("advances automatically", () => {
    vi.useFakeTimers();
    render(<HeroCarousel slides={slides} interval={5000} />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(activeSlide()?.getAttribute("aria-label")).toBe("2 de 2");
  });

  it("plays slide videos muted, looped and inline with their poster", () => {
    const { container } = render(<HeroCarousel slides={slides} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("src")).toBe("/videos/b.mp4");
    expect(video.getAttribute("poster")).toBe("/videos/b.jpg");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
  });
});
