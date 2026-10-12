"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const whatsappSchema = z.object({
  whatsapp_number: z.string().trim().max(64).regex(/^[+\d\s()-]+$/).transform((value) => value.replace(/\D/g, "")).pipe(z.string().regex(/^[1-9]\d{7,14}$/)),
  password: z.string().min(1).max(128),
});
export async function updateWhatsappNumber(_previous: { success?: boolean; message?: string }, form: FormData): Promise<{ success: boolean; message: string }> {
  await requireAdmin();
  const parsed = whatsappSchema.safeParse({ whatsapp_number: form.get("whatsapp_number"), password: form.get("password") });
  if (!parsed.success) return { success: false, message: "Ingresá un número internacional válido y la contraseña." };
  try {
    const client = await createClient();
    const { data, error } = await client.rpc("update_store_whatsapp", { p_number: parsed.data.whatsapp_number, p_password: parsed.data.password });
    if (error) return { success: false, message: "No se pudo actualizar el WhatsApp. Probá de nuevo." };
    if (!data) return { success: false, message: "La contraseña es incorrecta." };
  } catch {
    return { success: false, message: "No se pudo actualizar el WhatsApp. Probá de nuevo." };
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { success: true, message: "Número de WhatsApp actualizado." };
}
