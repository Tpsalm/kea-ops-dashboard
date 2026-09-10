"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface Leave {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

export function LeaveManagement() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch("/api/leaves?status=pending");
      const data = await res.json();
      setLeaves(data.leaves ?? []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  async function handleReview(id: string, approved: boolean) {
    try {
      await fetch(`/api/leaves/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      toast(approved ? "Leave approved" : "Leave rejected");
      fetchLeaves();
    } catch {
      toast("Failed to process leave", "error");
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #111)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <Calendar size={16} /> Leave Management
        {leaves.length > 0 && (
          <span style={{ fontSize: 11, background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{leaves.length} pending</span>
        )}
      </h3>
      {loading ? (
        <p style={{ fontSize: 13, color: "var(--muted, #6b7280)" }}>Loading…</p>
      ) : leaves.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", borderRadius: 12, border: "1px dashed var(--line, #e5e7eb)", color: "var(--muted, #6b7280)", fontSize: 13 }}>
          No pending leave requests
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {leaves.map((leave) => (
            <div key={leave.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
              borderRadius: 10, border: "1px solid var(--line, #e5e7eb)", background: "var(--card, #fff)",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Staff: {leave.staff_id.slice(0, 8)}…</span>
                  <StatusBadge value={leave.status} />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 2 }}>
                  {leave.start_date} → {leave.end_date}
                  {leave.reason && <span> · {leave.reason}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handleReview(leave.id, true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
                    borderRadius: 6, border: "none", background: "#dcfce7", color: "#16a34a",
                    fontWeight: 600, fontSize: 12, cursor: "pointer",
                  }}
                ><CheckCircle2 size={14} /> Approve</button>
                <button
                  onClick={() => handleReview(leave.id, false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
                    borderRadius: 6, border: "none", background: "#fef2f2", color: "#dc2626",
                    fontWeight: 600, fontSize: 12, cursor: "pointer",
                  }}
                ><XCircle size={14} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
