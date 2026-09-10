"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, AlertTriangle, CheckCircle, Clock, ShieldAlert, Send, ArrowRight, Lock, Check } from "lucide-react";
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
  amount: string | number;
  status: string;
  purpose: string;
  application_date?: string;
  created_at?: string;
  supervisor_notes?: string;
  admin_notes?: string;
  disbursement_date?: string;
}

export function FundingApplication() {
  const { toast } = useToast();
  const [debt, setDebt] = useState<DebtInfo | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await fetch("/api/auth/me").then((r) => r.json());
      const vsrId = me.user?.id;
      if (!vsrId) return;

      const [debtRes, loansRes] = await Promise.all([
        fetch(`/api/loans/validate-debt/${vsrId}`),
        fetch("/api/loans"),
      ]);
      if (debtRes.ok) setDebt(await debtRes.json());
      if (loansRes.ok) {
        const d = await loansRes.json();
        setLoans(d.loans ?? []);
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (!purpose.trim()) {
      toast("Please provide the business purpose", "error");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), purpose: purpose.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed");

      toast("Funding application submitted — routed to your Supervisor for triage!");
      setAmount("");
      setPurpose("");
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to submit application", "error");
    } finally {
      setBusy(false);
    }
  }

  const isBlocked = debt ? !debt.isEligible || debt.currentDebt > 0 : false;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* ─── SYSTEM VALIDATION GATE CARD ─── */}
      <div style={{
        padding: 20, borderRadius: 16, border: isBlocked ? "1px solid #fed7aa" : "1px solid #bbf7d0",
        background: isBlocked ? "#fffbeb" : "#f0fdf4", boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              borderRadius: 10, background: isBlocked ? "#fef3c7" : "#dcfce7",
              color: isBlocked ? "#d97706" : "#16a34a", display: "flex", padding: 8
            }}>
              {isBlocked ? <Lock size={22} /> : <CheckCircle size={22} />}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: isBlocked ? "#9a3412" : "#14532d" }}>
                  {isBlocked ? "Ineligible due to active loan debt." : "Eligible for Business Funding"}
                </h3>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                  background: isBlocked ? "#fee2e2" : "#dcfce7", color: isBlocked ? "#dc2626" : "#16a34a"
                }}>
                  {isBlocked ? "System Gate: Locked" : "System Gate: Open"}
                </span>
              </div>
              <p style={{ fontSize: 13, color: isBlocked ? "#b45309" : "#166534", margin: "6px 0 0" }}>
                {debt ? (
                  isBlocked
                    ? `Ineligible due to active loan debt. You have an outstanding balance of ₦${Number(debt.currentDebt).toLocaleString('en-NG', { minimumFractionDigits: 2 })}. Repay all existing debt to unlock new working capital.`
                    : "No active debt detected. You are authorized to apply for route inventory expansion & working capital."
                ) : (
                  "Verifying debt ledger..."
                )}
              </p>
            </div>
          </div>

          {!isBlocked && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
                borderRadius: 8, border: "none", background: "#0e918a", color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(14, 145, 138, 0.25)"
              }}
            >
              <Banknote size={16} /> {showForm ? "Close Form" : "Apply for Funding"}
            </button>
          )}
        </div>
      </div>

      {/* ─── SELF-SERVICE APPLICATION FORM ─── */}
      {showForm && !isBlocked && (
        <form onSubmit={handleSubmit} style={{
          padding: 20, borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
          background: "var(--card, #fff)", display: "flex", flexDirection: "column", gap: 14,
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
        }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "var(--text, #111)" }}>
              VSR Self-Service Funding Application
            </h4>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: "2px 0 0" }}>
              Requests are first triaged by your Supervisor before escalating to Super Admin
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text, #111)" }}>
              Requested Amount (₦)
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 250000"
                min="1000"
                required
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
                  borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", fontSize: 13, fontWeight: 600
                }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text, #111)" }}>
              Route & Inventory Purpose Justification
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Q3 inventory expansion for Lagos Central wholesale outlets"
                required
                style={{
                  display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
                  borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", fontSize: 13
                }}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                background: "#f9fafb", fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 20px",
                borderRadius: 8, border: "none", background: "#0e918a", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1
              }}
            >
              <Send size={14} />
              {busy ? "Routing to Supervisor..." : "Submit to Supervisor"}
            </button>
          </div>
        </form>
      )}

      {/* ─── MULTI-STAGE HIERARCHY APPLICATION TRACKER ─── */}
      <div style={{
        background: "var(--card, #fff)", borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
        padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
      }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 14px", color: "var(--text, #111)" }}>
          My Funding Applications & Stage History
        </h4>

        {loans.length === 0 ? (
          <div style={{
            padding: 28, textAlign: "center", borderRadius: 12,
            border: "1px dashed var(--line, #e5e7eb)", color: "var(--muted, #6b7280)", fontSize: 13
          }}>
            No previous loan applications found.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {loans.map((loan) => {
              const statusStep =
                loan.status === "pending_supervisor" ? 1 :
                loan.status === "pending_admin" ? 2 :
                loan.status === "approved" || loan.status === "disbursed" ? 3 : 0;

              return (
                <div key={loan.id} style={{
                  padding: 16, borderRadius: 12, border: "1px solid var(--line, #e5e7eb)",
                  background: "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text, #111)" }}>
                        ₦{Number(loan.amount).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginLeft: 8 }}>
                        Applied {new Date(loan.application_date || loan.created_at || "").toLocaleDateString()}
                      </span>
                    </div>
                    <StatusBadge value={loan.status} />
                  </div>

                  <p style={{ fontSize: 13, color: "var(--text, #111)", margin: "0 0 10px" }}>
                    Purpose: <strong>{loan.purpose}</strong>
                  </p>

                  {/* Multi-Stage Step Track */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: 10,
                    borderRadius: 8, background: "#fff", border: "1px solid var(--line, #e5e7eb)", fontSize: 11
                  }}>
                    <div style={{ color: statusStep >= 1 ? "#0e918a" : "var(--muted, #6b7280)", fontWeight: statusStep === 1 ? 800 : 600 }}>
                      1. Supervisor Triage {statusStep > 1 && "✓"}
                    </div>
                    <div style={{ color: statusStep >= 2 ? "#d97706" : "var(--muted, #6b7280)", fontWeight: statusStep === 2 ? 800 : 600 }}>
                      2. Admin Review {statusStep > 2 && "✓"}
                    </div>
                    <div style={{ color: statusStep >= 3 ? "#16a34a" : "var(--muted, #6b7280)", fontWeight: statusStep === 3 ? 800 : 600 }}>
                      3. Disbursement {statusStep >= 3 && "✓"}
                    </div>
                  </div>

                  {loan.supervisor_notes && (
                    <div style={{ fontSize: 12, color: "#0e918a", marginTop: 8, fontStyle: "italic" }}>
                      Supervisor Note: "{loan.supervisor_notes}"
                    </div>
                  )}
                  {loan.admin_notes && (
                    <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 4, fontStyle: "italic" }}>
                      Admin Note: "{loan.admin_notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
