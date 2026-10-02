import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ShortsGallery } from "@/components/home/shorts-gallery";

afterEach(cleanup);

describe("ShortsGallery", () => {
  it("opens a short in a player and closes it", () => {
    render(<ShortsGallery shorts={[{ id: "a", title: "Cómo aplicar cera", video: "/videos/cera.mp4" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver video: Cómo aplicar cera" }));
    const dialog = screen.getByRole("dialog", { name: "Cómo aplicar cera" });
    expect(dialog.querySelector("video")?.getAttribute("src")).toBe("/videos/cera.mp4");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar video" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("tells the visitor when a short has no video loaded yet", () => {
    render(<ShortsGallery shorts={[{ id: "b", title: "Lavado" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver video: Lavado" }));
    expect(screen.getByRole("dialog").textContent).toContain("Video próximamente");
  });
});
