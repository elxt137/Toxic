"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSiteUrl, getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  if (!getSupabaseConfig()) redirect("/login?error=not-configured");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl(await headers())}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}
