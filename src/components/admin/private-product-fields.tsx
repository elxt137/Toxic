import Link from "next/link";
import { savePrivateProduct } from "@/app/admin/console-actions";
import { adminMoney } from "@/lib/admin-console";
import { barcodeSvg } from "@/lib/barcode";
import type { Database } from "@/types/database";

export function PrivateProductFields({ id, salePrice, metadata }: { id: string; salePrice: number; metadata?: Database["public"]["Tables"]["product_admin_data"]["Row"] }) {
  return <section className="private-product-panel"><div><h3>Costos y código de barras</h3><p>El costo unitario es privado. Precio de venta: <b>{adminMoney(salePrice)}</b>.</p></div>
    <form action={savePrivateProduct.bind(null, id)} className="console-form private-product-form">
      <label>Costo unitario<input name="cost_price" type="number" min="0" step="0.01" defaultValue={metadata?.cost_price ?? ""} placeholder="Sin costo registrado" /></label>
      <label>Código asignado<input name="barcode" maxLength={32} pattern="[A-Za-z0-9-]{3,32}" defaultValue={metadata?.barcode ?? ""} placeholder="Código interno o código existente" /></label>
      <div className="form-buttons"><button type="submit" className="admin-button">Guardar datos privados</button><button type="submit" name="generate_barcode" value="on" className="admin-button secondary">Generar y asignar código</button></div>
    </form>
    {metadata?.barcode && <div className="product-barcode-preview"><div dangerouslySetInnerHTML={{ __html: barcodeSvg(metadata.barcode) }} /><b>{metadata.barcode}</b><Link className="admin-button secondary" href={`/admin/labels?type=product&ids=${id}&auto=1`}>Imprimir código</Link></div>}
  </section>;
}
