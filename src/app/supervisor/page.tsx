"use client";

export const dynamic = "force-dynamic";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, CheckCircle2, ChevronDown, ClipboardCheck,
  LogOut, MapPin, Menu, Moon, MoreHorizontal, Search, Settings,
  ShieldCheck, Sun, TrendingDown, TrendingUp, Users, X, Target,
  CalendarDays,
} from "lucide-react";
import { staff } from "../data";
import {
  supervisors, getChildren, getStoresBySupervisor,
  getActivitiesByStaff, getVSRRoute,
} from "../hierarchy-data";

type PageKey =
  | "team"
  | "merchandiser"
  | "vsr"
  | "coaching"
  | "route-coverage"
  | "data-quality"
  | "settings";

const navItems: { key: PageKey; label: string; icon: typeof Users }[] = [
  { key: "team", label: "Team Overview", icon: Users },
  { key: "merchandiser", label: "Merchandiser Performance", icon: Target },
  { key: "vsr", label: "VSR Performance", icon: MapPin },
  { key: "coaching", label: "Coaching Schedule", icon: CalendarDays },
  { key: "route-coverage", label: "Route Coverage Reports", icon: ClipboardCheck },
  { key: "data-quality", label: "Data Quality Audits", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  team: { title: "TEAM OVERVIEW", subtitle: "Your direct reports, completion rates and field status." },
  merchandiser: { title: "MERCHANDISER PERFORMANCE", subtitle: "Store execution, visits and completion per merchandiser." },
  vsr: { title: "VSR PERFORMANCE", subtitle: "Route coverage, visit count and field completion per VSR." },
  coaching: { title: "COACHING SCHEDULE", subtitle: "Planned coaching sessions, observations and follow-ups." },
  "route-coverage": { title: "ROUTE COVERAGE REPORTS", subtitle: "Territory coverage, store visits and route health." },
  "data-quality": { title: "DATA QUALITY AUDITS", subtitle: "Validate GPS data, staff records and activity logs." },
  settings: { title: "SETTINGS", subtitle: "Profile, preferences, theme and security." },
};

const coachingSessions = [
  { id: "CS-001", merchandiser: "Maria Uchechukwu", date: "2026-09-01", time: "10:00 AM", topic: "Shelf execution improvement", status: "Scheduled", notes: "Focus on VI Retail shelf share targets." },
  { id: "CS-002", merchandiser: "Jonathan Okena", date: "2026-09-02", time: "02:00 PM", topic: "Store visit efficiency", status: "Scheduled", notes: "Review route planning and time management." },
  { id: "CS-003", merchandiser: "Maria Uchechukwu", date: "2026-08-28", time: "11:00 AM", topic: "POSM deployment review", status: "Completed", notes: "Discussed brand visibility at key outlets." },
  { id: "CS-004", merchandiser: "Jonathan Okena", date: "2026-08-25", time: "09:30 AM", topic: "Weekly performance check-in", status: "Completed", notes: "Completion rate improved from 89% to 93%." },
  { id: "CS-005", merchandiser: "Arorundade Adewale", date: "2026-09-03", time: "03:00 PM", topic: "New store onboarding", status: "Scheduled", notes: "Walk through Dugbe Retail onboarding checklist." },
];

export default function SupervisorDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("team");
  const [supervisorId, setSupervisorId] = useState("KEA-SUP-001");
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState({ daily: true, alerts: true });

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
          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Sep 1, 2026</span>
          </div>

          <div style={{ marginBottom: 10, maxWidth: 280 }}>
            <SupervisorSelect value={supervisorId} options={supervisors} onChange={setSupervisorId} />
          </div>

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

          {activePage === "coaching" && (
            <>
              <section className="reference-kpis">
                <article><span>Total sessions <MoreHorizontal size={14} /></span><b>{coachingSessions.length}</b><small>all time</small></article>
                <article><span>Scheduled <MoreHorizontal size={14} /></span><b>{coachingSessions.filter((s) => s.status === "Scheduled").length}</b><small>upcoming</small></article>
                <article><span>Completed <MoreHorizontal size={14} /></span><b>{coachingSessions.filter((s) => s.status === "Completed").length}</b><small>done</small></article>
                <article><span>Coverage <MoreHorizontal size={14} /></span><b>{myMerchandisers.length > 0 ? Math.round((new Set(coachingSessions.map((s) => s.merchandiser)).size / myMerchandisers.length) * 100) : 0}%</b><small>team coached</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Coaching schedule</h2><p>Planned and completed coaching sessions</p></div><CalendarDays size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Merchandiser</th><th>Date</th><th>Time</th><th>Topic</th><th>Status</th><th>Notes</th></tr></thead>
                    <tbody>
                      {coachingSessions.map((session) => (
                        <tr key={session.id}>
                          <td data-label="Merchandiser"><b>{session.merchandiser}</b></td>
                          <td data-label="Date">{session.date}</td>
                          <td data-label="Time">{session.time}</td>
                          <td data-label="Topic">{session.topic}</td>
                          <td data-label="Status"><span className={`status ${session.status === "Completed" ? "active" : "on-route"}`}><i />{session.status}</span></td>
                          <td data-label="Notes"><small>{session.notes}</small></td>
                        </tr>
                      ))}
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
                <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>SV</div>
                  <div><b style={{ fontSize: 14 }}>{supervisor.name}</b><br /><small style={{ color: "var(--muted)" }}>Supervisor · {supervisor.territory}, {supervisor.region}</small></div>
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
