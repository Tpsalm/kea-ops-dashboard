"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { publishWorkflowCreated } from "@/lib/shared-communications";
import { Send, UserPlus, AlertCircle, FileText } from "lucide-react";

type OriginatorRole = "vsr" | "merchandiser" | "supervisor";
type Actor = {
  userId: string;
  role: string;
  name: string;
  email?: string;
  supervisorId?: string | null;
};

type Prefill = {
  title?: string;
  summary?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  relatedEntityType?: string;
  relatedEntityId?: string;
  documentIds?: string[];
  originatorOverrideId?: string;
  originatorOverrideName?: string;
  originatorOverrideRole?: OriginatorRole;
};

export function WorkflowSubmitModal({
  open, onClose, actor, prefill, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  actor: Actor;
  prefill?: Prefill;
  onCreated?: (workflowId: string, data: any) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [summary, setSummary] = useState(prefill?.summary ?? "");
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(prefill?.priority ?? 3);
  const [originatorId, setOriginatorId] = useState(prefill?.originatorOverrideId ?? actor.userId);
  const [originatorName, setOriginatorName] = useState(prefill?.originatorOverrideName ?? actor.name);
  const [originatorRole, setOriginatorRole] = useState<OriginatorRole>(
    (prefill?.originatorOverrideRole as OriginatorRole) ??
    (actor.role === "vsr" || actor.role === "merchandiser" || actor.role === "supervisor"
      ? actor.role
      : "vsr"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isExecutiveOriginatorPickerOn = actor.role === "super_admin" || actor.role === "admin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!title.trim()) {
      setErr("Workflow title is required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const payload: any = {
        title: title.trim(),
        summary: summary.trim() || null,
        priority,
        documentIds: prefill?.documentIds ?? [],
        originatorId: isExecutiveOriginatorPickerOn ? originatorId : actor.userId,
        originatorRole: isExecutiveOriginatorPickerOn ? originatorRole : actor.role,
        originatorName: isExecutiveOriginatorPickerOn ? originatorName : actor.name,
        relatedEntityType: prefill?.relatedEntityType ?? null,
        relatedEntityId: prefill?.relatedEntityId ?? null,
      };
      const res = await fetch("/api/workflows", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? j.code ?? `Request failed (HTTP ${res.status})`);
      }
      const json = await res.json();
      const wf = json.workflow;
      toast("Workflow created and routed", "success");
      publishWorkflowCreated({
        workflowId: wf.id,
        workflowTitle: wf.title,
        originatorRole: wf.originatorRole,
        originatorName: payload.originatorName,
        assignedSupervisorId: wf.assignedSupervisorId,
        payload: { workflow: wf },
      });
      onCreated?.(wf.id, wf);
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Submission failed");
      toast(e.message ?? "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { if (!submitting) onClose(); }}
      title="Submit Workflow Request"
      width={520}
    >
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {err && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fef2f2", border: "1px solid #fecaca",
            color: "#991b1b", padding: "10px 12px",
            borderRadius: 10, fontSize: 12, fontWeight: 500,
          }}>
            <AlertCircle size={14} />
            {err}
          </div>
        )}

        {isExecutiveOriginatorPickerOn && (
          <div style={{
            padding: 12, borderRadius: 10,
            background: "#fff7ed", border: "1px solid #fed7aa",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontWeight: 700, fontSize: 12, color: "#9a3412", marginBottom: 8,
            }}>
              <UserPlus size={14} />
              Executive On-Behalf Submission
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Originator Role</span>
                <select
                  value={originatorRole}
                  onChange={(e) => setOriginatorRole(e.target.value as any)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                >
                  <option value="vsr">VSR</option>
                  <option value="merchandiser">Merchandiser</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Originator Name</span>
                <input
                  value={originatorName}
                  onChange={(e) => setOriginatorName(e.target.value)}
                  placeholder="Originator's display name"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Originator UUID</span>
              <input
                value={originatorId}
                onChange={(e) => setOriginatorId(e.target.value)}
                placeholder="e.g. uuid from users table"
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, fontFamily: "monospace" }}
              />
            </label>
          </div>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text, #0f172a)" }}>
            Request Title <span style={{ color: "#dc2626" }}>*</span>
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Funding Request: ₦500,000 Route Ikeja North"
            style={{
              padding: "10px 12px", borderRadius: 10,
              border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
            }}
            maxLength={160}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text, #0f172a)" }}>
            Summary / Business Purpose
          </span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Explain the context, scope, and expected outcome."
            style={{
              padding: "10px 12px", borderRadius: 10,
              border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
              resize: "vertical", fontFamily: "inherit",
            }}
            maxLength={1000}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text, #0f172a)" }}>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) as any)}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            >
              <option value={1}>1 — Low</option>
              <option value={2}>2 — Medium</option>
              <option value={3}>3 — High</option>
              <option value={4}>4 — Urgent</option>
              <option value={5}>5 — Critical</option>
            </select>
          </label>

          {prefill?.documentIds && prefill.documentIds.length > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, color: "#475569", fontWeight: 600,
              padding: "4px 10px", background: "#f1f5f9",
              borderRadius: 999,
            }}>
              <FileText size={12} />
              {prefill.documentIds.length} doc{prefill.documentIds.length > 1 ? "s" : ""} attached
            </span>
          )}
        </div>

        <div style={{
          fontSize: 11, color: "#64748b",
          padding: "8px 10px", background: "#f8fafc",
          border: "1px solid #e2e8f0", borderRadius: 8,
        }}>
          <strong>Routing:</strong> Originator → Assigned Supervisor → (on escalation) Super Admin.
          The workflow will be securely scoped by JWT-verified role.
        </div>

        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 8,
          marginTop: 4,
        }}>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            style={{
              padding: "10px 16px", borderRadius: 10,
              border: "1px solid #e2e8f0", background: "#fff",
              color: "#475569", fontSize: 12, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 16px", borderRadius: 10,
              border: "none", background: "#0b1730",
              color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <Send size={13} />
            {submitting ? "Submitting…" : "Create & Route"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
