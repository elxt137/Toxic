import "server-only";

import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithVariants } from "@/types/database";

// Illustrative catalog only; live products are loaded from Supabase.
export const demoProducts: ProductWithVariants[] = [
  {
    "id": "demo-1",
    "name": "Shampoo para autos",
    "slug": "shampoo-para-autos",
    "brand": "Toxic",
    "description": "Para sumar a tu rutina de lavado exterior. Producto de muestra.",
    "category": "Decant",
    "price": 6500,
    "currency": "ARS",
    "stock": 8,
    "image_url": null,
    "concentration": null,
    "size_ml": 500,
    "is_published": true,
    "is_featured": true,
    "sort_order": 1,
    "created_at": "2026-10-02T00:00:00.000Z",
    "updated_at": "2026-10-02T00:00:00.000Z",
    "variants": [
      {
        "id": "demo-1-standard",
        "product_id": "demo-1",
        "label": "500 ml",
        "size_ml": 500,
        "price": 6500,
        "stock": 8,
        "sort_order": 0,
        "is_active": true,
        "created_at": "2026-10-02T00:00:00.000Z",
        "updated_at": "2026-10-02T00:00:00.000Z"
      }
    ]
  },
  {
    "id": "demo-2",
    "name": "Cera protectora",
    "slug": "cera-protectora",
    "brand": "Toxic",
    "description": "Cuidado y terminación para la carrocería. Producto de muestra.",
    "category": "Decant",
    "price": 11500,
    "currency": "ARS",
    "stock": 4,
    "image_url": null,
    "concentration": null,
    "size_ml": 250,
    "is_published": true,
    "is_featured": false,
    "sort_order": 2,
    "created_at": "2026-10-02T00:00:00.000Z",
    "updated_at": "2026-10-02T00:00:00.000Z",
    "variants": [
      {
        "id": "demo-2-standard",
        "product_id": "demo-2",
        "label": "250 ml",
        "size_ml": 250,
        "price": 11500,
        "stock": 4,
        "sort_order": 0,
        "is_active": true,
        "created_at": "2026-10-02T00:00:00.000Z",
        "updated_at": "2026-10-02T00:00:00.000Z"
      }
    ]
  },
  {
    "id": "demo-3",
    "name": "Cepillo de detailing",
    "slug": "cepillo-de-detailing",
    "brand": "Toxic",
    "description": "Un accesorio para trabajar en los detalles de tu vehículo. Producto de muestra.",
    "category": "Frasco completo",
    "price": 3800,
    "currency": "ARS",
    "stock": 3,
    "image_url": null,
    "concentration": null,
    "size_ml": null,
    "is_published": true,
    "is_featured": false,
    "sort_order": 3,
    "created_at": "2026-10-02T00:00:00.000Z",
    "updated_at": "2026-10-02T00:00:00.000Z",
    "variants": [
      {
        "id": "demo-3-standard",
        "product_id": "demo-3",
        "label": "1 unidad",
        "size_ml": null,
        "price": 3800,
        "stock": 3,
        "sort_order": 0,
        "is_active": true,
        "created_at": "2026-10-02T00:00:00.000Z",
        "updated_at": "2026-10-02T00:00:00.000Z"
      }
    ]
  },
  {
    "id": "demo-4",
    "name": "Paño de microfibra",
    "slug": "pano-de-microfibra",
    "brand": "Toxic",
    "description": "Un básico para tu kit de limpieza. Producto de muestra.",
    "category": "Frasco completo",
    "price": 4500,
    "currency": "ARS",
    "stock": 5,
    "image_url": null,
    "concentration": null,
    "size_ml": null,
    "is_published": true,
    "is_featured": false,
    "sort_order": 4,
    "created_at": "2026-10-02T00:00:00.000Z",
    "updated_at": "2026-10-02T00:00:00.000Z",
    "variants": [
      {
        "id": "demo-4-standard",
        "product_id": "demo-4",
        "label": "Pack de 3",
        "size_ml": null,
        "price": 4500,
        "stock": 5,
        "sort_order": 0,
        "is_active": true,
        "created_at": "2026-10-02T00:00:00.000Z",
        "updated_at": "2026-10-02T00:00:00.000Z"
      }
    ]
  },
  {
    "id": "demo-5",
    "name": "Luces LED",
    "slug": "luces-led",
    "brand": "Toxic",
    "description": "Consultá compatibilidad con tu vehículo antes de comprar. Producto de muestra.",
    "category": "Frasco completo",
    "price": 25000,
    "currency": "ARS",
    "stock": 0,
    "image_url": null,
    "concentration": null,
    "size_ml": null,
    "is_published": true,
    "is_featured": false,
    "sort_order": 5,
    "created_at": "2026-10-02T00:00:00.000Z",
    "updated_at": "2026-10-02T00:00:00.000Z",
    "variants": [
      {
        "id": "demo-5-standard",
        "product_id": "demo-5",
        "label": "Par",
        "size_ml": null,
        "price": 25000,
        "stock": 0,
        "sort_order": 0,
        "is_active": true,
        "created_at": "2026-10-02T00:00:00.000Z",
        "updated_at": "2026-10-02T00:00:00.000Z"
      }
    ]
  }
];

export async function getPublishedProducts() {
  if (!getSupabaseConfig()) return demoProducts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  const { data: variants, error: variantsError } = await supabase.from("product_variants").select("*").eq("is_active", true).order("sort_order").order("created_at");
  if (variantsError) throw new Error(`No se pudieron cargar las presentaciones: ${variantsError.message}`);
  return (data ?? []).map((product) => ({ ...product, variants: (variants ?? []).filter((variant) => variant.product_id === product.id) }));
}

export async function getPublishedProduct(slug: string) {
  const products = await getPublishedProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export function formatPrice(price: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
