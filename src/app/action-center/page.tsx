"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShieldAlert, Banknote, AlertTriangle, Check, X, RefreshCw,
  Search, Filter, CheckCircle2, Clock, FileText, ArrowRight,
  ShieldCheck, User, Calendar, DollarSign, MessageSquare, ChevronRight
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface LoanRequest {
  id: string;
  vsr_id: string;
  vsr_name?: string;
  vsr_region?: string;
  vsr_territory?: string;
  amount: number | string;
  purpose?: string;
  status: string;
  application_date?: string;
  created_at?: string;
  supervisor_name?: string;
  supervisor_notes?: string;
  repayment_terms?: string;
}

interface AlertItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  from_user_id: string;
  from_user_name?: string;
  region?: string;
  status: string;
  created_at: string;
}

export default function ActionCenterPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "funding" | "alerts" | "resolved">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LoanRequest | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [loansRes, alertsRes] = await Promise.all([
        fetch("/api/loans"),
        fetch("/api/alerts"),
      ]);

      if (loansRes.ok) {
        const lData = await loansRes.json();
        setLoans(lData.loans ?? []);
      }
      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        setAlerts(aData.alerts ?? []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLoanReview(loanId: string, approved: boolean, notes: string = "") {
    setProcessingId(loanId);
    try {
      const res = await fetch(`/api/loans/${loanId}/admin-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, notes: notes || (approved ? "Approved & Disbursed by Super Admin" : "Declined by Super Admin") }),
      });
      if (!res.ok) throw new Error("Review action failed");
      toast(approved ? "Funding approved & disbursed successfully" : "Funding application rejected");
      fetchData();
      if (selectedItem?.id === loanId) setSelectedItem(null);
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
      toast("Escalation marked as resolved");
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed", "error");
    } finally {
      setProcessingId(null);
    }
  }

  // Fallback items if fresh database
  const displayLoans: LoanRequest[] = loans.length > 0 ? loans : [
    {
      id: "ln-001",
      vsr_id: "vsr-101",
      vsr_name: "Shittu Akinsanya",
      vsr_region: "Lagos",
      vsr_territory: "Ikeja North",
      amount: 250000,
      purpose: "Ikeja North wholesale inventory restock & bulk distribution",
      status: "pending_admin",
      application_date: "2026-09-08",
      supervisor_name: "Michael Olayiwola (Supervisor)",
      supervisor_notes: "VSR maintains 94% route completion and zero bad debt. Endorsed for priority disbursement.",
      repayment_terms: "14 Days settlement via automated ledger"
    },
    {
      id: "ln-002",
      vsr_id: "vsr-103",
      vsr_name: "Paul Olakonipekun",
      vsr_region: "Ogun",
      vsr_territory: "Abeokuta North",
      amount: 150000,
      purpose: "Abeokuta North new tier-1 retailer onboarding inventory",
      status: "pending_admin",
      application_date: "2026-09-09",
      supervisor_name: "Michael Olayiwola (Supervisor)",
      supervisor_notes: "Route verified. Outlets verified on live GPS tracker. Recommended.",
      repayment_terms: "7 Days settlement upon delivery"
    },
    {
      id: "ln-003",
      vsr_id: "vsr-105",
      vsr_name: "Timothy Ogunmokun",
      vsr_region: "Ogun",
      vsr_territory: "Ijebu Central",
      amount: 320000,
      purpose: "Emergency stock replenishment during high-demand promotional week",
      status: "pending_admin",
      application_date: "2026-09-10",
      supervisor_name: "Adeleke Vance (Supervisor)",
      supervisor_notes: "Supervisor reviewed and endorsed.",
      repayment_terms: "14 Days standard cycle"
    }
  ];

  const displayAlerts: AlertItem[] = alerts.length > 0 ? alerts : [
    {
      id: "alt-001",
      type: "stockout_risk",
      severity: "high",
      title: "Critical Stockout: Ikeja Mega Hub",
      message: "Wholesale stock depleted below 10% safe buffer. Urgent reorder requested.",
      from_user_id: "sup-01",
      from_user_name: "Michael Olayiwola",
      region: "Lagos",
      status: "pending_admin",
      created_at: "2026-09-10T09:15:00Z"
    },
    {
      id: "alt-002",
      type: "route_disruption",
      severity: "medium",
      title: "Asaba Corridor Flooding Alert",
      message: "3 VSR routes temporarily rerouted due to expressway construction blockage.",
      from_user_id: "sup-02",
      from_user_name: "Chukwuma Eze",
      region: "Delta",
      status: "pending_admin",
      created_at: "2026-09-10T08:30:00Z"
    }
  ];

  const pendingLoans = displayLoans.filter((l) => l.status === "pending_admin");
  const pendingAlerts = displayAlerts.filter((a) => a.status === "pending_admin" || a.status === "open");
  const totalCapitalRequired = pendingLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const filteredLoans = displayLoans.filter((l) => {
    if (activeFilter === "alerts") return false;
    if (activeFilter === "resolved") return l.status === "approved" || l.status === "rejected" || l.status === "disbursed";
    if (activeFilter === "funding") return l.status === "pending_admin";
    const matchesSearch =
      (l.vsr_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (l.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (l.vsr_territory?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const filteredAlerts = displayAlerts.filter((a) => {
    if (activeFilter === "funding") return false;
    if (activeFilter === "resolved") return a.status === "resolved";
    if (activeFilter === "alerts") return a.status === "pending_admin" || a.status === "open";
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.region?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  });

  return (
    <AppShell contentClassName="page-action-center">
      {/* ─── 1. HEADER ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", letterSpacing: ".08em", textTransform: "uppercase" }}>
              SUPER ADMIN · COMMAND QUEUE
            </span>
            <span style={{ fontSize: 11, background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
              {pendingLoans.length + pendingAlerts.length} Escalations Pending
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text, #111)", margin: "4px 0 2px" }}>
            Centralized Action Center
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted, #6b7280)", margin: 0 }}>
            Unified authorization terminal for Supervisor-escalated funding applications, loan disbursements, and critical field interventions.
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
            Refresh Queue
          </button>
        </div>
      </div>

      {/* ─── 2. KPI SUMMARY CARDS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard
          label="Pending Funding Requests"
          value={pendingLoans.length}
          icon={Banknote}
          tone="amber"
          subtitle="Supervisor endorsed applications"
        />
        <KpiCard
          label="Total Capital Requested"
          value={`₦${totalCapitalRequired.toLocaleString()}`}
          icon={DollarSign}
          tone="blue"
          subtitle="Awaiting disbursement sign-off"
        />
        <KpiCard
          label="Critical Field Alerts"
          value={pendingAlerts.length}
          icon={AlertTriangle}
          tone="red"
          subtitle="Stockouts & route blockages"
        />
        <KpiCard
          label="Authority Sign-off"
          value="Super Admin"
          icon={ShieldCheck}
          tone="teal"
          subtitle="Final tier authorization"
        />
      </div>

      {/* ─── 3. ACTION QUEUE TERMINAL ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 12, border: "1px solid var(--line, #e5e7eb)",
        padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        {/* Filter & Search Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", background: "#f3f4f6", padding: 3, borderRadius: 8 }}>
            <button
              onClick={() => setActiveFilter("all")}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeFilter === "all" ? "#fff" : "transparent",
                color: activeFilter === "all" ? "#111" : "#6b7280",
                boxShadow: activeFilter === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              All Items ({pendingLoans.length + pendingAlerts.length})
            </button>
            <button
              onClick={() => setActiveFilter("funding")}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeFilter === "funding" ? "#fff" : "transparent",
                color: activeFilter === "funding" ? "#d97706" : "#6b7280",
                boxShadow: activeFilter === "funding" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Funding Escalations ({pendingLoans.length})
            </button>
            <button
              onClick={() => setActiveFilter("alerts")}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeFilter === "alerts" ? "#fff" : "transparent",
                color: activeFilter === "alerts" ? "#dc2626" : "#6b7280",
                boxShadow: activeFilter === "alerts" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Operational Alerts ({pendingAlerts.length})
            </button>
            <button
              onClick={() => setActiveFilter("resolved")}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeFilter === "resolved" ? "#fff" : "transparent",
                color: activeFilter === "resolved" ? "#16a34a" : "#6b7280",
                boxShadow: activeFilter === "resolved" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              History / Resolved
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Search actions by name, route, purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "7px 12px 7px 30px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                fontSize: 12, outline: "none", width: 260
              }}
            />
          </div>
        </div>

        {/* Action Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Funding Applications */}
          {filteredLoans.map((loan) => (
            <div
              key={loan.id}
              style={{
                padding: 16, borderRadius: 12, border: "1px solid #fed7aa",
                background: "#fffaf0", display: "flex", flexDirection: "column", gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: "#fef3c7",
                    color: "#d97706", display: "grid", placeItems: "center", flexShrink: 0
                  }}>
                    <Banknote size={20} />
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "#9a3412" }}>
                        ₦{Number(loan.amount).toLocaleString()}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: "#ffedd5", color: "#c2410c"
                      }}>
                        Supervisor Endorsed
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                        · {loan.vsr_name}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>
                        ({loan.vsr_region} · {loan.vsr_territory})
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: "#451a03", marginTop: 4 }}>
                      Purpose: {loan.purpose}
                    </div>

                    {loan.supervisor_notes && (
                      <div style={{
                        marginTop: 8, padding: "8px 12px", background: "#fef3c7", borderRadius: 6,
                        borderLeft: "3px solid #d97706", fontSize: 12, color: "#78350f"
                      }}>
                        <strong>Supervisor Endorsement Note:</strong> "{loan.supervisor_notes}"
                      </div>
                    )}

                    {loan.repayment_terms && (
                      <div style={{ fontSize: 11, color: "#9a3412", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} /> Repayment Terms: {loan.repayment_terms}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                  <button
                    disabled={processingId === loan.id}
                    onClick={() => handleLoanReview(loan.id, false, "Declined by Super Admin")}
                    style={{
                      padding: "8px 16px", borderRadius: 8, border: "1px solid #fca5a5",
                      background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <X size={14} /> Disapprove / Reject
                  </button>
                  <button
                    disabled={processingId === loan.id}
                    onClick={() => handleLoanReview(loan.id, true, "Approved for Immediate Disbursement")}
                    style={{
                      padding: "8px 20px", borderRadius: 8, border: "none",
                      background: "#0e918a", color: "#fff", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 2px 6px rgba(14, 145, 138, 0.25)"
                    }}
                  >
                    <Check size={14} /> Approve & Disburse
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Operational Alerts */}
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: 16, borderRadius: 12, border: "1px solid #fecaca",
                background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: "#fee2e2",
                  color: "#dc2626", display: "grid", placeItems: "center", flexShrink: 0
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#991b1b" }}>
                      {alert.title}
                    </span>
                    <span style={{ fontSize: 10, background: "#fee2e2", color: "#991b1b", padding: "1px 6px", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                      {alert.severity} Priority
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>
                      · {alert.region} Region
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#7f1d1d", marginTop: 2 }}>
                    {alert.message}
                  </div>
                  {alert.from_user_name && (
                    <div style={{ fontSize: 11, color: "#991b1b", marginTop: 4 }}>
                      Escalated by: {alert.from_user_name}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  disabled={processingId === alert.id}
                  onClick={() => handleAlertResolve(alert.id)}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "1px solid #e5e7eb",
                    background: "#fff", color: "var(--text, #111)", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}

          {filteredLoans.length === 0 && filteredAlerts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted, #6b7280)" }}>
              <CheckCircle2 size={36} style={{ color: "#16a34a", margin: "0 auto 10px" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
                Queue is Clear!
              </h3>
              <p style={{ fontSize: 12, margin: "4px 0 0" }}>
                There are no pending actions or escalations matching your selected filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
