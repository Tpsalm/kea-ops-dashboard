"use client";

import { useState } from "react";
import { UserPlus, Check, X, Shield, MapPin, Phone, Mail, User } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function UserOnboarding({ onUserCreated }: { onUserCreated?: () => void }) {
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<"merchandiser" | "vsr">("merchandiser");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Lagos");
  const [state, setState] = useState("Lagos");
  const [lga, setLga] = useState("");
  const [territory, setTerritory] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          phone,
          region,
          state,
          lga,
          territory: territory || `${region} Route`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user profile");
      }

      toast(`${role === "merchandiser" ? "Merchandiser" : "VSR"} provisioned successfully`);
      setName("");
      setEmail("");
      setPhone("");
      setLga("");
      setTerritory("");
      setShow(false);
      onUserCreated?.();
    } catch (err: any) {
      toast(err.message || "Failed to onboard user", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      background: "var(--card, #fff)", borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
      padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: 8, background: "#ecfdf5", color: "#10b981", borderRadius: 8 }}>
            <UserPlus size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
              User Onboarding Center
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
              Provision and configure new Merchandiser and Van Sales Representative (VSR) profiles
            </p>
          </div>
        </div>

        <button
          onClick={() => setShow(!show)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 8, border: "none", background: "#10b981", color: "#fff",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}
        >
          <UserPlus size={14} /> Provision Field User
        </button>
      </div>

      {show && (
        <form onSubmit={handleSubmit} style={{
          padding: 16, borderRadius: 12, border: "1px solid #a7f3d0",
          background: "#ecfdf5", display: "flex", flexDirection: "column", gap: 12
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#065f46" }}>
            Provision Field Profile under Your Direct Supervision
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>
              Field Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, background: "#fff" }}
              >
                <option value="merchandiser">Merchandiser</option>
                <option value="vsr">Van Sales Representative (VSR)</option>
              </select>
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>
              Full Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Samuel Olamide"
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, background: "#fff" }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>
              Corporate Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="samuel.olamide@kea.com"
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, background: "#fff" }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>
              Phone Number
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 000 0000"
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, background: "#fff" }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>
              Region
              <select
                value={region}
                onChange={(e) => { setRegion(e.target.value); setState(e.target.value); }}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, background: "#fff" }}
              >
                <option value="Lagos">Lagos</option>
                <option value="Ogun">Ogun</option>
                <option value="Oyo">Oyo</option>
                <option value="Delta">Delta</option>
                <option value="Abuja">Abuja (FCT)</option>
                <option value="Rivers">Rivers</option>
              </select>
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>
              LGA / Area
              <input
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                placeholder="e.g. Ikeja / Eti-Osa"
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, background: "#fff" }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>
              Assigned Territory / Route
              <input
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                placeholder="e.g. Lagos Central Route A"
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, background: "#fff" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setShow(false)}
              style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 18px",
                borderRadius: 6, border: "none", background: "#10b981", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1
              }}
            >
              <Check size={14} />
              {busy ? "Provisioning..." : "Provision User Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
