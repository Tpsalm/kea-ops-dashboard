import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns the authenticated user profile or error.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    // Fetch profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, name, role, client_id, supervisor_id, region, phone")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found. Please contact your administrator." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        clientId: profile.client_id,
        supervisorId: profile.supervisor_id,
        region: profile.region,
        phone: profile.phone,
      },
      session: authData.session,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
