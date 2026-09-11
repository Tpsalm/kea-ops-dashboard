"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Bell, CheckCircle2, ChevronRight, Clock,
  ExternalLink, ShieldAlert, Sparkles, Volume2, VolumeX, X,
  ArrowRight, Banknote, Route, Store, Users, Target, Zap
} from "lucide-react";
import type { AppRole } from "../lib/useAuth";

export interface UrgentAlertItem {
  id: string;
  severity: "critical" | "high" | "warning" | "info";
  title: string;
  description: string;
  tag: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  time: string;
}

// Dashboard-specific urgent action items
const DASHBOARD_ALERTS: Record<string, {
  roleTitle: string;
  dashboardName: string;
  subtitle: string;
  bannerTone: "orange" | "green" | "red";
  items: UrgentAlertItem[];
}> = {
  "super-admin": {
    roleTitle: "SUPER ADMIN EXECUTIVE CONTROL",
    dashboardName: "Global Super Admin Operations",
    subtitle: "High-priority capital authorizations and compliance escalations require your immediate sign-off.",
    bannerTone: "orange",
    items: [
      {
        id: "sa-1",
        severity: "critical",
        title: "₦400,000 Capital Float Authorisation Pending",
        description: "2 VSR loan applications (Shittu Akinsanya & Paul Olakonipekun) endorsed by Supervisors awaiting final disbursement.",
        tag: "CAPITAL DISBURSEMENT",
        actionLabel: "Review & Authorize",
        actionHref: "/action-center",
        time: "12 mins ago"
      },
      {
        id: "sa-2",
        severity: "high",
        title: "Delinquency Risk Alert: Lagos West Route",
        description: "4 VSR accounts exceed 14-day float repayment ceiling. Automated recovery freeze protocol recommended.",
        tag: "LOAN SURVEILLANCE",
        actionLabel: "Open Surveillance",
        actionHref: "/vsr-surveillance",
        time: "45 mins ago"
      },
      {
        id: "sa-3",
        severity: "warning",
        title: "Territory GPS Discrepancy",
        description: "Delta region logged 42 store visits with missing geo-fence confirmation. Immediate audit required.",
        tag: "COMPLIANCE",
        actionLabel: "Audit Outlets",
        actionHref: "/merchandiser-outlets",
        time: "1 hour ago"
      }
    ]
  },
  admin: {
    roleTitle: "KEA ADMINISTRATOR DIRECTIVE",
    dashboardName: "Operations Administration Center",
    subtitle: "Centralized approvals and system compliance notices requiring administrative attention.",
    bannerTone: "orange",
    items: [
      {
        id: "adm-1",
        severity: "critical",
        title: "Pending Staff & Territory Approvals",
        description: "3 new field team member onboarding packages awaiting division role assignment.",
        tag: "ONBOARDING",
        actionLabel: "Authorize Staff",
        actionHref: "/hierarchy",
        time: "20 mins ago"
      },
      {
        id: "adm-2",
        severity: "high",
        title: "Centralized Escalations Queue",
        description: "5 supervisor escalation tickets require administrator sign-off.",
        tag: "ESCALATIONS",
        actionLabel: "Open Action Center",
        actionHref: "/action-center",
        time: "1 hour ago"
      }
    ]
  },
  vsr: {
    roleTitle: "VSR ROUTE & FIELD DISPATCH",
    dashboardName: "VSR Operations & Route Execution",
    subtitle: "Immediate action required for today's store delivery routes and sales settlement.",
    bannerTone: "green",
    items: [
      {
        id: "vsr-1",
        severity: "critical",
        title: "Urgent SLA Visit: 3 Key Supermarkets Overdue",
        description: "Ikeja North route delivery & stock replenishment window closes at 1:00 PM today.",
        tag: "ROUTE SLA",
        actionLabel: "Open Today's Route",
        actionHref: "/vsr-operations",
        time: "Just now"
      },
      {
        id: "vsr-2",
        severity: "high",
        title: "Daily Float Sales Reconciliation Due",
        description: "Previous sales collection receipt (₦85,000) must be uploaded before next tranche release.",
        tag: "FLOAT SETTLEMENT",
        actionLabel: "Submit Collection",
        actionHref: "/vsr-operations",
        time: "30 mins ago"
      },
      {
        id: "vsr-3",
        severity: "warning",
        title: "POSM Display Audit Mandatory",
        description: "Capture mandatory proof-of-placement photos at 4 newly activated Tier 1 outlets.",
        tag: "EXECUTION AUDIT",
        actionLabel: "View Stores",
        actionHref: "/vsr-operations",
        time: "2 hours ago"
      }
    ]
  },
  supervisor: {
    roleTitle: "SUPERVISOR TERRITORY CONTROL",
    dashboardName: "Supervisor Command Center",
    subtitle: "Active field team incidents, route allocations, and loan endorsements awaiting your review.",
    bannerTone: "orange",
    items: [
      {
        id: "sup-1",
        severity: "critical",
        title: "2 High-Priority Field Discrepancies",
        description: "Merchandisers logged pricing variances exceeding ±5% in Abeokuta Central. Requires supervisor review.",
        tag: "FIELD ESCALATION",
        actionLabel: "Resolve Discrepancy",
        actionHref: "/supervisor",
        time: "15 mins ago"
      },
      {
        id: "sup-2",
        severity: "high",
        title: "Unassigned Route Allocation (14 Outlets)",
        description: "Relief staff allocation required for Ogun territory due to scheduled leave coverage.",
        tag: "ROUTE ALLOCATION",
        actionLabel: "Assign Route",
        actionHref: "/supervisor",
        time: "50 mins ago"
      },
      {
        id: "sup-3",
        severity: "warning",
        title: "6 EOD Visit Audits Pending Sign-Off",
        description: "Review and approve yesterday's completed merchandiser & TSR visit logs.",
        tag: "AUDIT SIGN-OFF",
        actionLabel: "Review Logs",
        actionHref: "/supervisor",
        time: "2 hours ago"
      }
    ]
  },
  merchandiser: {
    roleTitle: "MERCHANDISER FIELD DISPATCH",
    dashboardName: "Store Execution & Activity Workspace",
    subtitle: "Urgent shelf compliance and stockout prevention alerts for your assigned retail accounts.",
    bannerTone: "orange",
    items: [
      {
        id: "merch-1",
        severity: "critical",
        title: "Critical Out-of-Stock: 7 SKUs in Key Accounts",
        description: "Safety stock breach reported in Ikeja Mall hypermarket. Immediate stock count update required.",
        tag: "STOCKOUT RISK",
        actionLabel: "Log Stock Counts",
        actionHref: "/merchandiser-outlets",
        time: "Just now"
      },
      {
        id: "merch-2",
        severity: "high",
        title: "Planogram Endcap Photo Verification Due",
        description: "Submit morning promotional display verification photo before 12:00 PM deadline.",
        tag: "PHOTO PROOF",
        actionLabel: "Upload Photo",
        actionHref: "/merchandiser",
        time: "25 mins ago"
      }
    ]
  },
  tsr: {
    roleTitle: "TSR TERRITORY SALES NOTICE",
    dashboardName: "Territory Sales & Pipeline Command",
    subtitle: "Urgent sales orders, credit recovery, and distributor replenishment targets.",
    bannerTone: "green",
    items: [
      {
        id: "tsr-1",
        severity: "critical",
        title: "Territory Run-Rate Gap Alert (-8.4%)",
        description: "5 key distributor replenishment orders pending booking to meet mid-month sales target.",
        tag: "SALES TARGET",
        actionLabel: "Open Territory Pipeline",
        actionHref: "/tsr",
        time: "10 mins ago"
      },
      {
        id: "tsr-2",
        severity: "high",
        title: "Overdue Client Account Invoices",
        description: "Follow up on outstanding ₦180,000 trade receivable with Lagos Island wholesaler.",
        tag: "COLLECTIONS",
        actionLabel: "View Accounts",
        actionHref: "/tsr",
        time: "1 hour ago"
      }
    ]
  },
  "field-team": {
    roleTitle: "FIELD OPERATIONS NOTICE",
    dashboardName: "Field Team Daily Mission",
    subtitle: "Today's priority route assignments and compliance reminders.",
    bannerTone: "green",
    items: [
      {
        id: "ft-1",
        severity: "critical",
        title: "Daily Check-in & Route Activation",
        description: "Confirm your GPS check-in at first store location before starting daily visits.",
        tag: "GPS CHECK-IN",
        actionLabel: "Activate Route",
        actionHref: "/live-map",
        time: "Just now"
      },
      {
        id: "ft-2",
        severity: "high",
        title: "Store Observation & Photo Capture",
        description: "34 assigned stores require visit logging, pricing, and visibility capture today.",
        tag: "DAILY TARGET",
        actionLabel: "Open Stores",
        actionHref: "/stores",
        time: "1 hour ago"
      }
    ]
  }
};

export function UrgentLoginModal({
  role = "super-admin",
  userName,
  isOpen,
  onClose,
}: {
  role?: AppRole;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);
  const [displayName, setDisplayName] = useState<string>("Field Specialist");

  const alertData = DASHBOARD_ALERTS[role] || DASHBOARD_ALERTS["super-admin"];

  // Dynamically resolve actual profile owner name from storage or canonical role
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedName =
        localStorage.getItem("kea_user_name") ||
        sessionStorage.getItem("kea_last_login_name") ||
        (role === "supervisor" ? localStorage.getItem("kea_supervisor_name") : null) ||
        (role === "vsr" ? localStorage.getItem("kea_vsr_name") : null) ||
        (role === "merchandiser" ? localStorage.getItem("kea_merchandiser_name") : null) ||
        (role === "tsr" ? localStorage.getItem("kea_tsr_name") : null);

      if (userName && userName !== "User" && userName.trim().length > 0) {
        setDisplayName(userName);
      } else if (storedName && storedName.trim().length > 0) {
        setDisplayName(storedName);
      } else {
        const canonicalRoleNames: Record<string, string> = {
          "super-admin": "Super Admin Executive",
          admin: "KEA Administrator",
          supervisor: "Michael Olayiwola",
          vsr: "Babatunde Adeleke",
          merchandiser: "Maria Uchechukwu",
          tsr: "Emeka Nwosu",
          "field-team": "Field Operations Specialist",
        };
        setDisplayName(canonicalRoleNames[role] || "Operations Specialist");
      }
    } catch {}
  }, [role, userName, isOpen]);

  // Play subtle high-frequency attention chime on open
  useEffect(() => {
    if (isOpen && soundEnabled && typeof window !== "undefined") {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          // Gentle multi-tone chime (880Hz -> 1174Hz)
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.45);
        }
      } catch {}
    }
  }, [isOpen, soundEnabled]);

  if (!isOpen) return null;

  function handleActionClick(item: UrgentAlertItem) {
    setResolvedIds((prev) => [...prev, item.id]);
    if (item.actionHref) {
      onClose();
      router.push(item.actionHref);
    }
  }

  function handleMarkAllRead() {
    setResolvedIds(alertData.items.map((i) => i.id));
    setTimeout(() => {
      onClose();
    }, 300);
  }

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 10, 18, 0.78)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: "16px",
        animation: "urgentFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-modal-title"
    >
      <div
        className="urgent-modal-card"
        style={{
          width: "min(640px, 96vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "18px",
          background: "linear-gradient(180deg, #111a26 0%, #0c121d 100%)",
          border: "1.5px solid rgba(243, 112, 33, 0.45)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(243, 112, 33, 0.18)",
          color: "#f8fafc",
          overflow: "hidden",
          position: "relative",
          animation: "urgentSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Glowing Top Brand Stripe (Kea Orange & Lime) */}
        <div
          style={{
            height: "4px",
            width: "100%",
            background: "linear-gradient(90deg, #94C83D 0%, #F37021 50%, #94C83D 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmerLine 3s linear infinite",
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            {/* Pulsing Warning Icon */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(243, 112, 33, 0.22), rgba(148, 200, 61, 0.15))",
                border: "1px solid rgba(243, 112, 33, 0.5)",
                display: "grid",
                placeItems: "center",
                color: "#F37021",
                boxShadow: "0 0 20px rgba(243, 112, 33, 0.35)",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <ShieldAlert size={22} className="animate-pulse" />
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#F37021",
                  boxShadow: "0 0 8px #F37021",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#94C83D",
                    background: "rgba(148, 200, 61, 0.14)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(148, 200, 61, 0.3)",
                  }}
                >
                  {alertData.roleTitle}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#F37021",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#F37021",
                      display: "inline-block",
                    }}
                  />
                  URGENT ATTENTION REQUIRED
                </span>
              </div>

              <h2
                id="urgent-modal-title"
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: "6px 0 2px",
                  letterSpacing: "-0.02em",
                }}
              >
                Welcome back, {displayName}
              </h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                {alertData.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.05)",
                color: soundEnabled ? "#94C83D" : "#64748b",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss notifications"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body: Actionable Alerts List */}
        <div
          style={{
            padding: "18px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#64748b",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              paddingBottom: "4px",
            }}
          >
            <span>High-Priority Directive List ({alertData.items.length - resolvedIds.length} Pending)</span>
            <span style={{ color: "#94C83D" }}>Live Feed</span>
          </div>

          {alertData.items.map((item, idx) => {
            const isResolved = resolvedIds.includes(item.id);
            const isCritical = item.severity === "critical";

            return (
              <div
                key={item.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: isResolved
                    ? "rgba(148, 200, 61, 0.06)"
                    : isCritical
                    ? "linear-gradient(135deg, rgba(243, 112, 33, 0.12) 0%, rgba(20, 27, 40, 0.8) 100%)"
                    : "rgba(255, 255, 255, 0.04)",
                  border: isResolved
                    ? "1px solid rgba(148, 200, 61, 0.25)"
                    : isCritical
                    ? "1px solid rgba(243, 112, 33, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  opacity: isResolved ? 0.6 : 1,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Severity pill & Tag */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: isResolved
                          ? "rgba(148, 200, 61, 0.2)"
                          : isCritical
                          ? "rgba(243, 112, 33, 0.25)"
                          : "rgba(148, 200, 61, 0.18)",
                        color: isResolved ? "#94C83D" : isCritical ? "#F37021" : "#94C83D",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {item.tag}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} /> {item.time}
                    </span>
                  </div>

                  {isResolved && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94C83D", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={12} /> Acknowledged
                    </span>
                  )}
                </div>

                {/* Title and Description */}
                <div>
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isResolved ? "#94a3b8" : "#ffffff",
                      margin: "0 0 3px",
                      textDecoration: isResolved ? "line-through" : "none",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Action button */}
                {!isResolved && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => handleActionClick(item)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "7px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: "none",
                        background: isCritical
                          ? "linear-gradient(135deg, #F37021 0%, #e05e12 100%)"
                          : "linear-gradient(135deg, #94C83D 0%, #7fae32 100%)",
                        color: "#ffffff",
                        boxShadow: isCritical
                          ? "0 3px 10px rgba(243, 112, 33, 0.3)"
                          : "0 3px 10px rgba(148, 200, 61, 0.3)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
            <Sparkles size={13} style={{ color: "#94C83D" }} />
            <span>Auto-pops on each dashboard sign-in. Reopen via topbar bell anytime.</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "transparent",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Acknowledge All
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #94C83D 0%, #84b832 100%)",
                color: "#111827",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(148, 200, 61, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span>Continue to Dashboard</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes urgentFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes urgentSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
