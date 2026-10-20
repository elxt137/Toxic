"use client";
import { useActionState } from "react";
import { unstable_rethrow } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [error, action, pending] = useActionState(async () => {
    try { await deleteProduct(id); return ""; }
    catch (error) {
      unstable_rethrow(error);
      return error instanceof Error ? error.message : "No se pudo eliminar el producto.";
    }
  }, "");
  return <form action={action} onSubmit={event => {
    if (pending || !window.confirm(`¿Eliminar “${name}”? Esta acción no se puede deshacer.`)) event.preventDefault();
  }} className="delete-product-form">
    <button type="submit" disabled={pending}>{pending ? "Eliminando…" : "Eliminar producto"}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
