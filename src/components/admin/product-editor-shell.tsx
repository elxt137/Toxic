import Link from "next/link";
export function ProductEditorShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="admin-page premium-admin"><header className="admin-header"><Link className="brand-mark" href="/admin">RC2 <span>Administración</span></Link><Link href="/admin?section=products">Volver al inventario</Link></header><div className="admin-content product-editor-page"><h1>{title}</h1><p className="console-note">Completá los datos, las presentaciones y las fotos. Publicá el producto cuando esté listo para vender.</p><section className="console-panel">{children}</section></div></main>;
}
