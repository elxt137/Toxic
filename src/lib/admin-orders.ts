import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
export async function readAllOrders(client: Awaited<ReturnType<typeof createClient>>) {
  const orders: Database["public"]["Tables"]["orders"]["Row"][] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await client.from("orders").select("*").order("created_at", { ascending: false }).order("id").range(start, start + 499);
    if (error) throw new Error("No se pudieron cargar los pedidos.");
    orders.push(...(data ?? []));
    if ((data ?? []).length < 500) return orders;
  }
}
export async function readAllOrderItems(client: Awaited<ReturnType<typeof createClient>>) {
  const items: Database["public"]["Tables"]["order_items"]["Row"][] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await client.from("order_items").select("*").order("id").range(start, start + 499);
    if (error) throw new Error("No se pudieron cargar los artículos de los pedidos.");
    items.push(...(data ?? []));
    if ((data ?? []).length < 500) return items;
  }
}
