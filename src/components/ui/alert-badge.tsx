"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRealtimeAlerts } from "@/lib/use-realtime-alerts";

interface AlertBadgeProps {
  userId?: string;
}

export function AlertBadge({ userId }: AlertBadgeProps) {
  const { alerts, unreadCount } = useRealtimeAlerts(userId);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative", background: "none", border: "none",
          cursor: "pointer", padding: 6, borderRadius: 8,
          color: "var(--muted, #6b7280)",
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            width: 16, height: 16, borderRadius: "50%",
            background: "#dc2626", color: "#fff",
            fontSize: 9, fontWeight: 700, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            style={{
              position: "absolute", top: "100%", right: 0, marginTop: 8,
              width: 320, maxHeight: 400, overflow: "auto",
              background: "#fff", borderRadius: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,.15)",
              border: "1px solid var(--line, #e5e7eb)",
              zIndex: 100,
            }}
          >
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line, #e5e7eb)", fontWeight: 700, fontSize: 13 }}>
              Notifications {unreadCount > 0 && <span style={{ color: "#dc2626" }}>({unreadCount} unread)</span>}
            </div>
            {alerts.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--muted, #6b7280)", fontSize: 13 }}>No notifications</div>
            ) : (
              alerts.slice(0, 10).map((a) => (
                <div key={a.id} style={{
                  padding: "10px 14px", borderBottom: "1px solid var(--line, #e5e7eb)", fontSize: 12,
                  background: a.status === "pending" ? "#fffbeb" : "transparent",
                }}>
                  <div style={{ fontWeight: 600, color: "var(--text, #111)" }}>{a.title}</div>
                  {a.message ? <div style={{ color: "var(--muted, #6b7280)", marginTop: 2 }}>{a.message}</div> : null}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
