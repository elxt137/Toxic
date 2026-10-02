import { NextResponse } from "next/server";
import { z } from "zod";

import { getSiteUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(50),
  customer: z.object({
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(6).max(30),
    street: z.string().trim().min(2).max(120),
    number: z.string().trim().min(1).max(20),
    apartment: z.string().trim().max(40).optional(),
    city: z.string().trim().min(2).max(100),
    province: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(12),
  }),
});

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Mercado Pago no está configurado." }, { status: 503 });

  try {
    const body = requestSchema.parse(await request.json());
    const admin = createAdminClient();
    const productIds = [...new Set(body.items.map((item) => item.productId))];
    const variantIds = [...new Set(body.items.map((item) => item.variantId))];
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, brand, price, currency, stock, image_url")
      .in("id", productIds)
      .eq("is_published", true);
    const { data: variants, error: variantsError } = await admin.from("product_variants").select("id, product_id, label, price, stock, is_active").in("id", variantIds).eq("is_active", true);

    if (productsError) throw productsError;
    if (variantsError) throw variantsError;
    const productMap = new Map((products ?? []).map((product) => [product.id, product]));
    const variantMap = new Map((variants ?? []).map((variant) => [variant.id, variant]));
    const orderItems = body.items.map((item) => {
      const product = productMap.get(item.productId);
      const variant = variantMap.get(item.variantId);
      if (!product || !variant || variant.product_id !== product.id || variant.stock < item.quantity) throw new Error(`Stock insuficiente para ${product?.name ?? "un producto"}.`);
      return { product, variant, quantity: item.quantity };
    });
    const total = orderItems.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0);
    const { customer } = body;
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        total,
        currency: "ARS",
        payer_name: `${customer.firstName} ${customer.lastName}`,
        payer_email: customer.email,
        buyer_first_name: customer.firstName,
        buyer_last_name: customer.lastName,
        buyer_phone: customer.phone,
        shipping_street: customer.street,
        shipping_number: customer.number,
        shipping_apartment: customer.apartment || null,
        shipping_city: customer.city,
        shipping_province: customer.province,
        shipping_postal_code: customer.postalCode,
      })
      .select("id")
      .single();

    if (orderError || !order) throw orderError ?? new Error("No se pudo crear el pedido.");
    const { error: itemsError } = await admin.from("order_items").insert(orderItems.map(({ product, variant, quantity }) => ({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant.id,
      variant_label: variant.label,
      product_name: `${product.brand} ${product.name} — ${variant.label}`,
      unit_price: Number(variant.price),
      quantity,
    })));
    if (itemsError) throw itemsError;

    const siteUrl = getSiteUrl(request.headers);
    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        external_reference: order.id,
        payer: {
          name: customer.firstName,
          surname: customer.lastName,
          email: customer.email,
        },
        items: orderItems.map(({ product, variant, quantity }) => ({
          id: variant.id,
          title: `${product.brand} ${product.name} — ${variant.label}`,
          quantity,
          unit_price: Number(variant.price),
          currency_id: "ARS",
          picture_url: product.image_url ?? undefined,
        })),
        back_urls: {
          success: `${siteUrl}/pago/resultado?status=success`,
          failure: `${siteUrl}/pago/resultado?status=failure`,
          pending: `${siteUrl}/pago/resultado?status=pending`,
        },
        notification_url: `${siteUrl}/api/payments/webhook`,
      }),
    });
    const preference = await preferenceResponse.json() as { id?: string; init_point?: string; message?: string };
    if (!preferenceResponse.ok || !preference.id || !preference.init_point) {
      await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      throw new Error(preference.message ?? "Mercado Pago rechazó la preferencia.");
    }

    await admin.from("orders").update({ mercadopago_preference_id: preference.id }).eq("id", order.id);
    return NextResponse.json({ checkoutUrl: preference.init_point });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo iniciar el pago.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
