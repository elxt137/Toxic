import "server-only";

import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getWhatsappNumber } from "@/lib/store-contact";

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
