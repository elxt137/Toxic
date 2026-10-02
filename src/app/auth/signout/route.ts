import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", getSiteUrl(request.headers)), { status: 303 });
}
