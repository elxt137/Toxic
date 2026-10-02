export const freeShippingThreshold = 100_000;

export function getFreeShippingProgress(total: number) {
  const safeTotal = Math.max(0, total);
  const missing = Math.max(0, freeShippingThreshold - safeTotal);

  return {
    threshold: freeShippingThreshold,
    missing,
    progress: Math.min(100, (safeTotal / freeShippingThreshold) * 100),
    qualified: missing === 0,
  };
}
