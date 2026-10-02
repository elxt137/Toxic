import "server-only";

import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

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
