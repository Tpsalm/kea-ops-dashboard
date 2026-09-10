import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * POST /api/auth/logout
 * Signs out the current Supabase session and clears cookies.
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  // Clear the legacy demo cookie too
  response.cookies.set("kea_auth", "", { maxAge: 0, path: "/" });
  return response;
}
