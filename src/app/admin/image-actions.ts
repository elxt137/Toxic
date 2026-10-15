"use server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validateProductImage } from "@/lib/product-editor";
import {validateVideoHeader} from "@/lib/product-media";

export async function prepareProductVideoUpload(form:FormData):Promise<{token?:string;path?:string;url?:string;error?:string}>{
  await requireAdmin();
  const header=form.get("header");if(!(header instanceof File)||header.size>4096)return {error:"No se pudo validar el video."};
  let video;
  try{video=validateVideoHeader(new Uint8Array(await header.arrayBuffer()),header.type,Number(form.get("size")));}catch(error){return {error:error instanceof Error?error.message:"Video inválido."};}
  const client=await createClient();const path=`catalog/${crypto.randomUUID()}.${video.extension}`;const bucket=client.storage.from("product-images");
  const {data,error}=await bucket.createSignedUploadUrl(path,{upsert:false});
  if(error||!data)return {error:"No se pudo preparar la carga. Volvé a intentar."};
  return {token:data.token,path,url:bucket.getPublicUrl(path).data.publicUrl};
}

export async function uploadProductImage(form: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "Elegí una foto para subir." };
  let image;
  try { image = await validateProductImage(file); } catch (error) { return { error: error instanceof Error ? error.message : "Foto inválida." }; }
  const client = await createClient();
  const path = `catalog/${crypto.randomUUID()}.${image.extension}`;
  const bucket = client.storage.from("product-images");
  const { error } = await bucket.upload(path, image.bytes, { contentType: image.contentType, cacheControl: "31536000", upsert: false });
  if (error) return { error: "No se pudo subir la foto. Revisá la conexión y volvé a intentar." };
  return { url: bucket.getPublicUrl(path).data.publicUrl };
}
