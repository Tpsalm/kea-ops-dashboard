"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react";

interface ActionCardProps {
  title: string;
  description?: string;
  requester?: string;
  amount?: string;
  date?: string;
  type?: string;
  onApprove: (notes: string) => Promise<void>;
  onReject: (notes: string) => Promise<void>;
}

export function ActionCard({ title, description, requester, amount, date, type, onApprove, onReject }: ActionCardProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState(false);

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    try {
      if (action === "approve") await onApprove(notes);
      else await onReject(notes);
      setDone(true);
    } finally {
      setLoading(null);
    }
  }

  if (done) return null;

  return (
    <div style={{
      background: "var(--card, #fff)", borderRadius: 12, border: "1px solid var(--line, #e5e7eb)",
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text, #111)" }}>{title}</div>
          {description && <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 2 }}>{description}</div>}
        </div>
        {type && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
            background: "#fef3c7", color: "#d97706", textTransform: "uppercase", letterSpacing: ".05em",
          }}>{type}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted, #6b7280)" }}>
        {requester && <span>👤 {requester}</span>}
        {amount && <span>💰 {amount}</span>}
        {date && <span>📅 {date}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MessageSquare size={14} style={{ color: "var(--muted, #6b7280)" }} />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes (optional)"
          style={{
            flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
            fontSize: 12, outline: "none", background: "var(--bg, #f9fafb)",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => handle("approve")}
          disabled={loading !== null}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "#dcfce7", color: "#16a34a", fontWeight: 600, fontSize: 13,
          }}
        >
          <CheckCircle2 size={15} />
          {loading === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          onClick={() => handle("reject")}
          disabled={loading !== null}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 13,
          }}
        >
          <XCircle size={15} />
          {loading === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </div>
  );
}
