"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "blue" | "teal" | "amber" | "violet" | "red" | "green";
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
}

const tones: Record<string, { bg: string; fg: string; border: string }> = {
  blue:   { bg: "rgba(148, 200, 61, 0.12)", fg: "#94C83D", border: "rgba(148, 200, 61, 0.25)" },
  teal:   { bg: "rgba(148, 200, 61, 0.16)", fg: "#7da830", border: "rgba(148, 200, 61, 0.3)" },
  amber:  { bg: "rgba(243, 112, 33, 0.12)", fg: "#F37021", border: "rgba(243, 112, 33, 0.28)" },
  violet: { bg: "rgba(243, 112, 33, 0.16)", fg: "#e05e12", border: "rgba(243, 112, 33, 0.32)" },
  red:    { bg: "rgba(239, 68, 68, 0.12)", fg: "#dc2626", border: "rgba(239, 68, 68, 0.25)" },
  green:  { bg: "rgba(148, 200, 61, 0.15)", fg: "#84b832", border: "rgba(148, 200, 61, 0.3)" },
};

export function KpiCard({ label, value, icon: Icon, tone = "blue", trend, trendUp, subtitle, className }: KpiCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) { setDisplay(String(value)); return; }

    const duration = 800;
    const start = performance.now();
    const prefix = String(value).match(/^[^0-9]*/)?.[0] ?? "";
    const suffix = String(value).match(/[^0-9]*$/)?.[0] ?? "";

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * eased);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value]);

  const t = tones[tone] ?? tones.blue;

  return (
    <div
      ref={ref}
      className={`kpi-card ${className ?? ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "var(--card, #ffffff)",
        border: `1px solid var(--line, ${t.border})`,
        borderRadius: 12,
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        position: "relative",
        minHeight: 115,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(10px)",
        transition: "all .4s cubic-bezier(.22,1,.36,1)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <span
          className="kpi-label"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--muted, #64748b)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1.3
          }}
        >
          {label}
        </span>
        <div
          className="kpi-icon"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: t.bg,
            color: t.fg,
            flexShrink: 0
          }}
        >
          {Icon && <Icon size={16} />}
        </div>
      </div>

      <div className="kpi-body" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div
          className="kpi-value"
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text, #0f172a)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1
          }}
        >
          {display}
        </div>
        {subtitle && (
          <div
            className="kpi-sub"
            style={{
              fontSize: 11,
              color: "var(--muted, #64748b)",
              lineHeight: 1.3,
              fontWeight: 500
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {trend && (
        <div
          className="kpi-trend"
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: 700,
            color: trendUp ? "#16a34a" : "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <span>{trendUp ? "↑" : "↓"}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
