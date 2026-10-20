export const productCategoryIds = ["lavado", "interior", "proteccion", "brillo", "cepillos", "iluminacion", "kits"] as const;
export type ProductCategory = typeof productCategoryIds[number] | "Decant" | "Frasco completo";
export const productCategories = [
  { id: "lavado", label: "Lavado" },
  { id: "interior", label: "Limpieza interior" },
  { id: "proteccion", label: "Protección" },
  { id: "brillo", label: "Ceras y brillo" },
  { id: "cepillos", label: "Cepillos y microfibras" },
  { id: "iluminacion", label: "Iluminación LED" },
  { id: "kits", label: "Kits" },
];
