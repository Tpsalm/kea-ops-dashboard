"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import useAuth, { roleHome } from "../../lib/useAuth";

const roleAccess = [
  { label: "Supervisor", email: "supervisor@kea.com", description: "Coordinate field teams and approvals." },
  { label: "VSR", email: "vsr@kea.com", description: "Manage routes, visits, and funding." },
  { label: "Merchandiser", email: "merchandiser@kea.com", description: "Capture store execution and evidence." },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("superadmin@kea.com");
  const [password, setPassword] = useState("kea12345");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signedInUser = await signIn(email, password);
      document.cookie = "kea_auth=1; Path=/; Max-Age=28800; SameSite=Lax";
      if (typeof window !== "undefined") {
        sessionStorage.setItem("kea_urgent_login_alert", "true");
        sessionStorage.setItem("kea_last_login_role", signedInUser.role);
        sessionStorage.setItem("kea_last_login_name", signedInUser.name);
        sessionStorage.setItem("kea_last_login_time", Date.now().toString());
        localStorage.setItem("kea_user_name", signedInUser.name);
        localStorage.setItem("kea_user_email", signedInUser.email);
        localStorage.setItem("kea_user_role", signedInUser.role);
      }
      const defaultPath = roleHome(signedInUser.role);
      const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      router.push(nextPath?.startsWith("/admin") || nextPath?.startsWith("/portal/") ? nextPath : defaultPath);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function recoverPassword() {
    setBusy(true);
    setError("");
    try {
      await resetPassword(email);
      setRecoverySent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send recovery email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand"><div className="brand-logo auth-logo" aria-label="Kea Corporate Hospitality Services"><b className="logo-k">k</b><b className="logo-e">e</b><b className="logo-a">a</b><small>Corporate Hospitality Services</small></div><h1>Talent management<br />for every field team.</h1><span>One secure workspace for people, outlets, routes, and growth.</span></section>
      <section className="auth-panel">
        <div className="auth-kicker"><ShieldCheck size={16} /> SECURE WORKSPACE</div>
        <h2>Sign in to KEA</h2><p className="auth-muted">Choose your operational workspace. Your account determines the single dashboard and data you can access.</p>
        <div className="role-access" aria-label="Operational role access">
          {roleAccess.map((option) => (
            <button
              key={option.email}
              type="button"
              className={email === option.email ? "role-access-option active" : "role-access-option"}
              onClick={() => { setEmail(option.email); setPassword("kea12345"); setError(""); }}
            >
              <span><strong>{option.label}</strong><small>{option.description}</small></span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
        <form onSubmit={submit}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button type="button" className="auth-recovery" onClick={recoverPassword} disabled={busy}>Forgot password?</button>
          {error && <p className="auth-error">{error}</p>}
          {recoverySent && <p className="auth-success">Recovery email sent. Check your inbox.</p>}
          <button className="primary auth-submit" disabled={busy}>{busy ? "Signing in..." : "Continue"}<ArrowRight size={16} /></button>
        </form>
        <div className="admin-console-note"><ShieldCheck size={16} /><span><strong>Super Admin Console</strong><small>Executive governance, approvals, and global monitoring use a separate admin account.</small></span></div>
        <p className="auth-policy">No account yet? <Link href="/signup" style={{ fontWeight: 700, color: "#138a76" }}>Create an account</Link></p>
      </section>
    </main>
  );
}
