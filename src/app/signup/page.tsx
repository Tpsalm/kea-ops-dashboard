"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import useAuth, { roleHome, type AppRole } from "../../lib/useAuth";

const roleOptions: { label: string; value: AppRole }[] = [
  { label: "VSR", value: "vsr" },
  { label: "Merchandiser", value: "merchandiser" },
  { label: "TSR", value: "tsr" },
  { label: "Supervisor", value: "supervisor" },
];

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("merchandiser");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const newUser = await signUp(name, email, password, role);
      document.cookie = "kea_auth=1; Path=/; Max-Age=28800; SameSite=Lax";
      router.push(roleHome(newUser.role));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="brand-logo auth-logo" aria-label="KEA Corporate Hospitality Services"><b className="logo-k">k</b><b className="logo-e">e</b><b className="logo-a">a</b><small>Corporate Hospitality Services</small></div>
        <p>KEA GROUP</p>
        <h1>Join the field operations workspace.</h1>
        <span>Create your account to access your role-based dashboard and start capturing field performance.</span>
      </section>
      <section className="auth-panel">
        <div className="auth-kicker"><ShieldCheck size={16} /> CREATE ACCOUNT</div>
        <h2>Sign up to KEA</h2>
        <p className="auth-muted">Choose your role to be routed to the correct dashboard after sign-up.</p>
        <form onSubmit={submit}>
          <label>Full name<input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. KEA Field User" required /></label>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@kea.com" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" required minLength={6} /></label>
          <label>Role
            <select value={role} onChange={(event) => setRole(event.target.value as AppRole)} required>
              {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary auth-submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}<ArrowRight size={16} /></button>
        </form>
        <p className="auth-policy">Already have an account? <Link href="/login" style={{ fontWeight: 700, color: "#138a76" }}>Sign in</Link></p>
      </section>
    </main>
  );
}
