import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase no está configurado");

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Un Server Component no puede escribir cookies. proxy.ts se ocupa
          // de refrescar la sesión antes de que llegue a este punto.
        }
      },
    },
  });
}
