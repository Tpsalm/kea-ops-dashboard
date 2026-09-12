"use client";

import { useRef, useState, useEffect } from "react";
import { Send, ArrowUpRight, ArrowDownLeft, Lock, MessageSquareOff } from "lucide-react";
import { useWorkflowMessagesRealtime } from "@/lib/use-workflow-realtime";
import { publishWorkflowMessageSent } from "@/lib/shared-communications";
import { useToast } from "@/components/ui/toast";
import type { WorkflowMessage } from "@/db/schema";

type SenderContext = {
  userId: string | null;
  role: "super_admin" | "admin" | "supervisor" | "vsr" | "merchandiser" | "tsr" | null;
  name?: string;
};

function canSendMessage(role: SenderContext["role"], direction: "upstream" | "downstream"): boolean {
  if (!role || role === "tsr") return false;
  if (role === "super_admin" || role === "admin") {
    return direction === "downstream";
  }
  if (role === "vsr" || role === "merchandiser") {
    return direction === "upstream";
  }
  if (role === "supervisor") {
    return direction === "upstream" || direction === "downstream";
  }
  return false;
}

function messageAlignment(m: WorkflowMessage, meId: string | null | undefined): "sent" | "received" {
  if (m.senderId === meId) return "sent";
  return "received";
}

function directionBubbleColor(direction: string): string {
  if (direction === "upstream") return "#2563eb";
  if (direction === "downstream") return "#0b1730";
  return "#475569";
}

export function WorkflowMessagesThread({
  workflowId,
  sender,
  className,
}: {
  workflowId?: string | null;
  sender: SenderContext;
  className?: string;
}) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [direction, setDirection] = useState<"upstream" | "downstream">(
    sender.role === "supervisor" ? "downstream" : "upstream",
  );
  const { messages, unread, loading, refetch } = useWorkflowMessagesRealtime(
    workflowId ?? null,
    sender.userId,
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length, loading]);

  const canUp = canSendMessage(sender.role, "upstream");
  const canDown = canSendMessage(sender.role, "downstream");
  const anyCanSend = canUp || canDown;

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!workflowId || !anyCanSend || sending) return;
    const body = draft.trim();
    if (!body) return;
    if (!canSendMessage(sender.role, direction)) {
      toast(`Your role cannot send ${direction} messages.`, "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setDraft("");
      refetch().catch(() => {});
      publishWorkflowMessageSent({
        workflowId,
        workflowTitle: `Workflow ${workflowId.slice(0, 6)}`,
        direction,
        senderRole: sender.role ?? "unknown",
        senderName: sender.name ?? "User",
        targetUserId: json.message?.targetUserId,
        payload: { messageId: json.message?.id },
      });
      toast("Message delivered", "success");
    } catch (err: any) {
      toast(err.message ?? "Could not send message", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`workflow-messages-thread ${className ?? ""}`}
      style={{
        display: "flex", flexDirection: "column",
        background: "var(--card, #fff)",
        border: "1px solid var(--line, #e5e7eb)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--line, #e5e7eb)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#0b1730", color: "#14b8a6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 11, letterSpacing: ".05em",
          }}>
            WF
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text, #0f172a)" }}>
              Workflow Thread
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {sender.role === "tsr" ? "Read-only observer (TSR role)" : `Scope-locked: ${sender.role ?? "Guest"}`}
            </div>
          </div>
        </div>
        {unread > 0 && (
          <span style={{
            background: "#dc2626", color: "#fff",
            fontSize: 10, fontWeight: 700,
            padding: "3px 8px", borderRadius: 999,
          }}>
            {unread} new
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        style={{
          minHeight: 240, maxHeight: 360, overflow: "auto",
          padding: 14, display: "flex", flexDirection: "column", gap: 10,
          background: "#fafbfc",
        }}
      >
        {loading && messages.length === 0 && (
          <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: 20 }}>
            Loading thread…
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 10, padding: 28, color: "#94a3b8",
          }}>
            <MessageSquareOff size={28} />
            <div style={{ fontSize: 12, fontWeight: 500 }}>No messages yet.</div>
            <div style={{ fontSize: 11 }}>The first message will be securely routed by role.</div>
          </div>
        )}
        {messages.map((m) => {
          const placement = messageAlignment(m, sender.userId);
          const bubble = directionBubbleColor(m.direction);
          const justify = placement === "sent" ? "flex-end" : "flex-start";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: justify }}>
              <div style={{
                maxWidth: "78%",
                position: "relative",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: 3, justifyContent: placement === "sent" ? "flex-end" : "flex-start",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: "#475569",
                    display: "inline-flex", alignItems: "center", gap: 3,
                  }}>
                    {m.direction === "upstream" ? <ArrowUpRight size={10} style={{ color: "#2563eb" }} /> : <ArrowDownLeft size={10} style={{ color: "#0b1730" }} />}
                    {m.direction.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>
                    {new Date(m.sentAt ?? Date.now()).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{
                  padding: "10px 12px",
                  borderRadius: placement === "sent" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background: placement === "sent" ? bubble : "#ffffff",
                  color: placement === "sent" ? "#ffffff" : "var(--text, #0f172a)",
                  border: placement === "sent" ? "none" : "1px solid #e2e8f0",
                  boxShadow: placement === "sent" ? `0 6px 18px ${bubble}22` : "0 2px 8px rgba(0,0,0,.04)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} style={{
        borderTop: "1px solid var(--line, #e5e7eb)",
        padding: 12,
        background: "#ffffff",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {sender.role === "supervisor" ? (
          <div style={{
            display: "flex", gap: 6, flexWrap: "wrap",
          }}>
            {(["downstream", "upstream"] as const).map((d) => {
              const can = canSendMessage(sender.role, d);
              const active = direction === d;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!can}
                  onClick={() => can && setDirection(d)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: `1px solid ${active ? (d === "upstream" ? "#2563eb" : "#0b1730") : "#e5e7eb"}`,
                    background: active ? (d === "upstream" ? "#2563eb0d" : "#0b17300d") : "#fff",
                    color: active ? (d === "upstream" ? "#2563eb" : "#0b1730") : "#64748b",
                    fontSize: 11, fontWeight: 700,
                    cursor: can ? "pointer" : "not-allowed",
                    opacity: can ? 1 : 0.55,
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  {d === "upstream" ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                  {d === "upstream" ? "Upstream → Super Admin" : "Downstream → Originator"}
                </button>
              );
            })}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={anyCanSend
              ? `Write a ${direction} message…`
              : "Your role does not have message sending permissions."
            }
            disabled={!anyCanSend || sending}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: anyCanSend ? "#fff" : "#f1f5f9",
              fontSize: 13,
              outline: "none",
              color: anyCanSend ? "var(--text, #0f172a)" : "#94a3b8",
            }}
          />
          <button
            type="submit"
            disabled={!anyCanSend || sending || !draft.trim()}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: anyCanSend && draft.trim() ? "#0b1730" : "#cbd5e1",
              color: "#fff",
              cursor: anyCanSend && draft.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 6,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {!anyCanSend ? <Lock size={14} /> : <Send size={14} />}
            {sending ? "…" : !anyCanSend ? "Locked" : "Send"}
          </button>
        </div>

        {!anyCanSend && (
          <div style={{
            fontSize: 10, color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            <Lock size={10} />
            Role-based direction lock engaged.
          </div>
        )}
      </form>
    </div>
  );
}
