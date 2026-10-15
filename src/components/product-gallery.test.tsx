import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, it, expect } from "vitest";
import { ProductGallery } from "./product-gallery";
afterEach(cleanup);
it("shows the selected product photo with keyboard-accessible thumbnails", () => {
  render(<ProductGallery name="Shampoo" images={["https://example.invalid/a.jpg", "https://example.invalid/b.jpg"]} />);
  expect(screen.getByAltText("Producto: Shampoo").getAttribute("src")).toContain("a.jpg");
  fireEvent.click(screen.getByRole("button", { name: "Ver foto 2" }));
  expect(screen.getByAltText("Producto: Shampoo").getAttribute("src")).toContain("b.jpg");
});
it("lets the customer play a product video without autoplay",()=>{
  const {container}=render(<ProductGallery name="Tapones" images={["https://example.invalid/a.jpg"]} videos={["https://example.invalid/demo.mp4"]}/>);
  fireEvent.click(screen.getByRole("button",{name:"Ver video 1"}));
  const video=container.querySelector("video")!;expect(video.getAttribute("src")).toContain("demo.mp4");expect(video.controls).toBe(true);expect(video.autoplay).toBe(false);
});
