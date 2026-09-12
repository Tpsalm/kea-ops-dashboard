"use client";

import { useState, type CSSProperties } from "react";
import { Layers, Plus, ArrowUpCircle, CheckCircle2, XCircle, Search, RotateCcw, MessageSquare } from "lucide-react";
import { useWorkflowRealtime } from "@/lib/use-workflow-realtime";
import { WorkflowTracker } from "@/components/workflow-tracker";
import { WorkflowMessagesThread } from "@/components/workflow-messages-thread";
import { WorkflowSubmitModal } from "@/components/workflow-submit-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import type { Workflow } from "@/db/schema";

type CenterRole = "super_admin" | "super-admin" | "admin" | "supervisor" | "vsr" | "merchandiser" | "tsr";

export interface WorkflowActor {
  userId: string;
  role: string;
  name: string;
  supervisorId?: string | null;
}

function normalizeRole(role?: string | null): CenterRole {
  if (role === "super-admin" || role === "admin") return "super_admin";
  if (
    role === "super_admin" || role === "supervisor" || role === "vsr" ||
    role === "merchandiser" || role === "tsr"
  ) {
    return role;
  }
  return "vsr";
}

/**
 * Drop-in workflow center for all four dashboards.
 *
 * Usage (any dashboard page):
 *   <WorkflowCenter actor={{ userId, role, name }} />
 *
 * - VSR / Merchandiser: create, track, message upstream to supervisor.
 * - Supervisor:        review, request changes, escalate to Super Admin, message both ways.
 * - Super Admin/Admin: governance (approve/reject), message downstream, create on behalf.
 * - TSR:               read-only visibility over their supervisors' scoped workflows.
 */
export function WorkflowCenter({
  actor,
  className,
}: {
  actor: WorkflowActor;
  className?: string;
}) {
  const { toast } = useToast();
  const role = normalizeRole(actor.role);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { workflows, loading, refetch } = useWorkflowRealtime(actor.userId || undefined, role, {
    onNew: (w) => toast(`New workflow: ${w.title}`, "info"),
    onUpdate: (w) => toast(`Workflow updated: ${w.title}`, "info"),
  });

  const selected = workflows.find((w) => w.id === selectedId) ?? null;

  const canCreate = role !== "tsr";
  const isSupervisor = role === "supervisor";
  const isExecutive = role === "super_admin";

  async function runAction(
    wf: Workflow,
    endpoint: string,
    opts?: { method?: string; body?: any; success?: string },
  ) {
    setActionLoading(wf.id);
    try {
      const res = await fetch(endpoint, {
        method: opts?.method ?? "POST",
        credentials: "include",
        headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      toast(opts?.success ?? "Action completed", "success");
      refetch().catch(() => {});
    } catch (err: any) {
      toast(err.message ?? "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  }

  function openThread(wf: Workflow) {
    setSelectedId(wf.id);
    setThreadOpen(true);
    // Mark the thread read for this user in the background.
    fetch(`/api/workflows/${wf.id}/messages/read`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }

  return (
    <div
      className={`workflow-center ${className ?? ""}`}
      style={{
        display: "flex", flexDirection: "column", gap: 14,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={16} style={{ color: "#0b1730" }} />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".04em", color: "var(--text, #0f172a)" }}>
            WORKFLOW TRACKER
          </span>
        </div>
        {canCreate && (
          <button
            onClick={() => setSubmitOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              border: "none", background: "#0b1730", color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Plus size={14} />
            New Workflow
          </button>
        )}
      </div>

      {loading && workflows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#94a3b8", padding: "16px 0", textAlign: "center" }}>
          Loading workflows…
        </div>
      ) : workflows.length === 0 ? (
        <div style={{
          fontSize: 12, color: "#94a3b8", padding: "22px 0", textAlign: "center",
          border: "1px dashed #e2e8f0", borderRadius: 12,
        }}>
          No workflows in your scope yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {workflows.map((wf) => {
            const isActive = wf.id === selectedId;
            return (
              <div
                key={wf.id}
                style={{
                  border: `1px solid ${isActive ? "#0b1730" : "var(--line, #e5e7eb)"}`,
                  borderRadius: 12,
                  background: isActive ? "#f8fafc" : "var(--card, #fff)",
                  padding: "12px 14px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <button
                    onClick={() => setSelectedId(isActive ? null : wf.id)}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      textAlign: "left", flex: 1, minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text, #0f172a)", lineHeight: 1.35 }}>
                      {wf.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                      {wf.originatorRole.toUpperCase()} · {new Date(wf.createdAt ?? Date.now()).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </button>
                  <StatusBadge value={wf.status} variant="status" />
                </div>

                {isActive && (
                  <>
                    <WorkflowTracker workflowId={wf.id} currentStatus={wf.status} mini />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button
                        onClick={() => openThread(wf)}
                        style={actionBtn("var(--card, #fff)", "var(--text, #0f172a)", "1px solid #e2e8f0")}
                      >
                        <MessageSquare size={13} /> Messages
                      </button>

                      {isSupervisor && (
                        <>
                          <button
                            disabled={actionLoading === wf.id}
                            onClick={() =>
                              runAction(wf, `/api/workflows/${wf.id}/supervisor-action`, {
                                body: { action: "review" },
                                success: "Marked under supervisor review",
                              })
                            }
                            style={actionBtn("#2563eb0d", "#2563eb", "1px solid #2563eb40")}
                          >
                            <Search size={13} /> Review
                          </button>
                          <button
                            disabled={actionLoading === wf.id}
                            onClick={() =>
                              runAction(wf, `/api/workflows/${wf.id}/supervisor-action`, {
                                body: { action: "request_changes", messageBody: "Please provide additional information." },
                                success: "Change request routed downstream",
                              })
                            }
                            style={actionBtn("#f59e0b0d", "#b45309", "1px solid #f59e0b40")}
                          >
                            <RotateCcw size={13} /> Request Changes
                          </button>
                          <button
                            disabled={actionLoading === wf.id}
                            onClick={() =>
                              runAction(wf, `/api/workflows/${wf.id}/escalate`, {
                                success: "Escalated to Super Admin",
                              })
                            }
                            style={actionBtn("#f370210d", "#c2410c", "1px solid #f3702140")}
                          >
                            <ArrowUpCircle size={13} /> Escalate
                          </button>
                        </>
                      )}

                      {isExecutive && (
                        <>
                          <button
                            disabled={actionLoading === wf.id}
                            onClick={() =>
                              runAction(wf, `/api/workflows/${wf.id}/admin-action`, {
                                body: { decision: "approve" },
                                success: "Workflow approved",
                              })
                            }
                            style={actionBtn("#16a34a0d", "#15803d", "1px solid #16a34a40")}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            disabled={actionLoading === wf.id}
                            onClick={() =>
                              runAction(wf, `/api/workflows/${wf.id}/admin-action`, {
                                body: { decision: "reject" },
                                success: "Workflow rejected",
                              })
                            }
                            style={actionBtn("#dc26260d", "#b91c1c", "1px solid #dc262640")}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && threadOpen && (
        <WorkflowMessagesThread
          workflowId={selected.id}
          sender={{ userId: actor.userId, role: role as any, name: actor.name }}
        />
      )}

      <WorkflowSubmitModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        actor={{
          userId: actor.userId,
          role,
          name: actor.name,
          supervisorId: actor.supervisorId,
        }}
        onCreated={(wfId) => {
          setSelectedId(wfId);
          refetch().catch(() => {});
        }}
      />
    </div>
  );
}

function actionBtn(bg: string, fg: string, border: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 10px",
    borderRadius: 8,
    border,
    background: bg,
    color: fg,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  };
}
