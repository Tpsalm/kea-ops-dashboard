"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase";

export type AppRole = "super-admin" | "admin" | "vsr" | "supervisor" | "merchandiser" | "tsr" | "field-team";
export type User = { id?: string; email: string; name: string; role: AppRole; allowedClientIds: string[] };

export function roleHome(role: AppRole): string {
  switch (role) {
    case "super-admin":
    case "admin":
      return "/admin";
    case "vsr":
      return "/vsr-operations";
    case "merchandiser":
      return "/merchandiser";
    case "tsr":
      return "/tsr";
    case "supervisor":
      return "/supervisor";
    default:
      return "/portal/field-team";
  }
}

export const demoUsers: Record<string, User> = {
  "superadmin@kea.com": { email: "superadmin@kea.com", name: "Super Admin", role: "super-admin", allowedClientIds: ["client-a", "client-b"] },
  "admin@kea.com": { email: "admin@kea.com", name: "KEA Administrator", role: "admin", allowedClientIds: ["client-a", "client-b"] },
  "vsr@kea.com": { email: "vsr@kea.com", name: "VSR", role: "vsr", allowedClientIds: ["client-a"] },
  "supervisor@kea.com": { email: "supervisor@kea.com", name: "Supervisor", role: "supervisor", allowedClientIds: ["client-a"] },
  "merchandiser@kea.com": { email: "merchandiser@kea.com", name: "Merchandiser", role: "merchandiser", allowedClientIds: ["client-a"] },
  "tsr@kea.com": { email: "tsr@kea.com", name: "TSR", role: "tsr", allowedClientIds: ["client-a"] },
  "fieldteam@kea.com": { email: "fieldteam@kea.com", name: "Field Team", role: "field-team", allowedClientIds: ["client-a"] },
};

function mapProfile(profile: { id: string; email: string; name: string; role: string; client_id?: string | null }): User {
  const roleMap: Record<string, AppRole> = {
    super_admin: "super-admin", admin: "admin", vsr: "vsr",
    supervisor: "supervisor", merchandiser: "merchandiser", tsr: "tsr",
  };
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: roleMap[profile.role] ?? "field-team",
    allowedClientIds: profile.client_id ? [profile.client_id] : ["client-a", "client-b"],
  };
}

function mapSupabaseUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  const metadata = authUser.user_metadata ?? {};
  const role = metadata.role;
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: typeof metadata.name === "string" ? metadata.name : authUser.email ?? "KEA user",
    role:
      role === "super-admin" || role === "admin" || role === "vsr" || role === "supervisor" ||
      role === "merchandiser" || role === "tsr" || role === "field-team"
        ? role
        : "field-team",
    allowedClientIds: Array.isArray(metadata.allowedClientIds) ? metadata.allowedClientIds.filter((value): value is string => typeof value === "string") : ["client-a"],
  };
}

export default function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("kea_user");
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Try fetching the current Supabase session
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Fetch profile from public.users for the canonical role
        supabase
          .from("users")
          .select("id, email, name, role, client_id")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) setUser(mapProfile(profile));
            else setUser(mapSupabaseUser(data.user!));
          });
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("kea_user");
        document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
      } else if (session?.user) {
        supabase
          .from("users")
          .select("id, email, name, role, client_id")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) setUser(mapProfile(profile));
            else setUser(mapSupabaseUser(session.user));
          });
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try { localStorage.setItem("kea_user", JSON.stringify(user)); } catch { /* ignore */ }
  }, [user]);

  async function signUp(name: string, email: string, password: string, role: AppRole): Promise<User> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (!error && data.user) {
      const newUser = mapSupabaseUser(data.user);
      setUser(newUser);
      return newUser;
    }
    // Fall back to demo
    const demoUser: User = { email, name, role, allowedClientIds: ["client-a"] };
    setUser(demoUser);
    return demoUser;
  }

  async function signIn(email: string, password: string): Promise<User> {
    const emailLower = email.toLowerCase();
    const supabase = createClient();

    // Step 1: Try real Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailLower, password });
      if (!error && data.user) {
        // Fetch profile from public.users
        const { data: profile } = await supabase
          .from("users")
          .select("id, email, name, role, client_id")
          .eq("id", data.user.id)
          .single();

        const signedInUser = profile ? mapProfile(profile) : mapSupabaseUser(data.user);
        setUser(signedInUser);
        return signedInUser;
      }
    } catch (supabaseError) {
      console.warn("Supabase auth failed, falling back to demo:", supabaseError);
    }

    // Step 2: Fall back to demo login
    const demoUser = demoUsers[emailLower];
    if (demoUser && password === "kea12345") {
      setUser(demoUser);
      return demoUser;
    }

    if (!demoUser) {
      throw new Error(`Account ${emailLower} is not configured. Try one of the demo accounts.`);
    }
    throw new Error("Invalid password. The demo password is 'kea12345'.");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("kea_user");
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
  }

  async function resetPassword(email: string) {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: origin ? `${origin}/login` : "/login",
    });
    if (error) throw error;
  }

  return { user, loading, setUser, signUp, signIn, signOut, resetPassword } as const;
}
