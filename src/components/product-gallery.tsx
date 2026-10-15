"use client";
import { useState } from "react";
export function ProductGallery({ name, images,videos=[],initialImage }: { name: string; images: string[];videos?:string[];initialImage?:string|null }) {
  const [selected, setSelected] = useState(Math.max(0,initialImage?images.indexOf(initialImage):0));
  const [videoIndex,setVideoIndex]=useState<number|null>(images.length?null:videos.length?0:null);
  return <div className="product-gallery"><div className="product-detail-visual">
    {videoIndex!==null?<video key={videos[videoIndex]} src={videos[videoIndex]} controls playsInline preload="metadata" aria-label={`Video ${videoIndex+1} de ${name}`}/>:images.length ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[selected] ?? images[0]} alt={`Producto: ${name}`} />
    </> : <div className="card-bottle" aria-hidden="true"><i /></div>}
    </div>{images.length+videos.length > 1 && <div className="product-gallery-thumbnails" aria-label="Fotos y videos del producto">{images.map((src, index) => <button type="button" key={`${src}-${index}`} aria-label={`Ver foto ${index + 1}`} aria-pressed={videoIndex===null&&index === selected} onClick={() => {setSelected(index);setVideoIndex(null);}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={64} height={64} loading="lazy" />
    </button>)}{videos.map((src,index)=><button key={src} type="button" aria-label={`Ver video ${index+1}`} aria-pressed={videoIndex===index} onClick={()=>setVideoIndex(index)}>▶ Video {index+1}</button>)}</div>}
  </div>;
}
