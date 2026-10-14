"use client";
import { usePathname } from "next/navigation";
import { canTrackPath } from "@/lib/analytics";
import { CookieNotice } from "./home/cookie-notice";
export function StoreConsent() {
  const path = usePathname();
  return canTrackPath(path) ? <CookieNotice /> : null;
}
