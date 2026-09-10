"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2, Users, Banknote, AlertTriangle, CheckCircle, FileText,
  Clock, ShieldAlert, Check, X, Search, Filter, RefreshCw, ChevronRight,
  TrendingUp, ArrowUpRight, UserCheck, DollarSign
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AlertBadge } from "@/components/ui/alert-badge";
import { useToast } from "@/components/ui/toast";

interface AdminKpis {
  totalMerchandisers: number;
  totalOutlets: number;
  dueForFunding: number;
  activeLoans: number;
  noActiveLoans: number;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  from_user_id: string;
  status: string;
  created_at: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

interface Loan {
  id: string;
  vsr_id: string;
  amount: string | number;
  purpose?: string;
  status: string;
  application_date?: string;
  created_at?: string;
  supervisor_notes?: string;
  supervisor_review_date?: string;
  outstanding_balance?: number;
}

interface VSRItem {
  id: string;
  name: string;
  email: string;
  region?: string;
  territory?: string;
  supervisor_id?: string;
  loan_debt: number;
  status: string;
}

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [escalatedLoans, setEscalatedLoans] = useState<Loan[]>([]);
  const [vsrList, setVsrList] = useState<VSRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<"due" | "active" | "no_debt" | "all_loans">("due");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [kpisRes, alertsRes, loansRes, vsrRes] = await Promise.all([
        fetch("/api/kpis?scope=admin"),
        fetch("/api/alerts?status=pending_admin"),
        fetch("/api/loans?status=pending_admin"),
        fetch("/api/users?role=vsr"),
      ]);

      if (kpisRes.ok) setKpis(await kpisRes.json());
      if (alertsRes.ok) {
        const d = await alertsRes.json();
        setAlerts(d.alerts ?? []);
      }
      if (loansRes.ok) {
        const d = await loansRes.json();
        setEscalatedLoans(d.loans ?? []);
      }
      if (vsrRes.ok) {
        const d = await vsrRes.json();
        setVsrList(d.users ?? []);
      }
    } catch {
      // Offline / fallback state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserId(d.user?.id ?? ""))
      .catch(() => {});
  }, [fetchData]);

  async function handleLoanReview(loanId: string, approved: boolean, notes: string = "") {
    setProcessingId(loanId);
    try {
      const res = await fetch(`/api/loans/${loanId}/admin-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, notes }),
      });
      if (!res.ok) throw new Error("Review action failed");
      toast(approved ? "Loan approved and scheduled for disbursement" : "Loan rejected");
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to process review", "error");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleAlertResolve(alertId: string) {
    setProcessingId(alertId);
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to resolve alert");
      toast("Alert resolved");
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed", "error");
    } finally {
      setProcessingId(null);
    }
  }

  // Filtered VSRs for analytics grid
  const activeDebtVSRs = vsrList.filter((v) => Number(v.loan_debt) > 0);
  const debtFreeVSRs = vsrList.filter((v) => Number(v.loan_debt) === 0);

  const displayedVSRs = vsrList.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.territory && v.territory.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === "active") return Number(v.loan_debt) > 0;
    if (activeTab === "no_debt") return Number(v.loan_debt) === 0;
    return true;
  });

  return (
    <AppShell contentClassName="page-admin">
      {/* Header Section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0e918a", letterSpacing: ".08em", textTransform: "uppercase" }}>
              SUPER ADMIN · EXECUTIVE VIEW
            </span>
            <span style={{ fontSize: 11, background: "rgba(14, 145, 138, 0.1)", color: "#0e918a", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
              Live Hierarchy Chain
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text, #111)", margin: "6px 0 2px" }}>
            Field Operations & Financial Executive Command
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted, #6b7280)", margin: 0 }}>
            Cross-client operational overview, centralized multi-stage approvals, and debt surveillance.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", background: "var(--card, #fff)",
              color: "var(--text, #111)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <AlertBadge userId={userId} />
        </div>
      </div>

      {/* ─── 1. HIGH-LEVEL KPI COUNTERS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard
          label="Total Merchandisers"
          value={kpis?.totalMerchandisers ?? 0}
          icon={Users}
          tone="teal"
          subtitle="Global active field force"
        />
        <KpiCard
          label="Total Outlets"
          value={kpis?.totalOutlets ?? 0}
          icon={Building2}
          tone="blue"
          subtitle="Global monitored footprint"
        />
        <KpiCard
          label="Due for Funding"
          value={escalatedLoans.length || (kpis?.dueForFunding ?? 0)}
          icon={Banknote}
          tone="amber"
          subtitle="Supervisor endorsed & waiting"
        />
        <KpiCard
          label="Active Loans (In Debt)"
          value={kpis?.activeLoans ?? activeDebtVSRs.length}
          icon={AlertTriangle}
          tone="red"
          subtitle="Outstanding loan balance"
        />
        <KpiCard
          label="No Active Loans"
          value={kpis?.noActiveLoans ?? debtFreeVSRs.length}
          icon={CheckCircle}
          tone="green"
          subtitle="Eligible for new funding"
        />
      </div>

      {/* ─── 2. CENTRALIZED GLOBAL ACTIONS MODULE ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
        padding: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, background: "#fef3c7", color: "#d97706", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
                Centralized Global Action Center
              </h2>
              <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
                Approve, reject, or disburse escalations and requests routed through the Supervisor tier
              </p>
            </div>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999,
            background: (escalatedLoans.length + alerts.length) > 0 ? "#fef3c7" : "#f3f4f6",
            color: (escalatedLoans.length + alerts.length) > 0 ? "#d97706" : "#6b7280",
          }}>
            {escalatedLoans.length + alerts.length} Escalations Pending
          </span>
        </div>

        {escalatedLoans.length === 0 && alerts.length === 0 ? (
          <div style={{
            padding: 36, textAlign: "center", borderRadius: 12,
            border: "1px dashed var(--line, #e5e7eb)", background: "#f9fafb",
            color: "var(--muted, #6b7280)", fontSize: 13,
          }}>
            <UserCheck size={28} style={{ margin: "0 auto 8px", opacity: 0.5, color: "#16a34a" }} />
            <div style={{ fontWeight: 600, color: "var(--text, #111)" }}>No pending escalations</div>
            <div>All requests routed from the Supervisor tier have been reviewed and finalized.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {/* Escalated Funding Requests */}
            {escalatedLoans.map((loan) => (
              <div key={loan.id} style={{
                padding: 16, borderRadius: 12, border: "1px solid #fed7aa",
                background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ padding: 8, background: "#fef3c7", color: "#d97706", borderRadius: 8 }}>
                    <Banknote size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#9a3412" }}>
                        Funding Escalation: ₦{Number(loan.amount).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, background: "#ffedd5", color: "#c2410c", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                        Supervisor Endorsed
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#78350f", margin: "4px 0 2px" }}>
                      Purpose: <strong style={{ color: "#111" }}>{loan.purpose || "Route Inventory Capital"}</strong>
                    </p>
                    {loan.supervisor_notes && (
                      <p style={{ fontSize: 12, color: "#b45309", fontStyle: "italic", margin: 0 }}>
                        Supervisor Endorsement Note: "{loan.supervisor_notes}"
                      </p>
                    )}
                    <span style={{ fontSize: 11, color: "#9a3412", opacity: 0.8 }}>
                      Submitted: {new Date(loan.application_date || loan.created_at || "").toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    disabled={processingId === loan.id}
                    onClick={() => handleLoanReview(loan.id, false, "Rejected by Super Admin")}
                    style={{
                      padding: "8px 14px", borderRadius: 8, border: "1px solid #fca5a5",
                      background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      opacity: processingId === loan.id ? 0.5 : 1
                    }}
                  >
                    <X size={14} /> Veto / Reject
                  </button>
                  <button
                    disabled={processingId === loan.id}
                    onClick={() => handleLoanReview(loan.id, true, "Approved for Immediate Disbursement")}
                    style={{
                      padding: "8px 18px", borderRadius: 8, border: "none",
                      background: "#0e918a", color: "#fff", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      boxShadow: "0 2px 8px rgba(14, 145, 138, 0.2)",
                      opacity: processingId === loan.id ? 0.5 : 1
                    }}
                  >
                    <Check size={14} /> Approve & Disburse
                  </button>
                </div>
              </div>
            ))}

            {/* Other Escalated Alerts (Documents, Performance, Leaves) */}
            {alerts.map((alert) => (
              <div key={alert.id} style={{
                padding: 14, borderRadius: 12, border: "1px solid var(--line, #e5e7eb)",
                background: "var(--card, #fff)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ padding: 8, background: "#f3f4f6", color: "#4b5563", borderRadius: 8 }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text, #111)" }}>
                        {alert.title}
                      </span>
                      <StatusBadge value={alert.type.replace(/_/g, " ")} />
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: "2px 0 0" }}>
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    disabled={processingId === alert.id}
                    onClick={() => handleAlertResolve(alert.id)}
                    style={{
                      padding: "7px 14px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                      background: "#f9fafb", color: "var(--text, #111)", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                    }}
                  >
                    <Check size={14} /> Acknowledge & Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 3. VSR CREDIT & LOAN ANALYTICS GRID ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
        padding: 20, marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
              VSR Credit & Loan Analytics Grid
            </h2>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
              Real-time portfolio surveillance: Due for funding, Active Debt, and Debt-Free VSRs
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search VSR, territory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "7px 12px 7px 30px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                  fontSize: 12, outline: "none", width: 200
                }}
              />
            </div>

            <div style={{ display: "flex", background: "#f3f4f6", padding: 3, borderRadius: 8 }}>
              <button
                onClick={() => setActiveTab("due")}
                style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", background: activeTab === "due" ? "#fff" : "transparent",
                  color: activeTab === "due" ? "#d97706" : "#6b7280",
                  boxShadow: activeTab === "due" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                Due for Funding ({escalatedLoans.length})
              </button>
              <button
                onClick={() => setActiveTab("active")}
                style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", background: activeTab === "active" ? "#fff" : "transparent",
                  color: activeTab === "active" ? "#dc2626" : "#6b7280",
                  boxShadow: activeTab === "active" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                Active Loans ({activeDebtVSRs.length})
              </button>
              <button
                onClick={() => setActiveTab("no_debt")}
                style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", background: activeTab === "no_debt" ? "#fff" : "transparent",
                  color: activeTab === "no_debt" ? "#16a34a" : "#6b7280",
                  boxShadow: activeTab === "no_debt" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                No Active Loans ({debtFreeVSRs.length})
              </button>
            </div>
          </div>
        </div>

        {/* Tab View: Due for Funding */}
        {activeTab === "due" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>VSR Name / Application</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Requested Amount</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Purpose</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Supervisor Endorsement</th>
                  <th style={{ textAlign: "right", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {escalatedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--muted, #6b7280)" }}>
                      No VSR applications currently waiting for Super Admin disbursement.
                    </td>
                  </tr>
                ) : (
                  escalatedLoans.map((loan) => (
                    <tr key={loan.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>VSR Application #{loan.id.slice(0, 8)}</div>
                        <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>
                          Submitted: {new Date(loan.application_date || loan.created_at || "").toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0e918a" }}>
                        ₦{Number(loan.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text, #111)", maxWidth: 220 }}>
                        {loan.purpose || "Working capital expansion"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                          Verified & Escalated
                        </span>
                        {loan.supervisor_notes && (
                          <div style={{ fontSize: 11, color: "var(--muted, #6b7280)", marginTop: 2, fontStyle: "italic" }}>
                            "{loan.supervisor_notes}"
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <button
                          onClick={() => handleLoanReview(loan.id, true, "Approved")}
                          style={{
                            padding: "6px 12px", borderRadius: 6, border: "none", background: "#0e918a",
                            color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          Disburse
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab View: Active Loans / No Active Loans */}
        {(activeTab === "active" || activeTab === "no_debt") && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>VSR Name</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Territory / Region</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Current Loan Debt</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Funding Eligibility Gate</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedVSRs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--muted, #6b7280)" }}>
                      No VSR records found matching the filter.
                    </td>
                  </tr>
                ) : (
                  displayedVSRs.map((vsr) => {
                    const debt = Number(vsr.loan_debt);
                    const isDebtFree = debt === 0;
                    return (
                      <tr key={vsr.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{vsr.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{vsr.email}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "var(--text, #111)" }}>
                          {vsr.territory || vsr.region || "Unassigned"}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: debt > 0 ? "#dc2626" : "#16a34a" }}>
                          ₦{debt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                            background: isDebtFree ? "#dcfce7" : "#fee2e2",
                            color: isDebtFree ? "#16a34a" : "#dc2626"
                          }}>
                            {isDebtFree ? "Eligible (Debt == 0)" : "Blocked (Debt > 0)"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <StatusBadge value={vsr.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
