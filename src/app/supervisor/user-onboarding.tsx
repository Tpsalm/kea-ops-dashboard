"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function UserOnboarding() {
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [role, setRole] = useState("merchandiser");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, phone, region }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }
      toast(`${role === "merchandiser" ? "Merchandiser" : "VSR"} created successfully`);
      setName(""); setEmail(""); setPhone(""); setRegion("");
      setShow(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #111)", display: "flex", alignItems: "center", gap: 8 }}>
          <UserPlus size={16} /> User Onboarding
        </h3>
        <button
          onClick={() => setShow(!show)}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
            borderRadius: 6, border: "none", background: "var(--teal, #0e918a)", color: "#fff",
            fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}
        >
          <UserPlus size={14} /> New User
        </button>
      </div>

      {show && (
        <form onSubmit={handleSubmit} style={{
          padding: 16, borderRadius: 10, border: "1px solid var(--line, #e5e7eb)",
          background: "var(--bg, #f9fafb)", display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 12 }}>
                <option value="merchandiser">Merchandiser</option>
                <option value="vsr">Van Sales Rep (VSR)</option>
              </select>
            </label>
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 12 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 12 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 12 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Region
              <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 12 }}>
                <option value="">Select region</option>
                <option value="Lagos">Lagos</option>
                <option value="Ogun">Ogun</option>
                <option value="Oyo">Oyo</option>
                <option value="Delta">Delta</option>
                <option value="North">North</option>
                <option value="South East">South East</option>
                <option value="South South">South South</option>
                <option value="Port Harcourt">Port Harcourt</option>
                <option value="Owerri">Owerri</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "8px 16px", borderRadius: 6, border: "none",
              background: "var(--teal, #0e918a)", color: "#fff",
              fontWeight: 600, fontSize: 12, cursor: "pointer", opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Creating…" : "Create User"}
          </button>
        </form>
      )}
    </div>
  );
}
