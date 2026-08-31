"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth, { roleHome } from "../lib/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else router.replace(roleHome(user.role));
  }, [loading, router, user]);

  return <main className="auth-loading">Loading your dashboard...</main>;
}
