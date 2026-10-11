import type { ProductWithVariants } from "@/types/database";

export const catalogCategories = [
  { id: "lavado", label: "Lavado" },
  { id: "interior", label: "Limpieza interior" },
  { id: "proteccion", label: "Protección" },
  { id: "brillo", label: "Ceras y brillo" },
  { id: "cepillos", label: "Cepillos y microfibras" },
  { id: "iluminacion", label: "Iluminación LED" },
  { id: "accesorios", label: "Accesorios" },
  { id: "kits", label: "Kits" },
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Legacy products have only two database categories. Classify their names until
// the inventory gains dedicated vehicle-care categories through a new migration.
const categoryNames: Record<string, RegExp> = {
  lavado: /shampoo|champu|lavado|espuma|snow foam/,
  interior: /interior|tapizado|cuero|alfombra|habitaculo/,
  proteccion: /cera|sellador|coating|protector|ceramic/,
  brillo: /cera|brillo|pulidor|polish/,
  cepillos: /cepillo|microfibra|pano|brocha/,
  iluminacion: /\bled\b|luz|luces|iluminacion/,
  accesorios: /cepillo|microfibra|pano|brocha|\bled\b|luz|luces|guante|balde|aplicador/,
  kits: /\bkit\b|\bcombo\b/,
};

export function filterCatalogProducts(products: ProductWithVariants[], filters: { category?: string; query?: string; brand?: string }) {
  const words = normalize(filters.query ?? "").split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    const name = normalize(product.name);
    const text = normalize(`${product.name} ${product.brand} ${product.description}`);
    const category = filters.category;
    const matchesCategory = !category || category === "todos" ||
      (category === "Decant" || category === "Frasco completo" ? product.category === category : categoryNames[category]?.test(name) === true);
    return matchesCategory && (!filters.brand || product.brand === filters.brand) && words.every((word) => text.includes(word));
  });
}
