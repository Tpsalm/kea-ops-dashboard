"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth, { roleHome } from "../lib/useAuth";

/**
 * Master Dashboard Router
 * 
 * This is the unified entry point for all KEA users.
 * When a user signs in and visits the home page (/), they are automatically
 * routed to their role-specific dashboard:
 * 
 * - Super Admin (super-admin) → /admin
 * - Admin (admin) → /admin
 * - VSR (vsr) → /vsr-operations
 * - Merchandiser (merchandiser) → /merchandiser
 * - TSR (tsr) → /tsr
 * - Supervisor (supervisor) → /portal/supervisor
 * - Field Team (field-team) → /portal/field-team
 * 
 * Unauthenticated users are redirected to /login
 */
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
