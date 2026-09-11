"use client";

type BadgeVariant = "role" | "status" | "alert" | "loan" | "outlet" | "default";

const colorMap: Record<string, { bg: string; fg: string }> = {
  // Roles
  super_admin: { bg: "rgba(243, 112, 33, 0.14)", fg: "#F37021" },
  admin:       { bg: "rgba(243, 112, 33, 0.14)", fg: "#F37021" },
  supervisor:  { bg: "rgba(148, 200, 61, 0.16)", fg: "#7da830" },
  vsr:         { bg: "rgba(148, 200, 61, 0.14)", fg: "#94C83D" },
  merchandiser:{ bg: "rgba(243, 112, 33, 0.12)", fg: "#F37021" },
  tsr:         { bg: "rgba(148, 200, 61, 0.18)", fg: "#84b832" },
  // Statuses
  active:        { bg: "rgba(148, 200, 61, 0.16)", fg: "#84b832" },
  inactive:      { bg: "rgba(148, 163, 184, 0.15)", fg: "#64748b" },
  on_leave:      { bg: "rgba(243, 112, 33, 0.12)", fg: "#F37021" },
  "On route":    { bg: "rgba(148, 200, 61, 0.18)", fg: "#94C83D" },
  "Needs review":{ bg: "rgba(239, 68, 68, 0.14)", fg: "#dc2626" },
  // Alert statuses
  pending:   { bg: "rgba(243, 112, 33, 0.14)", fg: "#F37021" },
  reviewed:  { bg: "rgba(148, 200, 61, 0.15)", fg: "#7da830" },
  escalated: { bg: "rgba(243, 112, 33, 0.2)", fg: "#e05e12" },
  resolved:  { bg: "rgba(148, 200, 61, 0.18)", fg: "#84b832" },
  // Loan statuses
  pending_supervisor: { bg: "rgba(243, 112, 33, 0.14)", fg: "#F37021" },
  pending_admin:      { bg: "rgba(243, 112, 33, 0.16)", fg: "#F37021" },
  approved:           { bg: "rgba(148, 200, 61, 0.16)", fg: "#84b832" },
  rejected:           { bg: "rgba(239, 68, 68, 0.12)", fg: "#dc2626" },
  disbursed:          { bg: "rgba(148, 200, 61, 0.18)", fg: "#94C83D" },
  // Outlet statuses
  healthy:     { bg: "rgba(148, 200, 61, 0.16)", fg: "#84b832" },
  "needs_review": { bg: "rgba(239, 68, 68, 0.12)", fg: "#dc2626" },
  // Alert severity
  info:     { bg: "rgba(148, 200, 61, 0.14)", fg: "#94C83D" },
  warning:  { bg: "rgba(243, 112, 33, 0.15)", fg: "#F37021" },
  critical: { bg: "rgba(239, 68, 68, 0.15)", fg: "#dc2626" },
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function StatusBadge({
  value,
  variant = "default",
  className,
}: {
  value: string;
  variant?: BadgeVariant;
  className?: string;
}) {
  const key = slugify(value);
  const colors = colorMap[key] ?? { bg: "#f3f4f6", fg: "#374151" };

  return (
    <span
      className={`status-badge ${className ?? ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".02em",
        background: colors.bg,
        color: colors.fg,
        lineHeight: "18px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: colors.fg,
          flexShrink: 0,
        }}
      />
      {value.replace(/_/g, " ")}
    </span>
  );
}
