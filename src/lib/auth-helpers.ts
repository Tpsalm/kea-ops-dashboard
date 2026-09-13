import { cookies } from "next/headers";
import { createClient } from "./supabase-server";

export type AppRole = "super_admin" | "admin" | "supervisor" | "vsr" | "merchandiser" | "tsr";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  clientId: string | null;
  supervisorId: string | null;
  region: string | null;
}

/**
 * Get the currently authenticated user from the Supabase session.
 * Returns null when no valid session exists.
 * Reads from the `users` table using the Supabase Auth user ID.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!authError && user) {
    // Fetch profile from our users table (linked via auth.users.id → public.users.id)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, name, role, client_id, supervisor_id, region")
      .eq("id", user.id)
      .single();

    if (!profileError && profile) {
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as AppRole,
        clientId: profile.client_id,
        supervisorId: profile.supervisor_id,
        region: profile.region,
      };
    }
  }

  // Fallback: demo session (no Supabase Auth) — resolve by email cookie.
  return getDemoUser();
}

/**
 * Demo-mode identity bridge. The login page sets `kea_demo_session` when it
 * falls back to demo accounts; the server resolves it against public.users so
 * that every API route can enforce role-scoped access without Supabase Auth.
 */
async function getDemoUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("kea_demo_session")?.value;
  if (!raw) return null;

  try {
    const payload = JSON.parse(decodeURIComponent(raw));
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email) return null;

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("users")
      .select("id, email, name, role, client_id, supervisor_id, region")
      .eq("email", email)
      .single();

    if (error || !profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as AppRole,
      clientId: profile.client_id ?? null,
      supervisorId: profile.supervisor_id ?? null,
      region: profile.region ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Require a specific role. Throws when the user lacks permission.
 */
export async function requireRole(...allowed: AppRole[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  if (!allowed.includes(user.role)) {
    throw new Error(`Access denied: requires one of [${allowed.join(", ")}]`);
  }
  return user;
}

/**
 * Check if a user is at or above the supervisor tier.
 */
export function isSupervisorOrAbove(role: AppRole): boolean {
  return ["super_admin", "supervisor"].includes(role);
}

/**
 * Check if a user is a super admin.
 */
export function isSuperAdmin(role: AppRole): boolean {
  return role === "super_admin";
}
