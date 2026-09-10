"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Users, Banknote, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionCard } from "@/components/ui/action-card";
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
  related_entity_type: string;
  related_entity_id: string;
}

interface Loan {
  id: string;
  vsr_id: string;
  amount: string;
  status: string;
  application_date: string;
}

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [escalatedLoans, setEscalatedLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [kpisRes, alertsRes, loansRes] = await Promise.all([
        fetch("/api/kpis?scope=admin"),
        fetch("/api/alerts?status=pending"),
        fetch("/api/loans?status=pending_admin"),
      ]);
      if (kpisRes.ok) setKpis(await kpisRes.json());
      if (alertsRes.ok) { const d = await alertsRes.json(); setAlerts(d.alerts ?? []); }
      if (loansRes.ok) { const d = await loansRes.json(); setEscalatedLoans(d.loans ?? []); }
    } catch { /* api not connected yet — show empty state */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Fetch current user id for alert actions
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserId(d.user?.id ?? "")).catch(() => {});
  }, [fetchData]);

  async function handleLoanReview(loanId: string, approved: boolean, notes: string) {
    const res = await fetch(`/api/loans/${loanId}/admin-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, notes }),
    });
    if (!res.ok) throw new Error("Review failed");
    toast(approved ? "Loan approved and disbursed" : "Loan rejected");
    fetchData();
  }

  async function handleAlertResolve(alertId: string) {
    await fetch(`/api/alerts/${alertId}/resolve`, { method: "PATCH" });
    toast("Alert resolved");
    fetchData();
  }

  return (
    <AppShell contentClassName="page-admin">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--teal, #0e918a)", letterSpacing: ".08em", textTransform: "uppercase", margin: 0 }}>SUPER ADMIN · EXECUTIVE VIEW</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text, #111)", margin: "4px 0 0" }}>Global performance</h1>
          <p style={{ fontSize: 13, color: "var(--muted, #6b7280)", margin: "2px 0 0" }}>Cross-client operational overview and centralized action center.</p>
        </div>
        <AlertBadge userId={userId} />
      </div>

      {/* ─── KPI GRID ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total Merchandisers" value={kpis?.totalMerchandisers ?? 0} icon={Users} tone="teal" />
        <KpiCard label="Total Outlets" value={kpis?.totalOutlets ?? 0} icon={Building2} tone="blue" />
        <KpiCard label="Due for Funding" value={kpis?.dueForFunding ?? 0} icon={Banknote} tone="amber" />
        <KpiCard label="Active Loans" value={kpis?.activeLoans ?? 0} icon={AlertTriangle} tone="red" />
        <KpiCard label="No Active Loans" value={kpis?.noActiveLoans ?? 0} icon={CheckCircle} tone="green" />
      </div>

      {/* ─── GLOBAL ACTIONS MODULE ─── */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text, #111)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={18} /> Global Action Center
          {escalatedLoans.length > 0 && (
            <span style={{ fontSize: 11, background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
              {escalatedLoans.length} pending
            </span>
          )}
        </h2>

        {escalatedLoans.length === 0 && alerts.filter((a) => a.status === "pending").length === 0 ? (
          <div style={{
            padding: 40, textAlign: "center", borderRadius: 12,
            border: "1px dashed var(--line, #e5e7eb)", color: "var(--muted, #6b7280)", fontSize: 13,
          }}>
            {loading ? "Loading…" : "No pending actions. All clear!"}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {escalatedLoans.map((loan) => (
              <ActionCard
                key={loan.id}
                title={`Funding request — ₦${Number(loan.amount).toLocaleString()}`}
                description={`Application submitted ${new Date(loan.application_date).toLocaleDateString()}`}
                type="Escalated"
                onApprove={(n: string) => handleLoanReview(loan.id, true, n)}
                onReject={(n: string) => handleLoanReview(loan.id, false, n)}
              />
            ))}
            {alerts.filter((a) => a.status === "pending").map((alert) => (
              <ActionCard
                key={alert.id}
                title={alert.title}
                description={alert.message}
                type={alert.severity}
                onApprove={async () => { await handleAlertResolve(alert.id); }}
                onReject={async () => { await handleAlertResolve(alert.id); }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── RECENT ACTIVITY ─── */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text, #111)", marginBottom: 12 }}>Recent alerts</h2>
        <div style={{
          background: "var(--card, #fff)", borderRadius: 12, border: "1px solid var(--line, #e5e7eb)",
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: "var(--muted, #6b7280)", fontSize: 11 }}>Type</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: "var(--muted, #6b7280)", fontSize: 11 }}>Title</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: "var(--muted, #6b7280)", fontSize: 11 }}>Status</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: "var(--muted, #6b7280)", fontSize: 11 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--muted, #6b7280)" }}>No alerts yet</td></tr>
              ) : (
                alerts.slice(0, 10).map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                    <td style={{ padding: "10px 14px" }}><StatusBadge value={a.type.replace(/_/g, " ")} /></td>
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>{a.title}</td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge value={a.status} /></td>
                    <td style={{ padding: "10px 14px", color: "var(--muted, #6b7280)" }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
