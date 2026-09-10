"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { createClient } from "./supabase";

/**
 * Subscribes to real-time alerts for the current user.
 * Returns live alerts and a refetch function.
 *
 * Usage:
 *   const { alerts, unreadCount, refetch } = useRealtimeAlerts(userId);
 */
type AlertRow = {
  id: string; title: string; message: string; status: string;
  type: string; severity: string; created_at: string;
  from_user_id: string; to_user_id: string;
};

export function useRealtimeAlerts(userId?: string) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(data.alerts ?? []);
      setUnreadCount(data.unread ?? 0);
    } catch { /* empty */ }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchAlerts();

    const supabase = createClient();

    // Subscribe to INSERT events on the alerts table
    channelRef.current = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new as AlertRow;
          // Only include alerts directed to this user
          if (newAlert.to_user_id === userId) {
            setAlerts((prev) => [newAlert, ...prev]);
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "alerts" },
        (payload) => {
          const updated = payload.new as AlertRow;
          setAlerts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
          if (updated.status === "resolved" || updated.status === "reviewed") {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [userId, fetchAlerts]);

  return { alerts, unreadCount, refetch: fetchAlerts };
}
