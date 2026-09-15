"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

export const DASHBOARD_REFRESH_EVENT = "kea-documents-refreshed";

export function notifyDashboardRefresh(detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_REFRESH_EVENT, {
      detail: { source: "document-sync", ...(detail ?? {}) },
    }),
  );
}

/**
 * Live document sync for the Kea dashboards.
 *
 * Responsibilities:
 *  1. Subscribe to an in-app realtime channel that receives:
 *     - `postgres_changes` INSERTs on the `documents` table
 *       (requires the `documents`/`alerts` tables to be added to the
 *       `supabase_realtime` publication — see the SQL migration).
 *     - Cross-device broadcast events fired by the documents API.
 *  2. Listen for same-browser window events + `storage` events.
 *  3. Fall back to a lightweight interval poll.
 *
 * Whenever an incoming submission relevant to this dashboard's role/scope is
 * detected, `onRefresh` fires so the dashboard refetches and lights up.
 *
 * Usage (role-aware live refresh):
 *   useLiveDocuments({ userId, role, onRefresh: () => fetchDashboard() });
 */
export function useLiveDocuments(opts: {
  userId?: string | null;
  role?: string | null;
  enabled?: boolean;
  pollInterval?: number; // ms; 0 disables polling
  defaultRefreshOnNew?: boolean; // keep for compatibility
  onRefresh: () => void;
  onNew?: (doc: any) => void;
}) {
  const {
    userId,
    role,
    enabled = true,
    pollInterval = 12000,
    onRefresh,
    onNew,
  } = opts;

  const live = useRef({ onRefresh, onNew, userId, role });

  const [didSync, setDidSync] = useState(false);

  useEffect(() => {
    live.current = { onRefresh, onNew, userId, role };
  }, [onRefresh, onNew, userId, role]);

  useEffect(() => {
    if (!enabled) return;

    const shouldRefreshForDocument = (doc?: any) => {
      if (!doc) return true;
      const currentRole = live.current.role === "super-admin" ? "super_admin" : live.current.role;
      const currentUserId = live.current.userId;
      if (!currentRole || !currentUserId) return true;
      if (currentRole === "super_admin" || currentRole === "admin") {
        return true;
      }
      if (currentRole === "supervisor") {
        return doc.supervisorId === currentUserId || doc.supervisor_id === currentUserId || doc.uploaderId === currentUserId || doc.uploader_id === currentUserId;
      }
      return doc.uploaderId === currentUserId || doc.uploader_id === currentUserId;
    };

    const refresh = (event?: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : undefined;
      const doc = detail?.data ?? detail?.payload ?? detail;
      if (!shouldRefreshForDocument(doc)) return;
      try {
        live.current.onRefresh?.();
        live.current.onNew?.(doc);
        setDidSync(true);
      } catch {}
    };

    // Same-browser realtime + storage listeners (the local event bus).
    window.addEventListener("kea-document-submitted", refresh as any);
    window.addEventListener("kea-document-reconciled", refresh as any);
    window.addEventListener("kea-document-reconciled-acknowledged", refresh as any);
    window.addEventListener("kea-directive-dispatched", refresh as any);
    window.addEventListener("kea-directive-acknowledged", refresh as any);
    window.addEventListener("storage", refresh as any);

    let supabase: ReturnType<typeof createClient> | null = null;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      supabase = createClient();
      channel = supabase
        .channel(`kea-documents-live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
        .on("broadcast", { event: "kea-document-created" }, (payload) => {
          refresh(new CustomEvent("kea-document-created", { detail: payload.payload }));
        })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "documents" },
          (payload) => refresh(new CustomEvent("kea-document-created", { detail: payload.new })),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "documents" },
          (payload) => refresh(new CustomEvent("kea-document-updated", { detail: payload.new })),
        )
        .subscribe();
    } catch {
      channel = null;
    }

    if (pollInterval > 0) {
      pollRef.current = setInterval(refresh, pollInterval);
    }

    return () => {
      window.removeEventListener("kea-document-submitted", refresh as any);
      window.removeEventListener("kea-document-reconciled", refresh as any);
      window.removeEventListener("kea-document-reconciled-acknowledged", refresh as any);
      window.removeEventListener("kea-directive-dispatched", refresh as any);
      window.removeEventListener("kea-directive-acknowledged", refresh as any);
      window.removeEventListener("storage", refresh as any);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (supabase && channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          channel.unsubscribe();
        }
      }
    };
  }, [enabled, pollInterval]);

  void didSync;
  void role;
  void userId;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  return { didSync };
}
