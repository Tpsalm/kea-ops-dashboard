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
        if (data.user) {
          const metadata = data.user.user_metadata ?? {};
          setUser({ id: data.user.id, email: data.user.email ?? "", name: metadata.name ?? data.user.email ?? "KEA user", role: metadata.role ?? "field-team", allowedClientIds: metadata.allowedClientIds ?? ["client-a"] });
        }
        setLoading(false);
      });
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
      if (error) throw error;
      const metadata = data.user.user_metadata ?? {};
      const signedInUser = { id: data.user.id, email, name: metadata.name ?? email, role: metadata.role ?? "field-team", allowedClientIds: metadata.allowedClientIds ?? ["client-a"] } as User;
      setUser(signedInUser);
      return signedInUser;
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
  }

  return { user, loading, setUser, signIn, signOut } as const;
}
