import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const cookieStore=await cookies();
  const customerFlow=cookieStore.get("rc2_customer_checkout")?.value === "1";
  if (customerFlow) cookieStore.delete("rc2_customer_checkout");
  const requestedNext = url.searchParams.get("next") || (customerFlow ? "/checkout" : "/admin");
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !/[\\\u0000-\u0020\u007f]|%5c|%2f|%0[0-9a-f]|%1[0-9a-f]/i.test(requestedNext)
    ? requestedNext
    : "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, getSiteUrl(request.headers)));
  }

  return NextResponse.redirect(
    new URL(customerFlow ? "/checkout?error=callback" : "/login?error=callback", getSiteUrl(request.headers)),
  );
}
