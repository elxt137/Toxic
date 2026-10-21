import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentMatchesOrder, verifyPaymentSignature } from "@/lib/payment-security";

const providerId = z.union([z.number().int().positive().safe(), z.string().regex(/^\d{1,30}$/)]);
const paymentSchema = z.object({ id: providerId, external_reference: z.string().uuid(), status: z.enum(["approved","pending","in_process","authorized","rejected","cancelled"]), transaction_amount: z.number().finite().positive(), currency_id: z.literal("ARS"), order: z.object({ id: providerId }), payment_type_id: z.string().min(1).max(80).nullable().optional(), date_approved: z.iso.datetime({ offset: true }).nullable().optional() });
const merchantSchema = z.object({ preference_id: z.string().min(1), external_reference: z.string().uuid(), payments: z.array(z.object({ id: providerId })) });

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!accessToken || !secret) return NextResponse.json({ error: "La verificación de pagos no está configurada." }, { status: 503 });
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("data.id");
  if (!paymentId || url.searchParams.getAll("data.id").length !== 1 || !verifyPaymentSignature(request.headers, paymentId, secret)) return NextResponse.json({ error: "Notificación no autorizada." }, { status: 401 });
  try {
    const options = { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(7000) };
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, options);
    if (!paymentResponse.ok) return NextResponse.json({ error: "No se pudo verificar el pago." }, { status: 502 });
    const parsed = paymentSchema.safeParse(await paymentResponse.json());
    if (!parsed.success) return NextResponse.json({ error: "Pago no compatible con el pedido." }, { status: 409 });
    const payment = parsed.data;
    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin.from("orders").select("id,total,currency,mercadopago_preference_id").eq("id", payment.external_reference).maybeSingle();
    if (orderError) return NextResponse.json({ error: "No se pudo verificar el pedido." }, { status: 503 });
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 409 });
    const merchantResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${payment.order.id}`, { ...options, signal: AbortSignal.timeout(7000) });
    if (!merchantResponse.ok) return NextResponse.json({ error: "No se pudo verificar la preferencia." }, { status: 502 });
    const merchant = merchantSchema.safeParse(await merchantResponse.json());
    if (!merchant.success || !paymentMatchesOrder(payment,merchant.data,order,paymentId)) return NextResponse.json({ error: "El pago no coincide con el pedido." }, { status: 409 });
    const status = payment.status === "approved" ? "approved" : payment.status === "rejected" ? "rejected" : payment.status === "cancelled" ? "cancelled" : "pending";
    const { data, error } = await admin.rpc("record_verified_payment", { p_order_id: order.id, p_payment_id: paymentId, p_status: status, p_amount: payment.transaction_amount, p_currency: payment.currency_id, p_preference_id: merchant.data.preference_id, p_payment_type: payment.payment_type_id ?? null, p_paid_at: status === "approved" ? payment.date_approved ?? null : null });
    if (error) return NextResponse.json({ error: "No se pudo confirmar el pedido." }, { status: 503 });
    if (!data) return NextResponse.json({ error: "No se pudo vincular el pago al pedido." }, { status: 409 });
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: "No se pudo verificar la notificación." }, { status: 502 }); }
}
