"use client";
import { useActionState } from "react";
import { saveAnalyticsSettings } from "@/app/admin/analytics-actions";
import type { AnalyticsSettings } from "@/lib/analytics";
export function AnalyticsSettingsPanel({ settings }: { settings: AnalyticsSettings }) {
  const [state, action, pending] = useActionState(saveAnalyticsSettings, {});
  return <section className="console-panel analytics-settings"><h2>Google Analytics 4</h2><p className="console-note">Medí las visitas y los productos que consultan tus clientes.</p>
    <form action={action} className="console-form">
      <label>ID de medición<input name="measurementId" placeholder="G-XXXXXXXXXX" defaultValue={settings.measurementId ?? ""} maxLength={22} aria-describedby="analytics-help" /></label>
      <p id="analytics-help">Lo encontrás en Google Analytics → Administrar → Flujos de datos → Web → ID de medición.</p>
      <label className="console-checkbox"><input name="enabled" type="checkbox" defaultChecked={settings.enabled} /> Activar Google Analytics</label>
      <p className="console-note">Se registra la navegación de la tienda después de aceptar las cookies de medición. El panel, el acceso y el checkout quedan excluidos.</p>
      {state.message && <p className={`form-message ${state.success ? "success" : "error"}`} role={state.success ? "status" : "alert"}>{state.message}</p>}
      <button type="submit" className="admin-button" disabled={pending}>{pending ? "Guardando…" : "Guardar Analytics"}</button>
    </form><a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Abrir Google Analytics</a>
  </section>;
}
