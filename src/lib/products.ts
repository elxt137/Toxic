import "server-only";

import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithVariants } from "@/types/database";

const now = new Date().toISOString();

export const demoProducts: ProductWithVariants[] = [
  {
    id: "demo-1",
    name: "Nuit Ambrée",
    slug: "nuit-ambree",
    brand: "Maison Aure",
    description:
      "Ámbar, canela y vainilla. Una fragancia intensa para descubrir de a poco.",
    category: "Decant",
    price: 6500,
    currency: "ARS",
    stock: 8,
    image_url: null,
    concentration: "Eau de Parfum",
    size_ml: 100,
    is_published: true,
    is_featured: true,
    sort_order: 1,
    created_at: now,
    updated_at: now,
    variants: [{ id: "demo-1-5", product_id: "demo-1", label: "5 ml", size_ml: 5, price: 6500, stock: 8, sort_order: 0, is_active: true, created_at: now, updated_at: now }, { id: "demo-1-10", product_id: "demo-1", label: "10 ml", size_ml: 10, price: 11500, stock: 4, sort_order: 1, is_active: true, created_at: now, updated_at: now }],
  },
  {
    id: "demo-2",
    name: "Jardin Blanc",
    slug: "jardin-blanc",
    brand: "Armaf",
    description:
      "Cítricos, maderas y un fondo ahumado con gran duración.",
    category: "Decant",
    price: 3800,
    currency: "ARS",
    stock: 3,
    image_url: null,
    concentration: "Eau de Parfum",
    size_ml: 75,
    is_published: true,
    is_featured: false,
    sort_order: 2,
    created_at: now,
    updated_at: now,
    variants: [{ id: "demo-2-75", product_id: "demo-2", label: "75 ml", size_ml: 75, price: 3800, stock: 3, sort_order: 0, is_active: true, created_at: now, updated_at: now }],
  },
  {
    id: "demo-3",
    name: "Bois Secret",
    slug: "bois-secret",
    brand: "Dior",
    description:
      "Fresco, especiado y versátil. Un clásico moderno de diseñador.",
    category: "Frasco completo",
    price: 150000,
    currency: "ARS",
    stock: 0,
    image_url: null,
    concentration: "Extrait de Parfum",
    size_ml: 50,
    is_published: true,
    is_featured: false,
    sort_order: 3,
    created_at: now,
    updated_at: now,
    variants: [{ id: "demo-3-50", product_id: "demo-3", label: "50 ml", size_ml: 50, price: 150000, stock: 0, sort_order: 0, is_active: true, created_at: now, updated_at: now }],
  },
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
