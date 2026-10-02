import Link from "next/link";

const messages = {
  success: ["Pago recibido", "Mercado Pago confirmó tu pago. Estamos preparando tu pedido."],
  pending: ["Pago pendiente", "Mercado Pago todavía está procesando el pago."],
  failure: ["Pago no aprobado", "No se pudo confirmar el pago. Podés volver a intentarlo o escribirnos por WhatsApp."],
} as const;

type ResultPageProps = { searchParams: Promise<{ status?: keyof typeof messages }> };

export default async function PaymentResultPage({ searchParams }: ResultPageProps) {
  const { status } = await searchParams;
  const [title, message] = messages[status ?? "pending"] ?? messages.pending;
  return <main className="payment-result"><div><p className="eyebrow">Toxic</p><h1>{title}</h1><p>{message}</p><Link href="/productos">Volver a productos</Link></div></main>;
}