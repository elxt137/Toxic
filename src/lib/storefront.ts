import "server-only";

import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getWhatsappNumber } from "@/lib/store-contact";
import { defaultCommerceSettings, type CommerceSettings } from "@/lib/shipping";
import { commerceSchema } from "@/lib/crm";
import { analyticsSchema, type AnalyticsSettings } from "@/lib/analytics";

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  const disabled = { enabled: false, measurementId: null };
  if (!getSupabaseConfig()) return disabled;
  try {
    const client = await createClient();
    const { data, error } = await client.from("storefront_settings").select("google_analytics_id,google_analytics_enabled").eq("id", true).maybeSingle();
    if (error || !data) return disabled;
    const parsed = analyticsSchema.safeParse({ enabled: data.google_analytics_enabled, measurementId: data.google_analytics_id });
    return parsed.success ? parsed.data : disabled;
  } catch { return disabled; }
}

export async function getCommerceSettings(): Promise<CommerceSettings> {
  if (!getSupabaseConfig()) return defaultCommerceSettings;
  try {
    const client = await createClient();
    const { data, error } = await client.from("storefront_settings").select("free_shipping_enabled,free_shipping_threshold,free_shipping_destination,cart_whatsapp_enabled").eq("id",true).maybeSingle();
    const parsed = commerceSchema.safeParse(data);
    if (error || !parsed.success) return { ...defaultCommerceSettings, freeShippingEnabled: false };
    return { freeShippingEnabled: parsed.data.free_shipping_enabled, freeShippingThreshold: parsed.data.free_shipping_threshold, freeShippingDestination: parsed.data.free_shipping_destination, cartWhatsappEnabled: parsed.data.cart_whatsapp_enabled };
  } catch { return { ...defaultCommerceSettings, freeShippingEnabled: false }; }
}

export async function getStoreWhatsappNumber() {
  const fallback = getWhatsappNumber();
  if (!getSupabaseConfig()) return fallback;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("storefront_settings").select("whatsapp_number").eq("id", true).maybeSingle();
    return error || !data?.whatsapp_number ? fallback : data.whatsapp_number;
  } catch {
    return fallback;
  }
}

export const defaultAnnouncement = "Envíos a todo el país · 3 cuotas sin interés · Consultanos por WhatsApp";

export async function getAnnouncementText() {
  if (!getSupabaseConfig()) return defaultAnnouncement;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("storefront_settings")
    .select("announcement_text")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) return defaultAnnouncement;
  return data.announcement_text;
}
