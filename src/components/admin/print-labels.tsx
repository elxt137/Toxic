"use client";
import { useEffect, useRef } from "react";
export function PrintLabels({ auto = false }: { auto?: boolean }) {
  const printed = useRef(false);
  useEffect(() => {
    if (!auto || printed.current) return;
    printed.current = true;
    document.fonts.ready.then(() => window.print());
  }, [auto]);
  return <button type="button" className="admin-button" onClick={() => window.print()}>Imprimir etiquetas 38 × 21 mm</button>;
}
