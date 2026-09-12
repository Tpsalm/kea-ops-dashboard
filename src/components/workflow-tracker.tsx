"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import {
  FileEdit, Send, Search, ArrowUpCircle, CheckCircle2, XCircle, RotateCcw, ChevronRight, Clock,
} from "lucide-react";
import { useWorkflowStepsRealtime } from "@/lib/use-workflow-realtime";
import type { WorkflowStep } from "@/db/schema";

type DisplayStep = {
  key: string;
  label: string;
  icon: any;
  color: string;
  order: number;
  reached: boolean;
  active: boolean;
  isRetract?: boolean;
};

const BASE_STEPS_OPS: DisplayStep[] = [
  { key: "draft", label: "Draft", icon: FileEdit, color: "#64748b", order: 0, reached: false, active: false },
  { key: "submitted", label: "Submitted by Originator", icon: Send, color: "#94C83D", order: 1, reached: false, active: false },
  { key: "supervisor_review", label: "Under Supervisor Review", icon: Search, color: "#2563eb", order: 2, reached: false, active: false },
  { key: "escalated", label: "Escalated to Executive", icon: ArrowUpCircle, color: "#F37021", order: 3, reached: false, active: false },
  { key: "approved", label: "Approved", icon: CheckCircle2, color: "#16a34a", order: 4, reached: false, active: false },
];

const REJECT_STEP: DisplayStep = {
  key: "rejected", label: "Rejected", icon: XCircle, color: "#dc2626", order: 5, reached: false, active: false,
};
const RETRACT_STEP: DisplayStep = {
  key: "retracted", label: "Retracted", icon: RotateCcw, color: "#ca8a04", order: 6, reached: false, active: false, isRetract: true,
};

function statusToStepKey(status?: string | null): string | null {
  switch (status) {
    case "draft": return "draft";
    case "submitted_by_vsr":
    case "submitted_by_merchandiser": return "submitted";
    case "under_supervisor_review": return "supervisor_review";
    case "escalated_to_admin":
    case "under_admin_review": return "escalated";
    case "approved": return "approved";
    case "rejected": return "rejected";
    case "retracted": return "retracted";
    default: return null;
  }
}

function buildDisplaySteps(steps: WorkflowStep[], currentStatus?: string | null): DisplayStep[] {
  let terminal: DisplayStep | null = null;
  if (currentStatus === "rejected") terminal = { ...REJECT_STEP };
  if (currentStatus === "retracted") terminal = { ...RETRACT_STEP };

  let maxOrderReached = -1;
  let activeKey: string | null = statusToStepKey(currentStatus);

  for (const s of steps) {
    const k = statusToStepKey(s.statusTo);
    if (!k) continue;
    const idx = BASE_STEPS_OPS.findIndex((b) => b.key === k);
    if (idx >= 0) maxOrderReached = Math.max(maxOrderReached, idx);
    if (terminal && (s.statusTo === "rejected" || s.statusTo === "retracted")) {
      maxOrderReached = Math.max(maxOrderReached, terminal.order);
      activeKey = terminal.key;
    }
  }
  if (!activeKey && steps.length === 0 && currentStatus) activeKey = statusToStepKey(currentStatus);
  if (!activeKey && steps.length === 0) activeKey = "draft";

  const baseWithFlags: DisplayStep[] = BASE_STEPS_OPS.map((b) => ({
    ...b,
    reached: b.order <= maxOrderReached,
    active: b.key === activeKey,
  }));

  if (terminal) {
    baseWithFlags.push({
      ...terminal,
      reached: terminal.order <= maxOrderReached || true,
      active: terminal.key === activeKey,
    });
  }

  // Retract strike-through handling: if any retract step type present, mark as isRetract visual
  const retractPresent = steps.some((s) => s.stepType === "retract");
  if (retractPresent) {
    return baseWithFlags.map((b) => (b.key === "retracted" ? b : { ...b, isRetract: b.order < maxOrderReached && b.key !== activeKey }));
  }
  return baseWithFlags;
}

export function WorkflowTracker({
  workflowId,
  currentStatus,
  mini = false,
  className,
}: {
  workflowId?: string | null;
  currentStatus?: string | null;
  mini?: boolean;
  className?: string;
}) {
  const { steps, loading } = useWorkflowStepsRealtime(workflowId ?? null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const display = useMemo(() => buildDisplaySteps(steps ?? [], currentStatus), [steps, currentStatus]);

  useEffect(() => {
    const active = display.findIndex((d) => d.active);
    if (active >= 0) setFocusedIdx(active);
  }, [display]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(display.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(0, i - 1));
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [display.length]);

  const height = mini ? 56 : 72;
  const iconSize = mini ? 14 : 18;
  const labelSize = mini ? 10 : 12;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Workflow progress tracker"
      aria-live="polite"
      className={`workflow-tracker ${className ?? ""}`}
      style={{
        width: "100%",
        padding: mini ? "8px 10px" : "12px 14px",
        borderRadius: 12,
        background: mini ? "transparent" : "var(--card, #fff)",
        border: mini ? "1px dashed var(--line, #e5e7eb)" : "1px solid var(--line, #e5e7eb)",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4,
        minHeight: height,
      }}>
        {display.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === display.length - 1;
          const showConnector = !isLast;
          const activeOrReached = step.reached || step.active;
          const fg = step.active ? step.color : step.reached ? step.color : "#cbd5e1";
          const bg = step.active ? `${step.color}18` : step.reached ? `${step.color}10` : "transparent";
          const labelOpacity = step.reached || step.active ? 1 : 0.55;
          const textDecor = step.isRetract ? "line-through" : "none";
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
              <div
                tabIndex={0}
                role="listitem"
                aria-current={step.active ? "step" : undefined}
                style={{
                  display: "flex",
                  flexDirection: mini ? "row" : "column",
                  alignItems: "center",
                  gap: mini ? 6 : 4,
                  flex: 1,
                  minWidth: 0,
                  outline: focusedIdx === idx ? `2px dashed ${step.color}60` : "none",
                  outlineOffset: 2,
                  borderRadius: 8,
                  padding: mini ? "2px 4px" : 2,
                }}
              >
                <div style={{
                  width: mini ? 24 : 32, height: mini ? 24 : 32, borderRadius: "50%",
                  background: bg,
                  border: `1.5px solid ${fg}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: fg,
                  flexShrink: 0,
                  boxShadow: step.active ? `0 0 0 4px ${step.color}12` : "none",
                  opacity: labelOpacity,
                }}>
                  <Icon size={iconSize} />
                </div>
                {!mini && (
                  <span style={{
                    fontSize: labelSize,
                    fontWeight: step.active ? 700 : 600,
                    color: step.active ? step.color : "var(--text, #334155)",
                    opacity: labelOpacity,
                    textDecoration: textDecor,
                    textAlign: "center",
                    lineHeight: 1.25,
                    maxWidth: 110,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "normal",
                  }}>
                    {step.label}
                  </span>
                )}
                {mini && (
                  <span style={{
                    fontSize: labelSize,
                    fontWeight: step.active ? 700 : 600,
                    color: step.active ? step.color : "var(--muted, #64748b)",
                    opacity: labelOpacity,
                    textDecoration: textDecor,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
                  }}>
                    {step.label}
                  </span>
                )}
              </div>
              {showConnector && (
                <div style={{
                  flex: 0, flexBasis: mini ? 12 : 20, height: 2,
                  position: "relative",
                  background: "#e2e8f0",
                  marginLeft: mini ? 4 : 0,
                  marginRight: mini ? 4 : 0,
                  minWidth: mini ? 8 : 14,
                }} aria-hidden="true">
                  {activeOrReached && display[idx + 1]?.reached && (
                    <div style={{
                      position: "absolute", inset: 0, background: step.color,
                      transition: "background .4s",
                    }} />
                  )}
                  <ChevronRight
                    size={mini ? 10 : 12}
                    style={{
                      position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
                      color: "#cbd5e1",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {loading && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 8,
          fontSize: 11, color: "#94a3b8",
        }} aria-hidden="true">
          <Clock size={12} />
          <span>Synchronizing latest steps…</span>
        </div>
      )}
    </div>
  );
}
