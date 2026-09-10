"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCircle2, XCircle, Plus, Clock, User, CalendarDays } from "lucide-react";
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

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: string;
  territory?: string;
}

export function LeaveManagement() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeavesAndTeam = useCallback(async () => {
    try {
      setLoading(true);
      const [leavesRes, teamRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/users?role=merchandiser"),
      ]);

      if (leavesRes.ok) {
        const d = await leavesRes.json();
        setLeaves(d.leaves ?? []);
      }
      if (teamRes.ok) {
        const d = await teamRes.json();
        const members = d.users ?? [];
        setTeam(members);
        if (members.length > 0 && !selectedStaffId) {
          setSelectedStaffId(members[0].id);
        }
      }
    } catch {
      // Offline / fallback
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    fetchLeavesAndTeam();
  }, [fetchLeavesAndTeam]);

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaffId || !startDate || !endDate) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaffId,
          startDate,
          endDate,
          reason: reason || "Scheduled Annual / Reliever Leave",
          status: "approved",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to schedule leave");
      }

      toast("Merchandiser leave scheduled successfully");
      setShowScheduleForm(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      fetchLeavesAndTeam();
    } catch (err: any) {
      toast(err.message || "Failed to schedule leave", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const staffNameMap = new Map(team.map((m) => [m.id, m.name]));

  return (
    <div style={{
      background: "var(--card, #fff)", borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
      padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: 8, background: "#f0fdfa", color: "#0e918a", borderRadius: 8 }}>
            <Calendar size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
              Leave Management Engine
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
              Schedule, log, and view calendar dates for merchandisers
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowScheduleForm(!showScheduleForm)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 8, border: "none", background: "#0e918a", color: "#fff",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}
        >
          <Plus size={14} /> Schedule Leave Date
        </button>
      </div>

      {/* Schedule Form Modal / Expandable */}
      {showScheduleForm && (
        <form onSubmit={handleScheduleSubmit} style={{
          padding: 16, borderRadius: 12, border: "1px solid #ccfbf1",
          background: "#f0fdfa", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f766e" }}>
            Schedule Leave Dates for Field Merchandiser
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#134e4a" }}>
              Merchandiser
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #99f6e4", fontSize: 12, background: "#fff" }}
              >
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.territory || "Lagos"})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#134e4a" }}>
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #99f6e4", fontSize: 12, background: "#fff" }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#134e4a" }}>
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #99f6e4", fontSize: 12, background: "#fff" }}
              />
            </label>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: "#134e4a" }}>
            Leave Reason / Coverage Notes
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual Leave - Reliever assigned for Lagos Island route"
              style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #99f6e4", fontSize: 12, background: "#fff" }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowScheduleForm(false)}
              style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "7px 18px", borderRadius: 6, border: "none", background: "#0e918a",
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? "Saving..." : "Confirm & Schedule"}
            </button>
          </div>
        </form>
      )}

      {/* Leave Registry & Calendar List */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
              <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Merchandiser</th>
              <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Scheduled Period</th>
              <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Reason / Notes</th>
              <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--muted, #6b7280)" }}>
                  Loading leave calendar records…
                </td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 28, textAlign: "center", color: "var(--muted, #6b7280)" }}>
                  <CalendarDays size={24} style={{ margin: "0 auto 6px", opacity: 0.4 }} />
                  <div>No leave dates scheduled for your merchandisers.</div>
                </td>
              </tr>
            ) : (
              leaves.map((leave) => {
                const staffName = staffNameMap.get(leave.staff_id) || `Staff #${leave.staff_id.slice(0, 8)}`;
                return (
                  <tr key={leave.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{staffName}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>Merchandiser</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text, #111)" }}>
                      {leave.start_date} <span style={{ color: "var(--muted, #6b7280)" }}>→</span> {leave.end_date}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted, #6b7280)" }}>
                      {leave.reason || "Scheduled Leave"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge value={leave.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
