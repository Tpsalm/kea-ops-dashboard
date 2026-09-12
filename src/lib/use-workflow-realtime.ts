"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Workflow, WorkflowStep, WorkflowMessage } from "@/db/schema";

// `useAuth` exposes "super-admin" (hyphenated) while the API/DB roles use
// "super_admin" (underscored). Normalize both plus the legacy "admin" alias
// into the canonical governance tier so realtime scoping never misfires.
type AppRole = "super_admin" | "super-admin" | "admin" | "supervisor" | "vsr" | "merchandiser" | "tsr";

function normalizeRole(role?: AppRole | null): AppRole {
  if (role === "super-admin" || role === "admin") return "super_admin";
  return role ?? "vsr";
}

function buildWorkflowFilter(
  userId: string,
  role: AppRole | null | undefined,
): string {
  switch (normalizeRole(role)) {
    case "super_admin":
      return "";
    case "supervisor":
      return `assigned_supervisor_id=eq.${userId}`;
    case "vsr":
    case "merchandiser":
      return `originator_id=eq.${userId}`;
    case "tsr":
      return "";
    default:
      return `originator_id=eq.${userId}`;
  }
}

export function useWorkflowRealtime(
  userId: string | null | undefined,
  role: AppRole | null | undefined,
  opts?: { onNew?: (w: Workflow) => void; onUpdate?: (w: Workflow) => void },
) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<any>(null);
  const mounted = useRef(true);

  const fetchWorkflows = useCallback(async () => {
    if (!userId || !role) return;
    try {
      const res = await fetch("/api/workflows", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (mounted.current) {
        setWorkflows(json.workflows ?? []);
        setError(null);
      }
    } catch (e: any) {
      if (mounted.current) setError(e?.message ?? "Fetch failed");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    if (!userId || !role) {
      setLoading(false);
      return;
    }
    fetchWorkflows();

    const filter = buildWorkflowFilter(userId, role);
    let supabase: any = null;
    try {
      supabase = createClient();
      const channel = supabase
        .channel("workflows-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "workflows",
            ...(filter ? { filter } : {}),
          },
          (payload: any) => {
            const newWf = payload.new as Workflow;
            setWorkflows((prev) => {
              if (prev.some((w) => w.id === newWf.id)) return prev;
              opts?.onNew?.(newWf);
              return [newWf, ...prev];
            });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "workflows",
            ...(filter ? { filter } : {}),
          },
          (payload: any) => {
            const upWf = payload.new as Workflow;
            opts?.onUpdate?.(upWf);
            setWorkflows((prev) =>
              prev.map((w) => (w.id === upWf.id ? upWf : w)),
            );
          },
        )
        .subscribe((status: string) => {
          if (status !== "SUBSCRIBED" && status !== "TIMED_OUT") return;
        });
      channelRef.current = channel;
    } catch (_e) {
      // Supabase client unavailable — rely on polling only.
    }

    pollRef.current = setInterval(fetchWorkflows, 15000);

    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      if (supabase && channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
      }
    };
  }, [userId, role, fetchWorkflows, opts?.onNew, opts?.onUpdate]);

  const refetch = useCallback(() => fetchWorkflows(), [fetchWorkflows]);
  return { workflows, loading, error, refetch };
}

export function useWorkflowStepsRealtime(
  workflowId: string | null | undefined,
  opts?: { onStep?: (step: WorkflowStep) => void },
) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<any>(null);
  const mounted = useRef(true);

  const fetchSteps = useCallback(async () => {
    if (!workflowId) return;
    try {
      const res = await fetch(`/api/workflows/${workflowId}/steps`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (mounted.current) setSteps(json.steps ?? []);
    } catch {
      // ignore
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    if (!workflowId) { setLoading(false); return; }
    fetchSteps();

    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`workflow-steps-${workflowId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "workflow_steps",
            filter: `workflow_id=eq.${workflowId}`,
          },
          (payload: any) => {
            const ns = payload.new as WorkflowStep;
            opts?.onStep?.(ns);
            setSteps((prev) => {
              if (prev.some((s) => s.id === ns.id)) return prev;
              const next = [...prev, ns];
              next.sort((a, b) => Number(a.stepOrder) - Number(b.stepOrder));
              return next;
            });
          },
        )
        .subscribe();
      channelRef.current = channel;
    } catch {}

    pollRef.current = setInterval(fetchSteps, 15000);

    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      try {
        const sb = createClient();
        if (channelRef.current) sb.removeChannel(channelRef.current);
      } catch {}
    };
  }, [workflowId, fetchSteps, opts?.onStep]);

  return { steps, loading, refetch: fetchSteps };
}

export function useWorkflowMessagesRealtime(
  workflowId: string | null | undefined,
  userId: string | null | undefined,
  opts?: { onMessage?: (m: WorkflowMessage) => void },
) {
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<any>(null);
  const mounted = useRef(true);

  const fetchMsgs = useCallback(async () => {
    if (!workflowId) return;
    try {
      const res = await fetch(`/api/workflows/${workflowId}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: WorkflowMessage[] = json.messages ?? [];
      if (mounted.current) {
        setMessages(list);
        setUnread(list.filter((m) => !m.isRead && m.targetUserId === userId).length);
      }
    } catch {
      // ignore
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [workflowId, userId]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    if (!workflowId) { setLoading(false); return; }
    fetchMsgs();

    if (userId) {
      try {
        const supabase = createClient();
        const channel = supabase
          .channel(`workflow-messages-${workflowId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "workflow_messages",
              filter: `workflow_id=eq.${workflowId}`,
            },
            (payload: any) => {
              const nm = payload.new as WorkflowMessage;
              if (nm.senderId !== userId && nm.targetUserId !== userId) return;
              opts?.onMessage?.(nm);
              setMessages((prev) => {
                if (prev.some((m) => m.id === nm.id)) return prev;
                return [...prev, nm];
              });
              if (nm.targetUserId === userId && !nm.isRead) {
                setUnread((x) => x + 1);
              }
            },
          )
          .subscribe();
        channelRef.current = channel;
      } catch {}
    }

    pollRef.current = setInterval(fetchMsgs, 15000);

    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      try {
        const sb = createClient();
        if (channelRef.current) sb.removeChannel(channelRef.current);
      } catch {}
    };
  }, [workflowId, userId, fetchMsgs, opts?.onMessage]);

  return { messages, unread, loading, refetch: fetchMsgs };
}
