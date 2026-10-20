"use client";
import { productCategories } from "@/lib/product-categories";
import {useState} from "react";
import type {ProductWithVariants} from "@/types/database";
import {ProductGallery} from "./product-gallery";
import {ProductDetailActions} from "./product-detail-actions";
export function ProductDetailContent({product}:{product:ProductWithVariants}){
  const [variantId,setVariantId]=useState(product.variants.find(variant=>variant.stock>0)?.id??product.variants[0]?.id??"");
  const variant=product.variants.find(item=>item.id===variantId);
  const images=product.image_urls?.length?product.image_urls:product.image_url?[product.image_url]:[];
  return <div className="product-detail"><ProductGallery key={variantId} name={product.name} images={images} videos={product.video_urls} initialImage={variant?.image_url}/><div className="product-detail-copy">{product.brand&&<p className="product-brand">{product.brand}</p>}<h1>{product.name}</h1><p className="product-detail-category">{productCategories.find(category => category.id === product.category)?.label ?? (product.category==="Decant"?"Limpieza y protección":"Accesorios")}{product.size_ml?` · ${product.size_ml} ml`:""}</p><p className="product-detail-description">{product.description||"Un aliado para el cuidado de tu vehículo."}</p><ProductDetailActions product={product} selectedVariantId={variantId} onVariantChange={setVariantId}/></div></div>;
}
