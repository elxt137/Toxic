"use server";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteUrl, getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
export async function signInCustomer() {
  if (!getSupabaseConfig()) redirect("/checkout?error=not-configured");
  const client = await createClient();
  const siteUrl=getSiteUrl(await headers());
  (await cookies()).set("rc2_customer_checkout","1",{ httpOnly:true,sameSite:"lax",secure:siteUrl.startsWith("https:"),maxAge:600,path:"/" });
  const { data,error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${siteUrl}/auth/callback` } });
  if (error || !data.url) redirect("/checkout?error=oauth");
  redirect(data.url);
}
