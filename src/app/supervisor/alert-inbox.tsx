"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell, ArrowUp, Mail, CheckCircle2, AlertTriangle, ShieldCheck,
  Check, X, Clock, ExternalLink, RefreshCw, Inbox
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

interface DispatchedEmail {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  summary: string;
  category: string;
  timestamp: string;
  status: string;
  htmlContent: string;
}

export function SupervisorAlertInbox() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"alerts" | "emails">("alerts");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emails, setEmails] = useState<DispatchedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEmail, setSelectedEmail] = useState<DispatchedEmail | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [alertRes, userRes, emailRes] = await Promise.all([
        fetch("/api/alerts"),
        fetch("/api/users?role=super_admin"),
        fetch("/api/notifications/emails"),
      ]);
      if (alertRes.ok) {
        const d = await alertRes.json();
        setAlerts(d.alerts ?? []);
      }
      if (userRes.ok) {
        const d = await userRes.json();
        setAdmins(d.users ?? []);
      }
      if (emailRes.ok) {
        const d = await emailRes.json();
        setEmails(d.emails ?? []);
      }
    } catch {
      /* fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function escalateAlert(alertId: string) {
    const adminId = admins[0]?.id;
    if (!adminId) {
      toast("No Super Admin found", "error");
      return;
    }
    try {
      await fetch(`/api/alerts/${alertId}/escalate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: adminId }),
      });
      toast("Alert escalated to Super Admin Dashboard");
      fetchData();
    } catch {
      toast("Escalation failed", "error");
    }
  }

  // Fallback demo alerts and emails if database is fresh
  const displayAlerts: Alert[] = alerts.length > 0 ? alerts : [
    {
      id: "alt-001",
      type: "pod_submission",
      severity: "info",
      title: "[POD Received] Merchandiser Toluwaleni Adio Uploaded POD Tracker",
      message: "Completed Proof of Delivery tracker submitted for Royal Prince Ikosi (Ref: WB-2026-09-842). Store manager signature attached.",
      status: "pending",
      created_at: new Date().toISOString()
    },
    {
      id: "alt-002",
      type: "field_report_submission",
      severity: "info",
      title: "[Report Received] VSR Shittu Akinsanya Submitted Week 36 Sales Report",
      message: "Gross Sales: ₦1,850,000.00 · Cash Collected: ₦1,420,000.00 · Attached: VSR_Shittu_Wk36_RouteReport.xlsx.",
      status: "pending",
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: "alt-003",
      type: "funding_request",
      severity: "info",
      title: "Super Admin Approved Funding for Shittu Akinsanya",
      message: "Application of ₦250,000.00 was approved and disbursed. VSR debt ledger is now active.",
      status: "resolved",
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "alt-004",
      type: "stockout_risk",
      severity: "high",
      title: "Critical Stockout Alert: Ikeja Mega Hub",
      message: "Retail stock depleted below 10% threshold on Royal Prince route.",
      status: "pending",
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const displayEmails: DispatchedEmail[] = emails.length > 0 ? emails : [
    {
      id: "em-001",
      to: "michael.olayiwola@kea.com",
      recipientName: "Michael Olayiwola (Supervisor)",
      subject: "[KEA OPERATIONS] Super Admin Decision: Funding Application for Shittu Akinsanya - APPROVED & DISBURSED",
      summary: "Funding application of ₦250,000.00 approved and disbursed by Super Admin Executive. VSR debt ledger is now active.",
      category: "loan_approval",
      timestamp: new Date().toISOString(),
      status: "delivered",
      htmlContent: `<div style="font-family: sans-serif; padding: 20px;"><h2>KEA Operations: Funding Approved</h2><p>Dear Michael Olayiwola,</p><p>Super Admin Executive has approved and disbursed ₦250,000.00 for VSR <strong>Shittu Akinsanya</strong>.</p><p>Debt validation gate is active.</p></div>`
    }
  ];

  return (
    <div style={{ background: "var(--card, #fff)", border: "1px solid var(--line, #e5e7eb)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #111)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={16} /> Supervisor Notification & Decision Inbox
          </h3>
          <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: "2px 0 0" }}>
            Real-time notifications & instant emails from Super Admin Executive decisions
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", background: "#f3f4f6", padding: 2, borderRadius: 6 }}>
            <button
              onClick={() => setActiveSubTab("alerts")}
              style={{
                padding: "5px 12px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 700,
                cursor: "pointer", background: activeSubTab === "alerts" ? "#fff" : "transparent",
                color: activeSubTab === "alerts" ? "#0e918a" : "#6b7280",
                display: "flex", alignItems: "center", gap: 4
              }}
            >
              <Inbox size={12} /> Live Alerts ({displayAlerts.length})
            </button>
            <button
              onClick={() => setActiveSubTab("emails")}
              style={{
                padding: "5px 12px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 700,
                cursor: "pointer", background: activeSubTab === "emails" ? "#fff" : "transparent",
                color: activeSubTab === "emails" ? "#2563eb" : "#6b7280",
                display: "flex", alignItems: "center", gap: 4
              }}
            >
              <Mail size={12} /> Dispatched Emails ({displayEmails.length})
            </button>
          </div>

          <button
            onClick={() => fetchData()}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: LIVE ALERTS */}
      {activeSubTab === "alerts" && (
        <div style={{ display: "grid", gap: 8 }}>
          {displayAlerts.map((alert) => (
            <div key={alert.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px",
              borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", background: alert.title.includes("Approved") ? "#f0fdf4" : alert.title.includes("Declined") ? "#fef2f2" : "#f9fafb", fontSize: 13,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {alert.title.includes("Approved") ? (
                  <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
                ) : alert.title.includes("Declined") ? (
                  <AlertTriangle size={18} style={{ color: "#dc2626", flexShrink: 0 }} />
                ) : (
                  <Bell size={18} style={{ color: "#0e918a", flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "var(--text, #111)" }}>{alert.title}</span>
                    <StatusBadge value={alert.status} />
                  </div>
                  {alert.message && <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 2 }}>{alert.message}</div>}
                </div>
              </div>

              {alert.status === "pending" && (
                <button
                  onClick={() => escalateAlert(alert.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
                    borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", background: "#fff",
                    fontWeight: 700, fontSize: 11, cursor: "pointer", color: "var(--text, #111)", flexShrink: 0
                  }}
                >
                  <ArrowUp size={12} /> Escalate to Super Admin
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: DISPATCHED EMAIL LOG */}
      {activeSubTab === "emails" && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 11, color: "#1e40af" }}>
            ✉️ <strong>Instant Email Dispatch Channel:</strong> When the Super Admin Executive reviews an application or escalation, an automated email notification is dispatched simultaneously to the Supervisor's email address.
          </div>

          {displayEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px",
                borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer",
                transition: "all 0.15s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text, #111)" }}>{email.subject}</div>
                  <div style={{ fontSize: 11, color: "var(--muted, #6b7280)", marginTop: 2 }}>
                    To: <strong>{email.to}</strong> ({email.recipientName}) · {email.summary}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  {email.status.toUpperCase()}
                </span>
                <button
                  style={{
                    padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc",
                    fontSize: 11, fontWeight: 600, cursor: "pointer"
                  }}
                >
                  View Email
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMAIL PREVIEW MODAL */}
      {selectedEmail && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "grid", placeItems: "center", padding: 20
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, width: "100%", maxWidth: 620, maxHeight: "85vh",
            overflow: "auto", padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                  Dispatched Email Preview
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "4px 0 2px" }}>{selectedEmail.subject}</h3>
                <div style={{ fontSize: 12, color: "#64748b" }}>To: {selectedEmail.to}</div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f1f5f9", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "#f8fafc" }}
              dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
