import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
const {prepare,upload}=vi.hoisted(()=>({prepare:vi.fn(),upload:vi.fn()}));
vi.mock("@/app/admin/image-actions",()=>({prepareProductVideoUpload:prepare}));
vi.mock("@/lib/supabase/client",()=>({createClient:()=>({storage:{from:()=>({uploadToSignedUrl:upload})}})}));
import {ProductVideoEditor} from "./product-video-editor";
beforeEach(()=>{vi.clearAllMocks();prepare.mockResolvedValue({path:"catalog/test.mp4",token:"synthetic",url:"https://example.invalid/test.mp4"});upload.mockResolvedValue({error:null});});
afterEach(cleanup);
it("uploads directly with a signed path and includes the resulting video in the form",async()=>{
  const change=vi.fn();const busy=vi.fn();render(<ProductVideoEditor videos={[]} onChange={change} onBusy={busy}/>);
  fireEvent.change(screen.getByLabelText("Subir videos"),{target:{files:[new File(["synthetic video"],"demo.mp4",{type:"video/mp4"})]}});
  await vi.waitFor(()=>expect(change).toHaveBeenCalledWith(["https://example.invalid/test.mp4"]));expect(upload).toHaveBeenCalledWith("catalog/test.mp4","synthetic",expect.any(File),expect.objectContaining({contentType:"video/mp4"}));expect(busy.mock.calls).toEqual([[true],[false]]);
});
it("does not change saved videos when storage rejects a file",async()=>{
  const change=vi.fn();upload.mockResolvedValue({error:{message:"private"}});render(<ProductVideoEditor videos={[]} onChange={change} onBusy={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText("Subir videos"),{target:{files:[new File(["synthetic"],"demo.mp4",{type:"video/mp4"})]}});
  expect(await screen.findByRole("alert")).toBeTruthy();expect(change).not.toHaveBeenCalled();
});
it("rejects unsupported formats and more than three videos before requesting permission",async()=>{
  render(<ProductVideoEditor videos={["a","b","c"]} onChange={vi.fn()} onBusy={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText("Subir videos"),{target:{files:[new File(["video"],"demo.mp4",{type:"video/mp4"})]}});
  expect(await screen.findByRole("alert")).toBeTruthy();expect(prepare).not.toHaveBeenCalled();
});
