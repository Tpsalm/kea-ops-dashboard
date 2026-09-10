"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, AlertTriangle, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface DebtInfo {
  currentDebt: number;
  isEligible: boolean;
  pendingApplications: number;
  detail: string;
}

interface Loan {
  id: string;
  amount: string;
  status: string;
  purpose: string;
  application_date: string;
  supervisor_notes: string;
  admin_notes: string;
}

export function FundingApplication() {
  const { toast } = useToast();
  const [debt, setDebt] = useState<DebtInfo | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      const vsrId = me.user?.id;
      if (!vsrId) return;

      const [debtRes, loansRes] = await Promise.all([
        fetch(`/api/loans/validate-debt/${vsrId}`),
        fetch("/api/loans"),
      ]);
      if (debtRes.ok) setDebt(await debtRes.json());
      if (loansRes.ok) { const d = await loansRes.json(); setLoans(d.loans ?? []); }
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed");
      toast("Funding application submitted — your supervisor will review");
      setAmount(""); setPurpose(""); setShowForm(false);
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Debt Status Card */}
      <div style={{
        padding: 16, borderRadius: 12, marginBottom: 16,
        border: debt?.isEligible ? "1px solid #dcfce7" : "1px solid #fef3c7",
        background: debt?.isEligible ? "#f0fdf4" : "#fffbeb",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          {debt?.isEligible ? <CheckCircle size={18} style={{ color: "#16a34a" }} /> : <AlertTriangle size={18} style={{ color: "#d97706" }} />}
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text, #111)" }}>
            Loan Status
          </span>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted, #6b7280)" }}>
          {debt ? debt.detail : "Loading…"}
        </div>
        {debt && debt.pendingApplications > 0 && (
          <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>
            You have {debt.pendingApplications} pending application(s).
          </div>
        )}
      </div>

      {/* Apply Button */}
      {debt?.isEligible && (
        <>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              borderRadius: 8, border: "none", background: "var(--teal, #0e918a)", color: "#fff",
              fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 16,
            }}
          >
            <Banknote size={16} /> Apply for Funding
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} style={{
              padding: 16, borderRadius: 10, border: "1px solid var(--line, #e5e7eb)",
              background: "var(--bg, #f9fafb)", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10,
            }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Amount (₦)
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 250000"
                  min="1"
                  required
                  style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 13 }}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Purpose
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe the purpose of this funding request"
                  rows={3}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 13, resize: "vertical" }}
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: "10px 16px", borderRadius: 6, border: "none",
                  background: "var(--teal, #0e918a)", color: "#fff",
                  fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? "Submitting…" : "Submit Application"}
              </button>
            </form>
          )}
        </>
      )}

      {/* My Applications */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #111)", marginBottom: 10 }}>My Applications</h3>
      {loans.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", borderRadius: 12, border: "1px dashed var(--line, #e5e7eb)", color: "var(--muted, #6b7280)", fontSize: 13 }}>
          No applications yet
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {loans.map((loan) => (
            <div key={loan.id} style={{
              padding: "12px 16px", borderRadius: 10,
              border: "1px solid var(--line, #e5e7eb)", background: "var(--card, #fff)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>₦{Number(loan.amount).toLocaleString()}</span>
                <StatusBadge value={loan.status} />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 4 }}>
                Applied {new Date(loan.application_date).toLocaleDateString()}
                {loan.purpose && ` · ${loan.purpose}`}
              </div>
              {loan.supervisor_notes && (
                <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontStyle: "italic" }}>
                  Supervisor: {loan.supervisor_notes}
                </div>
              )}
              {loan.admin_notes && (
                <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 4, fontStyle: "italic" }}>
                  Admin: {loan.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
