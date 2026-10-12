"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateWhatsappNumber } from "@/app/admin/whatsapp-actions";

export function WhatsappSettings({ currentNumber }: { currentNumber: string }) {
  const [number, setNumber] = useState(currentNumber);
  const [state, action, pending] = useActionState<{ success?: boolean; message?: string }, FormData>(updateWhatsappNumber, {});
  const passwordInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (passwordInput.current) passwordInput.current.value = ""; }, [state]);
  return <section className="console-panel">
    <h2>WhatsApp de la tienda</h2>
    <p className="console-note">Este número se usa en los botones de contacto y en los pedidos por WhatsApp. Para cambiarlo, ingresá la contraseña de personalización.</p>
    <form className="console-form" action={action}>
      <label>Número de WhatsApp<input name="whatsapp_number" type="tel" value={number} onChange={(event) => setNumber(event.target.value)} maxLength={64} required autoComplete="tel" placeholder="Ej.: 5491112345678" aria-describedby="whatsapp-number-help" /></label>
      <small id="whatsapp-number-help">Incluí el código de país. Para celulares argentinos: 54, 9, código de área y número, sin 0 ni 15.</small>
      <label>Contraseña de personalización<input ref={passwordInput} name="password" type="password" required maxLength={128} autoComplete="current-password" /></label>
      <button className="admin-button" type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar WhatsApp"}</button>
      {state.message && <p role={state.success ? "status" : "alert"} className={`form-message ${state.success ? "success" : "error"}`}>{state.message}</p>}
    </form>
  </section>;
}
