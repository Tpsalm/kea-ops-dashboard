"use client";

export const dynamic = "force-dynamic";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Bell, Camera, CheckCircle2, ChevronDown, Home, Layers, LogOut, Menu,
  Moon, MoreHorizontal, PackageCheck, Presentation, Search, Settings, Store, Sun,
  Target, TrendingDown, TrendingUp, Users, X, Building2, Calendar, Send, Plus, Check
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { staff } from "../data";
import { activities, getProductsByMerchandiser, getStoresByMerchandiser, products } from "../hierarchy-data";
import { FadeIn, SelectBox } from "../shared";
import { FieldHero } from "../../components/field-hero";
import { ScrollProgress } from "../../components/motion-primitives/scroll-progress";
import { AnimatedNumber } from "../../components/motion-primitives/animated-number";
import { Badge } from "../../components/ui/badge";
import { useTheme } from "../../lib/theme-provider";

type PageKey = "home" | "stores" | "leave" | "shelf" | "posm" | "photos" | "settings";

const navItems: { key: PageKey; label: string; icon: typeof Store }[] = [
  { key: "home", label: "Overview", icon: Home },
  { key: "stores", label: "Assigned Stores", icon: Store },
  { key: "leave", label: "Leave Requests", icon: Calendar },
  { key: "shelf", label: "Share of Shelf", icon: Layers },
  { key: "posm", label: "POSM Deployment", icon: Presentation },
  { key: "photos", label: "Activity Photos", icon: Camera },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "MERCHANDISER DASHBOARD", subtitle: "Your stores, share of shelf, stock health, and target progress at a glance." },
  stores: { title: "ASSIGNED STORES & EXECUTION", subtitle: "Retail outlet inventory, stock checks, and instant stockout escalation to Supervisor." },
  leave: { title: "LEAVE APPLICATION & SCHEDULE", subtitle: "Submit scheduled leave requests with relief coverage directly to your Supervisor." },
  shelf: { title: "SHARE OF SHELF LOG", subtitle: "Shelf visibility and product availability share per assigned store." },
  posm: { title: "POSM DEPLOYMENT", subtitle: "Point-of-sale marketing placement and merchandising execution tracking." },
  photos: { title: "ACTIVITY PHOTOS & EVIDENCE", subtitle: "Field evidence captured during retail store audits and visits." },
  settings: { title: "SETTINGS & PREFERENCES", subtitle: "Display lighting mode, profile information, and account settings." },
};

const posmItems = ["Shelf talkers", "Brand posters", "Wobblers", "Standees", "Price cards", "Gondola branding"];

export default function MerchandiserDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [merchandiserId, setMerchandiserId] = useState("KEA-MER-001");
  const [mobileNav, setMobileNav] = useState(false);
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [posm, setPosm] = useState<Record<string, boolean>>({
    "Shelf talkers": true,
    "Brand posters": true,
    "Price cards": true,
  });
  const [notice, setNotice] = useState("");

  // Leave application state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("Annual Scheduled Rest & Recovery");
  const [reliefStaff, setReliefStaff] = useState("Maria Uchechukwu");
  const [myLeaves, setMyLeaves] = useState<Array<{
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    reliefStaff: string;
    status: string;
  }>>([
    {
      id: "LV-2041",
      startDate: "2026-09-20",
      endDate: "2026-09-27",
      reason: "Annual field rotation leave",
      reliefStaff: "Arorundade Adewale",
      status: "Approved by Supervisor",
    },
  ]);

  // Stockout escalation state
  const [showStockoutModal, setShowStockoutModal] = useState(false);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [stockoutSku, setStockoutSku] = useState("");

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  const shelfTrend = [
    { label: "Wk 24", share: 78 }, { label: "Wk 25", share: 82 },
    { label: "Wk 26", share: 80 }, { label: "Wk 27", share: 86 },
    { label: "Wk 28", share: 85 }, { label: "Wk 29", share: 90 },
  ];

  const myStores = useMemo(() => getStoresByMerchandiser(merchandiserId), [merchandiserId]);
  const myProducts = useMemo(() => getProductsByMerchandiser(merchandiserId), [merchandiserId]);
  const myActivities = useMemo(() => activities.filter((activity) => activity.staffId === merchandiserId), [merchandiserId]);

  const healthyStores = myStores.filter((store) => store.status === "Healthy").length;
  const photosCount = myActivities.reduce((sum, activity) => sum + (activity.photos?.length ?? 0), 0);
  const posmDone = Object.values(posm).filter(Boolean).length;
  const posmPct = Math.round((posmDone / posmItems.length) * 100);

  function togglePosm(id: string) {
    setPosm((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      flash("Please select both start and end dates!");
      return;
    }
    const newLeave = {
      id: `LV-${Math.floor(1000 + Math.random() * 9000)}`,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      reliefStaff,
      status: "Pending Supervisor Review",
    };
    setMyLeaves([newLeave, ...myLeaves]);
    setShowLeaveModal(false);
    flash(`Leave request submitted for ${leaveStartDate} to ${leaveEndDate}! Sent to Supervisor.`);
  }

  function handleStockoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowStockoutModal(false);
    flash(`Urgent stockout escalation for ${stockoutSku || "product SKU"} at ${selectedStoreName} sent to Supervisor!`);
  }

  function signOut() {
    try {
      localStorage.removeItem("kea_user");
    } catch {}
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  return (
    <div className={isDark ? "merch-reference dark" : "merch-reference"}>
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}

      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>Merchandiser Console</small>
          <button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              className={activePage === key ? "active" : ""}
              onClick={() => { setActivePage(key); setMobileNav(false); setSearch(""); }}
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
            <button type="button" aria-label="Notifications" onClick={() => setActivePage("leave")}><Bell size={15} /></button>
            <span style={{ cursor: "pointer" }} onClick={() => setActivePage("settings")} title="Open settings">
              MD
            </span>
          </div>
        </header>

        <div className="reference-content">
          <ScrollProgress className="fixed top-0 left-0 right-0 z-[60]" />

          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Sep 10, 2026 · Retail Merchandising Execution</span>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "home" && (
            <div className="page-admin page-merchandiser" style={{ padding: "0 0 30px", display: "grid", gap: 20 }}>
              <FieldHero
                eyebrow="MERCHANDISER SNAPSHOT"
                title="Hello, Maria Uchechukwu"
                subtitle="Retail Merchandiser · Lagos Island · VI Retail Axis — 12 assigned stores."
                badge="Route Active"
                variant="waves"
                colors={["#0d9488", "#07535a", "#14b8a6", "#134e4a"]}
                stat={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Badge variant="accent">
                      <Store size={12} /> 12 Assigned Stores
                    </Badge>
                    <Badge variant="success">
                      97% Execution Rate
                    </Badge>
                  </div>
                }
              />

              {/* QUICK ACTION BANNER */}
              <div style={{
                background: "linear-gradient(135deg, rgba(13, 148, 136, 0.09) 0%, rgba(37, 99, 235, 0.09) 100%)",
                border: "1px solid var(--line)", borderRadius: 14, padding: "14px 18px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={20} color="#0d9488" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                      Upcoming Scheduled Leave
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      Next leave: Sep 20 – Sep 27 · Relief Merchandiser: Arorundade Adewale
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(true)}
                    style={{
                      background: "#0d9488", color: "#fff", border: "none", padding: "8px 16px",
                      borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <Plus size={14} /> Request Leave
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStoreName("Ebeano Supermarket (VI)");
                      setShowStockoutModal(true);
                    }}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)",
                      padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <AlertTriangle size={14} /> Escalate Stockout
                  </button>
                </div>
              </div>

              {/* KPI CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-teal"><Store size={18} /></div>
                  <span className="kx-kpi-label">Assigned Stores</span>
                  <strong className="kx-kpi-value">{myStores.length}</strong>
                  <div className="kx-kpi-trend up"><b>{healthyStores} Healthy</b> <small>coverage</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-blue"><Layers size={18} /></div>
                  <span className="kx-kpi-label">Avg Share of Shelf</span>
                  <strong className="kx-kpi-value">88%</strong>
                  <div className="kx-kpi-trend up"><b>+4.2%</b> <small>vs last week</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-amber"><Presentation size={18} /></div>
                  <span className="kx-kpi-label">POSM Deployed</span>
                  <strong className="kx-kpi-value">{posmPct}%</strong>
                  <div className="kx-kpi-trend up"><b>{posmDone}/{posmItems.length}</b> <small>materials active</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-violet"><Camera size={18} /></div>
                  <span className="kx-kpi-label">Audit Photos</span>
                  <strong className="kx-kpi-value">{photosCount || 18}</strong>
                  <div className="kx-kpi-trend up"><b>Geotagged</b> <small>store evidence</small></div>
                </div>
              </div>

              {/* CHARTS */}
              <FadeIn delay={0.05} className="charts-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                <div className="card">
                  <div className="card-head"><div><h3>Share of shelf trajectory</h3><p>Weekly average brand visibility across assigned outlets</p></div></div>
                  <div style={{ height: 220, marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={shelfTrend}>
                        <defs>
                          <linearGradient id="gShelf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", fontSize: 12 }} />
                        <Area type="monotone" dataKey="share" name="Share %" stroke="#0d9488" strokeWidth={2.5} fill="url(#gShelf)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head"><div><h3>POSM completion</h3><p>Marketing deployment status</p></div></div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#0d9488" }}>{posmPct}%</div>
                    <div style={{ height: 10, background: "var(--bar-muted)", borderRadius: 5, overflow: "hidden", margin: "10px 0" }}>
                      <div style={{ height: "100%", width: `${posmPct}%`, background: "#0d9488", borderRadius: 5 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {posmDone} of {posmItems.length} materials deployed in VI territory.
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: ASSIGNED STORES & OUTLETS
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "stores" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>My Assigned Stores ({myStores.length} Total)</h2>
                    <p>Audit store execution, product availability, or report critical stockouts to Supervisor</p>
                  </div>
                  <Store size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Store Name</th>
                        <th>Address / Area</th>
                        <th>Category</th>
                        <th>Shelf Share</th>
                        <th>Status</th>
                        <th>Stockout Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myStores.map((store, idx) => (
                        <tr key={store.id}>
                          <td data-label="Store"><b>{store.name}</b><br /><small>{store.id}</small></td>
                          <td data-label="Address">{store.address}</td>
                          <td data-label="Category">{store.territory || "Retail Store"}</td>
                          <td data-label="Share"><b>{78 + (idx * 4) % 15}%</b></td>
                          <td data-label="Status">
                            <span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}>
                              <i /> {store.status}
                            </span>
                          </td>
                          <td data-label="Alert">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStoreName(store.name);
                                setShowStockoutModal(true);
                              }}
                              style={{
                                background: "rgba(239, 68, 68, 0.1)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)",
                                padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              <AlertTriangle size={11} style={{ display: "inline", marginRight: 3 }} /> Escalate Stockout
                            </button>
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
              TAB 3: LEAVE APPLICATION & ROSTER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "leave" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)" }}>My Leave Requests & Calendar</h3>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>Requests are endorsed and scheduled by your Supervisor</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  style={{
                    background: "#0d9488", color: "#fff", border: "none", padding: "8px 16px",
                    borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                  }}
                >
                  <Plus size={14} /> Request New Leave
                </button>
              </div>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Scheduled Leave History</h2>
                    <p>Past and upcoming leave requests with relief merchandiser assignment</p>
                  </div>
                  <Calendar size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Leave ID</th>
                        <th>Leave Dates</th>
                        <th>Reason</th>
                        <th>Assigned Relief Staff</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.map((l) => (
                        <tr key={l.id}>
                          <td data-label="ID"><b>{l.id}</b></td>
                          <td data-label="Dates"><b>{l.startDate} to {l.endDate}</b></td>
                          <td data-label="Reason">{l.reason}</td>
                          <td data-label="Relief"><b>{l.reliefStaff}</b></td>
                          <td data-label="Status">
                            <span className={`status ${l.status.includes("Approved") ? "active" : "needs-review"}`}>
                              <i /> {l.status}
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
              TAB 4: SHARE OF SHELF
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "shelf" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <section className="admin-panel">
                <header><div><h2>Shelf share log per store</h2><p>Product visibility compared to competing brands</p></div><Layers size={16} color="#0d9488" /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Store</th><th>Category</th><th>SKUs in stock</th><th>Share of shelf</th><th>Health</th></tr></thead>
                    <tbody>
                      {myStores.map((store, idx) => (
                        <tr key={store.id}>
                          <td data-label="Store"><b>{store.name}</b></td>
                          <td data-label="Category">{store.territory || "Retail Store"}</td>
                          <td data-label="SKUs"><b>14 / 16 SKUs</b></td>
                          <td data-label="Share"><b>{78 + (idx * 4) % 15}%</b></td>
                          <td data-label="Health"><span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}><i />{store.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 5: POSM DEPLOYMENT
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "posm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <section className="admin-panel">
                <header><div><h2>Point of Sale Materials Checklist</h2><p>Toggle materials placed across your assigned VI stores</p></div><Presentation size={16} color="#0d9488" /></header>
                <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {posmItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => togglePosm(item)}
                      style={{
                        padding: 14, borderRadius: 10, border: `2px solid ${posm[item] ? "#0d9488" : "var(--line)"}`,
                        background: posm[item] ? "rgba(13, 148, 136, 0.08)" : "var(--card)",
                        color: "var(--text)", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between"
                      }}
                    >
                      <span>{item}</span>
                      {posm[item] ? <CheckCircle2 size={18} color="#0d9488" /> : <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--line)" }} />}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 6: PHOTOS
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "photos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <section className="admin-panel">
                <header><div><h2>Field Audit Photo Evidence</h2><p>Geotagged shelf and store pictures</p></div><Camera size={16} color="#0d9488" /></header>
                <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  {[
                    { label: "Ebeano Supermarket VI · Gondola End", date: "Sep 10, 2026", url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60" },
                    { label: "Grand Square Mall · Shelf Frontage", date: "Sep 09, 2026", url: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=500&auto=format&fit=crop&q=60" },
                    { label: "Hubmart Mega VI · POSM Standee", date: "Sep 08, 2026", url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&auto=format&fit=crop&q=60" },
                  ].map((p, idx) => (
                    <div key={idx} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
                      <img src={p.url} alt={p.label} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                      <div style={{ padding: 10 }}>
                        <b style={{ fontSize: 11, display: "block" }}>{p.label}</b>
                        <small style={{ color: "var(--muted)", fontSize: 9 }}>{p.date}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 7: SETTINGS
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="settings-section-card">
                <div className="settings-section-header">
                  <Sun size={15} />
                  <span>Display Lighting & Theme Mode</span>
                </div>
                <div className="theme-selector-grid">
                  <button
                    type="button"
                    className={`theme-card-btn ${theme === "light" ? "active" : ""}`}
                    onClick={() => { setTheme("light"); flash("Light theme applied"); }}
                  >
                    {theme === "light" && <div className="theme-card-check"><Check size={11} /></div>}
                    <div className="theme-card-icon"><Sun size={18} /></div>
                    <strong>Light Mode</strong>
                    <span>Crisp daylight contrast</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-card-btn ${theme === "dark" ? "active" : ""}`}
                    onClick={() => { setTheme("dark"); flash("Dark theme applied"); }}
                  >
                    {theme === "dark" && <div className="theme-card-check"><Check size={11} /></div>}
                    <div className="theme-card-icon"><Moon size={18} /></div>
                    <strong>Dark Mode</strong>
                    <span>Low-light night contrast</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-card-btn ${theme === "system" ? "active" : ""}`}
                    onClick={() => { setTheme("system"); flash("System theme synced"); }}
                  >
                    {theme === "system" && <div className="theme-card-check"><Check size={11} /></div>}
                    <div className="theme-card-icon"><Settings size={18} /></div>
                    <strong>Auto System</strong>
                    <span>Matches operating system</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: REQUEST LEAVE ─── */}
      {showLeaveModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLeaveModal(false); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Request leave">
            <div className="modal-head">
              <div>
                <small>FIELD ROTATION & LEAVE</small>
                <h2>Request Merchandiser Leave</h2>
              </div>
              <button type="button" onClick={() => setShowLeaveModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleLeaveSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    style={{ width: "100%", marginTop: 4, height: 36, padding: "0 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>End Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    style={{ width: "100%", marginTop: 4, height: 36, padding: "0 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Reason for Leave</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Annual Rest, Family Medical"
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Nominated Relief Merchandiser</label>
                <select
                  value={reliefStaff}
                  onChange={(e) => setReliefStaff(e.target.value)}
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                >
                  <option>Arorundade Adewale</option>
                  <option>Jonathan Okena</option>
                  <option>Abiola Felicia</option>
                  <option>Maria Uchechukwu</option>
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: 6 }}>
                <button type="button" className="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ background: "#0d9488", borderColor: "#0d9488" }}>
                  <Send size={14} /> Submit to Supervisor
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ─── MODAL: ESCALATE STOCKOUT TO SUPERVISOR ─── */}
      {showStockoutModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowStockoutModal(false); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Escalate stockout">
            <div className="modal-head">
              <div>
                <small>STOCKOUT ESCALATION ENGINE</small>
                <h2>Escalate Stockout to Supervisor</h2>
              </div>
              <button type="button" onClick={() => setShowStockoutModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleStockoutSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Store Location</label>
                <input
                  type="text"
                  value={selectedStoreName}
                  readOnly
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--soft)", color: "var(--text)", fontSize: 12, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Affected SKU / Brand</label>
                <input
                  type="text"
                  value={stockoutSku}
                  onChange={(e) => setStockoutSku(e.target.value)}
                  placeholder="e.g. Peak Milk 400g Refill (0 units remaining)"
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 6 }}>
                <button type="button" className="secondary" onClick={() => setShowStockoutModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ background: "#dc2626", borderColor: "#dc2626", color: "#fff" }}>
                  <AlertTriangle size={14} /> Dispatch Urgent Alert to Supervisor
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
