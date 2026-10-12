"use client";
import { useActionState } from "react";
type State = { success?: boolean; message?: string };
export function AdminMutationForm({ action, children, submitLabel = "Guardar", className = "" }: { action: (state: State, form: FormData) => Promise<State>; children: React.ReactNode; submitLabel?: string; className?: string }) {
  const [state, save, pending] = useActionState<State,FormData>(action,{});
  return <form action={save} className={`console-form ${className}`}>
    {children}<button className="admin-button" disabled={pending}>{pending ? "Guardando…" : submitLabel}</button>
    {state.message && <p className={`form-message ${state.success ? "success" : "error"}`} role={state.success ? "status" : "alert"}>{state.message}</p>}
  </form>;
}
