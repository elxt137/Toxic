import Link from "next/link";

import { CheckoutForm } from "@/components/checkout-form";
import { getCommerceSettings } from "@/lib/storefront";
import { getCustomerBenefit } from "@/lib/customer-benefit";
import { signInCustomer } from "./actions";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const settings = await getCommerceSettings();
  let benefit: Awaited<ReturnType<typeof getCustomerBenefit>> = null;
  let unavailable = false;
  try { benefit = await getCustomerBenefit(); } catch { unavailable = true; }
  return <main className="checkout-page"><header className="checkout-header shell"><Link className="notta-logo" href="/">RC2 <span>ESTÉTICA VEHICULAR</span></Link><Link href="/productos">Seguir comprando</Link></header>
    {!benefit && <section className="checkout-benefit shell"><p>¿Tenés un beneficio de cliente? Verificá tu correo con Google para aplicar el descuento de tu grupo. También podés comprar como invitado.</p><form action={signInCustomer}><button className="save-button">Verificar correo con Google</button></form>{params.error && <p role="alert">No se pudo iniciar la verificación. Probá de nuevo.</p>}</section>}
    <CheckoutForm settings={settings} benefit={benefit} benefitUnavailable={unavailable} />
  </main>;
}
