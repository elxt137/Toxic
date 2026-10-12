import "server-only";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { CustomerBenefit } from "@/lib/crm";
const benefitSchema = z.object({ group_id: z.string().uuid(), group_name: z.string(), discount_percent: z.coerce.number().min(0).max(99) });
export async function getCustomerBenefit(): Promise<CustomerBenefit | null> {
  if (!getSupabaseConfig()) return null;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) return null;
  const { data, error } = await client.rpc("get_my_customer_benefit", {});
  if (error) throw new Error("No se pudo verificar el beneficio del cliente. Probá de nuevo.");
  if (!data) return { email: user.email.toLowerCase(), groupId: null, groupName: "Minorista", percent: 0 };
  const benefit = benefitSchema.parse(data);
  return { email: user.email.toLowerCase(), groupId: benefit.group_id, groupName: benefit.group_name, percent: benefit.discount_percent };
}
