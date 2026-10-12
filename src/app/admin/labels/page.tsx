import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { barcodeSvg } from "@/lib/barcode";
import { PrintLabels } from "@/components/admin/print-labels";

export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ ids?: string; type?: string; auto?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const ids = z.array(z.string().uuid()).min(1).max(100).parse((params.ids ?? "").split(","));
  const type = z.enum(["coupon", "product"]).parse(params.type);
  const client = await createClient();
  let labels: { code: string; title: string; detail: string }[];
  if (type === "coupon") {
    const { data, error } = await client.from("coupons").select("code,kind,value,expires_at").in("id", ids);
    if (error) throw new Error("No se pudieron cargar las etiquetas.");
    labels = (data ?? []).map((c) => ({ code: c.code, title: "RC2 · Estética Vehicular", detail: c.kind === "percent" ? `${c.value}% de descuento` : `$${c.value} de descuento` }));
  } else {
    const [{ data, error }, { data: products, error: productsError }] = await Promise.all([client.from("product_admin_data").select("product_id,barcode").in("product_id", ids), client.from("products").select("id,name").in("id", ids)]);
    if (error || productsError) throw new Error("No se pudieron cargar los códigos.");
    labels = (data ?? []).filter((p) => p.barcode).map((p) => ({ code: p.barcode!, title: "RC2", detail: products?.find((product) => product.id === p.product_id)?.name ?? "Producto" }));
  }
  return <main className="labels-page"><div className="label-controls"><Link href={`/admin?section=${type === "coupon" ? "marketing" : "products"}`}>Volver al panel</Link><h1>Etiquetas físicas</h1><p>Seleccioná papel de 38 × 21 mm, escala 100%, sin márgenes ni encabezados.</p><PrintLabels auto={params.auto === "1"} /></div><div className="label-sheet">{labels.map((label) => <article className="physical-label" key={label.code}><strong>{label.title}</strong><span>{label.detail}</span><div className="label-barcode" dangerouslySetInnerHTML={{ __html: barcodeSvg(label.code) }} /><b>{label.code}</b></article>)}</div>{!labels.length && <p>No hay códigos asignados para imprimir.</p>}</main>;
}
