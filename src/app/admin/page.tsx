"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SuperAdminDashboard from "./super-admin-dashboard";
import useAuth, { roleHome } from "../../lib/useAuth";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "super-admin" || user?.role === "admin";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && !isAdmin) router.replace(roleHome(user.role));
  }, [loading, router, user, isAdmin]);

  if (loading || !user || !isAdmin) return <main className="auth-loading">Checking secure workspace...</main>;
  return <SuperAdminDashboard />;
}
