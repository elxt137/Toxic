type SearchableProduct = { name: string; brand: string; slug: string };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function filterInventory<T extends SearchableProduct>(products: T[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    const text = normalize(`${product.name} ${product.brand} ${product.slug}`);
    return words.every((word) => text.includes(word));
  });
}

export function getInventoryStock(product: { variants: { stock: number; is_active: boolean }[] }) {
  return product.variants.filter((variant) => variant.is_active).reduce((total, variant) => total + variant.stock, 0);
}

export function getStockStatus(stock: number) {
  if (stock <= 0) return { id: "empty", label: "Sin stock" };
  if (stock <= 2) return { id: "low", label: "Stock bajo" };
  return { id: "good", label: "Stock disponible" };
}
