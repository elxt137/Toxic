import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
export async function readCustomers(client: Awaited<ReturnType<typeof createClient>>) {
  const customers: Database["public"]["Tables"]["customers"]["Row"][] = [];
  for (let start=0; ; start+=500) {
    const { data, error } = await client.from("customers").select("*").order("registered_at", { ascending: false }).order("id").range(start,start+499);
    if (error) throw new Error("No se pudo cargar la base de clientes.");
    customers.push(...(data ?? []));
    if (!data || data.length<500) return customers;
  }
}
