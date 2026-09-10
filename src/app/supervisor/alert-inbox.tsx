"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, ArrowUp } from "lucide-react";
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

export function SupervisorAlertInbox() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Array<{ id: string; name: string }>>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertRes, userRes] = await Promise.all([
        fetch("/api/alerts"),
        fetch("/api/users?role=super_admin"),
      ]);
      if (alertRes.ok) { const d = await alertRes.json(); setAlerts(d.alerts ?? []); }
      if (userRes.ok) { const d = await userRes.json(); setAdmins(d.users ?? []); }
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  async function escalateAlert(alertId: string) {
    const adminId = admins[0]?.id;
    if (!adminId) { toast("No Super Admin found", "error"); return; }
    try {
      await fetch(`/api/alerts/${alertId}/escalate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: adminId }),
      });
      toast("Alert escalated to Super Admin");
      fetchAlerts();
    } catch {
      toast("Escalation failed", "error");
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #111)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={16} /> Alert Inbox
        {alerts.filter((a) => a.status === "pending").length > 0 && (
          <span style={{ fontSize: 11, background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
            {alerts.filter((a) => a.status === "pending").length} new
          </span>
        )}
      </h3>
      {loading ? (
        <p style={{ fontSize: 13, color: "var(--muted, #6b7280)" }}>Loading…</p>
      ) : alerts.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", borderRadius: 12, border: "1px dashed var(--line, #e5e7eb)", color: "var(--muted, #6b7280)", fontSize: 13 }}>
          No alerts
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {alerts.map((alert) => (
            <div key={alert.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", background: "var(--card, #fff)", fontSize: 13,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>{alert.title}</span>
                  <StatusBadge value={alert.status} />
                </div>
                {alert.message && <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 2 }}>{alert.message}</div>}
              </div>
              {alert.status === "pending" && (
                <button
                  onClick={() => escalateAlert(alert.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                    borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", background: "#fff",
                    fontWeight: 600, fontSize: 11, cursor: "pointer", color: "var(--text, #111)",
                  }}
                ><ArrowUp size={12} /> Escalate</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
