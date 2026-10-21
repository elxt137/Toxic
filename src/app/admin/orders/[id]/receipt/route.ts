import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response("Pedido inválido.", { status: 400 });
  const client = await createClient();
  const { data, error } = await client.from("orders").select("transfer_receipt_path").eq("id", id).maybeSingle();
  const path = data?.transfer_receipt_path;
  if (error || !path || !new RegExp(`^${id}/[a-f0-9-]{36}\\.(pdf|jpg|png)$`).test(path)) return new Response("No hay comprobante disponible.", { status: 404 });
  const { data: file, error: downloadError } = await client.storage.from("transfer-receipts").download(path);
  if (downloadError || !file) return new Response("No se pudo cargar el comprobante.", { status: 404 });
  const extension = path.split(".").at(-1)!;
  const type = extension === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : "image/jpeg";
  const mode = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new Response(file, { headers: { "Content-Type": type, "Content-Disposition": `${mode}; filename="comprobante-${id}.${extension}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'", "Referrer-Policy": "no-referrer" } });
}
