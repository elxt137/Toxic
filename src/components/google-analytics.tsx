"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { analyticsSchema, canTrackPath, type AnalyticsSettings } from "@/lib/analytics";

type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
export function GoogleAnalytics({ settings }: { settings: AnalyticsSettings }) {
  const path = usePathname();
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const parsed = analyticsSchema.safeParse(settings);
  const id = parsed.success && parsed.data.enabled ? parsed.data.measurementId : null;
  const allowed = consent && !!id && canTrackPath(path);
  useEffect(() => {
    function refresh() { let accepted = false; try { accepted = localStorage.getItem("rc2-analytics-consent") === "accepted"; } catch { /* keep disabled */ } setConsent(accepted); }
    const timer = setTimeout(refresh, 0);
    window.addEventListener("rc2-analytics-consent", refresh); window.addEventListener("storage", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("rc2-analytics-consent", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  useEffect(() => {
    if (!id) return;
    const target = window as unknown as AnalyticsWindow & Record<string, unknown>;
    target[`ga-disable-${id}`] = !allowed;
    if (allowed && ready) target.gtag?.("event", "page_view", { page_location: `${location.origin}${path}`, page_path: path, page_title: document.title });
  }, [allowed, id, path, ready]);
  if (!allowed) return null;
  return <Script id="rc2-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" onReady={() => {
    const target = window as AnalyticsWindow;
    target.dataLayer ??= [];
    // gtag expects arguments objects in the queue, not flattened arrays.
    // Google consumes the standard gtag arguments queue.
    // eslint-disable-next-line prefer-rest-params
    target.gtag ??= function () { target.dataLayer?.push(arguments); };
    target.gtag("js", new Date());
    target.gtag("config", id, { send_page_view: false, page_location: `${location.origin}${path}`, allow_google_signals: false, allow_ad_personalization_signals: false });
    setReady(true);
  }} />;
}
