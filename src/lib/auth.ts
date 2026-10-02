import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: allowed, error } = await supabase
    .from("admin_allowlist")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !allowed) return null;
  return user;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/login?error=unauthorized");
  return admin;
}
