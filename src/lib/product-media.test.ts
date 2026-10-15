import { expect,it } from "vitest";
import { validateVideoHeader,reorderMedia } from "./product-media";
it("moves images both ways and rejects invalid positions without losing files",()=>{
  expect(reorderMedia(["a","b","c"],2,1)).toEqual(["a","c","b"]);
  expect(reorderMedia(["a","b","c"],0,2)).toEqual(["b","c","a"]);
  expect(reorderMedia(["a"],0,-1)).toEqual(["a"]);
});
it("validates MP4 and WebM signatures with a 25 MB limit",()=>{
  const mp4=new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0]);
  expect(validateVideoHeader(mp4,"video/mp4",1000)).toEqual({extension:"mp4",contentType:"video/mp4"});
  expect(validateVideoHeader(new Uint8Array([26,69,223,163,0,119,101,98,109]),"video/webm",1000).extension).toBe("webm");
  for(const [bytes,type,size] of [[mp4,"video/mp4",0],[mp4,"video/mp4",26*1024*1024],[new Uint8Array([1,2]),"video/mp4",1000],[mp4,"video/webm",1000]] as const)expect(()=>validateVideoHeader(bytes,type,size)).toThrow();
});
