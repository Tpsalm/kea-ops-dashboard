"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "../dashboard";
import useAuth from "../../lib/useAuth";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && user.role !== "super-admin") router.replace(`/portal/${user.role}`);
  }, [loading, router, user]);

  if (loading || !user || user.role !== "super-admin") return <main className="auth-loading">Checking secure workspace...</main>;
  return <Dashboard />;
}
