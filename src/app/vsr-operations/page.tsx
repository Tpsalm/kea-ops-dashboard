"use client";

export const dynamic = "force-dynamic";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  AlertTriangle, Bell, ClipboardList, CreditCard, Home, LogOut, MapPin, Menu, Moon,
  MoreHorizontal, Phone, Route, Search, Settings, Sun, Target,
  TrendingDown, TrendingUp, Users, Wallet, X, Building2, CheckCircle2, DollarSign,
  Banknote, ShieldAlert, Send, ArrowRight, Check, Plus, AlertCircle, Clock,
  FileText, FileSpreadsheet, UploadCloud, FileCheck, Download, ExternalLink
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dailySales, dailyTarget, staff } from "../data";
import { vsrRoutes } from "../hierarchy-data";
import { FadeIn, SelectBox } from "../shared";
import { FieldHero } from "../../components/field-hero";
import { ScrollProgress } from "../../components/motion-primitives/scroll-progress";
import { AnimatedNumber } from "../../components/motion-primitives/animated-number";
import { Badge } from "../../components/ui/badge";
import { ProfileSettingsModal } from "../../components/profile-settings-modal";
import { useTheme } from "../../lib/theme-provider";

type PageKey = "home" | "funding" | "reports" | "routes" | "sales" | "performance";

const navItems: { key: PageKey | "settings"; label: string; icon: any }[] = [
  { key: "home", label: "Overview", icon: Home },
  { key: "funding", label: "Capital & Funding", icon: Banknote },
  { key: "reports", label: "Weekly & Monthly Reports", icon: FileText },
  { key: "routes", label: "My Routes & Stores", icon: Route },
  { key: "sales", label: "Daily Sales Log", icon: DollarSign },
  { key: "performance", label: "Targets & Performance", icon: Target },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "VSR OPERATIONS DASHBOARD", subtitle: "Daily route execution, sales tracking, vehicle health, and capital surveillance." },
  funding: { title: "CAPITAL & LOAN APPLICATION", subtitle: "Apply for inventory funding tranches with strict zero-debt validation and supervisor routing." },
  reports: { title: "VSR WEEKLY & MONTHLY REPORTS", subtitle: "Upload weekly route summaries and monthly reconciliation reports with instant supervisor receipt." },
  routes: { title: "MY ROUTES & STORES", subtitle: "Route coverage, scheduled visits and real-time completion tracking." },
  sales: { title: "DAILY SALES & COLLECTIONS", subtitle: "Record sales transactions, collection modes and outstanding credit." },
  performance: { title: "PERFORMANCE & TARGETS", subtitle: "Daily, weekly and monthly targets vs actual achievements." },
};

export default function VsrOperationsPage() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [mobileNav, setMobileNav] = useState(false);
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [salesLog, setSalesLog] = useState(dailySales);
  const [period, setPeriod] = useState("Today");
  const [notice, setNotice] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Profile avatar & custom info state
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [userName, setUserName] = useState<string>("Babatunde Adeleke");

  useEffect(() => {
    function loadProfile() {
      try {
        const av = localStorage.getItem("kea_vsr_avatar") || localStorage.getItem("kea_user_avatar");
        if (av) setUserAvatar(av);
        const name = localStorage.getItem("kea_vsr_name");
        if (name) setUserName(name);
      } catch {}
    }
    loadProfile();
    window.addEventListener("kea-avatar-updated", loadProfile);
    return () => window.removeEventListener("kea-avatar-updated", loadProfile);
  }, []);

  // Funding & Loan State
  const [currentDebt, setCurrentDebt] = useState<number>(0); // ₦0 debt = eligible
  const [fundingAmount, setFundingAmount] = useState<string>("150000");
  const [fundingPurpose, setFundingPurpose] = useState<string>("Stock replenishment for high-volume retail stores in Ikeja");
  const [showFundingModal, setShowFundingModal] = useState<boolean>(false);
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [incidentReason, setIncidentReason] = useState<string>("");
  const [recentApplications, setRecentApplications] = useState<Array<{
    id: string;
    amount: number;
    purpose: string;
    status: string;
    date: string;
    stage: string;
  }>>([
    {
      id: "LN-9821",
      amount: 150000,
      purpose: "Ikeja North inventory buffer expansion",
      status: "Pending Supervisor Endorsement",
      stage: "Step 1 of 2: Supervisor Review",
      date: "Sep 10, 2026",
    },
    {
      id: "LN-8412",
      amount: 100000,
      purpose: "August inventory tranche",
      status: "Fully Repaid & Cleared",
      stage: "Completed",
      date: "Aug 12, 2026",
    },
  ]);

  // VSR Weekly & Monthly Reports State
  const [reportFrequency, setReportFrequency] = useState<"weekly" | "monthly">("weekly");
  const [reportPeriod, setReportPeriod] = useState("Week 36 (Sep 01 - Sep 07, 2026)");
  const [grossSalesAmount, setGrossSalesAmount] = useState("1850000");
  const [cashCollectedAmount, setCashCollectedAmount] = useState("1420000");
  const [transferCollectedAmount, setTransferCollectedAmount] = useState("330000");
  const [creditIssuedAmount, setCreditIssuedAmount] = useState("100000");
  const [mileageNotes, setMileageNotes] = useState("142 km covered · ₦18,500 fuel expenditure");
  const [fieldNotes, setFieldNotes] = useState("All scheduled route supermarkets supplied. Royal Prince store requested +10 cartons for next cycle.");
  const [reportFileName, setReportFileName] = useState("");
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [myReportSubmissions, setMyReportSubmissions] = useState<Array<{
    id: string;
    type: string;
    period: string;
    grossSales: number;
    cash: number;
    transfer: number;
    credit: number;
    fileName: string;
    date: string;
    notes: string;
    status: string;
    feedback: string;
  }>>([
    {
      id: "REP-902",
      type: "Weekly Summary",
      period: "Week 36 (Sep 01 - Sep 07, 2026)",
      grossSales: 1850000,
      cash: 1420000,
      transfer: 330000,
      credit: 100000,
      fileName: "VSR_Shittu_Wk36_RouteReport.xlsx",
      date: "2026-09-08 17:40",
      notes: "Route completed at 94% on-time rate.",
      status: "Received by Supervisor (Michael Olayiwola)",
      feedback: "Under review for weekly route reconciliation.",
    },
    {
      id: "REP-850",
      type: "Monthly Reconciliation",
      period: "August 2026",
      grossSales: 7420000,
      cash: 5800000,
      transfer: 1420000,
      credit: 200000,
      fileName: "VSR_Shittu_August_Reconciliation.pdf",
      date: "2026-09-01 10:20",
      notes: "Full month reconciliation with verified bank deposits.",
      status: "Approved & Reconciled by Supervisor",
      feedback: "Full audit reconciled. Clean credit record maintained.",
    },
  ]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  // Handle Weekly/Monthly Report Submission with Instant Alert to Supervisor
  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!grossSalesAmount || !reportPeriod) {
      flash("Please provide report period and sales figures!");
      return;
    }
    setIsUploadingReport(true);
    const uploadedName = reportFileName || `VSR_Report_${reportFrequency}_${reportPeriod.replace(/\s+/g, "_")}.xlsx`;
    const typeKey = reportFrequency === "weekly" ? "vsr_weekly_report" : "vsr_monthly_report";

    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeKey,
          title: `VSR ${reportFrequency.toUpperCase()} Report: ${reportPeriod}`,
          fileUrl: `https://storage.supabase.co/v1/object/public/documents/${Date.now()}_${uploadedName}`,
          fileName: uploadedName,
          notes: fieldNotes,
          metadata: {
            frequency: reportFrequency,
            period: reportPeriod,
            grossSales: Number(grossSalesAmount) || 0,
            cash: Number(cashCollectedAmount) || 0,
            transfer: Number(transferCollectedAmount) || 0,
            credit: Number(creditIssuedAmount) || 0,
            mileage: mileageNotes,
            submittedAt: new Date().toISOString(),
          }
        }),
      });
    } catch {
      // continue for local responsiveness
    }

    const newReport = {
      id: `REP-${Math.floor(100 + Math.random() * 900)}`,
      type: reportFrequency === "weekly" ? "Weekly Summary" : "Monthly Reconciliation",
      period: reportPeriod,
      grossSales: Number(grossSalesAmount) || 0,
      cash: Number(cashCollectedAmount) || 0,
      transfer: Number(transferCollectedAmount) || 0,
      credit: Number(creditIssuedAmount) || 0,
      fileName: uploadedName,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      notes: fieldNotes,
      status: "Received by Supervisor (Michael Olayiwola)",
      feedback: "Supervisor alerted instantly. Review in progress.",
    };

    setMyReportSubmissions([newReport, ...myReportSubmissions]);
    setIsUploadingReport(false);
    setReportFileName("");
    flash(`${reportFrequency === "weekly" ? "Weekly" : "Monthly"} Report submitted! Received directly by Supervisor Michael Olayiwola.`);
  }

  const salesTrend = [
    { label: "Mon", value: 1.2 }, { label: "Tue", value: 1.6 }, { label: "Wed", value: 1.4 },
    { label: "Thu", value: 1.9 }, { label: "Fri", value: 2.1 }, { label: "Sat", value: 1.7 }, { label: "Sun", value: 1.5 },
  ];

  const vsrStaff = useMemo(() => staff.filter((person) => person.role === "VSR"), []);
  const routeStops = (vsrId: string) => vsrRoutes.find((route) => route.vsrId === vsrId)?.coordinates.length ?? 0;

  const activeRoutes = vsrStaff.filter((person) => person.status === "Active" || person.status === "On route").length;
  const completedVisits = vsrStaff.reduce((sum, person) => sum + person.visits, 0);

  const totalValue = salesLog.reduce((sum, sale) => sum + sale.value, 0);
  const paidValue = salesLog.filter((sale) => sale.mode === "Paid").reduce((sum, sale) => sum + sale.value, 0);
  const creditValue = salesLog.filter((sale) => sale.mode === "Credit").reduce((sum, sale) => sum + sale.value, 0);
  const collectedValue = salesLog.reduce((sum, sale) => sum + sale.collected, 0);
  const targetPct = Math.round((collectedValue / dailyTarget) * 100);

  const visitTarget = 30;
  const completionTarget = 90;

  function markCollected(id: string) {
    setSalesLog((prev) =>
      prev.map((sale) => (sale.id === id ? { ...sale, collected: sale.value, mode: "Paid" } : sale)),
    );
    flash("Payment marked as collected — daily target updated!");
  }

  function handleApplyFundingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (currentDebt > 0) {
      flash("Cannot apply for funding: you have an outstanding loan balance!");
      return;
    }
    const amt = Number(fundingAmount);
    const newApp = {
      id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: amt,
      purpose: fundingPurpose,
      status: "Pending Supervisor Endorsement",
      stage: "Step 1 of 2: Routed to Supervisor Dashboard",
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };

    setRecentApplications([newApp, ...recentApplications]);
    setShowFundingModal(false);
    flash(`Funding request of ₦${amt.toLocaleString()} submitted! Dispatched to Supervisor for endorsement.`);
  }

  function handleReportIncidentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowIncidentModal(false);
    setIncidentReason("");
    flash("Incident alert dispatched directly to your Supervisor Dashboard!");
  }

  function signOut() {
    try {
      localStorage.removeItem("kea_user");
    } catch {}
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  const filteredSales = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return salesLog;
    return salesLog.filter((sale) =>
      `${sale.outlet} ${sale.productLine} ${sale.staff} ${sale.mode}`.toLowerCase().includes(query),
    );
  }, [search, salesLog]);

  const filteredRoutes = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return vsrStaff;
    return vsrStaff.filter((person) =>
      `${person.name} ${person.route} ${person.territory} ${person.region}`.toLowerCase().includes(query),
    );
  }, [search, vsrStaff]);

  const initials = (userName || "Babatunde Adeleke")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "VS";

  return (
    <div className={isDark ? "vsr-reference dark" : "vsr-reference"}>
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}

      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>VSR Operations Console</small>
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
            <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" title={`Switch to ${isDark ? "Light" : "Dark"} mode`}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button type="button" aria-label="Notifications" onClick={() => setActivePage("funding")}><Bell size={15} /></button>
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
                <img src={userAvatar} alt="VSR avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
            <span>Sep 10, 2026 · Van Sales Direct Operations</span>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "home" && (
            <div className="page-admin page-vsr" style={{ padding: "0 0 30px", display: "grid", gap: 20 }}>
              <FieldHero
                eyebrow="VSR FIELD SNAPSHOT"
                title="Good day, Shittu Akinsanya"
                subtitle="Van Sales Representative · Lagos Central · Route Ikeja North A1."
                badge="Active Route"
                variant="waves"
                colors={["#07535a", "#0d9488", "#14b8a6", "#134e4a"]}
                stat={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Badge variant="accent">
                      <Route size={12} /> Ikeja North · 6 stops
                    </Badge>
                    <Badge variant="success">
                      ₦<AnimatedNumber value={Math.round(totalValue / 100000)} />0K today
                    </Badge>
                    <Badge variant={currentDebt === 0 ? "success" : "danger"}>
                      {currentDebt === 0 ? "Debt: ₦0 (Eligible for Funding)" : `Debt: ₦${currentDebt.toLocaleString()}`}
                    </Badge>
                  </div>
                }
              />

              {/* CAPITAL & LOAN CALLOUT CARD */}
              <div style={{
                background: currentDebt === 0 ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 148, 136, 0.12) 100%)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${currentDebt === 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center",
                    background: currentDebt === 0 ? "#10b981" : "#ef4444", color: "#fff"
                  }}>
                    <Banknote size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                      {currentDebt === 0 ? "Inventory Funding Status: Clear & Eligible" : `Active Loan Balance: ₦${currentDebt.toLocaleString()}`}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {currentDebt === 0
                        ? "You have zero loan debt. You are eligible to request up to ₦250,000 for route inventory."
                        : "Outstanding loan debt must be repaid before requesting subsequent tranches."}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentDebt > 0) {
                        flash(`Debt Gate: You have ₦${currentDebt.toLocaleString()} active debt. Repay first!`);
                      } else {
                        setShowFundingModal(true);
                      }
                    }}
                    style={{
                      background: currentDebt === 0 ? "#10b981" : "#94a3b8", color: "#fff",
                      border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                      cursor: currentDebt === 0 ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <Plus size={15} /> Apply for Funding
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(true)}
                    style={{
                      background: "transparent", color: "var(--text)", border: "1px solid var(--line)",
                      padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <AlertTriangle size={14} color="#f59e0b" /> Report Issue to Supervisor
                  </button>
                </div>
              </div>

              {/* KPI METRICS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-teal"><Wallet size={18} /></div>
                  <span className="kx-kpi-label">Today&apos;s Sales</span>
                  <strong className="kx-kpi-value">₦{(totalValue / 1000000).toFixed(1)}M</strong>
                  <div className="kx-kpi-trend up"><b>{targetPct}%</b> <small>of daily target</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-blue"><CreditCard size={18} /></div>
                  <span className="kx-kpi-label">Collected (Paid)</span>
                  <strong className="kx-kpi-value">₦{(paidValue / 1000000).toFixed(1)}M</strong>
                  <div className="kx-kpi-trend up"><b>Cash & POS</b> <small>settled</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-amber"><Building2 size={18} /></div>
                  <span className="kx-kpi-label">Pending Credit</span>
                  <strong className="kx-kpi-value">₦{(creditValue / 1000000).toFixed(1)}M</strong>
                  <div className="kx-kpi-trend down"><b>{salesLog.filter((s) => s.mode === "Credit").length}</b> <small>invoices</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-violet"><CheckCircle2 size={18} /></div>
                  <span className="kx-kpi-label">Visits Completed</span>
                  <strong className="kx-kpi-value">{completedVisits}</strong>
                  <div className="kx-kpi-trend up"><b>6 stops</b> <small>on Ikeja route</small></div>
                </div>
              </div>

              {/* CHARTS */}
              <FadeIn delay={0.05} className="charts-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                <div className="card">
                  <div className="card-head"><div><h3>Sales this week</h3><p>Daily collected value in ₦ millions</p></div></div>
                  <div style={{ height: 220, marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrend}>
                        <defs>
                          <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" name="₦M" stroke="#0d9488" strokeWidth={2.5} fill="url(#gSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head"><div><h3>Payment mix</h3><p>Paid vs credit this window</p></div></div>
                  <div style={{ height: 220, marginTop: 8, position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Paid", value: paidValue, color: "#16a34a" },
                            { name: "Credit", value: creditValue, color: "#f59e0b" },
                          ]}
                          dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={84} paddingAngle={3} strokeWidth={0}
                        >
                          {[{ name: "Paid", value: paidValue, color: "#16a34a" }, { name: "Credit", value: creditValue, color: "#f59e0b" }].map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <b style={{ fontSize: 24 }}>₦{(totalValue / 1000000).toFixed(1)}M</b><span style={{ fontSize: 10, color: "var(--muted)" }}>total sales</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: CAPITAL & FUNDING APPLICATION
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "funding" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Financial Status Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Current Loan Balance</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: currentDebt === 0 ? "#16a34a" : "#dc2626", marginTop: 4 }}>
                    ₦{currentDebt.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {currentDebt === 0 ? "Zero outstanding debt · Full eligibility" : "Repayment active"}
                  </div>
                </div>

                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Funding Eligibility Gate</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: currentDebt === 0 ? "#0d9488" : "#d97706", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    {currentDebt === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {currentDebt === 0 ? "Cleared for Next Tranche" : "Debt Gate Active"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    Max request limit: ₦250,000
                  </div>
                </div>

                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentDebt > 0) {
                        flash(`Debt Gate: You must clear ₦${currentDebt.toLocaleString()} before applying!`);
                      } else {
                        setShowFundingModal(true);
                      }
                    }}
                    style={{
                      background: currentDebt === 0 ? "#0d9488" : "#94a3b8", color: "#fff",
                      border: "none", padding: "12px 18px", borderRadius: 8, fontSize: 13, fontWeight: 800,
                      cursor: currentDebt === 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                    }}
                  >
                    <Plus size={16} /> New Funding Application
                  </button>
                </div>
              </div>

              {/* End-to-End Chain Diagram */}
              <div style={{ background: "var(--soft)", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Route size={15} color="#0d9488" /> End-to-End Hierarchical Review Chain
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
                  <div style={{ padding: "6px 12px", background: "#7da830", color: "#fff", borderRadius: 6, fontWeight: 700 }}>
                    1. VSR Submits Request
                  </div>
                  <ArrowRight size={14} color="var(--muted)" />
                  <div style={{ padding: "6px 12px", background: "#94C83D", color: "#0A0E17", borderRadius: 6, fontWeight: 700 }}>
                    2. Supervisor Endorses / Triages
                  </div>
                  <ArrowRight size={14} color="var(--muted)" />
                  <div style={{ padding: "6px 12px", background: "#F37021", color: "#fff", borderRadius: 6, fontWeight: 700 }}>
                    3. Super Admin Disburses & Approves
                  </div>
                </div>
              </div>

              {/* Funding Applications Log */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Funding Application History & Tracking</h2>
                    <p>Track request stages from Supervisor endorsement to Super Admin final disbursement</p>
                  </div>
                  <Clock size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Requested Tranche</th>
                        <th>Business Purpose</th>
                        <th>Status Stage</th>
                        <th>Submission Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.map((app) => (
                        <tr key={app.id}>
                          <td data-label="ID"><b>{app.id}</b></td>
                          <td data-label="Amount"><b>₦{app.amount.toLocaleString()}</b></td>
                          <td data-label="Purpose">{app.purpose}</td>
                          <td data-label="Status">
                            <span className={`status ${app.status.includes("Pending") ? "needs-review" : "active"}`}>
                              <i /> {app.status}
                            </span>
                            <br /><small style={{ color: "var(--muted)", fontSize: 9 }}>{app.stage}</small>
                          </td>
                          <td data-label="Date">{app.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: WEEKLY & MONTHLY REPORTS
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Supervisor Receipt Callout Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(148, 200, 61, 0.08) 0%, rgba(243, 112, 33, 0.1) 100%)",
                border: "1px solid rgba(148, 200, 61, 0.35)",
                borderRadius: 14, padding: "18px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #94C83D, #7da830)", color: "#0A0E17", flexShrink: 0
                  }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Official VSR Route & Reconciliation Reporting</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#94C83D", color: "#0A0E17" }}>
                        Direct Supervisor Ingestion
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                      Submitted weekly summaries and monthly reconciliation reports are received instantly on your Supervisor&apos;s dashboard (Michael Olayiwola).
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setReportFrequency("weekly")}
                    style={{
                      background: reportFrequency === "weekly" ? "#94C83D" : "var(--card)",
                      color: reportFrequency === "weekly" ? "#0A0E17" : "var(--text)",
                      border: "1px solid rgba(148, 200, 61, 0.5)", padding: "7px 14px",
                      borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    Weekly Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFrequency("monthly")}
                    style={{
                      background: reportFrequency === "monthly" ? "#F37021" : "var(--card)",
                      color: reportFrequency === "monthly" ? "#fff" : "var(--text)",
                      border: "1px solid rgba(243, 112, 33, 0.5)", padding: "7px 14px",
                      borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    Monthly Reconciliation
                  </button>
                </div>
              </div>

              {/* Upload Report Form */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Submit {reportFrequency === "weekly" ? "Weekly Route Sales Summary" : "Monthly Performance & Reconciliation Report"}</h2>
                    <p>Enter collected revenue figures, fuel expenditure, and attach detailed breakdown spreadsheet</p>
                  </div>
                  <UploadCloud size={18} color="#94C83D" />
                </header>

                <form onSubmit={handleReportSubmit} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Report Period / Week</label>
                      <input
                        type="text"
                        value={reportPeriod}
                        onChange={(e) => setReportPeriod(e.target.value)}
                        placeholder="e.g. Week 36 (Sep 01 - Sep 07, 2026)"
                        required
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Total Gross Van Sales (₦)</label>
                      <input
                        type="number"
                        value={grossSalesAmount}
                        onChange={(e) => setGrossSalesAmount(e.target.value)}
                        placeholder="1850000"
                        required
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Cash Collected (₦)</label>
                      <input
                        type="number"
                        value={cashCollectedAmount}
                        onChange={(e) => setCashCollectedAmount(e.target.value)}
                        placeholder="1420000"
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Bank Transfer (₦)</label>
                      <input
                        type="number"
                        value={transferCollectedAmount}
                        onChange={(e) => setTransferCollectedAmount(e.target.value)}
                        placeholder="330000"
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Outstanding Credit Extended (₦)</label>
                      <input
                        type="number"
                        value={creditIssuedAmount}
                        onChange={(e) => setCreditIssuedAmount(e.target.value)}
                        placeholder="100000"
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Vehicle Mileage & Fuel Cost</label>
                      <input
                        type="text"
                        value={mileageNotes}
                        onChange={(e) => setMileageNotes(e.target.value)}
                        placeholder="e.g. 142 km covered · ₦18,500 fuel"
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Attachment (.xlsx, .pdf, .csv)</label>
                      <input
                        type="file"
                        accept=".xlsx,.csv,.pdf,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setReportFileName(f.name);
                        }}
                        style={{ width: "100%", marginTop: 4, padding: "6px 0", fontSize: 12, color: "var(--text)" }}
                      />
                      <small style={{ fontSize: 10, color: "var(--muted)" }}>
                        {reportFileName ? `Selected: ${reportFileName}` : "Full product ledger spreadsheet"}
                      </small>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Route Notes & Retailer Feedback</label>
                    <textarea
                      value={fieldNotes}
                      onChange={(e) => setFieldNotes(e.target.value)}
                      rows={2}
                      placeholder="Notes on route delays, fast-moving SKUs, or customer restocking requests..."
                      style={{ width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <button
                      type="submit"
                      disabled={isUploadingReport}
                      style={{
                        background: "linear-gradient(135deg, #94C83D, #7da830)", color: "#0A0E17", border: "none", padding: "10px 22px",
                        borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                        boxShadow: "0 2px 10px rgba(148, 200, 61, 0.35)"
                      }}
                    >
                      <Send size={14} />
                      {isUploadingReport ? "Submitting to Supervisor..." : "Submit Report & Alert Supervisor Instantly"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Submitted Reports History */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Submitted Field Reports History</h2>
                    <p>Track supervisor receipt, route audit verification, and reconciliation comments</p>
                  </div>
                  <FileCheck size={18} color="#94C83D" />
                </header>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>Type & Period</th>
                        <th>Gross Sales</th>
                        <th>Collections (Cash / Transfer)</th>
                        <th>Attached File</th>
                        <th>Submission Date</th>
                        <th>Supervisor Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReportSubmissions.map((r) => (
                        <tr key={r.id}>
                          <td data-label="ID"><b>{r.id}</b></td>
                          <td data-label="Period">
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: r.type.includes("Monthly") ? "rgba(148, 200, 61, 0.15)" : "rgba(243, 112, 33, 0.12)", color: r.type.includes("Monthly") ? "#7da830" : "#F37021" }}>
                              {r.type}
                            </span>
                            <br /><b>{r.period}</b>
                          </td>
                          <td data-label="Gross"><b>₦{r.grossSales.toLocaleString()}</b></td>
                          <td data-label="Collections">
                            <small>Cash: ₦{r.cash.toLocaleString()}</small><br />
                            <small>Transfer: ₦{r.transfer.toLocaleString()}</small>
                          </td>
                          <td data-label="File">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#94C83D", fontWeight: 700, fontSize: 11 }}>
                              <FileText size={13} /> {r.fileName}
                            </span>
                          </td>
                          <td data-label="Date">{r.date}</td>
                          <td data-label="Status">
                            <span className={`status ${r.status.includes("Approved") ? "active" : "needs-review"}`}>
                              <i /> {r.status}
                            </span>
                            <br /><small style={{ color: "var(--muted)", fontSize: 9 }}>{r.feedback}</small>
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
              TAB 4: MY ROUTES
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "routes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", minWidth: 260, flex: "0 1 340px" }}>
                  <Search size={14} style={{ color: "var(--muted)" }} />
                  <input
                    placeholder="Search routes, territories, regions..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "var(--text)", width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 6, background: "rgba(13, 148, 136, 0.1)", color: "#0d9488" }}>
                    <Route size={12} style={{ display: "inline", marginRight: 4 }} /> {filteredRoutes.length} Assigned Routes
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-teal"><Route size={18} /></div>
                  <span className="kx-kpi-label">Active Routes</span>
                  <strong className="kx-kpi-value">{activeRoutes}</strong>
                  <div className="kx-kpi-trend up"><b>{vsrStaff.length} total</b> <small>assigned</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-blue"><MapPin size={18} /></div>
                  <span className="kx-kpi-label">Visits Completed</span>
                  <strong className="kx-kpi-value">{completedVisits}</strong>
                  <div className="kx-kpi-trend up"><b>Across</b> <small>all routes</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-emerald"><CheckCircle2 size={18} /></div>
                  <span className="kx-kpi-label">Avg Completion</span>
                  <strong className="kx-kpi-value">94%</strong>
                  <div className="kx-kpi-trend up"><b>Ikeja North A1</b> <small>on track</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-violet"><Building2 size={18} /></div>
                  <span className="kx-kpi-label">Route Stops</span>
                  <strong className="kx-kpi-value">6 stops</strong>
                  <div className="kx-kpi-trend up"><b>Scheduled</b> <small>today</small></div>
                </div>
              </div>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Route Board & Field Coverage</h2>
                    <p>Your assigned territories, schedule adherence and completion metrics</p>
                  </div>
                  <MapPin size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Route</th><th>Territory</th><th>Region</th><th>Status</th><th>Stops</th><th>Visits</th><th>Completion</th></tr></thead>
                    <tbody>
                      {filteredRoutes.map((person) => (
                        <tr key={person.id}>
                          <td data-label="Route"><b>{person.route}</b></td>
                          <td data-label="Territory">{person.territory}</td>
                          <td data-label="Region">{person.region}</td>
                          <td data-label="Status"><span className={`status ${person.status.toLowerCase().replace(" ", "-")}`}><i />{person.status}</span></td>
                          <td data-label="Stops">{routeStops(person.id) || "6"}</td>
                          <td data-label="Visits"><b>{person.visits}</b></td>
                          <td data-label="Completion">
                            <div className="progress-cell"><div><i style={{ width: `${person.completion}%` }} /></div><b>{person.completion}%</b></div>
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
              TAB 4: SALES
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "sales" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", minWidth: 260, flex: "0 1 340px" }}>
                  <Search size={14} style={{ color: "var(--muted)" }} />
                  <input
                    placeholder="Search outlets, products, payment mode..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "var(--text)", width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 6, background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                    <DollarSign size={12} style={{ display: "inline", marginRight: 2 }} /> {filteredSales.length} Sales Transactions
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-teal"><Wallet size={18} /></div>
                  <span className="kx-kpi-label">Today&apos;s Sales</span>
                  <strong className="kx-kpi-value">₦{(totalValue / 1000000).toFixed(1)}M</strong>
                  <div className="kx-kpi-trend up"><b>Paid + Credit</b> <small>combined</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-blue"><CreditCard size={18} /></div>
                  <span className="kx-kpi-label">Paid / Collected</span>
                  <strong className="kx-kpi-value">₦{(paidValue / 1000000).toFixed(1)}M</strong>
                  <div className="kx-kpi-trend up"><b>Cash & POS</b> <small>received</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-amber"><Building2 size={18} /></div>
                  <span className="kx-kpi-label">Pending Credit</span>
                  <strong className="kx-kpi-value">₦{(creditValue / 1000000).toFixed(1)}M</strong>
                  <div className="kx-kpi-trend down"><b>{salesLog.filter((s) => s.mode === "Credit").length}</b> <small>invoices</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-violet"><Target size={18} /></div>
                  <span className="kx-kpi-label">Target Progress</span>
                  <strong className="kx-kpi-value">{targetPct}%</strong>
                  <div className="kx-kpi-trend up"><b>₦{(dailyTarget / 1000000).toFixed(0)}M</b> <small>daily quota</small></div>
                </div>
              </div>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Daily Sales & Collections Log</h2>
                    <p>Record paid and credit sales. Customer phone number is verified for credit transactions.</p>
                  </div>
                  <ClipboardList size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Outlet</th><th>Product line</th><th>Qty</th><th>Value</th><th>Mode</th><th>Phone (credit)</th><th>Collected</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id}>
                          <td data-label="Outlet"><b>{sale.outlet}</b></td>
                          <td data-label="Product line">{sale.productLine}</td>
                          <td data-label="Qty">{sale.quantity}</td>
                          <td data-label="Value">₦{(sale.value / 1000000).toFixed(2)}M</td>
                          <td data-label="Mode">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 5, padding: "3px 9px", fontWeight: 700, fontSize: 10, color: sale.mode === "Paid" ? "#065f46" : "#92400e", background: sale.mode === "Paid" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)" }}>
                              {sale.mode === "Paid" ? <Wallet size={12} /> : <CreditCard size={12} />}
                              {sale.mode}
                            </span>
                          </td>
                          <td data-label="Phone">{sale.mode === "Credit" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Phone size={12} />{sale.phone ?? "—"}</span> : "—"}</td>
                          <td data-label="Collected">{sale.collected > 0 ? <b>₦{(sale.collected / 1000000).toFixed(2)}M</b> : "—"}</td>
                          <td data-label="Actions">
                            {sale.mode === "Credit" && sale.collected === 0 && (
                              <button type="button" className="mark-paid" onClick={() => markCollected(sale.id)}>Mark paid</button>
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
              TAB 5: PERFORMANCE
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "performance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-teal"><Target size={18} /></div>
                  <span className="kx-kpi-label">Visit Target</span>
                  <strong className="kx-kpi-value">{visitTarget}</strong>
                  <div className="kx-kpi-trend up"><b>Per month</b> <small>quota</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-blue"><CheckCircle2 size={18} /></div>
                  <span className="kx-kpi-label">Completion Target</span>
                  <strong className="kx-kpi-value">{completionTarget}%</strong>
                  <div className="kx-kpi-trend up"><b>Minimum</b> <small>standard</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-emerald"><Route size={18} /></div>
                  <span className="kx-kpi-label">Visits Completed</span>
                  <strong className="kx-kpi-value">{completedVisits}</strong>
                  <div className="kx-kpi-trend up"><b>This</b> <small>window</small></div>
                </div>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-violet"><TrendingUp size={18} /></div>
                  <span className="kx-kpi-label">Avg Completion</span>
                  <strong className="kx-kpi-value">94%</strong>
                  <div className="kx-kpi-trend up"><b>All</b> <small>routes</small></div>
                </div>
              </div>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>My Target Progress</h2>
                    <p>Individual route performance against targets</p>
                  </div>
                  <Target size={16} color="#0d9488" />
                </header>
                <div className="vsr-target-list">
                  {vsrStaff.map((person) => {
                    const visitPct = Math.min(100, Math.round((person.visits / visitTarget) * 100));
                    const completionOk = person.completion >= completionTarget;
                    return (
                      <div key={person.id} className="vsr-target-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <b style={{ fontSize: 12 }}>{person.route}</b>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{person.visits}/{visitTarget} visits · {person.completion}%</span>
                          </div>
                          <div style={{ height: 9, background: "var(--bar-muted, #eef1ef)", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                            <div style={{ height: "100%", width: `${visitPct}%`, background: completionOk ? "#12a472" : "#f59e0b", borderRadius: 5 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: completionOk ? "#0c9b6b" : "#d8900b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {completionOk ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {completionOk ? "On track" : "Below target"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: APPLY FOR FUNDING (WITH ZERO-DEBT GUARD) ─── */}
      {showFundingModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowFundingModal(false); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Apply for inventory funding">
            <div className="modal-head">
              <div>
                <small>CAPITAL SURVEILLANCE & TRADING</small>
                <h2>Apply for Route Inventory Funding</h2>
              </div>
              <button type="button" onClick={() => setShowFundingModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleApplyFundingSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={20} color="#059669" />
                <div style={{ fontSize: 11, color: "#065f46" }}>
                  <b>Zero-Debt Clearance Confirmed.</b> You are eligible to request working capital. Request will be dispatched to your Supervisor.
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Select Requested Amount</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                  {["50000", "100000", "150000", "250000"].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setFundingAmount(amt)}
                      style={{
                        padding: "10px 12px", borderRadius: 8, border: `2px solid ${fundingAmount === amt ? "#0d9488" : "var(--line)"}`,
                        background: fundingAmount === amt ? "rgba(13, 148, 136, 0.1)" : "var(--card)",
                        color: "var(--text)", fontWeight: 800, fontSize: 13, cursor: "pointer", textAlign: "center"
                      }}
                    >
                      ₦{Number(amt).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Business Purpose / Route Need</label>
                <textarea
                  rows={3}
                  value={fundingPurpose}
                  onChange={(e) => setFundingPurpose(e.target.value)}
                  placeholder="Describe inventory replenishment requirements..."
                  style={{
                    width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: "1px solid var(--line)",
                    background: "var(--card)", color: "var(--text)", fontSize: 12, resize: "none"
                  }}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 6 }}>
                <button type="button" className="secondary" onClick={() => setShowFundingModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ background: "#0d9488", borderColor: "#0d9488" }}>
                  <Send size={14} /> Submit to Supervisor
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ─── MODAL: REPORT INCIDENT / DELAY TO SUPERVISOR ─── */}
      {showIncidentModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowIncidentModal(false); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Report issue to supervisor">
            <div className="modal-head">
              <div>
                <small>FIELD INCIDENT DISPATCH</small>
                <h2>Report Route Issue to Supervisor</h2>
              </div>
              <button type="button" onClick={() => setShowIncidentModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleReportIncidentSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Incident Type</label>
                <select style={{ width: "100%", marginTop: 6, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}>
                  <option>Stock Shortage / Warehouse Stockout</option>
                  <option>Vehicle Maintenance / Breakdown</option>
                  <option>Severe Road Traffic / Route Blockage</option>
                  <option>Customer Credit Default / Dispute</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Details / Immediate Action Required</label>
                <textarea
                  rows={3}
                  value={incidentReason}
                  onChange={(e) => setIncidentReason(e.target.value)}
                  placeholder="Explain the field challenge for your supervisor..."
                  style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, resize: "none" }}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 6 }}>
                <button type="button" className="secondary" onClick={() => setShowIncidentModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ background: "#f59e0b", borderColor: "#f59e0b", color: "#fff" }}>
                  <Send size={14} /> Send Alert to Supervisor
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {/* ─── SETTINGS & PROFILE POPUP MODAL ─── */}
      <ProfileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        role="vsr"
        defaultName={userName || "Babatunde Adeleke"}
        defaultEmail="babatunde.adeleke@kea.com"
        roleLabel="Van Sales Representative · Fleet Lead"
        onFlash={flash}
      />
    </div>
  );
}
