import { z } from "zod";
export const analyticsSchema = z.object({
  enabled: z.boolean(),
  measurementId: z.preprocess((value) => typeof value === "string" ? value.trim().toUpperCase() || null : value, z.string().regex(/^G-[A-Z0-9]{5,20}$/).nullable()),
}).refine((value) => !value.enabled || value.measurementId !== null, "Ingresá el ID de medición GA4 para activar Analytics.");
export type AnalyticsSettings = z.infer<typeof analyticsSchema>;
export function canTrackPath(path: string) {
  return !["/admin", "/auth", "/login", "/checkout", "/api", "/_next"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
