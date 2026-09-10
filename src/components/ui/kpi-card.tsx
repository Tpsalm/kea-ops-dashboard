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

const tones: Record<string, { bg: string; fg: string }> = {
  blue:   { bg: "#eef2ff", fg: "#356bc2" },
  teal:   { bg: "#ecfdf5", fg: "#0e918a" },
  amber:  { bg: "#fffbeb", fg: "#d97706" },
  violet: { bg: "#f5f3ff", fg: "#7c3aed" },
  red:    { bg: "#fef2f2", fg: "#dc2626" },
  green:  { bg: "#f0fdf4", fg: "#16a34a" },
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
    <div ref={ref} className={`kpi-card ${className ?? ""}`} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(12px)", transition: "all .5s cubic-bezier(.22,1,.36,1)" }}>
      <div className="kpi-icon" style={{ background: t.bg, color: t.fg }}>
        {Icon && <Icon size={18} />}
      </div>
      <div className="kpi-body">
        <span className="kpi-value" style={{ color: t.fg }}>{display}</span>
        <span className="kpi-label">{label}</span>
        {subtitle && <span className="kpi-sub">{subtitle}</span>}
      </div>
      {trend && (
        <span className="kpi-trend" style={{ color: trendUp ? "#16a34a" : "#dc2626" }}>
          {trendUp ? "↑" : "↓"} {trend}
        </span>
      )}
    </div>
  );
}
