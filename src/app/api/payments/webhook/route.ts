import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Mercado Pago no está configurado." }, { status: 503 });

  const url = new URL(request.url);
  let body: { type?: string; data?: { id?: string } } = {};
  try { body = await request.json(); } catch { /* Mercado Pago puede enviar solo query params. */ }
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body.type;
  const paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? body.data?.id;
  if (type !== "payment" || !paymentId || !/^\d+$/.test(paymentId)) return NextResponse.json({ received: true });

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!paymentResponse.ok) return NextResponse.json({ error: "No se pudo verificar el pago." }, { status: 502 });
  const payment = await paymentResponse.json() as { external_reference?: string; status?: string };
  if (!payment.external_reference) return NextResponse.json({ received: true });

  const status = payment.status === "approved"
    ? "approved"
    : payment.status === "rejected" ? "rejected"
      : payment.status === "cancelled" ? "cancelled" : "pending";
  const admin = createAdminClient();
  const { error } = await admin.rpc("confirm_order_payment", {
    p_order_id: payment.external_reference,
    p_payment_id: paymentId,
    p_status: status,
  });
  if (error) return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
  return NextResponse.json({ received: true });
}