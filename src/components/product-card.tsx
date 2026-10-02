import Link from "next/link";

import type { ProductWithVariants } from "@/types/database";

function formatPrice(price: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

function formatInstallment(price: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

type ProductCardProps = { product: ProductWithVariants; index: number };

export function ProductCard({ product, index }: ProductCardProps) {
  const soldOut = !product.variants.some((variant) => variant.stock > 0);
  const lowestPrice = Math.min(...product.variants.map((variant) => variant.price));
  const installmentPrice = lowestPrice / 3;

  return <article className="product-card">
    <Link className="product-card-link" href={`/productos/${product.slug}`}>
      <div className={`product-visual tone-${(index % 3) + 1}`}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={`Producto: ${product.name}`} />
        ) : <div className="card-bottle" aria-hidden="true"><i /></div>}
        {product.is_featured && <span className="featured-badge">Destacado</span>}
        {soldOut && <span className="stock-badge">Sin stock</span>}
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.brand}, {product.name}</h3>
      </div>
    </Link>
    <div className="product-footer">
      <div className="product-prices">
        <strong>{product.variants.length > 1 ? "Desde " : ""}{formatPrice(lowestPrice, product.currency)}</strong>
        <span>3 cuotas sin interés de <b>{formatInstallment(installmentPrice, product.currency)}</b></span>
      </div>
      <div className="product-actions"><Link className="buy-now" href={`/productos/${product.slug}`} aria-disabled={soldOut}>{soldOut ? "Sin stock" : "Comprar"}</Link></div>
    </div>
  </article>;
}
