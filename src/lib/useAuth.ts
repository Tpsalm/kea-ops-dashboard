"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type AppRole = "super-admin" | "vsr" | "supervisor" | "field-team";
export type User = { id?: string; email: string; name: string; role: AppRole; allowedClientIds: string[] };

export const demoUsers: Record<string, User> = {
  "superadmin@kea.com": { email: "superadmin@kea.com", name: "Super Admin", role: "super-admin", allowedClientIds: ["client-a", "client-b"] },
  "vsr@kea.com": { email: "vsr@kea.com", name: "VSR Demo", role: "vsr", allowedClientIds: ["client-a"] },
  "supervisor@kea.com": { email: "supervisor@kea.com", name: "Supervisor Demo", role: "supervisor", allowedClientIds: ["client-a"] },
  "fieldteam@kea.com": { email: "fieldteam@kea.com", name: "Field Team Demo", role: "field-team", allowedClientIds: ["client-a"] },
};

function mapSupabaseUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  const metadata = authUser.user_metadata ?? {};
  const role = metadata.role;
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: typeof metadata.name === "string" ? metadata.name : authUser.email ?? "KEA user",
    role: role === "super-admin" || role === "vsr" || role === "supervisor" || role === "field-team" ? role : "field-team",
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

  async function signIn(email: string, password: string): Promise<User> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const signedInUser = mapSupabaseUser(data.user);
        setUser(signedInUser);
        return signedInUser;
      }

      const configuredDemo = demoUsers[email.toLowerCase()];
      if (configuredDemo && password === "kea12345") {
        setUser(configuredDemo);
        return configuredDemo;
      }
      throw error ?? new Error("Unable to sign in.");
    }
    const demo = demoUsers[email.toLowerCase()];
    if (!demo || password !== "kea12345") throw new Error("Use a configured Supabase account or a demo login.");
    setUser(demo);
    return demo;
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

  return { user, loading, setUser, signIn, signOut, resetPassword } as const;
}
