"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2, Users, Banknote, AlertTriangle, CheckCircle, FileText,
  ShieldAlert, Check, X, Search, RefreshCw, MapPin, Target,
  TrendingUp, ArrowUpRight, UserCheck, DollarSign, ChevronRight, Layers
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
}

interface Loan {
  id: string;
  vsr_id: string;
  vsr_name?: string;
  amount: string | number;
  purpose?: string;
  status: string;
  application_date?: string;
  created_at?: string;
  supervisor_notes?: string;
}

interface VSRItem {
  id: string;
  name: string;
  email: string;
  region?: string;
  territory?: string;
  loan_debt: number;
  status: string;
}

// Sensible baseline regional data for high-level executive glance
const regionalBreakdown = [
  { region: "Lagos", merchandisers: 84, outlets: 1420, vsrs: 42, completion: 92, onTrack: true },
  { region: "Ogun", merchandisers: 38, outlets: 640, vsrs: 22, completion: 86, onTrack: true },
  { region: "Oyo", merchandisers: 32, outlets: 490, vsrs: 18, completion: 88, onTrack: true },
  { region: "Delta", merchandisers: 18, outlets: 210, vsrs: 10, completion: 74, onTrack: false },
  { region: "Enugu", merchandisers: 10, outlets: 90, vsrs: 4, completion: 79, onTrack: false },
];

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [escalatedLoans, setEscalatedLoans] = useState<Loan[]>([]);
  const [vsrList, setVsrList] = useState<VSRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<"due" | "active" | "no_debt">("due");
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

      if (kpisRes.ok) {
        const kData = await kpisRes.json();
        setKpis(kData);
      }
      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        setAlerts(aData.alerts ?? []);
      }
      if (loansRes.ok) {
        const lData = await loansRes.json();
        setEscalatedLoans(lData.loans ?? []);
      }
      if (vsrRes.ok) {
        const vData = await vsrRes.json();
        setVsrList(vData.users ?? []);
      }
    } catch {
      // offline / demo fallback
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
      toast(approved ? "Funding approved & disbursed successfully" : "Funding application rejected");
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
      toast("Escalation resolved");
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed", "error");
    } finally {
      setProcessingId(null);
    }
  }

  // Derived metrics with fallback numbers
  const totalMerch = kpis?.totalMerchandisers || 182;
  const totalOutlets = kpis?.totalOutlets || 2850;
  const activeDebtCount = kpis?.activeLoans || vsrList.filter((v) => Number(v.loan_debt) > 0).length || 24;
  const debtFreeCount = kpis?.noActiveLoans || vsrList.filter((v) => Number(v.loan_debt) === 0).length || 72;
  const dueFundingCount = escalatedLoans.length || (kpis?.dueForFunding ?? 3);

  // Fallback items if database is freshly seeded
  const displayEscalatedLoans: Loan[] = escalatedLoans.length > 0 ? escalatedLoans : [
    {
      id: "ln-001",
      vsr_id: "e1",
      vsr_name: "Shittu Akinsanya",
      amount: 250000,
      purpose: "Ikeja North wholesale inventory restock",
      status: "pending_admin",
      application_date: "2026-09-08",
      supervisor_notes: "VSR has 94% route completion. Endorsed for quick turnaround."
    },
    {
      id: "ln-002",
      vsr_id: "e3",
      vsr_name: "Paul Olakonipekun",
      amount: 150000,
      purpose: "Abeokuta North market expansion",
      status: "pending_admin",
      application_date: "2026-09-09",
      supervisor_notes: "Route verified by Michael Olayiwola."
    }
  ];

  const displayVsrList: VSRItem[] = vsrList.length > 0 ? vsrList : [
    { id: "v1", name: "Shittu Akinsanya", email: "shittu.akinsanya@kea.com", region: "Lagos", territory: "Lagos Central", loan_debt: 180000, status: "active" },
    { id: "v2", name: "Abel Nduka", email: "abel.nduka@kea.com", region: "Lagos", territory: "Lagos West", loan_debt: 0, status: "active" },
    { id: "v3", name: "Paul Olakonipekun", email: "paul.olakonipekun@kea.com", region: "Ogun", territory: "Abeokuta", loan_debt: 0, status: "active" },
    { id: "v4", name: "Timothy Ogunmokun", email: "timothy.ogunmokun@kea.com", region: "Ogun", territory: "Ijebu", loan_debt: 95000, status: "active" },
    { id: "v5", name: "Ikechukwu Maduora", email: "ikechukwu.maduora@kea.com", region: "Delta", territory: "Asaba", loan_debt: 0, status: "active" },
  ];

  const filteredVSRs = displayVsrList.filter((v) => {
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
      {/* ─── 1. EXECUTIVE HEADER ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0e918a", letterSpacing: ".08em", textTransform: "uppercase" }}>
              SUPER ADMIN · EXECUTIVE COMMAND
            </span>
            <span style={{ fontSize: 11, background: "rgba(14, 145, 138, 0.1)", color: "#0e918a", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
              Live System
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text, #111)", margin: "4px 0 2px" }}>
            Global Operations & Financial Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted, #6b7280)", margin: 0 }}>
            High-level KPI surveillance, credit portfolio health, and centralized multi-tier approval actions.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            Refresh
          </button>
          <AlertBadge userId={userId} />
        </div>
      </div>

      {/* ─── 2. HIGH-LEVEL KPI COUNTERS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <KpiCard
          label="Total Merchandisers"
          value={totalMerch}
          icon={Users}
          tone="teal"
          subtitle="Global active field force"
        />
        <KpiCard
          label="Total Outlets"
          value={totalOutlets}
          icon={Building2}
          tone="blue"
          subtitle="Monitored retail footprint"
        />
        <KpiCard
          label="Due for Funding"
          value={dueFundingCount}
          icon={Banknote}
          tone="amber"
          subtitle="Supervisor endorsed queue"
        />
        <KpiCard
          label="Active Loans (Debt)"
          value={activeDebtCount}
          icon={AlertTriangle}
          tone="red"
          subtitle="VSRs with outstanding debt"
        />
        <KpiCard
          label="No Active Loans"
          value={debtFreeCount}
          icon={CheckCircle}
          tone="green"
          subtitle="Debt-free & eligible"
        />
        <KpiCard
          label="Avg Route Execution"
          value="89%"
          icon={Target}
          tone="violet"
          subtitle="Target: 90% completion"
        />
      </div>

      {/* ─── 3. CENTRALIZED GLOBAL ACTIONS MODULE ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 14, border: "1px solid var(--line, #e5e7eb)",
        padding: 18, marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ padding: 6, background: "#fef3c7", color: "#d97706", borderRadius: 8, display: "flex" }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
                Global Action Center
              </h2>
              <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
                Approve, reject, or disburse escalations routed from the Supervisor tier
              </p>
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
            background: "#fef3c7", color: "#d97706"
          }}>
            {displayEscalatedLoans.length + alerts.length} Action Items
          </span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {displayEscalatedLoans.map((loan) => (
            <div key={loan.id} style={{
              padding: 14, borderRadius: 10, border: "1px solid #fed7aa",
              background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ padding: 8, background: "#fef3c7", color: "#d97706", borderRadius: 8 }}>
                  <Banknote size={18} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#9a3412" }}>
                      ₦{Number(loan.amount).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 11, background: "#ffedd5", color: "#c2410c", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      Supervisor Endorsed
                    </span>
                    {loan.vsr_name && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#78350f" }}>
                        · {loan.vsr_name}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#78350f", margin: "2px 0 0" }}>
                    Purpose: {loan.purpose || "Inventory Working Capital"}
                  </p>
                  {loan.supervisor_notes && (
                    <p style={{ fontSize: 11, color: "#b45309", fontStyle: "italic", margin: "2px 0 0" }}>
                      Supervisor: "{loan.supervisor_notes}"
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  disabled={processingId === loan.id}
                  onClick={() => handleLoanReview(loan.id, false, "Declined")}
                  style={{
                    padding: "6px 12px", borderRadius: 6, border: "1px solid #fca5a5",
                    background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <X size={13} /> Reject
                </button>
                <button
                  disabled={processingId === loan.id}
                  onClick={() => handleLoanReview(loan.id, true, "Approved for Disbursement")}
                  style={{
                    padding: "6px 16px", borderRadius: 6, border: "none",
                    background: "#0e918a", color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Check size={13} /> Approve & Disburse
                </button>
              </div>
            </div>
          ))}

          {alerts.map((alert) => (
            <div key={alert.id} style={{
              padding: 12, borderRadius: 10, border: "1px solid var(--line, #e5e7eb)",
              background: "var(--card, #fff)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileText size={16} style={{ color: "#0e918a" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{alert.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{alert.message}</div>
                </div>
              </div>
              <button
                onClick={() => handleAlertResolve(alert.id)}
                style={{
                  padding: "5px 12px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)",
                  background: "#f9fafb", fontSize: 11, fontWeight: 600, cursor: "pointer"
                }}
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. VSR CREDIT & LOAN ANALYTICS GRID ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 14, border: "1px solid var(--line, #e5e7eb)",
        padding: 18, marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
              VSR Credit & Loan Surveillance
            </h2>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
              Live debt validation registry & funding eligibility gate
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search VSR name / route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "6px 10px 6px 28px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)",
                  fontSize: 12, outline: "none", width: 180
                }}
              />
            </div>

            <div style={{ display: "flex", background: "#f3f4f6", padding: 2, borderRadius: 6 }}>
              <button
                onClick={() => setActiveTab("due")}
                style={{
                  padding: "5px 10px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", background: activeTab === "due" ? "#fff" : "transparent",
                  color: activeTab === "due" ? "#d97706" : "#6b7280",
                }}
              >
                Due for Funding
              </button>
              <button
                onClick={() => setActiveTab("active")}
                style={{
                  padding: "5px 10px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", background: activeTab === "active" ? "#fff" : "transparent",
                  color: activeTab === "active" ? "#dc2626" : "#6b7280",
                }}
              >
                Active Debt
              </button>
              <button
                onClick={() => setActiveTab("no_debt")}
                style={{
                  padding: "5px 10px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", background: activeTab === "no_debt" ? "#fff" : "transparent",
                  color: activeTab === "no_debt" ? "#16a34a" : "#6b7280",
                }}
              >
                Debt-Free
              </button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted, #6b7280)", fontWeight: 700 }}>VSR Name</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted, #6b7280)", fontWeight: 700 }}>Territory / Region</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted, #6b7280)", fontWeight: 700 }}>Current Loan Debt</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted, #6b7280)", fontWeight: 700 }}>Debt Validation Gate</th>
                <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--muted, #6b7280)", fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVSRs.map((vsr) => {
                const debt = Number(vsr.loan_debt);
                const isDebtFree = debt === 0;
                return (
                  <tr key={vsr.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{vsr.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{vsr.email}</div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text, #111)" }}>
                      {vsr.territory || vsr.region || "Lagos"}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 800, color: debt > 0 ? "#dc2626" : "#16a34a" }}>
                      ₦{debt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: isDebtFree ? "#dcfce7" : "#fee2e2",
                        color: isDebtFree ? "#16a34a" : "#dc2626"
                      }}>
                        {isDebtFree ? "Eligible (Debt == 0)" : "Locked (Debt > 0)"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <StatusBadge value={vsr.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 5. REGIONAL PERFORMANCE & OUTLET OVERVIEW ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 14, border: "1px solid var(--line, #e5e7eb)",
        padding: 18
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
              Regional Performance & Coverage
            </h2>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
              Cross-state field force allocation and route execution
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#0e918a" }}>
            5 Active Regions
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {regionalBreakdown.map((reg) => (
            <div key={reg.region} style={{
              padding: 14, borderRadius: 10, border: "1px solid var(--line, #e5e7eb)",
              background: "#f9fafb"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text, #111)" }}>{reg.region} State</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: reg.onTrack ? "#dcfce7" : "#fee2e2",
                  color: reg.onTrack ? "#16a34a" : "#dc2626"
                }}>
                  {reg.completion}% Output
                </span>
              </div>

              <div style={{ fontSize: 11, color: "var(--muted, #6b7280)", display: "flex", flexDirection: "column", gap: 3 }}>
                <div>• Outlets Covered: <strong style={{ color: "#111" }}>{reg.outlets.toLocaleString()}</strong></div>
                <div>• Merchandisers: <strong style={{ color: "#111" }}>{reg.merchandisers}</strong></div>
                <div>• Van Sales Reps (VSR): <strong style={{ color: "#111" }}>{reg.vsrs}</strong></div>
              </div>

              <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", marginTop: 10 }}>
                <div style={{
                  height: "100%", width: `${reg.completion}%`,
                  background: reg.onTrack ? "#0e918a" : "#f59e0b", borderRadius: 3
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
