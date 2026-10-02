export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}

const validHost = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const localHost = /^(localhost|127\.0\.0\.1)(:|$)/i;

// Si el build no tiene NEXT_PUBLIC_SITE_URL, el dominio público sale del request
// (x-forwarded-host detrás de un proxy, o host). Supabase sólo acepta redirect_to
// incluidos en sus Redirect URLs, así que un host falso no desvía el login.
function getRequestOrigin(requestHeaders?: Headers) {
  const host = requestHeaders?.get("x-forwarded-host")?.split(",")[0].trim() || requestHeaders?.get("host")?.trim();
  if (!host || !validHost.test(host)) return null;
  return `${localHost.test(host) ? "http" : "https"}://${host}`;
}

export function getSiteUrl(requestHeaders?: Headers) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return getRequestOrigin(requestHeaders) ?? "http://localhost:3000";
}
