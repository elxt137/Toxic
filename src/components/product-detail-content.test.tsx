import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
import {demoProducts} from "@/lib/products";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()})}));
import {ProductDetailContent} from "./product-detail-content";
afterEach(()=>{cleanup();localStorage.clear();});
it("changes color, photo and price together and adds that color to the cart",()=>{
  const product={...demoProducts[0],brand:"",name:"Tapones",option_name:"Color",image_urls:["https://example.invalid/red.jpg","https://example.invalid/gray.jpg"],variants:[{...demoProducts[0].variants[0],id:"red",label:"Rojo",price:8000,stock:2,image_url:"https://example.invalid/red.jpg"},{...demoProducts[0].variants[0],id:"gray",label:"Gris",price:9000,stock:1,image_url:"https://example.invalid/gray.jpg"},{...demoProducts[0].variants[0],id:"black",label:"Negro",price:8000,stock:0,image_url:null}]};
  render(<ProductDetailContent product={product}/>);expect(screen.getByRole("group",{name:"Color"})).toBeTruthy();
  expect((screen.getByRole("button",{name:"Negro · Sin stock"}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button",{name:"Gris"}));expect(screen.getByAltText("Producto: Tapones").getAttribute("src")).toContain("gray.jpg");
  fireEvent.click(screen.getByRole("button",{name:"Añadir al carrito"}));
  expect(JSON.parse(localStorage.getItem("notta-cart")!)[0]).toMatchObject({variantId:"gray",quantity:1});
});
