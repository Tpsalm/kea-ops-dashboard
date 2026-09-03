"use client";

export const dynamic = "force-dynamic";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, Building2, CheckCircle2, ChevronDown, Gauge, Home, Layers,
  LogOut, Map, MapPin, Menu, Moon, MoreHorizontal, Search, Settings,
  Store, Sun, TrendingDown, TrendingUp, Users, X,
} from "lucide-react";
import { outletData, staff, vsrTrackerRows } from "../data";
import { clients, getChildren, getStoresByTSR, tsrs } from "../hierarchy-data";
import { MapCard } from "../shared";

type PageKey = "home" | "territory" | "pipeline" | "accounts" | "outlets" | "map" | "supervisors" | "settings";

const navItems: { key: PageKey; label: string; icon: typeof Gauge }[] = [
  { key: "home", label: "Dashboard", icon: Home },
  { key: "territory", label: "Territory performance", icon: Gauge },
  { key: "pipeline", label: "Pipeline funnel", icon: Layers },
  { key: "accounts", label: "Key account growth", icon: Building2 },
  { key: "outlets", label: "New outlets acquired", icon: Store },
  { key: "map", label: "Territory map", icon: Map },
  { key: "supervisors", label: "Supervisor performance", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "DASHBOARD", subtitle: "Your territory, pipeline, outlet requests and targets at a glance." },
  territory: { title: "TERRITORY PERFORMANCE", subtitle: "Store coverage, execution health and field completion." },
  pipeline: { title: "PIPELINE FUNNEL", subtitle: "VSR onboarding and funding pipeline across your territory." },
  accounts: { title: "KEY ACCOUNT GROWTH", subtitle: "Client accounts, stores and completion trajectory." },
  outlets: { title: "NEW OUTLETS ACQUIRED", subtitle: "Retail outlets under your territory coverage." },
  map: { title: "TERRITORY MAP", subtitle: "Field staff and coverage across your assigned territory." },
  supervisors: { title: "SUPERVISOR PERFORMANCE", subtitle: "Your supervisors' field output against targets." },
  settings: { title: "SETTINGS", subtitle: "Profile, preferences, theme and security." },
};

export default function TsrDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [tsrId, setTsrId] = useState("KEA-TSR-001");
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState({ daily: true, alerts: true });
  const [requests, setRequests] = useState(outletData.filter((o) => o.status === "Pending"));
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Convenience");
  const [newTerritory, setNewTerritory] = useState("Lagos Central");

  const tsr = useMemo(() => tsrs.find((item) => item.id === tsrId) ?? tsrs[0], [tsrId]);
  const myStores = useMemo(() => getStoresByTSR(tsrId), [tsrId]);
  const myChildren = useMemo(() => getChildren(tsrId), [tsrId]);
  const supervisors = useMemo(() => myChildren.filter((person) => person.role === "Supervisor"), [myChildren]);
  const vsrs = useMemo(() => myChildren.filter((person) => person.role === "VSR"), [myChildren]);
  const territoryStaff = useMemo(() => staff.filter((person) => person.region === tsr?.region), [tsr]);

  const healthyStores = myStores.filter((store) => store.status === "Healthy").length;
  const completionTarget = 90;

  const pipeline = useMemo(() => [
    { name: "Lead", value: vsrTrackerRows.length },
    { name: "Funded", value: vsrTrackerRows.filter((row) => row.status === "Funded").length },
    { name: "Deployed", value: staff.filter((person) => person.role === "VSR" && person.status !== "Inactive").length },
  ], []);

  const filteredStores = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return myStores;
    return myStores.filter((store) => `${store.name} ${store.address} ${store.region} ${store.territory}`.toLowerCase().includes(query));
  }, [myStores, search]);

  function signOut() {
    try {
      localStorage.removeItem("kea_user");
    } catch {
      // storage unavailable
    }
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  function requestOutlet() {
    if (!newName.trim()) {
      alert("Enter an outlet name.");
      return;
    }
    const req = {
      id: `OL-${4030 + requests.length}`,
      name: newName.trim(),
      region: tsr?.region ?? "Lagos",
      territory: newTerritory,
      chain: "Indie",
      type: newType as "Convenience" | "Supermarket" | "Wholesale" | "Kiosk",
      status: "Pending" as const,
      weeklyVisits: 0,
      lastVisit: "—",
      merchandiser: tsr?.name ?? "Unassigned",
      tier: "C" as const,
    };
    setRequests((prev) => [...prev, req]);
    setNewName("");
    alert("Outlet request submitted — it is now Pending and will be activated once your supervisor approves it.");
  }

  return (
    <div className={dark ? "tsr-reference dark" : "tsr-reference"}>
      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>TSR Console</small>
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
            <span>TS</span>
          </div>
        </header>

        <div className="reference-content">
          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Aug 31, 2026</span>
          </div>

          <div style={{ marginBottom: 10, maxWidth: 240 }}>
            <TsrSelect value={tsrId} options={tsrs} onChange={setTsrId} />
          </div>

          {activePage === "home" && (
            <>
              <div className="vsr-welcome">
                <div>
                  <span>Welcome back,</span>
                  <h2>{tsr?.name}</h2>
                  <p>TSR · {tsr?.region} region — here is your territory at a glance.</p>
                </div>
              </div>
              <section className="reference-kpis">
                <article onClick={() => setActivePage("territory")} style={{ cursor: "pointer" }}><span>Assigned stores <MoreHorizontal size={14} /></span><b>{myStores.length}</b><small>my territory</small></article>
                <article onClick={() => setActivePage("pipeline")} style={{ cursor: "pointer" }}><span>Pipeline leads <MoreHorizontal size={14} /></span><b>{pipeline[0].value}</b><small>vsr onboarding</small></article>
                <article onClick={() => setActivePage("outlets")} style={{ cursor: "pointer" }}><span>Pending outlets <MoreHorizontal size={14} /></span><b>{requests.length}</b><small>awaiting approval</small></article>
                <article><span>Supervisors <MoreHorizontal size={14} /></span><b>{supervisors.length}</b><small>reporting to me</small></article>
              </section>
              <section className="reference-kpis">
                <article><span>Healthy stores <MoreHorizontal size={14} /></span><b>{healthyStores}</b><small>execution health</small></article>
                <article><span>VSRs <MoreHorizontal size={14} /></span><b>{vsrs.length}</b><small>route coverage</small></article>
                <article><span>Funded pipeline <MoreHorizontal size={14} /></span><b>{pipeline[1].value}</b><small>of {pipeline[0].value} leads</small></article>
                <article><span>Avg completion <MoreHorizontal size={14} /></span><b>{myChildren.length ? Math.round(myChildren.reduce((s, c) => s + c.completion, 0) / myChildren.length) : 0}%</b><small>field performance</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>New outlet requests</h2><p>Outlets you&apos;ve requested — they stay Pending until approved by your supervisor.</p></div><Store size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Outlet</th><th>Territory</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {requests.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>No pending outlet requests.</td></tr>}
                      {requests.map((outlet) => (
                        <tr key={outlet.id}>
                          <td data-label="Outlet"><b>{outlet.name}</b></td>
                          <td data-label="Territory">{outlet.territory}</td>
                          <td data-label="Type">{outlet.type}</td>
                          <td data-label="Status"><span className="status on-route"><i />{outlet.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "0 16px 16px", display: "grid", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Request a new outlet</span>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Outlet name" style={{ width: "100%", marginTop: 4, border: "1px solid #dfe4e2", borderRadius: 6, padding: 9, fontSize: 12 }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <label className="admin-select" style={{ flex: 1, minWidth: 140 }}>
                      <span>TYPE</span>
                      <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                        <option>Convenience</option><option>Supermarket</option><option>Wholesale</option><option>Kiosk</option>
                      </select>
                      <ChevronDown size={13} />
                    </label>
                    <input value={newTerritory} onChange={(e) => setNewTerritory(e.target.value)} placeholder="Territory" style={{ flex: 1, minWidth: 140, border: "1px solid #dfe4e2", borderRadius: 6, padding: 9, fontSize: 12 }} />
                  </div>
                  <div>
                    <button type="button" onClick={requestOutlet} style={{ background: "#07535a", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 6 }} /> Request outlet (Pending)
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activePage === "territory" && (
            <>
              <section className="reference-kpis">
                <article><span>Assigned stores <MoreHorizontal size={14} /></span><b>{myStores.length}</b><small>my territory</small></article>
                <article><span>Healthy stores <MoreHorizontal size={14} /></span><b>{healthyStores}</b><small>execution health</small></article>
                <article><span>Supervisors <MoreHorizontal size={14} /></span><b>{supervisors.length}</b><small>reporting to me</small></article>
                <article><span>VSRs <MoreHorizontal size={14} /></span><b>{vsrs.length}</b><small>route coverage</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Territory store performance</h2><p>{tsr?.name} · {tsr?.region} region</p></div><Gauge size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Store</th><th>Address</th><th>Region</th><th>Territory</th><th>Status</th></tr></thead>
                    <tbody>
                      {filteredStores.map((store) => (
                        <tr key={store.id}>
                          <td data-label="Store"><b>{store.name}</b></td>
                          <td data-label="Address">{store.address}</td>
                          <td data-label="Region">{store.region}</td>
                          <td data-label="Territory">{store.territory}</td>
                          <td data-label="Status"><span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}><i />{store.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "pipeline" && (
            <>
              <section className="reference-kpis">
                <article><span>Total VSR records <MoreHorizontal size={14} /></span><b>{vsrTrackerRows.length}</b><small>pipeline</small></article>
                <article><span>Funded <MoreHorizontal size={14} /></span><b>{pipeline[1].value}</b><small>funds disbursed</small></article>
                <article><span>Deployed <MoreHorizontal size={14} /></span><b>{pipeline[2].value}</b><small>active in field</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Funding deployment funnel</h2><p>Lead → Funded → Deployed</p></div><Layers size={16} /></header>
                <div style={{ padding: "8px 16px 18px", display: "grid", gap: 14 }}>
                  {pipeline.map((item, index) => {
                    const max = Math.max(...pipeline.map((p) => p.value), 1);
                    const width = Math.max(14, Math.round((item.value / max) * 100));
                    const colors = ["#356bc2", "#16a34a", "#ca8a04"];
                    return (
                      <div key={item.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <b style={{ fontSize: 12 }}>{item.name}</b>
                          <span style={{ fontSize: 12, fontWeight: 800, color: colors[index] }}>{item.value}</span>
                        </div>
                        <div style={{ height: 22, background: "#eef1ef", borderRadius: 5, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${width}%`, background: colors[index], borderRadius: 5 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activePage === "accounts" && (
            <>
              <section className="reference-kpis">
                <article><span>Key accounts <MoreHorizontal size={14} /></span><b>{clients.length}</b><small>active clients</small></article>
                <article><span>Total stores <MoreHorizontal size={14} /></span><b>{clients.reduce((sum, client) => sum + client.stores, 0)}</b><small>across accounts</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Key account growth</h2><p>Client completion and store footprint</p></div><Building2 size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Account</th><th>Sector</th><th>Stores</th><th>Completion</th><th>Growth</th><th>Status</th></tr></thead>
                    <tbody>
                      {clients.map((client) => {
                        const completion = parseFloat(client.completion);
                        return (
                          <tr key={client.id}>
                            <td data-label="Account"><b>{client.name}</b></td>
                            <td data-label="Sector">{client.sector}</td>
                            <td data-label="Stores">{client.stores}</td>
                            <td data-label="Completion">{client.completion}</td>
                            <td data-label="Growth">
                              <div style={{ width: 120, height: 8, background: "#eef1ef", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${completion}%`, background: "#16a34a", borderRadius: 4 }} />
                              </div>
                            </td>
                            <td data-label="Status"><span className="status active"><i />{client.status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "outlets" && (
            <>
              <div className="reference-search" style={{ marginBottom: 10 }}>
                <Search size={13} /><input placeholder="Search outlets..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <section className="reference-kpis">
                <article><span>Outlets acquired <MoreHorizontal size={14} /></span><b>{myStores.length}</b><small>in territory</small></article>
                <article><span>Healthy outlets <MoreHorizontal size={14} /></span><b>{healthyStores}</b><small>active</small></article>
                <article><span>Needs review <MoreHorizontal size={14} /></span><b>{myStores.length - healthyStores}</b><small>attention</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>New outlets acquired</h2><p>Retail locations under your coverage</p></div><Store size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Outlet</th><th>Address</th><th>Region</th><th>Territory</th><th>Status</th></tr></thead>
                    <tbody>
                      {filteredStores.map((store) => (
                        <tr key={store.id}>
                          <td data-label="Outlet"><b>{store.name}</b></td>
                          <td data-label="Address">{store.address}</td>
                          <td data-label="Region">{store.region}</td>
                          <td data-label="Territory">{store.territory}</td>
                          <td data-label="Status"><span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}><i />{store.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "map" && (
            <section className="admin-panel">
              <header><div><h2>Territory map</h2><p>{territoryStaff.length} field staff in {tsr?.region}</p></div><MapPin size={16} /></header>
              <MapCard
                staff={territoryStaff}
                selected={0}
                onSelect={() => {}}
                region="All regions"
                role="All roles"
                title="Territory coverage"
                subtitle={`${tsr?.region} field operations`}
              />
            </section>
          )}

          {activePage === "supervisors" && (
            <>
              <section className="reference-kpis">
                <article><span>Supervisors <MoreHorizontal size={14} /></span><b>{supervisors.length}</b><small>reporting to me</small></article>
                <article><span>Avg completion <MoreHorizontal size={14} /></span><b>{supervisors.length ? Math.round(supervisors.reduce((sum, supervisor) => sum + supervisor.completion, 0) / supervisors.length) : 0}%</b><small>vs {completionTarget}% target</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Supervisor performance</h2><p>Field output against targets</p></div><Users size={16} /></header>
                <div className="vsr-target-list">
                  {supervisors.map((supervisor) => {
                    const onTrack = supervisor.completion >= completionTarget;
                    const visitPct = Math.min(100, Math.round((supervisor.visits / 30) * 100));
                    return (
                      <div key={supervisor.id} className="vsr-target-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <b style={{ fontSize: 12 }}>{supervisor.name}</b>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{supervisor.visits} visits · {supervisor.completion}%</span>
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

          {activePage === "settings" && (
            <>
              <section className="admin-panel">
                <header><div><h2>Profile</h2><p>Your account details</p></div><Users size={16} /></header>
                <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>TS</div>
                  <div><b style={{ fontSize: 14 }}>{tsr?.name ?? "TSR"}</b><br /><small style={{ color: "var(--muted)" }}>TSR · {tsr?.region} · {tsr?.route}</small></div>
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
                    <span><Bell size={15} /> Daily territory reminders</span>
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

function TsrSelect({ value, options, onChange }: { value: string; options: { id: string; name: string }[]; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <label className="admin-select" style={{ width: "100%" }} htmlFor={id}>
      <span>TSR</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
      <ChevronDown size={13} />
    </label>
  );
}
