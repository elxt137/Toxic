export const freeShippingThreshold = 100_000;
export type CommerceSettings = { freeShippingEnabled: boolean; freeShippingThreshold: number; freeShippingDestination: "branch" | "home"; cartWhatsappEnabled: boolean };
export const defaultCommerceSettings: CommerceSettings = { freeShippingEnabled: true, freeShippingThreshold, freeShippingDestination: "branch", cartWhatsappEnabled: true };
export const shippingDestinationLabel = (settings: CommerceSettings) => settings.freeShippingDestination === "home" ? "a domicilio" : "a sucursal";

export function getFreeShippingProgress(total: number, settings: CommerceSettings = defaultCommerceSettings) {
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const threshold = settings.freeShippingThreshold > 0 && Number.isFinite(settings.freeShippingThreshold) ? settings.freeShippingThreshold : freeShippingThreshold;
  const missing = Math.max(0, threshold - safeTotal);

  return {
    threshold,
    missing,
    progress: Math.min(100, (safeTotal / threshold) * 100),
    qualified: settings.freeShippingEnabled && missing === 0,
  };
}
