import { Package, Search } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { filterInventory, getInventoryStock, getStockStatus } from "@/lib/inventory";
import type { ProductWithVariants } from "@/types/database";

type Props = {
  products: ProductWithVariants[];
  query?: string;
  updateAction: (id: string, formData: FormData) => void | Promise<void>;
};

export function AdminInventory({ products, query = "", updateAction }: Props) {
  const filtered = filterInventory(products, query);
  return <>
    <form action="/admin" method="get" role="search" aria-label="Buscar en inventario" className="inventory-search">
      <input type="hidden" name="section" value="products" />
      <label htmlFor="inventory-search">Buscar productos del inventario</label>
      <div><Search size={18} aria-hidden="true" /><input id="inventory-search" name="q" type="search" defaultValue={query} placeholder="Nombre o marca del producto" /><button type="submit">Buscar</button></div>
      {query.trim() && <Link href="/admin?section=products">Limpiar búsqueda</Link>}
    </form>
    <p className="inventory-results" role="status">{filtered.length} de {products.length} productos</p>
    <section className="inventory-list" aria-label="Productos del inventario">
      {!products.length && <div className="admin-empty"><Package size={32} /><h2>Inventario vacío</h2><p>Agregá el primer producto desde el botón superior.</p></div>}
      {products.length > 0 && !filtered.length && <p className="inventory-no-results">No encontramos productos con esa búsqueda.</p>}
      {filtered.map((product) => {
        const stock = getInventoryStock(product);
        const status = getStockStatus(stock);
        return <details className={`inventory-item inventory-${status.id}`} data-stock-status={status.id} key={product.id}>
          <summary>
            <span className={`status-dot stock-${status.id}`} aria-hidden="true" />
            <span className="inventory-name"><b>{product.name}</b><small>{product.brand}</small></span>
            <span className={`inventory-stock stock-${status.id}`}><b>{stock} <span className="inventory-unit-label">unidades</span></b><small>{status.label}</small></span>
            <span className={product.is_published ? "published" : "unpublished"}>{product.is_published ? "Publicado" : "Oculto"}</span>
          </summary>
          <ProductForm action={updateAction.bind(null, product.id)} product={product} submitLabel="Guardar cambios" />
        </details>;
      })}
    </section>
  </>;
}
