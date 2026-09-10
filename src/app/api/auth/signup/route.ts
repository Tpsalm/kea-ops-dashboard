import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * POST /api/auth/signup
 * Body: { email, password, name }
 * Creates a Supabase Auth user AND a public.users profile row.
 * The user's role defaults to "merchandiser" — admins can upgrade later.
 */
export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    if (!authData.user) {
      return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }

    // 2. Create profile in public.users (role defaults to merchandiser)
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        name,
        role: "merchandiser",
      });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: { id: authData.user.id, email, name, role: "merchandiser" },
      message: "Account created. Check your email for a confirmation link.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
