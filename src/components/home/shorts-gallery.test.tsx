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

  it("does not offer playback for videos that have not been uploaded", () => {
    render(<ShortsGallery shorts={[{ id: "b", title: "Lavado" }]} />);
    expect(screen.queryByRole("button", { name: "Ver video: Lavado" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Videos RC2" })).toBeNull();
  });
});
