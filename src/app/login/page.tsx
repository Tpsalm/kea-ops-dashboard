"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import useAuth from "../../lib/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("superadmin@kea.com");
  const [password, setPassword] = useState("kea12345");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signedInUser = await signIn(email, password);
      router.push(signedInUser.role === "super-admin" ? "/admin" : `/portal/${signedInUser.role}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand"><div className="brand-logo auth-logo" aria-label="KEA Corporate Hospitality Services"><b className="logo-k">k</b><b className="logo-e">e</b><b className="logo-a">a</b><small>Corporate Hospitality Services</small></div><p>KEA GROUP</p><h1>Talent management<br />for every field team.</h1><span>One secure workspace for people, outlets, routes, and growth.</span></section>
      <section className="auth-panel">
        <div className="auth-kicker"><ShieldCheck size={16} /> SECURE WORKSPACE</div>
        <h2>Sign in to KEA</h2><p className="auth-muted">Use the organisation account created for you by the Super Admin.</p>
        <form onSubmit={submit}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary auth-submit" disabled={busy}>{busy ? "Signing in..." : "Continue"}<ArrowRight size={16} /></button>
        </form>
        <p className="auth-policy">No self-service sign up. Contact your Super Admin if you need an account or password reset.</p>
      </section>
    </main>
  );
}
