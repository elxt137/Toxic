import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceRoleKey) throw new Error("Supabase server credentials are not configured");

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}