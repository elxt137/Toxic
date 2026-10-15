export const allowedImageTypes=["image/jpeg","image/png","image/webp","image/avif","image/gif"];
export const allowedVideoTypes=["video/mp4","video/webm"];
export const maxProductVideoBytes=25*1024*1024;
export function reorderMedia<T>(items:T[],from:number,to:number):T[]{
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=items.length||to>=items.length)return [...items];
  const next=[...items];const [item]=next.splice(from,1);next.splice(to,0,item);return next;
}
export function validateVideoHeader(bytes:Uint8Array,type:string,size:number){
  if(!Number.isSafeInteger(size)||size<=0||size>maxProductVideoBytes)throw new Error("El video debe pesar hasta 25 MB.");
  const text=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
  const mp4=bytes.length>=16&&text(4,8)==="ftyp"&&["isom","iso2","mp41","mp42","avc1","M4V ","MSNV"].includes(text(8,12));
  const webm=[26,69,223,163].every((value,index)=>bytes[index]===value)&&new TextDecoder().decode(bytes).includes("webm");
  if(type==="video/mp4"&&mp4)return {extension:"mp4",contentType:type};
  if(type==="video/webm"&&webm)return {extension:"webm",contentType:type};
  throw new Error("Elegí un video MP4 o WebM válido.");
}
