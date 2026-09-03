"use client";

export const dynamic = "force-dynamic";

import { useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Bell, CheckCircle2, ChevronDown, ClipboardCheck,
  Home, LogOut, MapPin, Menu, Moon, MoreHorizontal, Search, Settings,
  ShieldCheck, Store, Sun, TrendingDown, TrendingUp, Upload, Users, X, Target, Building2, Layers,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { outletData, staff } from "../data";
import {
  products, supervisors, getChildren, getStoresBySupervisor,
  getActivitiesByStaff, getVSRRoute,
} from "../hierarchy-data";
import { FadeIn, KpiGrid, SelectBox } from "../shared";
import { FieldHero } from "../../components/field-hero";
import { ScrollProgress } from "../../components/motion-primitives/scroll-progress";
import { AnimatedNumber } from "../../components/motion-primitives/animated-number";
import { Badge } from "../../components/ui/badge";

type PageKey =
  | "home"
  | "team"
  | "merchandiser"
  | "vsr"
  | "visits"
  | "onboarding"
  | "route-coverage"
  | "data-quality"
  | "settings";

const navItems: { key: PageKey; label: string; icon: typeof Users }[] = [
  { key: "home", label: "Dashboard", icon: Home },
  { key: "team", label: "Team Overview", icon: Users },
  { key: "merchandiser", label: "Merchandiser Performance", icon: Target },
  { key: "vsr", label: "VSR Performance", icon: MapPin },
  { key: "visits", label: "Visit Reports & Uploads", icon: Upload },
  { key: "onboarding", label: "Outlet Onboarding", icon: Store },
  { key: "route-coverage", label: "Route Coverage Reports", icon: ClipboardCheck },
  { key: "data-quality", label: "Data Quality Audits", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "DASHBOARD", subtitle: "Your team, targets, expiry alerts and field execution at a glance." },
  team: { title: "TEAM OVERVIEW", subtitle: "Your direct reports, completion rates and field status." },
  merchandiser: { title: "MERCHANDISER PERFORMANCE", subtitle: "Store execution, visits and completion per merchandiser." },
  vsr: { title: "VSR PERFORMANCE", subtitle: "Route coverage, visit count and field completion per VSR." },
  visits: { title: "VISIT REPORTS & UPLOADS", subtitle: "Upload and review visit evidence from your field team." },
  onboarding: { title: "OUTLET ONBOARDING", subtitle: "Approve or reject new outlets requested by your team." },
  "route-coverage": { title: "ROUTE COVERAGE REPORTS", subtitle: "Territory coverage, store visits and route health." },
  "data-quality": { title: "DATA QUALITY AUDITS", subtitle: "Validate GPS data, staff records and activity logs." },
  settings: { title: "SETTINGS", subtitle: "Profile, preferences, theme and security." },
};

export default function SupervisorDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [supervisorId, setSupervisorId] = useState("KEA-SUP-001");
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState({ daily: true, alerts: true });
  const [pendingOutlets, setPendingOutlets] = useState(outletData.filter((o) => o.status === "Pending"));
  const [uploaded, setUploaded] = useState(0);
  const [reportMember, setReportMember] = useState("");
  const [reportType, setReportType] = useState("Store visit report");
  const [reportNotes, setReportNotes] = useState("");
  const [reportFiles, setReportFiles] = useState<{ name: string; size: number }[]>([]);
  const [submittedReports, setSubmittedReports] = useState<{ id: string; member: string; type: string; date: string; files: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [period, setPeriod] = useState("Last 30 days");
  const [region, setRegion] = useState("My region");

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
  const myActivities = useMemo(
    () => myTeam.flatMap((member) => getActivitiesByStaff(member.id)),
    [myTeam]
  );

  const completionTarget = 90;
  const healthyStores = myStores.filter((s) => s.status === "Healthy").length;
  const avgCompletion = myTeam.length
    ? Math.round(myTeam.reduce((sum, m) => sum + m.completion, 0) / myTeam.length)
    : 0;

  // Expiry monitoring — products within a 4-day window. Supervisors are alerted
  // when 3 or more people under them have expiring products.
  const teamIds = new Set(myTeam.map((m) => m.id));
  const teamProducts = products.filter((p) => teamIds.has(p.merchandiserId));
  const expiringRisk: Record<string, boolean> = {};
  teamProducts.forEach((p, index) => {
    if (index % 4 === 0) expiringRisk[p.merchandiserId] = true;
  });
  const peopleWithExpiry = Object.keys(expiringRisk).length;
  const expiryAlert = peopleWithExpiry >= 3;
  const expiringProducts = teamProducts.filter((_, index) => index % 4 === 0).length;

  const pendingCount = pendingOutlets.length;

  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const approvalsToday = pendingOutlets.filter((o) => o.status === "Pending").length;

  const dataQualityScore = useMemo(() => {
    const withGPS = myTeam.filter((m) => m.lat && m.lng).length;
    const activeCount = myTeam.filter((m) => m.status !== "Inactive").length;
    const withPhotos = myTeam.filter((m) => m.photos && m.photos.length > 0).length;
    const gpsScore = myTeam.length ? (withGPS / myTeam.length) * 40 : 0;
    const activeScore = myTeam.length ? (activeCount / myTeam.length) * 30 : 0;
    const photoScore = myTeam.length ? (withPhotos / myTeam.length) * 30 : 0;
    return Math.round(gpsScore + activeScore + photoScore);
  }, [myTeam]);

  const filteredMerchandisers = useMemo(() => {
    if (!search) return myMerchandisers;
    const q = search.toLowerCase();
    return myMerchandisers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.territory.toLowerCase().includes(q) || m.route.toLowerCase().includes(q)
    );
  }, [myMerchandisers, search]);

  const filteredVSRs = useMemo(() => {
    if (!search) return myVSRs;
    const q = search.toLowerCase();
    return myVSRs.filter(
      (v) => v.name.toLowerCase().includes(q) || v.territory.toLowerCase().includes(q) || v.route.toLowerCase().includes(q)
    );
  }, [myVSRs, search]);

  function signOut() {
    try { localStorage.removeItem("kea_user"); } catch { /* ignore */ }
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  function approveOutlet(id: string) {
    setPendingOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Active" } : o)));
  }

  function rejectOutlet(id: string) {
    setPendingOutlets((prev) => prev.filter((o) => o.id !== id));
  }

  function openFolderPicker() {
    fileInputRef.current?.click();
  }

  function onFilesChosen(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map((file) => ({ name: file.name, size: file.size }));
    setReportFiles((prev) => [...prev, ...next].slice(0, 10));
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer?.files) onFilesChosen(event.dataTransfer.files);
  }

  function removeFile(name: string) {
    setReportFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function handleUpload() {
    if (!reportMember) {
      alert("Please select a team member.");
      return;
    }
    if (reportFiles.length === 0) {
      alert("Please choose at least one file (photo / evidence) to upload.");
      return;
    }
    const now = new Date();
    setSubmittedReports((prev) => [
      { id: `RT-${Date.now()}`, member: reportMember, type: reportType, date: now.toISOString().slice(0, 10), files: reportFiles.length },
      ...prev,
    ]);
    setUploaded((n) => n + 1);
    setReportFiles([]);
    setReportNotes("");
    alert(`Visit report uploaded successfully — ${reportFiles.length} file(s) attached for ${reportMember}.`);
  }

  return (
    <div className={dark ? "tsr-reference dark" : "tsr-reference"}>
      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>Supervisor Console</small>
          <button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button type="button" key={key} className={activePage === key ? "active" : ""} onClick={() => { setActivePage(key); setMobileNav(false); setSearch(""); }}>
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
            <button type="button" aria-label="Notifications"><Bell size={15} /></button>
            <span>SV</span>
          </div>
        </header>

        <div className="reference-content">
          <ScrollProgress className="fixed top-0 left-0 right-0 z-[60]" />

          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Sep 1, 2026</span>
          </div>

          <div style={{ marginBottom: 10, maxWidth: 280 }}>
            <SupervisorSelect value={supervisorId} options={supervisors} onChange={setSupervisorId} />
          </div>

          {activePage === "home" && (
            <>
              <div className="page-admin page-supervisor" style={{ padding: "28px 30px", display: "grid", gap: 22 }}>
                <FieldHero
                  eyebrow="SUPERVISOR OVERVIEW"
                  title={<>Welcome back, {supervisor.name}</>}
                  subtitle={`Supervisor · ${supervisor.territory}, ${supervisor.region} — your team, targets and field execution at a glance.`}
                  badge="Live"
                  variant="waves"
                  colors={["#0d9488", "#07535a", "#14b8a6", "#134e4a"]}
                  stat={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Badge variant="success">
                        <AnimatedNumber value={myTeam.length} /> team members
                      </Badge>
                      <Badge variant={avgCompletion >= completionTarget ? "success" : "warning"}>
                        {avgCompletion}% completion
                      </Badge>
                    </div>
                  }
                />

                <div className="filters" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <SelectBox label="Period" value={period} onChange={setPeriod} options={["Last 7 days", "Last 30 days", "This quarter", "This year"]} />
                  <SelectBox label="Region" value={region} onChange={setRegion} options={["My region", supervisor.region, supervisor.territory]} />
                </div>

                {expiryAlert && (
                  <div style={{ padding: "13px 16px", borderRadius: 8, display: "flex", gap: 10, background: "#fef3f2", border: "1px solid #fecaca" }}>
                    <AlertTriangle size={18} style={{ color: "#b42318", flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: "#7a271a" }}>
                      <b>Expiry alert:</b> {peopleWithExpiry} people under you have products expiring within 4 days (about {expiringProducts} SKUs). Review stock rotation and confirm reorders.
                    </div>
                  </div>
                )}

                <KpiGrid items={[
                  { label: "Direct reports", value: String(myTeam.length), trend: myTeam.map((m) => m.role).filter((r) => r === "Merchandiser").length + " merch", up: true, sub: "team members", icon: Users, tone: "blue" },
                  { label: "Avg completion", value: `${avgCompletion}%`, trend: `${completionTarget}%`, up: avgCompletion >= completionTarget, sub: "target", icon: Target, tone: "teal" },
                  { label: "Pending outlets", value: String(pendingCount), trend: "action", up: false, sub: "awaiting approval", icon: Building2, tone: "amber" },
                  { label: "Stores covered", value: String(myStores.length), trend: `${healthyStores} healthy`, up: true, sub: "execution health", icon: Store, tone: "violet" },
                  { label: "Expiry risk", value: String(peopleWithExpiry), trend: `${expiringProducts} SKUs`, up: false, sub: "people at risk", icon: AlertTriangle, tone: "amber" },
                  { label: "Below target", value: String(myTeam.filter((m) => m.completion < completionTarget).length), trend: "coaching", up: true, sub: "needs attention", icon: Layers, tone: "blue" },
                ]} />

                <FadeIn delay={0.05} className="charts-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                  <div className="card">
                    <div className="card-head"><div><h3>Team completion trend</h3><p>Average execution against the {completionTarget}% minimum over time</p></div></div>
                    <div style={{ height: 240, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={completionTrend}>
                          <defs>
                            <linearGradient id="gCompSup" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} width={32} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                          <Area type="monotone" dataKey="completion" name="Completion %" stroke="#0d9488" strokeWidth={2.5} fill="url(#gCompSup)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><h3>Team mix</h3><p>Direct reports by role</p></div></div>
                    <div style={{ height: 240, marginTop: 8, position: "relative" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[
                            { name: "Merchandisers", value: myMerchandisers.length, color: "#0d9488" },
                            { name: "VSRs", value: myVSRs.length, color: "#2563eb" },
                          ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                            {[{ name: "Merchandisers", value: myMerchandisers.length, color: "#0d9488" }, { name: "VSRs", value: myVSRs.length, color: "#2563eb" }].map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <b style={{ fontSize: 26 }}>{myTeam.length}</b><span style={{ fontSize: 11, color: "var(--muted)" }}>team members</span>
                      </div>
                    </div>
                    <div className="legend" style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 11 }}>
                      <span><i style={{ width: 9, height: 9, borderRadius: 3, background: "#0d9488", display: "inline-block" }} />Merchandisers · {myMerchandisers.length}</span>
                      <span><i style={{ width: 9, height: 9, borderRadius: 3, background: "#2563eb", display: "inline-block" }} />VSRs · {myVSRs.length}</span>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1} className="charts-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div className="card">
                    <div className="card-head"><div><h3>Completion by member</h3><p>Individual output against target</p></div></div>
                    <div style={{ height: 220, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={myTeam.map((m) => ({ name: m.name.split(" ")[0], completion: m.completion }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8a9499" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} width={32} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                          <Bar dataKey="completion" name="Completion %" radius={[6, 6, 0, 0]} fill="#0d9488" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><h3>Route coverage</h3><p>Store visits vs target per member</p></div></div>
                    <div style={{ height: 220, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={myTeam.map((m) => ({ name: m.name.split(" ")[0], visits: m.visits }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8a9499" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} width={32} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                          <Bar dataKey="visits" name="Visits" radius={[6, 6, 0, 0]} fill="#2563eb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.15} className="card">
                  <div className="card-head"><div><h3>Team overview</h3><p>Direct reports with completion and target status</p></div><Users size={16} /></div>
                  <div className="vsr-target-list">
                    {myTeam.map((member) => {
                      const onTrack = member.completion >= completionTarget;
                      return (
                        <div key={member.id} className="vsr-target-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <b style={{ fontSize: 12 }}>{member.name}</b>
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>{member.role} · {member.visits} visits · {member.completion}%</span>
                            </div>
                            <div style={{ height: 9, background: "#eef1ef", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                              <div style={{ height: "100%", width: `${Math.min(100, member.completion)}%`, background: onTrack ? "#16a34a" : "#f59e0b", borderRadius: 5 }} />
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: onTrack ? "#0c9b6b" : "#d8900b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            {onTrack ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {onTrack ? "On track" : "Below target"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </FadeIn>

                <FadeIn delay={0.2} className="card">
                  <div className="card-head"><div><h3>Avg completion vs target</h3><p>Overall team execution compared to {completionTarget}% minimum</p></div><Target size={16} /></div>
                  <div style={{ padding: 16 }}>
                    <div style={{ height: 12, background: "#eef1ef", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, avgCompletion)}%`, background: avgCompletion >= completionTarget ? "#16a34a" : "#f59e0b", borderRadius: 6 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
                      <span>{avgCompletion}% team average</span>
                      <span>{completionTarget}% target</span>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </>
          )}

          {activePage === "team" && (
            <>
              <section className="reference-kpis">
                <article><span>Direct reports <MoreHorizontal size={14} /></span><b>{myTeam.length}</b><small>team members</small></article>
                <article><span>Avg completion <MoreHorizontal size={14} /></span><b>{avgCompletion}%</b><small>vs {completionTarget}% target</small></article>
                <article><span>Stores covered <MoreHorizontal size={14} /></span><b>{myStores.length}</b><small>across team</small></article>
                <article><span>Healthy stores <MoreHorizontal size={14} /></span><b>{healthyStores}</b><small>execution health</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Team members</h2><p>{supervisor.name} · {supervisor.territory}, {supervisor.region}</p></div><Users size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Name</th><th>Role</th><th>Territory</th><th>Route</th><th>Status</th><th>Visits</th><th>Completion</th></tr></thead>
                    <tbody>
                      {myTeam.map((member) => {
                        const onTrack = member.completion >= completionTarget;
                        return (
                          <tr key={member.id}>
                            <td data-label="Name"><b>{member.name}</b><br /><small>{member.id}</small></td>
                            <td data-label="Role"><span className={`role-badge ${member.role.toLowerCase()}`}>{member.role}</span></td>
                            <td data-label="Territory">{member.territory}</td>
                            <td data-label="Route">{member.route}</td>
                            <td data-label="Status"><span className={`status ${member.status.toLowerCase().replace(" ", "-")}`}><i />{member.status}</span></td>
                            <td data-label="Visits"><b>{member.visits}</b></td>
                            <td data-label="Completion">
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 80, height: 8, background: "#eef1ef", borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${member.completion}%`, background: onTrack ? "#16a34a" : "#f59e0b", borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{member.completion}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>Completion summary</h2><p>Team members above and below {completionTarget}% target</p></div><Target size={16} /></header>
                <div className="vsr-target-list">
                  {myTeam.map((member) => {
                    const onTrack = member.completion >= completionTarget;
                    const visitPct = Math.min(100, Math.round((member.visits / 35) * 100));
                    return (
                      <div key={member.id} className="vsr-target-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <b style={{ fontSize: 12 }}>{member.name}</b>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{member.visits} visits · {member.completion}%</span>
                          </div>
                          <div style={{ height: 9, background: "#eef1ef", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                            <div style={{ height: "100%", width: `${visitPct}%`, background: onTrack ? "#16a34a" : "#f59e0b", borderRadius: 5 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: onTrack ? "#0c9b6b" : "#d8900b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {onTrack ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {onTrack ? "On track" : "Below target"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activePage === "merchandiser" && (
            <>
              <div className="reference-search" style={{ marginBottom: 10 }}>
                <Search size={13} /><input placeholder="Search merchandisers..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <section className="reference-kpis">
                <article><span>Merchandisers <MoreHorizontal size={14} /></span><b>{myMerchandisers.length}</b><small>reporting to you</small></article>
                <article><span>Avg completion <MoreHorizontal size={14} /></span><b>{myMerchandisers.length ? Math.round(myMerchandisers.reduce((s, m) => s + m.completion, 0) / myMerchandisers.length) : 0}%</b><small>execution rate</small></article>
                <article><span>Above target <MoreHorizontal size={14} /></span><b>{myMerchandisers.filter((m) => m.completion >= completionTarget).length}</b><small>at or above {completionTarget}%</small></article>
                <article><span>Below target <MoreHorizontal size={14} /></span><b>{myMerchandisers.filter((m) => m.completion < completionTarget).length}</b><small>needs coaching</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Merchandiser performance</h2><p>Visit count, completion rate and territory coverage</p></div><Target size={16} /></header>
                <div className="vsr-target-list">
                  {filteredMerchandisers.map((merch) => {
                    const onTrack = merch.completion >= completionTarget;
                    const visitPct = Math.min(100, Math.round((merch.visits / 35) * 100));
                    const perMerchStores = Math.ceil(myStores.length / Math.max(myMerchandisers.length, 1));
                    return (
                      <div key={merch.id} className="vsr-target-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <b style={{ fontSize: 12 }}>{merch.name}</b>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{merch.territory} · {merch.route}</span>
                          </div>
                          <div style={{ height: 9, background: "#eef1ef", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                            <div style={{ height: "100%", width: `${visitPct}%`, background: onTrack ? "#16a34a" : "#f59e0b", borderRadius: 5 }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{merch.visits} visits · ~{perMerchStores} stores</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{merch.completion}%</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: onTrack ? "#0c9b6b" : "#d8900b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {onTrack ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {onTrack ? "On track" : "Below target"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>Recent activities</h2><p>Latest field activity from your merchandisers</p></div><ClipboardCheck size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Staff</th><th>Type</th><th>Store</th><th>Date</th><th>Completion</th></tr></thead>
                    <tbody>
                      {myActivities.slice(0, 8).map((act) => (
                        <tr key={act.id}>
                          <td data-label="Staff"><b>{act.staffName}</b></td>
                          <td data-label="Type">{act.type}</td>
                          <td data-label="Store">{act.storeName || "\u2014"}</td>
                          <td data-label="Date">{act.date} {act.time}</td>
                          <td data-label="Completion"><span className={`status ${act.completion >= 90 ? "active" : act.completion >= 70 ? "on-route" : "needs-review"}`}><i />{act.completion}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "vsr" && (
            <>
              <div className="reference-search" style={{ marginBottom: 10 }}>
                <Search size={13} /><input placeholder="Search VSRs..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <section className="reference-kpis">
                <article><span>VSRs in territory <MoreHorizontal size={14} /></span><b>{myVSRs.length}</b><small>route coverage</small></article>
                <article><span>Active VSRs <MoreHorizontal size={14} /></span><b>{myVSRs.filter((v) => v.status !== "Inactive").length}</b><small>in the field</small></article>
                <article><span>Avg completion <MoreHorizontal size={14} /></span><b>{myVSRs.length ? Math.round(myVSRs.reduce((s, v) => s + v.completion, 0) / myVSRs.length) : 0}%</b><small>route performance</small></article>
                <article><span>Total visits <MoreHorizontal size={14} /></span><b>{myVSRs.reduce((s, v) => s + v.visits, 0)}</b><small>across all routes</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>VSR route performance</h2><p>Route coverage, visits and completion per VSR</p></div><MapPin size={16} /></header>
                <div className="vsr-target-list">
                  {filteredVSRs.map((vsr) => {
                    const onTrack = vsr.completion >= completionTarget;
                    const visitPct = Math.min(100, Math.round((vsr.visits / 35) * 100));
                    const route = getVSRRoute(vsr.id);
                    const waypoints = route?.coordinates.length ?? 0;
                    const routeStores = route?.stores.length ?? 0;
                    return (
                      <div key={vsr.id} className="vsr-target-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <b style={{ fontSize: 12 }}>{vsr.name}</b>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{vsr.route} · {vsr.territory}</span>
                          </div>
                          <div style={{ height: 9, background: "#eef1ef", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                            <div style={{ height: "100%", width: `${visitPct}%`, background: onTrack ? "#16a34a" : "#f59e0b", borderRadius: 5 }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{vsr.visits} visits · {waypoints} waypoints · {routeStores} stores</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{vsr.completion}%</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: onTrack ? "#0c9b6b" : "#d8900b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {onTrack ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {onTrack ? "On track" : "Below target"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>VSR status summary</h2><p>Current operational status of each VSR</p></div><ClipboardCheck size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>VSR</th><th>Route</th><th>Territory</th><th>Status</th><th>Visits</th><th>Completion</th></tr></thead>
                    <tbody>
                      {filteredVSRs.map((vsr) => (
                        <tr key={vsr.id}>
                          <td data-label="VSR"><b>{vsr.name}</b><br /><small>{vsr.id}</small></td>
                          <td data-label="Route">{vsr.route}</td>
                          <td data-label="Territory">{vsr.territory}</td>
                          <td data-label="Status"><span className={`status ${vsr.status.toLowerCase().replace(" ", "-")}`}><i />{vsr.status}</span></td>
                          <td data-label="Visits"><b>{vsr.visits}</b></td>
                          <td data-label="Completion">{vsr.completion}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "visits" && (
            <>
              <section className="reference-kpis">
                <article><span>Reports uploaded <MoreHorizontal size={14} /></span><b>{uploaded}</b><small>this session</small></article>
                <article><span>Team reports <MoreHorizontal size={14} /></span><b>{myActivities.length}</b><small>aggregate activity</small></article>
                <article><span>With photos <MoreHorizontal size={14} /></span><b>{myTeam.filter((m) => m.photos && m.photos.length > 0).length}</b><small>evidence captured</small></article>
                <article><span>Pending outlets <MoreHorizontal size={14} /></span><b>{pendingCount}</b><small>awaiting onboarding</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Upload a visit report</h2><p>Attach visit evidence (photos, notes, stock observations) for your team.</p></div><Upload size={16} /></header>
                <div style={{ padding: 16, display: "grid", gap: 12 }}>
                  <label className="admin-select" style={{ width: "100%" }}>
                    <span>TEAM MEMBER</span>
                    <select value={reportMember} onChange={(e) => setReportMember(e.target.value)}>
                      <option value="">Select team member...</option>
                      {myTeam.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                    <ChevronDown size={13} />
                  </label>
                  <label className="admin-select" style={{ width: "100%" }}>
                    <span>REPORT TYPE</span>
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                      <option>Store visit report</option>
                      <option>Stock observation</option>
                      <option>Credit collection</option>
                      <option>New account evidence</option>
                    </select>
                    <ChevronDown size={13} />
                  </label>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openFolderPicker}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    style={{
                      border: `1.5px dashed ${dragOver ? "#07535a" : "#c2ccc7"}`,
                      background: dragOver ? "#eef7f5" : "#fafcfb",
                      borderRadius: 8, padding: 20, textAlign: "center", fontSize: 12, color: "var(--muted)",
                      cursor: "pointer", outline: "none",
                    }}
                  >
                    <Upload size={22} style={{ color: "#07535a", marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
                    Drag & drop files here, or <span style={{ color: "#07535a", fontWeight: 700 }}>click to browse files</span>
                    <div style={{ fontSize: 10, marginTop: 4 }}>Photos / evidence · max 10 files</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={(e) => { onFilesChosen(e.target.files); e.target.value = ""; }}
                    />
                  </div>

                  {reportFiles.length > 0 && (
                    <div style={{ display: "grid", gap: 6 }}>
                      {reportFiles.map((file) => (
                        <div key={file.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--soft)", borderRadius: 6, padding: "7px 10px", fontSize: 11 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <Upload size={13} style={{ color: "#07535a", flex: "none" }} />
                            <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</b>
                            <small style={{ color: "var(--muted)" }}>({(file.size / 1024).toFixed(0)} KB)</small>
                          </span>
                          <button type="button" onClick={() => removeFile(file.name)} style={{ border: "none", background: "none", color: "#b42318", fontWeight: 800, cursor: "pointer", fontSize: 13 }} aria-label={`Remove ${file.name}`}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Notes</span>
                    <textarea rows={3} value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} placeholder="Add observations from the visit..." style={{ width: "100%", marginTop: 6, border: "1px solid #dfe4e2", borderRadius: 6, padding: 10, fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
                  </div>
                  <div>
                    <button type="button" onClick={handleUpload} style={{ background: "#07535a", color: "#fff", border: "none", borderRadius: 6, padding: "11px 16px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      <Upload size={14} style={{ verticalAlign: "middle", marginRight: 6 }} /> Submit visit report
                    </button>
                  </div>
                </div>
              </section>

              {submittedReports.length > 0 && (
                <section className="admin-panel">
                  <header><div><h2>Submitted reports</h2><p>Visit reports uploaded in this session</p></div><ClipboardCheck size={16} /></header>
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Report</th><th>Team member</th><th>Type</th><th>Date</th><th>Files</th></tr></thead>
                      <tbody>
                        {submittedReports.map((report) => (
                          <tr key={report.id}>
                            <td data-label="Report"><b>{report.id}</b></td>
                            <td data-label="Team member">{report.member}</td>
                            <td data-label="Type">{report.type}</td>
                            <td data-label="Date">{report.date}</td>
                            <td data-label="Files">{report.files}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              <section className="admin-panel">
                <header><div><h2>Recent field activity</h2><p>Evidence uploads and store visits from your team</p></div><ClipboardCheck size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Staff</th><th>Type</th><th>Store</th><th>Date</th><th>Completion</th></tr></thead>
                    <tbody>
                      {myActivities.slice(0, 10).map((act) => (
                        <tr key={act.id}>
                          <td data-label="Staff"><b>{act.staffName}</b></td>
                          <td data-label="Type">{act.type}</td>
                          <td data-label="Store">{act.storeName || "\u2014"}</td>
                          <td data-label="Date">{act.date} {act.time}</td>
                          <td data-label="Completion"><span className={`status ${act.completion >= 90 ? "active" : act.completion >= 70 ? "on-route" : "needs-review"}`}><i />{act.completion}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "onboarding" && (
            <>
              <section className="reference-kpis">
                <article><span>Pending approvals <MoreHorizontal size={14} /></span><b>{pendingCount}</b><small>new outlets</small></article>
                <article><span>Approved <MoreHorizontal size={14} /></span><b>{pendingOutlets.filter((o) => o.status === "Active").length}</b><small>activated</small></article>
                <article><span>Rejected <MoreHorizontal size={14} /></span><b>{pendingOutlets.length - pendingCount}</b><small>declined</small></article>
                <article><span>Total queue <MoreHorizontal size={14} /></span><b>{pendingOutlets.length}</b><small>all new outlets</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Outlet onboarding queue</h2><p>New outlets created by your team. Approve to activate, or reject to decline.</p></div><Store size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Outlet</th><th>Territory</th><th>Type</th><th>Requested by</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {pendingOutlets.map((outlet) => (
                        <tr key={outlet.id}>
                          <td data-label="Outlet"><b>{outlet.name}</b><br /><small>{outlet.id}</small></td>
                          <td data-label="Territory">{outlet.territory}, {outlet.region}</td>
                          <td data-label="Type">{outlet.type}</td>
                          <td data-label="Requested by">{outlet.merchandiser}</td>
                          <td data-label="Status"><span className={`status ${outlet.status === "Active" ? "active" : "on-route"}`}><i />{outlet.status}</span></td>
                          <td data-label="">
                            {outlet.status === "Pending" && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button type="button" className="mark-paid" onClick={() => approveOutlet(outlet.id)}><CheckCircle2 size={12} /> Approve</button>
                                <button type="button" onClick={() => rejectOutlet(outlet.id)} style={{ border: "1px solid #fecaca", color: "#b42318", background: "#fff", borderRadius: 5, padding: "6px 12px", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {pendingOutlets.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No outlets awaiting approval.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "route-coverage" && (
            <>
              <section className="reference-kpis">
                <article><span>Stores covered <MoreHorizontal size={14} /></span><b>{myStores.length}</b><small>in territory</small></article>
                <article><span>Healthy <MoreHorizontal size={14} /></span><b>{healthyStores}</b><small>execution health</small></article>
                <article><span>Needs review <MoreHorizontal size={14} /></span><b>{myStores.length - healthyStores}</b><small>attention</small></article>
                <article><span>VSR routes <MoreHorizontal size={14} /></span><b>{myVSRs.length}</b><small>active routes</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Store coverage by territory</h2><p>Stores assigned across your supervised territories</p></div><MapPin size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Store</th><th>Address</th><th>Territory</th><th>LGA</th><th>Status</th></tr></thead>
                    <tbody>
                      {myStores.map((store) => (
                        <tr key={store.id}>
                          <td data-label="Store"><b>{store.name}</b></td>
                          <td data-label="Address">{store.address}</td>
                          <td data-label="Territory">{store.territory}</td>
                          <td data-label="LGA">{store.lga}</td>
                          <td data-label="Status"><span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}><i />{store.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>VSR route details</h2><p>Route waypoints and coverage area per VSR</p></div><ClipboardCheck size={16} /></header>
                <div className="vsr-target-list">
                  {myVSRs.map((vsr) => {
                    const route = getVSRRoute(vsr.id);
                    const waypoints = route?.coordinates.length ?? 0;
                    const routeStores = route?.stores.length ?? 0;
                    return (
                      <div key={vsr.id} className="vsr-target-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <b style={{ fontSize: 12 }}>{vsr.name}</b>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{vsr.route}</span>
                          </div>
                          <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                            <span>{waypoints} waypoints</span>
                            <span>{routeStores} stores on route</span>
                            <span>{vsr.completion}% completion</span>
                          </div>
                        </div>
                        <span className={`status ${vsr.status.toLowerCase().replace(" ", "-")}`}><i />{vsr.status}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activePage === "data-quality" && (
            <>
              <section className="reference-kpis">
                <article><span>Quality score <MoreHorizontal size={14} /></span><b>{dataQualityScore}%</b><small>overall health</small></article>
                <article><span>GPS coverage <MoreHorizontal size={14} /></span><b>{myTeam.length ? Math.round((myTeam.filter((m) => m.lat && m.lng).length / myTeam.length) * 100) : 0}%</b><small>staff with coordinates</small></article>
                <article><span>Active records <MoreHorizontal size={14} /></span><b>{myTeam.filter((m) => m.status !== "Inactive").length}</b><small>of {myTeam.length}</small></article>
                <article><span>Photo evidence <MoreHorizontal size={14} /></span><b>{myTeam.filter((m) => m.photos && m.photos.length > 0).length}</b><small>staff with photos</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Data quality audit</h2><p>Validate staff records, GPS coordinates and activity logs</p></div><ShieldCheck size={16} /></header>
                <div style={{ padding: 16 }}>
                  {[
                    { id: "gps", label: "GPS coordinates validated", ok: myTeam.every((m) => m.lat && m.lng) },
                    { id: "active", label: "All team members have active status", ok: myTeam.every((m) => m.status !== "Inactive") },
                    { id: "hierarchy", label: "Hierarchy links verified", ok: myTeam.every((m) => m.parentId) },
                    { id: "completion", label: "Completion rates within bounds", ok: myTeam.every((m) => m.completion >= 0 && m.completion <= 100) },
                    { id: "visits", label: "Visit counts are non-negative", ok: myTeam.every((m) => m.visits >= 0) },
                    { id: "photos", label: "Photo evidence uploaded", ok: myTeam.filter((m) => m.photos && m.photos.length > 0).length > 0 },
                  ].map((check) => (
                    <div key={check.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {check.ok ? <CheckCircle2 size={16} style={{ color: "#16a34a" }} /> : <AlertTriangle size={16} style={{ color: "#f59e0b" }} />}
                        <span style={{ fontSize: 12 }}>{check.label}</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: check.ok ? "#0c9b6b" : "#d8900b" }}>{check.ok ? "Passed" : "Review needed"}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>Staff record health</h2><p>Per-member data completeness</p></div><Users size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Staff</th><th>Role</th><th>GPS</th><th>Status</th><th>Photos</th><th>Hierarchy</th></tr></thead>
                    <tbody>
                      {myTeam.map((member) => (
                        <tr key={member.id}>
                          <td data-label="Staff"><b>{member.name}</b><br /><small>{member.id}</small></td>
                          <td data-label="Role"><span className={`role-badge ${member.role.toLowerCase()}`}>{member.role}</span></td>
                          <td data-label="GPS">{member.lat && member.lng ? <span style={{ color: "#16a34a", fontWeight: 700 }}>Valid</span> : <span style={{ color: "#d8900b", fontWeight: 700 }}>Missing</span>}</td>
                          <td data-label="Status"><span className={`status ${member.status.toLowerCase().replace(" ", "-")}`}><i />{member.status}</span></td>
                          <td data-label="Photos">{member.photos && member.photos.length > 0 ? <span style={{ color: "#16a34a", fontWeight: 700 }}>{member.photos.length}</span> : <span style={{ color: "#d8900b" }}>None</span>}</td>
                          <td data-label="Hierarchy">{member.parentId ? <span style={{ color: "#16a34a", fontWeight: 700 }}>Linked</span> : <span style={{ color: "#d8900b" }}>Unlinked</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "settings" && (
            <>
              <section className="admin-panel">
                <header><div><h2>Profile</h2><p>Your account details</p></div><Users size={16} /></header>
                <div style={{ padding: 16 }}>
                  <ProfileImageUpload name={supervisor.name} role={`Supervisor · ${supervisor.territory}, ${supervisor.region}`} />
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>Preferences</h2><p>Theme and notifications</p></div></header>
                <div className="vsr-settings-list">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{dark ? <Moon size={15} /> : <Sun size={15} />} Dark mode</span>
                    <button type="button" className={dark ? "vsr-toggle on" : "vsr-toggle"} onClick={() => setDark(!dark)} aria-label="Toggle dark mode"><i /></button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><Bell size={15} /> Daily team reminders</span>
                    <button type="button" className={notifications.daily ? "vsr-toggle on" : "vsr-toggle"} onClick={() => setNotifications((n) => ({ ...n, daily: !n.daily }))} aria-label="Toggle daily reminders"><i /></button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><AlertTriangle size={15} /> Performance alerts</span>
                    <button type="button" className={notifications.alerts ? "vsr-toggle on" : "vsr-toggle"} onClick={() => setNotifications((n) => ({ ...n, alerts: !n.alerts }))} aria-label="Toggle alerts"><i /></button>
                  </div>
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>Security</h2><p>Session and account access</p></div></header>
                <div style={{ padding: 14 }}>
                  <button type="button" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#b42318", color: "#fff", border: "none", borderRadius: 6, padding: "11px 16px", fontWeight: 700, fontSize: 11, cursor: "pointer" }} onClick={signOut}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SupervisorSelect({ value, options, onChange }: { value: string; options: { id: string; name: string }[]; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <label className="admin-select" style={{ width: "100%" }} htmlFor={id}>
      <span>SUPERVISOR</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
      <ChevronDown size={13} />
    </label>
  );
}

function ProfileImageUpload({ name, role }: { name: string; role: string }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <button type="button" onClick={() => inputRef.current?.click()} aria-label="Change profile picture"
        style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2px solid #07535a", background: "#07535a", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, padding: 0 }}>
        {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
      </button>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
      <div>
        <b style={{ fontSize: 14 }}>{name}</b>
        <br />
        <small style={{ color: "var(--muted)" }}>{role}</small>
        <div>
          <button type="button" onClick={() => inputRef.current?.click()} style={{ marginTop: 6, border: "1px solid #c2ccc7", background: "#fff", borderRadius: 5, padding: "5px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Change photo</button>
        </div>
      </div>
    </div>
  );
}
