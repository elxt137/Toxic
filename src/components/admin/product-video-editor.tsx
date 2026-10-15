"use client";
import {useId,useState} from "react";
import {prepareProductVideoUpload} from "@/app/admin/image-actions";
import {createClient} from "@/lib/supabase/client";
import {allowedVideoTypes,maxProductVideoBytes,reorderMedia} from "@/lib/product-media";
export function ProductVideoEditor({videos,onChange,onBusy}:{videos:string[];onChange:(videos:string[])=>void;onBusy:(busy:boolean)=>void}){
  const id=useId();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function upload(files:File[]){
    setError("");if(videos.length+files.length>3){setError("Podés guardar hasta 3 videos por producto.");return;}
    if(files.some(file=>!allowedVideoTypes.includes(file.type)||!file.size||file.size>maxProductVideoBytes)){setError("Elegí videos MP4 o WebM de hasta 25 MB cada uno.");return;}
    setBusy(true);onBusy(true);const uploaded=[...videos];
    try{for(const file of files){
      const form=new FormData();form.set("size",String(file.size));form.set("header",new File([file.slice(0,4096)],"header",{type:file.type}));
      const prepared=await prepareProductVideoUpload(form);
      if(!prepared.path||!prepared.token||!prepared.url)throw new Error(prepared.error||"No se pudo preparar el video.");
      const {error:uploadError}=await createClient().storage.from("product-images").uploadToSignedUrl(prepared.path,prepared.token,file,{contentType:file.type,cacheControl:"31536000"});
      if(uploadError)throw new Error("No se pudo subir el video. Revisá la conexión y volvé a intentar.");
      uploaded.push(prepared.url);onChange([...uploaded]);
    }}catch(error){setError(error instanceof Error?error.message:"No se pudo subir el video.");}finally{setBusy(false);onBusy(false);}
  }
  return <fieldset className="wide product-image-editor" disabled={busy}><legend>Videos del producto</legend><p>Hasta 3 videos MP4 o WebM de 25 MB cada uno. Se reproducen con controles y sin reproducción automática. La compatibilidad depende del códec del archivo.</p><input type="hidden" name="video_urls" value={JSON.stringify(videos)}/><div className="product-image-grid">{videos.map((src,index)=><figure key={src}><video src={src} controls playsInline preload="metadata"/><figcaption>Video {index+1}</figcaption><div>{index>0&&<button type="button" aria-label={`Adelantar video ${index+1}`} onClick={()=>onChange(reorderMedia(videos,index,index-1))}>←</button>}{index<videos.length-1&&<button type="button" aria-label={`Atrasar video ${index+1}`} onClick={()=>onChange(reorderMedia(videos,index,index+1))}>→</button>}<button type="button" onClick={()=>onChange(videos.filter((_,i)=>i!==index))}>Quitar video {index+1}</button></div></figure>)}</div><label htmlFor={id}>Subir videos<input id={id} type="file" multiple accept={allowedVideoTypes.join(",")} onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value="";if(files.length)void upload(files);}}/></label>{busy&&<p role="status">Subiendo videos… Esperá a que termine la carga.</p>}{error&&<p className="form-message error" role="alert">{error}</p>}</fieldset>;
}
