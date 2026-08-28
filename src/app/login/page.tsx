"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import useAuth from "../../lib/useAuth";

const roles = [
  ["superadmin@kea.com", "Super Admin", "Authorise divisions, accounts, and new outlets"],
  ["vsr@kea.com", "VSR", "Route execution and store visits"],
  ["supervisor@kea.com", "Supervisor", "Team coverage and approvals"],
  ["fieldteam@kea.com", "Merchandiser / TSR", "Store execution and field activity"],
] as const;

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
      router.push(signedInUser.role === "super-admin" ? "/" : `/portal/${signedInUser.role}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand"><div className="brand-mark">K</div><p>KEA GROUP</p><h1>Talent management<br />for every field team.</h1><span>One secure workspace for people, outlets, routes, and growth.</span></section>
      <section className="auth-panel">
        <div className="auth-kicker"><ShieldCheck size={16} /> SECURE WORKSPACE</div>
        <h2>Sign in to KEA</h2><p className="auth-muted">Use your organisation account to open the right dashboard.</p>
        <form onSubmit={submit}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary auth-submit" disabled={busy}>{busy ? "Signing in..." : "Continue"}<ArrowRight size={16} /></button>
        </form>
        <div className="demo-access"><div><KeyRound size={15} /><b>Review access by role</b></div><small>Demo password: <strong>kea12345</strong></small>{roles.map(([address, label, description]) => <button type="button" key={address} onClick={() => { setEmail(address); setPassword("kea12345"); }}><span><b>{label}</b><small>{description}</small></span><ArrowRight size={15} /></button>)}</div>
      </section>
    </main>
  );
}
