"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

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
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    try {
      localStorage.getItem("kea_user");
    } catch {
      return;
    }
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user ? mapSupabaseUser(data.user) : null);
        setLoading(false);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
        setLoading(false);
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kea_user', JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  }, [user]);

  async function signUp(name: string, email: string, password: string, role: AppRole): Promise<User> {
    if (supabase) {
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
    }
    const demoUser: User = { email, name, role, allowedClientIds: ["client-a"] };
    setUser(demoUser);
    return demoUser;
  }

  async function signIn(email: string, password: string): Promise<User> {
    const emailLower = email.toLowerCase();
    const demoUser = demoUsers[emailLower];

    // Step 1: Try Supabase if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: emailLower, password });
        if (!error && data.user) {
          const signedInUser = mapSupabaseUser(data.user);
          setUser(signedInUser);
          return signedInUser;
        }
      } catch (supabaseError) {
        console.warn("Supabase auth failed, falling back to demo:", supabaseError);
      }
    }

    // Step 2: Fall back to demo login for configured demo users
    if (demoUser && password === "kea12345") {
      setUser(demoUser);
      return demoUser;
    }

    // Step 3: No valid auth method worked
    if (!demoUser) {
      throw new Error(`Account ${emailLower} is not configured. Try one of the demo accounts.`);
    }
    throw new Error("Invalid password. The demo password is 'kea12345'.");
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("kea_user");
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
  }

  async function resetPassword(email: string) {
    if (!supabase) throw new Error("Password recovery requires a configured Supabase account.");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: origin ? `${origin}/login` : "/login",
    });
    if (error) throw error;
  }

  return { user, loading, setUser, signUp, signIn, signOut, resetPassword } as const;
}
