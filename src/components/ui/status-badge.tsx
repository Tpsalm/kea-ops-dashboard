"use client";

type BadgeVariant = "role" | "status" | "alert" | "loan" | "outlet" | "default";

const colorMap: Record<string, { bg: string; fg: string }> = {
  // Roles
  super_admin: { bg: "#ede9fe", fg: "#7c3aed" },
  admin:       { bg: "#ede9fe", fg: "#7c3aed" },
  supervisor:  { bg: "#dbeafe", fg: "#2563eb" },
  vsr:         { bg: "#ecfdf5", fg: "#0e918a" },
  merchandiser:{ bg: "#fff7ed", fg: "#ea580c" },
  tsr:         { bg: "#fefce8", fg: "#ca8a04" },
  // Statuses
  active:        { bg: "#dcfce7", fg: "#16a34a" },
  inactive:      { bg: "#f3f4f6", fg: "#6b7280" },
  on_leave:      { bg: "#fef3c7", fg: "#d97706" },
  "On route":    { bg: "#dbeafe", fg: "#2563eb" },
  "Needs review":{ bg: "#fef2f2", fg: "#dc2626" },
  // Alert statuses
  pending:   { bg: "#fef3c7", fg: "#d97706" },
  reviewed:  { bg: "#dbeafe", fg: "#2563eb" },
  escalated: { bg: "#fce7f3", fg: "#db2777" },
  resolved:  { bg: "#dcfce7", fg: "#16a34a" },
  // Loan statuses
  pending_supervisor: { bg: "#fef3c7", fg: "#d97706" },
  pending_admin:      { bg: "#fef3c7", fg: "#d97706" },
  approved:           { bg: "#dcfce7", fg: "#16a34a" },
  rejected:           { bg: "#fef2f2", fg: "#dc2626" },
  disbursed:          { bg: "#dbeafe", fg: "#2563eb" },
  // Outlet statuses
  healthy:     { bg: "#dcfce7", fg: "#16a34a" },
  "needs_review": { bg: "#fef2f2", fg: "#dc2626" },
  // Alert severity
  info:     { bg: "#dbeafe", fg: "#2563eb" },
  warning:  { bg: "#fef3c7", fg: "#d97706" },
  critical: { bg: "#fef2f2", fg: "#dc2626" },
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
