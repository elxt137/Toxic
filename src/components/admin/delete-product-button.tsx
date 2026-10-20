"use client";
import { useActionState } from "react";
import { unstable_rethrow } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [error, action, pending] = useActionState(async () => {
    try { const result = await deleteProduct(id); return result.error; }
    catch (error) {
      unstable_rethrow(error);
      return "No se pudo eliminar el producto. Volvé a intentar.";
    }
  }, "");
  return <form action={action} onSubmit={event => {
    if (pending || !window.confirm(`¿Eliminar “${name}”? Esta acción no se puede deshacer.`)) event.preventDefault();
  }} className="delete-product-form">
    <button type="submit" disabled={pending}>{pending ? "Eliminando…" : "Eliminar producto"}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
