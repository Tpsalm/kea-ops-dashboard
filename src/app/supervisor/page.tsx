"use client";

export const dynamic = "force-dynamic";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  AlertTriangle, Bell, CheckCircle2, ChevronDown, ClipboardCheck,
  Home, LogOut, MapPin, Menu, Moon, MoreHorizontal, Search, Settings,
  ShieldCheck, Store, Sun, TrendingDown, TrendingUp, Upload, Users, X, Target, Building2, Layers,
  UserPlus, Calendar, FolderOpen, Banknote, DollarSign, CheckCircle, FileText, ArrowRight,
  ShieldAlert, Send, Eye, RefreshCw, Check, Clock
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { outletData, staff } from "../data";
import {
  products, supervisors, getChildren, getStoresBySupervisor,
  getActivitiesByStaff, getVSRRoute,
} from "../hierarchy-data";
import { FadeIn, SelectBox } from "../shared";
import { FieldHero } from "../../components/field-hero";
import { ScrollProgress } from "../../components/motion-primitives/scroll-progress";
import { AnimatedNumber } from "../../components/motion-primitives/animated-number";
import { Badge } from "../../components/ui/badge";
import { UserOnboarding } from "./user-onboarding";
import { LeaveManagement } from "./leave-management";
import { DocumentVault } from "./document-vault";
import { SupervisorAlertInbox } from "./alert-inbox";
import { ProfileSettingsModal } from "../../components/profile-settings-modal";
import { UrgentLoginModal } from "../../components/urgent-login-modal";
import { useTheme } from "../../lib/theme-provider";
import {
  getSupervisorBroadcasts, publishSupervisorBroadcast, type SupervisorBroadcast,
  WORKFLOW_CREATED_EVENT, WORKFLOW_STEP_CHANGED_EVENT, WORKFLOW_MESSAGE_SENT_EVENT,
} from "../../lib/shared-communications";
import { useWorkflowRealtime } from "@/lib/use-workflow-realtime";
import { WorkflowTracker } from "@/components/workflow-tracker";
import { WorkflowMessagesThread } from "@/components/workflow-messages-thread";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/status-badge";

type PageKey =
  | "home"
  | "merchandisers-outlets"
  | "vsr-surveillance"
  | "leave-management"
  | "document-vault"
  | "field-broadcasts"
  | "user-onboarding"
  | "alert-inbox"
  | "workflow-inbox";

const navItems: { key: PageKey | "settings"; label: string; icon: typeof Users }[] = [
  { key: "home", label: "Operations Overview", icon: Home },
  { key: "workflow-inbox", label: "Workflow Inbox", icon: Layers as any },
  { key: "merchandisers-outlets", label: "Merchandisers & Outlets", icon: Store },
  { key: "vsr-surveillance", label: "VSR Surveillance & Loans", icon: Banknote },
  { key: "field-broadcasts", label: "Directives & Broadcasts", icon: Send as any },
  { key: "leave-management", label: "Leave Management", icon: Calendar as any },
  { key: "document-vault", label: "Document Vault & POD", icon: FolderOpen as any },
  { key: "user-onboarding", label: "User Onboarding", icon: UserPlus as any },
  { key: "alert-inbox", label: "Alert Triage & Escalation", icon: Bell as any },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "SUPERVISOR OPERATIONS CONTROL", subtitle: "Real-time field surveillance, merchandiser status breakdown, outlet health, and VSR funding surveillance." },
  "workflow-inbox": { title: "WORKFLOW INBOX & TRACKER", subtitle: "Bidirectional triage: review VSR & Merchandiser submissions, message originators, escalate upstream to Super Admin, and track steps in real time." },
  "merchandisers-outlets": { title: "MERCHANDISER ACTIVITY & OUTLETS", subtitle: "Supervised retail outlets, merchandiser status breakdown (Active, Inactive, On Leave), and store health." },
  "vsr-surveillance": { title: "VSR CREDIT & FUNDING SURVEILLANCE", subtitle: "Track VSR funding tranches, active loan debt balances, repayment schedules, and funding eligibility." },
  "field-broadcasts": { title: "FIELD DIRECTIVES & BROADCAST DISPATCH", subtitle: "Broadcast instant instructions, route directives, and document guidelines to VSRs and Merchandisers." },
  "leave-management": { title: "MERCHANDISER LEAVE ENGINE", subtitle: "Schedule, log, and monitor calendar leave dates for field merchandisers with relief coverage." },
  "document-vault": { title: "DOCUMENT VAULT & POD TRACKER", subtitle: "Upload POD Tracker Templates & VSR Monthly Performance Reports with instant Super Admin alert dispatch." },
  "user-onboarding": { title: "USER ONBOARDING CENTER", subtitle: "Provision and configure new Merchandiser and VSR profiles under your direct supervision." },
  "alert-inbox": { title: "ALERT TRIAGE & ESCALATION", subtitle: "Review and route field events through the hierarchical chain to the Super Admin Dashboard." },
};

function SupervisorSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: typeof supervisors;
  onChange: (id: string) => void;
}) {
  return (
    <label className="admin-select">
      <span>SUPERVISOR</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.territory})
          </option>
        ))}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

export default function SupervisorDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [supervisorId, setSupervisorId] = useState("KEA-SUP-001");
  const [mobileNav, setMobileNav] = useState(false);
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [merchFilter, setMerchFilter] = useState<"all" | "active" | "on_leave" | "inactive">("all");
  const [vsrFilter, setVsrFilter] = useState<"all" | "funded" | "non_funded" | "on_loan" | "due_funding">("all");
  const [notice, setNotice] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Profile avatar & custom info state
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [userName, setUserName] = useState<string>("Michael Olayiwola");
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);

  // ── Workflow Inbox State ──
  const { toast } = useToast();
  const [workflowUserId, setWorkflowUserId] = useState<string>("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [showWorkflowThread, setShowWorkflowThread] = useState(false);
  const [workflowActionLoading, setWorkflowActionLoading] = useState<string | null>(null);

  const { workflows, loading: wfLoading, refetch: wfRefetch } = useWorkflowRealtime(
    workflowUserId || undefined,
    "supervisor",
    {
      onNew: (w) => toast(`New workflow received: ${w.title}`, "info"),
      onUpdate: (w) => toast(`Workflow updated: ${w.title}`, "info"),
    },
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d?.user?.id && setWorkflowUserId(d.user.id))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onCreated = (e: any) => {
      const det = e.detail ?? {};
      if (det.targetUserId && workflowUserId && det.targetUserId !== workflowUserId) return;
      toast(`🔔 Workflow created: ${det.workflowTitle ?? det.workflowId}`, "info");
      wfRefetch().catch(() => {});
    };
    const onStep = (e: any) => {
      const det = e.detail ?? {};
      toast(`⚡ Workflow step: ${det.workflowTitle} → ${det.actorRole ?? det.stepType}`, "info");
      wfRefetch().catch(() => {});
    };
    const onMsg = (e: any) => {
      const det = e.detail ?? {};
      if (det.targetUserId && workflowUserId && det.targetUserId !== workflowUserId) return;
      toast(`💬 New workflow message: ${det.workflowTitle}`, "info");
      wfRefetch().catch(() => {});
    };
    const onStorage = () => wfRefetch().catch(() => {});
    window.addEventListener(WORKFLOW_CREATED_EVENT, onCreated as any);
    window.addEventListener(WORKFLOW_STEP_CHANGED_EVENT, onStep as any);
    window.addEventListener(WORKFLOW_MESSAGE_SENT_EVENT, onMsg as any);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(WORKFLOW_CREATED_EVENT, onCreated as any);
      window.removeEventListener(WORKFLOW_STEP_CHANGED_EVENT, onStep as any);
      window.removeEventListener(WORKFLOW_MESSAGE_SENT_EVENT, onMsg as any);
      window.removeEventListener("storage", onStorage);
    };
  }, [workflowUserId, wfRefetch, toast]);

  async function escalateSelected(wfId: string) {
    setWorkflowActionLoading(wfId);
    try {
      const res = await fetch(`/api/workflows/${wfId}/escalate`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      toast("Escalated to Super Admin Executive", "success");
      wfRefetch().catch(() => {});
    } catch (err: any) {
      toast(err.message ?? "Escalation failed", "error");
    } finally {
      setWorkflowActionLoading(null);
    }
  }

  async function requestInfo(wfId: string, originatorId: string) {
    const body = prompt("Request additional information from the originator:");
    if (body === null) return;
    try {
      const res = await fetch(`/api/workflows/${wfId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "downstream", body: body || "Requesting additional information." }),
      });
      if (!res.ok) throw new Error("Could not deliver message");
      toast("Information request sent to originator", "success");
    } catch (err: any) {
      toast(err.message ?? "Failed to send message", "error");
    }
  }

  useEffect(() => {
    try {
      const isUrgentPending = sessionStorage.getItem("kea_urgent_login_alert");
      if (isUrgentPending === "true") {
        setUrgentModalOpen(true);
        sessionStorage.removeItem("kea_urgent_login_alert");
      } else {
        const sessionSeen = sessionStorage.getItem("kea_seen_alert_supervisor");
        if (!sessionSeen) {
          setUrgentModalOpen(true);
          sessionStorage.setItem("kea_seen_alert_supervisor", "true");
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    function loadProfile() {
      try {
        const av = localStorage.getItem("kea_supervisor_avatar") || localStorage.getItem("kea_user_avatar");
        if (av) setUserAvatar(av);
        const name = localStorage.getItem("kea_supervisor_name");
        if (name) setUserName(name);
      } catch {}
    }
    loadProfile();
    window.addEventListener("kea-avatar-updated", loadProfile);
    return () => window.removeEventListener("kea-avatar-updated", loadProfile);
  }, []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  const completionTrend = [
    { label: "Wk 24", completion: 78 }, { label: "Wk 25", completion: 82 },
    { label: "Wk 26", completion: 81 }, { label: "Wk 27", completion: 85 },
    { label: "Wk 28", completion: 84 }, { label: "Wk 29", completion: 88 },
  ];

  const supervisor = useMemo(
    () => supervisors.find((s) => s.id === supervisorId) ?? supervisors[0],
    [supervisorId]
  );
  const myMerchandisers = useMemo(
    () => getChildren(supervisorId).filter((m) => m.role === "Merchandiser"),
    [supervisorId]
  );
  const myStores = useMemo(() => getStoresBySupervisor(supervisorId), [supervisorId]);

  const myVSRs = useMemo(() => {
    const tsrParent = supervisor.parentId;
    if (!tsrParent) {
      return staff.filter((p) => p.role === "VSR" && p.region === supervisor.region);
    }
    return staff.filter((p) => p.role === "VSR" && p.parentId === tsrParent);
  }, [supervisor]);

  const myTeam = useMemo(() => [...myMerchandisers, ...myVSRs], [myMerchandisers, myVSRs]);
  const completionTarget = 90;
  const healthyStores = myStores.filter((s) => s.status === "Healthy").length;
  const avgCompletion = myTeam.length
    ? Math.round(myTeam.reduce((sum, m) => sum + m.completion, 0) / myTeam.length)
    : 0;

  // Real-time VSR credit metrics
  const totalVsrsCount = myVSRs.length || 96;
  const fundedVsrsCount = Math.round(totalVsrsCount * 0.75); // ~72
  const nonFundedVsrsCount = totalVsrsCount - fundedVsrsCount; // ~24
  const vsrsOnLoanCount = Math.round(totalVsrsCount * 0.40); // ~38
  const vsrsClearOfLoanCount = totalVsrsCount - vsrsOnLoanCount; // ~58
  const vsrsDueForFundingCount = Math.round(vsrsClearOfLoanCount * 0.28); // ~16

  // Merchandiser status breakdown
  const activeMerchCount = myMerchandisers.filter((m) => m.status === "Active" || !m.status).length || 168;
  const onLeaveMerchCount = 6;
  const inactiveMerchCount = Math.max(0, (myMerchandisers.length || 182) - activeMerchCount - onLeaveMerchCount) || 8;
  const totalMerchCount = activeMerchCount + onLeaveMerchCount + inactiveMerchCount;

  // Real-time Field Directives & Broadcast Dispatch State
  const [broadcasts, setBroadcasts] = useState<SupervisorBroadcast[]>([]);
  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");
  const [bTargetRole, setBTargetRole] = useState<"all" | "vsr" | "merchandiser">("all");
  const [bPriority, setBPriority] = useState<"urgent" | "guideline" | "target" | "info">("urgent");
  const [bFileName, setBFileName] = useState("");
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false);

  useEffect(() => {
    function loadBroadcasts() {
      setBroadcasts(getSupervisorBroadcasts());
    }
    loadBroadcasts();
    window.addEventListener("kea-directive-dispatched", loadBroadcasts);
    window.addEventListener("kea-directive-acknowledged", loadBroadcasts);
    window.addEventListener("storage", loadBroadcasts);
    return () => {
      window.removeEventListener("kea-directive-dispatched", loadBroadcasts);
      window.removeEventListener("kea-directive-acknowledged", loadBroadcasts);
      window.removeEventListener("storage", loadBroadcasts);
    };
  }, []);

  function handlePublishBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!bTitle || !bMessage) {
      flash("Please fill in directive title and message!");
      return;
    }
    setIsPublishingBroadcast(true);
    const newBroadcast: SupervisorBroadcast = {
      id: `DIR-${Math.floor(100 + Math.random() * 900)}`,
      supervisorName: userName || supervisor.name || "Michael Olayiwola",
      supervisorId,
      title: bTitle,
      message: bMessage,
      targetRole: bTargetRole,
      priority: bPriority,
      timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      fileName: bFileName || undefined,
      acknowledgedBy: [],
    };
    publishSupervisorBroadcast(newBroadcast);
    setBroadcasts(getSupervisorBroadcasts());
    setIsPublishingBroadcast(false);
    setBTitle("");
    setBMessage("");
    setBFileName("");
    flash(`Directive "${newBroadcast.title}" broadcasted live to all ${bTargetRole === "all" ? "field staff" : bTargetRole.toUpperCase() + "s"}!`);
  }

  function signOut() {
    try { localStorage.removeItem("kea_user"); } catch { /* ignore */ }
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  function handleEndorseVsrFunding(vsrName: string, amount: string) {
    flash(`Funding request of ${amount} for ${vsrName} endorsed and forwarded to Super Admin!`);
  }

  const initials = (userName || supervisor.name)
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SV";

  return (
    <div className={isDark ? "tsr-reference dark" : "tsr-reference"}>
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}

      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>Supervisor Console</small>
          <button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              className={key !== "settings" && activePage === key ? "active" : ""}
              onClick={() => {
                if (key === "settings") {
                  setShowSettingsModal(true);
                } else {
                  setActivePage(key as PageKey);
                  setSearch("");
                }
                setMobileNav(false);
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        <button className="reference-settings" type="button" onClick={signOut}><LogOut size={15} /> Sign out</button>
      </aside>

      <main className="reference-main">
        <header className="reference-topbar">
          <button className="reference-menu" type="button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <span className="vsr-page-title">{pageTitles[activePage].title}</span>
          <div className="reference-actions">
            <button
              type="button"
              onClick={() => setUrgentModalOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 10px", borderRadius: 20,
                background: "rgba(243, 112, 33, 0.14)", border: "1px solid rgba(243, 112, 33, 0.4)",
                color: "#F37021", fontSize: 10, fontWeight: 800, cursor: "pointer",
                letterSpacing: "0.04em", transition: "all 0.2s ease"
              }}
              title="View Urgent Supervisor Directives"
            >
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#F37021",
                boxShadow: "0 0 0 3px rgba(243, 112, 33, 0.25)", display: "inline-block"
              }} />
              Urgent Notice
            </button>
            <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" title={`Switch to ${isDark ? "Light" : "Dark"} mode`}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button type="button" aria-label="Notifications" onClick={() => setActivePage("alert-inbox")}>
              <Bell size={15} />
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--line)",
                background: "linear-gradient(135deg, #94C83D, #F37021)", color: "#0A0E17",
                display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800,
                cursor: "pointer", overflow: "hidden", padding: 0
              }}
              title="Open Profile & Settings"
              aria-label="Profile and settings"
            >
              {userAvatar ? (
                <img src={userAvatar} alt="Supervisor avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>

        <div className="reference-content">
          <ScrollProgress className="fixed top-0 left-0 right-0 z-[60]" />

          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Sep 10, 2026 · Field Operations Hierarchy</span>
          </div>

          <div style={{ marginBottom: 16, maxWidth: 280 }}>
            <SupervisorSelect value={supervisorId} options={supervisors} onChange={setSupervisorId} />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: OPERATIONS OVERVIEW & COMMAND CENTER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "home" && (
            <div className="page-admin page-supervisor" style={{ padding: "0 0 30px", display: "grid", gap: 20 }}>
              <FieldHero
                eyebrow="SUPERVISOR COMMAND CENTER"
                title={<>Welcome back, {supervisor.name}</>}
                subtitle={`Supervising ${supervisor.territory}, ${supervisor.region} · End-to-end merchandiser leave tracking, outlet status, and VSR credit surveillance.`}
                badge="Active Supervised Hub"
                variant="waves"
                colors={["#0d9488", "#07535a", "#14b8a6", "#134e4a"]}
                stat={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Badge variant="success">
                      <AnimatedNumber value={totalMerchCount} /> Merchandisers
                    </Badge>
                    <Badge variant="accent">
                      <AnimatedNumber value={totalVsrsCount} /> VSRs
                    </Badge>
                    <Badge variant={avgCompletion >= completionTarget ? "success" : "warning"}>
                      {avgCompletion}% Avg Completion
                    </Badge>
                  </div>
                }
              />

              {/* QUICK DISPATCH & FIELD DIRECTIVES BANNER */}
              <div style={{
                background: "linear-gradient(135deg, rgba(243, 112, 33, 0.09) 0%, rgba(148, 200, 61, 0.09) 100%)",
                border: "1px solid rgba(243, 112, 33, 0.35)", borderRadius: 14, padding: "14px 18px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #F37021, #d95f17)", color: "#fff", flexShrink: 0
                  }}>
                    <Send size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                      Field Team Directives & Real-Time Bulletins
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {broadcasts.length} active directives published · Push updates directly to VSR & Merchandiser screens
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActivePage("field-broadcasts")}
                    style={{
                      background: "linear-gradient(135deg, #F37021, #d95f17)", color: "#fff", border: "none",
                      padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(243, 112, 33, 0.3)"
                    }}
                  >
                    <Send size={13} /> Dispatch New Directive
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage("document-vault")}
                    style={{
                      background: "var(--card)", color: "var(--text)", border: "1px solid var(--line)",
                      padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <FolderOpen size={13} /> Ingestion Vault
                  </button>
                </div>
              </div>

              {/* SECTION 1: MERCHANDISERS & OUTLETS BOLD KPI CARD CLUSTER */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Store size={15} color="#0d9488" /> Merchandiser & Outlet Architecture
                  </div>
                  <button
                    onClick={() => setActivePage("merchandisers-outlets")}
                    style={{ background: "none", border: "none", color: "#0d9488", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    View Roster <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <div className="kx-kpi" onClick={() => setActivePage("merchandisers-outlets")}>
                    <div className="kx-kpi-iconwrap tone-teal"><Store size={18} /></div>
                    <span className="kx-kpi-label">Total Outlets</span>
                    <strong className="kx-kpi-value">{myStores.length || 142}</strong>
                    <div className="kx-kpi-trend up">
                      <b>{healthyStores || 128} Healthy</b> <small>· {myStores.length - healthyStores || 14} review</small>
                    </div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("merchandisers-outlets")}>
                    <div className="kx-kpi-iconwrap tone-blue"><Users size={18} /></div>
                    <span className="kx-kpi-label">Total Merchandisers</span>
                    <strong className="kx-kpi-value">{totalMerchCount}</strong>
                    <div className="kx-kpi-trend up">
                      <b>100%</b> <small>field force assigned</small>
                    </div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("merchandisers-outlets")}>
                    <div className="kx-kpi-iconwrap tone-teal"><CheckCircle2 size={18} /></div>
                    <span className="kx-kpi-label">Active Merchandisers</span>
                    <strong className="kx-kpi-value" style={{ color: "#16a34a" }}>{activeMerchCount}</strong>
                    <div className="kx-kpi-trend up">
                      <b>{Math.round((activeMerchCount / totalMerchCount) * 100)}%</b> <small>on field routes</small>
                    </div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("leave-management")}>
                    <div className="kx-kpi-iconwrap tone-amber"><Calendar size={18} /></div>
                    <span className="kx-kpi-label">Merchandisers On Leave</span>
                    <strong className="kx-kpi-value" style={{ color: "#d97706" }}>{onLeaveMerchCount}</strong>
                    <div className="kx-kpi-trend" style={{ color: "#d97706" }}>
                      <b>Relief Assigned</b> <small>· Active schedule</small>
                    </div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("merchandisers-outlets")}>
                    <div className="kx-kpi-iconwrap tone-violet"><AlertTriangle size={18} /></div>
                    <span className="kx-kpi-label">Inactive Merchandisers</span>
                    <strong className="kx-kpi-value" style={{ color: "#dc2626" }}>{inactiveMerchCount}</strong>
                    <div className="kx-kpi-trend down">
                      <b>Needs review</b> <small>· Pending route</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: VSR SURVEILLANCE & FUNDING KPI CARD CLUSTER */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Banknote size={15} color="#F37021" /> VSR Credit & Funding Surveillance
                  </div>
                  <button
                    onClick={() => setActivePage("vsr-surveillance")}
                    style={{ background: "none", border: "none", color: "#F37021", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    View Loans <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  <div className="kx-kpi" onClick={() => setActivePage("vsr-surveillance")}>
                    <div className="kx-kpi-iconwrap tone-blue"><MapPin size={18} /></div>
                    <span className="kx-kpi-label">Total VSRs</span>
                    <strong className="kx-kpi-value">{totalVsrsCount}</strong>
                    <div className="kx-kpi-trend up"><b>{supervisor.territory}</b> <small>fleet</small></div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("vsr-surveillance")}>
                    <div className="kx-kpi-iconwrap tone-teal"><DollarSign size={18} /></div>
                    <span className="kx-kpi-label">Funded VSRs</span>
                    <strong className="kx-kpi-value" style={{ color: "#7da830" }}>{fundedVsrsCount}</strong>
                    <div className="kx-kpi-trend up"><b>{Math.round((fundedVsrsCount / totalVsrsCount) * 100)}%</b> <small>capital disbursed</small></div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("vsr-surveillance")}>
                    <div className="kx-kpi-iconwrap tone-amber"><Banknote size={18} /></div>
                    <span className="kx-kpi-label">Non-Funded VSRs</span>
                    <strong className="kx-kpi-value" style={{ color: "#d97706" }}>{nonFundedVsrsCount}</strong>
                    <div className="kx-kpi-trend" style={{ color: "#d97706" }}><b>Pending Grant</b> <small>· eligible</small></div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("vsr-surveillance")}>
                    <div className="kx-kpi-iconwrap tone-violet"><ShieldAlert size={18} /></div>
                    <span className="kx-kpi-label">VSRs on Active Loan</span>
                    <strong className="kx-kpi-value" style={{ color: "#b91c1c" }}>{vsrsOnLoanCount}</strong>
                    <div className="kx-kpi-trend down"><b>Repayment Open</b> <small>· locked</small></div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("vsr-surveillance")}>
                    <div className="kx-kpi-iconwrap tone-teal"><CheckCircle size={18} /></div>
                    <span className="kx-kpi-label">Clear / Not on Loan</span>
                    <strong className="kx-kpi-value" style={{ color: "#16a34a" }}>{vsrsClearOfLoanCount}</strong>
                    <div className="kx-kpi-trend up"><b>₦0 Debt Balance</b> <small>· clear</small></div>
                  </div>

                  <div className="kx-kpi" onClick={() => setActivePage("vsr-surveillance")}>
                    <div className="kx-kpi-iconwrap tone-orange"><TrendingUp size={18} /></div>
                    <span className="kx-kpi-label">VSRs Due for Funding</span>
                    <strong className="kx-kpi-value" style={{ color: "#F37021" }}>{vsrsDueForFundingCount}</strong>
                    <div className="kx-kpi-trend up"><b>Endorsement Ready</b> <small>· to Admin</small></div>
                  </div>
                </div>
              </div>

              {/* ACTION CENTER SHORTCUTS */}
              <div style={{
                background: "linear-gradient(135deg, #07535a 0%, #0d9488 100%)", borderRadius: 14,
                padding: 16, color: "#fff", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10
              }}>
                <button
                  onClick={() => setActivePage("user-onboarding")}
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: 12, color: "#fff", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                    <UserPlus size={15} /> Create Merchandiser / VSR
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.85, marginTop: 3 }}>Provision new field profiles</div>
                </button>

                <button
                  onClick={() => setActivePage("leave-management")}
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: 12, color: "#fff", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                    <Calendar size={15} /> Schedule Merchandiser Leave
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.85, marginTop: 3 }}>Log leave dates & relief staff</div>
                </button>

                <button
                  onClick={() => setActivePage("document-vault")}
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: 12, color: "#fff", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                    <FolderOpen size={15} /> Upload POD Tracker Template
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.85, marginTop: 3 }}>Upload VSR Monthly Reports</div>
                </button>

                <button
                  onClick={() => setActivePage("alert-inbox")}
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: 12, color: "#fff", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                    <Bell size={15} /> Alert Triage & Escalation
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.85, marginTop: 3 }}>Forward to Super Admin</div>
                </button>
              </div>

              {/* CHARTS */}
              <FadeIn delay={0.05} className="charts-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                <div className="card">
                  <div className="card-head"><div><h3>Team completion trend</h3><p>Average execution against the {completionTarget}% target</p></div></div>
                  <div style={{ height: 220, marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={completionTrend}>
                        <defs>
                          <linearGradient id="gCompSup" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", fontSize: 12 }} />
                        <Area type="monotone" dataKey="completion" name="Completion %" stroke="#0d9488" strokeWidth={2.5} fill="url(#gCompSup)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head"><div><h3>Field force composition</h3><p>Supervised talent breakdown</p></div></div>
                  <div style={{ height: 220, marginTop: 8, position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Merchandisers", value: totalMerchCount, color: "#7da830" },
                            { name: "VSRs", value: totalVsrsCount, color: "#94C83D" },
                          ]}
                          dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={84} paddingAngle={3} strokeWidth={0}
                        >
                          {[{ name: "Merchandisers", value: totalMerchCount, color: "#7da830" }, { name: "VSRs", value: totalVsrsCount, color: "#94C83D" }].map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <b style={{ fontSize: 24 }}>{totalMerchCount + totalVsrsCount}</b><span style={{ fontSize: 10, color: "var(--muted)" }}>total team</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: MERCHANDISER ACTIVITY & OUTLETS
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "merchandisers-outlets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["all", "active", "on_leave", "inactive"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setMerchFilter(f)}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid var(--line)",
                        background: merchFilter === f ? "#0d9488" : "var(--card)",
                        color: merchFilter === f ? "#fff" : "var(--text)", cursor: "pointer",
                      }}
                    >
                      {f === "all" ? "All Merchandisers" : f === "active" ? `Active (${activeMerchCount})` : f === "on_leave" ? `On Leave (${onLeaveMerchCount})` : `Inactive (${inactiveMerchCount})`}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActivePage("user-onboarding")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0d9488", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  <UserPlus size={14} /> Create Merchandiser
                </button>
              </div>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Merchandiser Field Workforce Roster</h2>
                    <p>Status breakdown, assigned store routes, and leave schedule</p>
                  </div>
                  <Users size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Merchandiser</th>
                        <th>Territory / Route</th>
                        <th>Assigned Outlets</th>
                        <th>Field Status</th>
                        <th>Visits (MTD)</th>
                        <th>Execution %</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "KEA-MER-001", name: "Maria Uchechukwu", territory: "Lagos Island", route: "VI Retail Axis", stores: 12, status: "Active", visits: 34, completion: 97 },
                        { id: "KEA-MER-002", name: "Ologbonori Toyosi", territory: "Ijebu Hub", route: "Ijebu Core", stores: 8, status: "Active", visits: 28, completion: 91 },
                        { id: "KEA-MER-003", name: "Jonathan Okena", territory: "Ibadan Axis", route: "Ring Road", stores: 10, status: "On Leave", visits: 14, completion: 82, relief: "Maria Uchechukwu" },
                        { id: "KEA-MER-004", name: "Arorundade Adewale", territory: "Ibadan Axis", route: "Dugbe Retail", stores: 11, status: "Active", visits: 33, completion: 96 },
                        { id: "KEA-MER-005", name: "Abiola Felicia", territory: "Lagos Island", route: "Marina Mall", stores: 9, status: "Active", visits: 30, completion: 94 },
                        { id: "KEA-MER-006", name: "Ibrahim Salisu", territory: "Lagos Central", route: "Ikeja Plaza", stores: 7, status: "Inactive", visits: 4, completion: 38 },
                      ].map((m) => (
                        <tr key={m.id}>
                          <td data-label="Merchandiser">
                            <b>{m.name}</b><br /><small>{m.id}</small>
                          </td>
                          <td data-label="Territory">{m.territory} · {m.route}</td>
                          <td data-label="Outlets"><b>{m.stores} outlets</b></td>
                          <td data-label="Status">
                            <span className={`status ${m.status === "Active" ? "active" : m.status === "On Leave" ? "needs-review" : "inactive"}`}>
                              <i /> {m.status} {m.relief && `(Relief: ${m.relief})`}
                            </span>
                          </td>
                          <td data-label="Visits"><b>{m.visits}</b></td>
                          <td data-label="Execution">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 70, height: 6, background: "var(--bar-muted)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${m.completion}%`, background: m.completion >= 90 ? "#16a34a" : "#f59e0b", borderRadius: 3 }} />
                              </div>
                              <b>{m.completion}%</b>
                            </div>
                          </td>
                          <td data-label="Actions">
                            <button
                              type="button"
                              onClick={() => { setActivePage("leave-management"); flash(`Scheduling leave for ${m.name}`); }}
                              style={{ background: "rgba(13, 148, 136, 0.1)", border: "1px solid rgba(13, 148, 136, 0.3)", color: "#0d9488", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                            >
                              <Calendar size={11} style={{ display: "inline", marginRight: 3 }} /> Schedule Leave
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Supervised Retail Outlets ({myStores.length || 142} Total)</h2>
                    <p>Retail point health, location, and assigned merchandiser</p>
                  </div>
                  <Store size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Outlet Name</th>
                        <th>Category</th>
                        <th>Region / State</th>
                        <th>Assigned Merchandiser</th>
                        <th>Shelf Share</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outletData.slice(0, 6).map((o, idx) => (
                        <tr key={o.id}>
                          <td data-label="Outlet"><b>{o.name}</b><br /><small>{o.id}</small></td>
                          <td data-label="Category">{o.type}</td>
                          <td data-label="Region">{o.region} · {o.territory}</td>
                          <td data-label="Merchandiser"><b>{o.merchandiser}</b></td>
                          <td data-label="Share"><b>{82 + (idx * 3) % 12}%</b></td>
                          <td data-label="Status">
                            <span className={`status ${o.status === "Active" || o.status === "New" ? "active" : "needs-review"}`}>
                              <i /> {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: VSR SURVEILLANCE & LOANS
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "vsr-surveillance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["all", "funded", "non_funded", "on_loan", "due_funding"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setVsrFilter(f)}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid var(--line)",
                        background: vsrFilter === f ? "#F37021" : "var(--card)",
                        color: vsrFilter === f ? "#fff" : "var(--text)", cursor: "pointer",
                      }}
                    >
                      {f === "all" ? "All VSRs (96)" : f === "funded" ? "Funded (72)" : f === "non_funded" ? "Non-Funded (24)" : f === "on_loan" ? "On Active Loan (38)" : "Due for Funding (16)"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActivePage("user-onboarding")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#94C83D", color: "#0A0E17", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  <UserPlus size={14} /> Create New VSR
                </button>
              </div>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>VSR Fleet Funding & Debt Ledger</h2>
                    <p>Hierarchical loan review: Supervisor endorses requests before forwarding to Super Admin Executive</p>
                  </div>
                  <Banknote size={16} color="#F37021" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>VSR Representative</th>
                        <th>Route Territory</th>
                        <th>Active Loan Debt</th>
                        <th>Credit Status</th>
                        <th>Next Tranche Due</th>
                        <th>Supervisor Endorsement Chain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "KEA-VSR-001", name: "Shittu Akinsanya", route: "Ikeja North A1", debt: 0, status: "Clear · Eligible", tranche: "₦150,000", pendingReview: true },
                        { id: "KEA-VSR-002", name: "Abel Nduka", route: "Surulere Main B2", debt: 45000, status: "Active Loan", tranche: "Locked (Debt > ₦0)", pendingReview: false },
                        { id: "KEA-VSR-003", name: "Paul Olakonipekun", route: "ABK North Axis", debt: 110000, status: "Active Loan · Limit Exceeded", tranche: "Locked", pendingReview: false },
                        { id: "KEA-VSR-004", name: "Timothy Ogunmokun", route: "ABK South Axis", debt: 0, status: "Clear · Non-Funded", tranche: "₦100,000 Initial", pendingReview: true },
                        { id: "KEA-VSR-005", name: "Ikechukwu Maduora", route: "Asaba Core C1", debt: 35000, status: "Active Loan", tranche: "Locked", pendingReview: false },
                      ].map((v) => (
                        <tr key={v.id}>
                          <td data-label="VSR">
                            <b>{v.name}</b><br /><small>{v.id}</small>
                          </td>
                          <td data-label="Route">{v.route}</td>
                          <td data-label="Debt">
                            <b style={{ color: v.debt > 0 ? "#dc2626" : "#16a34a" }}>
                              ₦{v.debt.toLocaleString()}
                            </b>
                          </td>
                          <td data-label="Status">
                            <span className={`status ${v.debt === 0 ? "active" : "needs-review"}`}>
                              <i /> {v.status}
                            </span>
                          </td>
                          <td data-label="Tranche">
                            <b>{v.tranche}</b>
                          </td>
                          <td data-label="Action">
                            {v.pendingReview ? (
                              <button
                                type="button"
                                onClick={() => handleEndorseVsrFunding(v.name, v.tranche)}
                                style={{
                                  background: "#94C83D", color: "#0A0E17", border: "none", padding: "5px 10px",
                                  borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                                }}
                              >
                                <Send size={11} /> Endorse to Super Admin
                              </button>
                            ) : (
                              <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>
                                {v.debt > 0 ? "Repayment Ongoing" : "No Open Request"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: FIELD DIRECTIVES & BROADCAST DISPATCH CENTER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "field-broadcasts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Header Hero Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(243, 112, 33, 0.1) 0%, rgba(148, 200, 61, 0.12) 100%)",
                border: "1.5px solid rgba(243, 112, 33, 0.35)", borderRadius: 14, padding: "18px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #F37021, #d95f17)", color: "#fff", flexShrink: 0
                  }}>
                    <Send size={22} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Instant Field Directives & Information Dispatch</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#F37021", color: "#fff" }}>
                        Real-Time Push to VSR & Merchandiser Dashboards
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                      Post urgent notices, route guidelines, or template documents. Your team receives them instantly on their dashboards with receipt tracking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compose Directive Form */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Compose & Broadcast New Field Directive</h2>
                    <p>Select target audience, priority level, and attach instructions or route guidelines</p>
                  </div>
                  <Send size={18} color="#F37021" />
                </header>

                <form onSubmit={handlePublishBroadcast} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Directive Title</label>
                      <input
                        type="text"
                        value={bTitle}
                        onChange={(e) => setBTitle(e.target.value)}
                        placeholder="e.g. Mandatory Weekend Route Cash Reconciliation Deadline"
                        required
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Target Audience</label>
                      <select
                        value={bTargetRole}
                        onChange={(e) => setBTargetRole(e.target.value as any)}
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontWeight: 700 }}
                      >
                        <option value="all">All Field Staff (VSRs & Merchandisers)</option>
                        <option value="vsr">Van Sales Representatives (VSRs Only)</option>
                        <option value="merchandiser">Retail Merchandisers Only</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Priority Level</label>
                      <select
                        value={bPriority}
                        onChange={(e) => setBPriority(e.target.value as any)}
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontWeight: 700 }}
                      >
                        <option value="urgent">🚨 Urgent Attention Required</option>
                        <option value="guideline">📋 Standard Field Guideline</option>
                        <option value="target">🎯 Route Sales Target Update</option>
                        <option value="info">ℹ️ General Notice</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Directive Message / Detailed Instructions</label>
                    <textarea
                      value={bMessage}
                      onChange={(e) => setBMessage(e.target.value)}
                      rows={3}
                      placeholder="Type the full operational directive, route expectations, or audit compliance rules..."
                      required
                      style={{ width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Attach Document Name or File Guideline (Optional)</label>
                      <input
                        type="text"
                        value={bFileName}
                        onChange={(e) => setBFileName(e.target.value)}
                        placeholder="e.g. KEA_Retail_Visibility_Planogram_2026.pdf"
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
                      <button
                        type="submit"
                        disabled={isPublishingBroadcast}
                        style={{
                          background: "linear-gradient(135deg, #F37021, #d95f17)", color: "#fff", border: "none", padding: "10px 24px",
                          borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                          boxShadow: "0 2px 10px rgba(243, 112, 33, 0.35)", height: 38
                        }}
                      >
                        <Send size={14} />
                        {isPublishingBroadcast ? "Broadcasting..." : "Broadcast Live to Field Dashboards"}
                      </button>
                    </div>
                  </div>
                </form>
              </section>

              {/* Active Broadcasts History & Staff Acknowledgment */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Active Field Directives & Acknowledgment Log</h2>
                    <p>Monitor real-time confirmation receipts from VSRs and Merchandisers across territories</p>
                  </div>
                  <Clock size={16} color="#F37021" />
                </header>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Directive ID & Title</th>
                        <th>Target Role</th>
                        <th>Priority</th>
                        <th>Broadcast Time</th>
                        <th>Attached File</th>
                        <th>Acknowledged Staff Receipts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcasts.map((b) => (
                        <tr key={b.id}>
                          <td data-label="Title" style={{ maxWidth: 280 }}>
                            <b style={{ color: "var(--text)" }}>{b.title}</b>
                            <br /><small style={{ color: "var(--muted)", fontSize: 11 }}>{b.message}</small>
                          </td>
                          <td data-label="Target">
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--soft)", color: "var(--text)" }}>
                              {b.targetRole === "all" ? "ALL FIELD TEAM" : b.targetRole.toUpperCase() + "S ONLY"}
                            </span>
                          </td>
                          <td data-label="Priority">
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                              background: b.priority === "urgent" ? "rgba(243, 112, 33, 0.15)" : "rgba(148, 200, 61, 0.15)",
                              color: b.priority === "urgent" ? "#F37021" : "#7da830"
                            }}>
                              {b.priority.toUpperCase()}
                            </span>
                          </td>
                          <td data-label="Time">{b.timestamp}</td>
                          <td data-label="File">
                            {b.fileName ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#94C83D", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <FileText size={12} /> {b.fileName}
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)", fontSize: 11 }}>None</span>
                            )}
                          </td>
                          <td data-label="Receipts">
                            {b.acknowledgedBy && b.acknowledgedBy.length > 0 ? (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {b.acknowledgedBy.map((staffName) => (
                                  <span key={staffName} style={{
                                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                                    background: "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22, 163, 74, 0.3)",
                                    display: "inline-flex", alignItems: "center", gap: 4
                                  }}>
                                    <Check size={10} /> {staffName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>
                                ⏳ Pending field acknowledgments
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: LEAVE MANAGEMENT ENGINE
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "leave-management" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LeaveManagement />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 5: DOCUMENT VAULT & POD TRACKER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "document-vault" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <DocumentVault />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 6: USER ONBOARDING CENTER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "user-onboarding" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <UserOnboarding onUserCreated={() => flash("Field user profile created and added to supervisor roster!")} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 7: ALERT TRIAGE & ESCALATION CENTER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "alert-inbox" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SupervisorAlertInbox />
            </div>
          )}
        </div>
      </main>

      {/* ─── SETTINGS & PROFILE POPUP MODAL ─── */}
      <ProfileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        role="supervisor"
        defaultName={userName || supervisor.name}
        defaultEmail="michael.olayiwola@kea.com"
        roleLabel="Field Supervisor · Operations Control"
        onFlash={flash}
      />

      {/* ─── URGENT ATTENTION NOTIFICATION MODAL ─── */}
      <UrgentLoginModal
        role="supervisor"
        userName={userName || supervisor.name}
        isOpen={urgentModalOpen}
        onClose={() => setUrgentModalOpen(false)}
      />
    </div>
  );
}
