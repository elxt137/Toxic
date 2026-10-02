import Link from "next/link";

import { CheckoutForm } from "@/components/checkout-form";

export default function CheckoutPage() {
  return <main className="checkout-page"><header className="checkout-header shell"><Link className="notta-logo" href="/">TOXIC <span>AUTO CARE</span></Link><Link href="/productos">Seguir comprando</Link></header><CheckoutForm /></main>;
}
