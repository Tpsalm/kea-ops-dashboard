"use client";

export const dynamic = "force-dynamic";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Bell, ClipboardList, CreditCard, Home, LogOut, MapPin, Menu, Moon,
  MoreHorizontal, Phone, Route, Search, Settings, Sun, Target,
  TrendingDown, TrendingUp, Users, Wallet, X, Building2, CheckCircle2,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dailySales, dailyTarget, staff } from "../data";
import { vsrRoutes } from "../hierarchy-data";
import { FadeIn, KpiGrid, SelectBox } from "../shared";
import { FieldHero } from "../../components/field-hero";
import { ScrollProgress } from "../../components/motion-primitives/scroll-progress";
import { AnimatedNumber } from "../../components/motion-primitives/animated-number";
import { Badge } from "../../components/ui/badge";

type PageKey = "home" | "routes" | "sales" | "performance" | "settings";

const navItems: { key: PageKey; label: string; icon: typeof Route }[] = [
  { key: "home", label: "Dashboard", icon: Home },
  { key: "routes", label: "My Routes", icon: Route },
  { key: "sales", label: "Daily Sales Log", icon: ClipboardList },
  { key: "performance", label: "Performance (My Target)", icon: Target },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "DASHBOARD", subtitle: "Your daily field snapshot, targets and alerts." },
  routes: { title: "MY ROUTES", subtitle: "Assigned territories, route coverage and field completion." },
  sales: { title: "DAILY SALES LOG", subtitle: "Record paid and credit sales against your daily target." },
  performance: { title: "PERFORMANCE (MY TARGET)", subtitle: "Your visit and completion progress against targets." },
  settings: { title: "SETTINGS", subtitle: "Profile, preferences, theme and security for your workspace." },
};

export default function VsrOperationsPage() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);
  const [notifications, setNotifications] = useState({ daily: true, alerts: true });
  const [search, setSearch] = useState("");
  const [salesLog, setSalesLog] = useState(dailySales);
  const [period, setPeriod] = useState("Today");

  const salesTrend = [
    { label: "Mon", value: 1.2 }, { label: "Tue", value: 1.6 }, { label: "Wed", value: 1.4 },
    { label: "Thu", value: 1.9 }, { label: "Fri", value: 2.1 }, { label: "Sat", value: 1.7 }, { label: "Sun", value: 1.5 },
  ];

  const vsrStaff = useMemo(() => staff.filter((person) => person.role === "VSR"), []);
  const routeStops = (vsrId: string) => vsrRoutes.find((route) => route.vsrId === vsrId)?.coordinates.length ?? 0;

  const activeRoutes = vsrStaff.filter((person) => person.status === "Active" || person.status === "On route").length;
  const completedVisits = vsrStaff.reduce((sum, person) => sum + person.visits, 0);
  const avgCompletion = vsrStaff.length ? Math.round(vsrStaff.reduce((sum, person) => sum + person.completion, 0) / vsrStaff.length) : 0;

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
  }

  function signOut() {
    try {
      localStorage.removeItem("kea_user");
    } catch {
      // storage unavailable
    }
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

  return (
    <div className={dark ? "vsr-reference dark" : "vsr-reference"}>
      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>VSR Operations Console</small>
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
            <span>VS</span>
          </div>
        </header>

        <div className="reference-content">
          <ScrollProgress className="fixed top-0 left-0 right-0 z-[60]" />

          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Aug 31, 2026</span>
          </div>

          {activePage === "home" && (
            <>
              <div className="page-admin page-vsr" style={{ padding: "28px 30px", display: "grid", gap: 22 }}>
                <FieldHero
                  eyebrow="FIELD SNAPSHOT"
                  title="Good morning, Shittu Akinsanya"
                  subtitle="VSR · Lagos Central · Ikeja North — here is today&apos;s snapshot."
                  badge="Live"
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
                    </div>
                  }
                />

                <div className="filters" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <SelectBox label="Period" value={period} onChange={setPeriod} options={["Today", "This week", "This month"]} />
                </div>

                <KpiGrid items={[
                  { label: "Today's sales", value: `₦${(totalValue / 1000000).toFixed(1)}M`, trend: `${targetPct}%`, up: targetPct >= 100, sub: `of ₦${dailyTarget / 1000000}M target`, icon: Wallet, tone: "teal" },
                  { label: "Collected (paid)", value: `₦${(paidValue / 1000000).toFixed(1)}M`, trend: "cash & transfer", up: true, sub: "this window", icon: CreditCard, tone: "blue" },
                  { label: "Pending credit", value: `₦${(creditValue / 1000000).toFixed(1)}M`, trend: `${salesLog.filter((s) => s.mode === "Credit").length} invoices`, up: false, sub: "to collect", icon: Building2, tone: "amber" },
                  { label: "Visits completed", value: String(completedVisits), trend: "this window", up: true, sub: "store visits", icon: CheckCircle2, tone: "violet" },
                  { label: "Active runs", value: String(activeRoutes), trend: "on the road", up: true, sub: "routes", icon: Route, tone: "teal" },
                  { label: "Target progress", value: `${targetPct}%`, trend: "collected", up: targetPct >= 100, sub: "vs daily target", icon: Target, tone: "amber" },
                ]} />

                <FadeIn delay={0.05} className="charts-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                  <div className="card">
                    <div className="card-head"><div><h3>Sales this week</h3><p>Daily collected value in ₦ millions</p></div></div>
                    <div style={{ height: 240, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesTrend}>
                          <defs>
                            <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} width={32} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                          <Area type="monotone" dataKey="value" name="₦M" stroke="#0d9488" strokeWidth={2.5} fill="url(#gSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><h3>Payment mix</h3><p>Paid vs credit this window</p></div></div>
                    <div style={{ height: 240, marginTop: 8, position: "relative" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[
                            { name: "Paid", value: paidValue, color: "#16a34a" },
                            { name: "Credit", value: creditValue, color: "#f59e0b" },
                          ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                            {[{ name: "Paid", value: paidValue, color: "#16a34a" }, { name: "Credit", value: creditValue, color: "#f59e0b" }].map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <b style={{ fontSize: 26 }}>₦{(totalValue / 1000000).toFixed(1)}M</b><span style={{ fontSize: 11, color: "var(--muted)" }}>total sales</span>
                      </div>
                    </div>
                    <div className="legend" style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 11 }}>
                      <span><i style={{ width: 9, height: 9, borderRadius: 3, background: "#16a34a", display: "inline-block" }} />Paid · ₦{(paidValue / 1000000).toFixed(1)}M</span>
                      <span><i style={{ width: 9, height: 9, borderRadius: 3, background: "#f59e0b", display: "inline-block" }} />Credit · ₦{(creditValue / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1} className="charts-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div className="card">
                    <div className="card-head"><div><h3>Completion by route</h3><p>Field completion across your routes</p></div></div>
                    <div style={{ height: 220, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vsrStaff.map((p) => ({ name: p.route.split(" ")[0], completion: p.completion }))}>
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
                    <div className="card-head"><div><h3>Visits by route</h3><p>Store visits completed this window</p></div></div>
                    <div style={{ height: 220, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vsrStaff.map((p) => ({ name: p.route.split(" ")[0], visits: p.visits }))}>
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
                  <div className="card-head"><div><h3>Target progress</h3><p>Collected value against today&apos;s target of ₦{(dailyTarget / 1000000).toFixed(0)}M</p></div><Target size={16} /></div>
                  <div style={{ padding: 16 }}>
                    <div style={{ height: 12, background: "#eef1ef", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, targetPct)}%`, background: targetPct >= 100 ? "#12a472" : targetPct >= 70 ? "#f59e0b" : "#2563eb", borderRadius: 6 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
                      <span>₦{(collectedValue / 1000000).toFixed(1)}M collected</span>
                      <span>{targetPct >= 100 ? "Target met" : targetPct >= 70 ? "Almost there" : "Keep going"}</span>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </>
          )}

          {activePage === "routes" && (
            <>
              <div className="reference-search" style={{ marginBottom: 10 }}>
                <Search size={13} /><input placeholder="Search routes, territories..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <section className="reference-kpis">
                <article><span>Active routes <MoreHorizontal size={14} /></span><b>{activeRoutes}</b><small>{vsrStaff.length} total assigned</small></article>
                <article><span>Visits completed <MoreHorizontal size={14} /></span><b>{completedVisits}</b><small>across all routes</small></article>
                <article><span>Avg completion <MoreHorizontal size={14} /></span><b>{avgCompletion}%</b><small>field performance</small></article>
                <article><span>Route stops <MoreHorizontal size={14} /></span><b>{vsrRoutes.reduce((sum, route) => sum + route.coordinates.length, 0)}</b><small>coverage points</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Route board</h2><p>Your assigned territories and field coverage</p></div><MapPin size={16} /></header>
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
                          <td data-label="Stops">{routeStops(person.id) || "—"}</td>
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
            </>
          )}

          {activePage === "sales" && (
            <>
              <div className="reference-search" style={{ marginBottom: 10 }}>
                <Search size={13} /><input placeholder="Search outlets, products, mode..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <section className="reference-kpis">
                <article><span>Today&apos;s sales <MoreHorizontal size={14} /></span><b>₦{(totalValue / 1000000).toFixed(1)}M</b><small>paid + credit</small></article>
                <article><span>Paid / collected <MoreHorizontal size={14} /></span><b>₦{(paidValue / 1000000).toFixed(1)}M</b><small>cash & transfer</small></article>
                <article><span>On credit <MoreHorizontal size={14} /></span><b>₦{(creditValue / 1000000).toFixed(1)}M</b><small>{salesLog.filter((s) => s.mode === "Credit").length} invoices</small></article>
                <article><span>Vs target <MoreHorizontal size={14} /></span><b>{targetPct}%</b><small>of ₦{(dailyTarget / 1000000).toFixed(0)}M</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Daily sales log</h2><p>Record and track paid and credit sales against your target. Phone number is required for credit.</p></div><ClipboardList size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Outlet</th><th>Product line</th><th>Qty</th><th>Value</th><th>Mode</th><th>Phone (credit)</th><th>Collected</th><th></th></tr></thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id}>
                          <td data-label="Outlet"><b>{sale.outlet}</b></td>
                          <td data-label="Product line">{sale.productLine}</td>
                          <td data-label="Qty">{sale.quantity}</td>
                          <td data-label="Value">₦{(sale.value / 1000000).toFixed(2)}M</td>
                          <td data-label="Mode">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 5, padding: "3px 9px", fontWeight: 700, fontSize: 10, color: sale.mode === "Paid" ? "#0b3b2c" : "#7a4a00", background: sale.mode === "Paid" ? "#c8f3d1" : "#f6d7a5" }}>
                              {sale.mode === "Paid" ? <Wallet size={12} /> : <CreditCard size={12} />}
                              {sale.mode}
                            </span>
                          </td>
                          <td data-label="Phone">{sale.mode === "Credit" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Phone size={12} />{sale.phone ?? "—"}</span> : "—"}</td>
                          <td data-label="Collected">{sale.collected > 0 ? <b>₦{(sale.collected / 1000000).toFixed(2)}M</b> : "—"}</td>
                          <td data-label="">
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
              {creditValue > 0 && (
                <section className="admin-panel">
                  <header><div><h2>Credit collection</h2><p>Outstanding credit invoices to be collected and reflected in your target.</p></div><CreditCard size={16} /></header>
                  <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, background: "#fff8e6", borderRadius: 8 }}>
                    <span style={{ fontSize: 12 }}>
                      You have <b>₦{(creditValue / 1000000).toFixed(1)}M</b> outstanding credit. Use <b>Mark paid</b> above when a customer settles; collected value feeds your daily target automatically.
                    </span>
                  </div>
                </section>
              )}
            </>
          )}

          {activePage === "performance" && (
            <>
              <section className="reference-kpis">
                <article><span>Visit target <MoreHorizontal size={14} /></span><b>{visitTarget}</b><small>per month</small></article>
                <article><span>Completion target <MoreHorizontal size={14} /></span><b>{completionTarget}%</b><small>minimum</small></article>
                <article><span>Visits completed <MoreHorizontal size={14} /></span><b>{completedVisits}</b><small>this window</small></article>
                <article><span>Avg completion <MoreHorizontal size={14} /></span><b>{avgCompletion}%</b><small>all routes</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>My target progress</h2><p>Individual route performance against targets</p></div><Target size={16} /></header>
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
                          <div style={{ height: 9, background: "#eef1ef", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                            <div style={{ height: "100%", width: `${visitPct}%`, background: completionOk ? "#12a472" : "#f59e0b", borderRadius: 5 }} />
                          </div>
                        </div>
                        <span className="status" style={{ color: completionOk ? "#0c9b6b" : "#d8900b", fontSize: 11, fontWeight: 700 }}>
                          {completionOk ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {completionOk ? "On track" : "Below target"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activePage === "settings" && (
            <>
              <section className="admin-panel">
                <header><div><h2>Profile</h2><p>Your account details</p></div><Users size={16} /></header>
                <div style={{ padding: 16 }}>
                  <ProfileImageUploadVsr />
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
                    <span><Bell size={15} /> Daily route reminders</span>
                    <button type="button" className={notifications.daily ? "vsr-toggle on" : "vsr-toggle"} onClick={() => setNotifications((n) => ({ ...n, daily: !n.daily }))} aria-label="Toggle daily reminders"><i /></button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><AlertTriangle size={15} /> Risk & compliance alerts</span>
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

function ProfileImageUploadVsr() {
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
        {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "SA"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
      <div>
        <b style={{ fontSize: 14 }}>Shittu Akinsanya</b>
        <br />
        <small style={{ color: "var(--muted)" }}>VSR · Lagos Central · Ikeja North</small>
        <div>
          <button type="button" onClick={() => inputRef.current?.click()} style={{ marginTop: 6, border: "1px solid #c2ccc7", background: "#fff", borderRadius: 5, padding: "5px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Change photo</button>
        </div>
      </div>
    </div>
  );
}
