"use client";

import { useEffect, useState } from "react";

export type User = { role: 'admin' | 'management' | 'operations' | 'client'; allowedClientIds: string[] };

// Minimal auth hook for local development. Replace with your real auth provider.
export default function useAuth() {
  const [user, setUser] = useState<User>({ role: 'admin', allowedClientIds: ['client-a'] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kea_user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kea_user', JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  }, [user]);

  return { user, setUser } as const;
}
