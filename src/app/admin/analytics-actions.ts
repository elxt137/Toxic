"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { analyticsSchema } from "@/lib/analytics";

export type AnalyticsState = { success?: boolean; message?: string };
export async function saveAnalyticsSettings(_previous: AnalyticsState, form: FormData): Promise<AnalyticsState> {
  await requireAdmin();
  const parsed = analyticsSchema.safeParse({ enabled: form.get("enabled") === "on", measurementId: form.get("measurementId") ?? "" });
  if (!parsed.success) return { success: false, message: "Ingresá un ID GA4 válido (G-XXXXXXXXXX)." };
  const client = await createClient();
  const { data, error } = await client.from("storefront_settings").update({ google_analytics_enabled: parsed.data.enabled, google_analytics_id: parsed.data.measurementId }).eq("id", true).select("id").maybeSingle();
  if (error || !data) return { success: false, message: "No se pudo guardar Analytics. Volvé a intentar." };
  revalidatePath("/", "layout");
  return { success: true, message: "Configuración de Analytics guardada." };
}
