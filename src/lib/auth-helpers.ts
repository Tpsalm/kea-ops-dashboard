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
  if (authError || !user) return null;

  // Fetch profile from our users table (linked via auth.users.id → public.users.id)
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, name, role, client_id, supervisor_id, region")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

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
