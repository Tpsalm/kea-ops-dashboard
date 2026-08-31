"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import {
  AlertTriangle, Bell, Car, CheckCircle2, ClipboardList, LogOut, MapPin, Menu, Moon,
  MoreHorizontal, PackageCheck, Route, Search, Settings, ShieldCheck, Sun, Target,
  TrendingDown, TrendingUp, Users, X,
} from "lucide-react";
import { staff } from "../data";
import { products, vsrRoutes } from "../hierarchy-data";

type PageKey = "routes" | "sales" | "vehicle" | "performance" | "settings";

const vehicleItems = [
  { id: "oil", label: "Engine oil level" },
  { id: "tyres", label: "Tyre pressure & tread depth" },
  { id: "brakes", label: "Brake function & handbrake" },
  { id: "lights", label: "Headlights, indicators & horn" },
  { id: "fuel", label: "Fuel / battery level" },
  { id: "coolant", label: "Coolant & fluids" },
  { id: "wipers", label: "Wipers & washer fluid" },
  { id: "safety", label: "Seatbelt, mirrors & warning triangle" },
];

const navItems: { key: PageKey; label: string; icon: typeof Route }[] = [
  { key: "routes", label: "My routes", icon: Route },
  { key: "sales", label: "Daily sales log", icon: ClipboardList },
  { key: "vehicle", label: "Vehicle check", icon: Car },
  { key: "performance", label: "Performance", icon: Target },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  routes: { title: "MY ROUTES", subtitle: "Assigned territories, route coverage and field completion." },
  sales: { title: "DAILY SALES LOG", subtitle: "Product movement and stock observations from your outlets." },
  vehicle: { title: "VEHICLE CHECK", subtitle: "Pre-trip vehicle inspection checklist and safety sign-off." },
  performance: { title: "PERFORMANCE · MY TARGET", subtitle: "Your visit and completion progress against monthly targets." },
  settings: { title: "SETTINGS", subtitle: "Profile, preferences, theme and security for your workspace." },
};

export default function VsrOperationsPage() {
  const [activePage, setActivePage] = useState<PageKey>("routes");
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState({ daily: true, alerts: true });
  const [search, setSearch] = useState("");

  const vsrStaff = useMemo(() => staff.filter((person) => person.role === "VSR"), []);
  const routeStops = (vsrId: string) => vsrRoutes.find((route) => route.vsrId === vsrId)?.coordinates.length ?? 0;

  const activeRoutes = vsrStaff.filter((person) => person.status === "Active" || person.status === "On route").length;
  const completedVisits = vsrStaff.reduce((sum, person) => sum + person.visits, 0);
  const avgCompletion = vsrStaff.length ? Math.round(vsrStaff.reduce((sum, person) => sum + person.completion, 0) / vsrStaff.length) : 0;

  const totalProducts = products.length;
  const inStock = products.filter((product) => product.availability === "In stock").length;
  const lowStock = products.filter((product) => product.availability === "Low stock").length;
  const outStock = products.filter((product) => product.availability === "Out of stock").length;

  const visitTarget = 30;
  const completionTarget = 90;

  const checkedCount = Object.values(checks).filter(Boolean).length;
  const vehiclePct = Math.round((checkedCount / vehicleItems.length) * 100);

  function toggleCheck(id: string) {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function submitVehicleCheck() {
    try {
      localStorage.setItem("kea_vehicle_check", JSON.stringify(checks));
    } catch {
      // storage unavailable
    }
    alert(`Vehicle check submitted — ${checkedCount} of ${vehicleItems.length} items cleared.`);
  }

  function signOut() {
    try {
      localStorage.removeItem("kea_user");
      localStorage.removeItem("kea_vehicle_check");
    } catch {
      // storage unavailable
    }
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      `${product.name} ${product.sku} ${product.category} ${product.availability}`.toLowerCase().includes(query),
    );
  }, [search]);

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
          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Aug 31, 2026</span>
          </div>

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
                <Search size={13} /><input placeholder="Search products, SKU, category..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <section className="reference-kpis">
                <article><span>Products tracked <MoreHorizontal size={14} /></span><b>{totalProducts}</b><small>total SKUs</small></article>
                <article><span>In stock <MoreHorizontal size={14} /></span><b>{inStock}</b><small>healthy</small></article>
                <article><span>Low stock <MoreHorizontal size={14} /></span><b>{lowStock}</b><small>needs reorder</small></article>
                <article><span>Out of stock <MoreHorizontal size={14} /></span><b>{outStock}</b><small>urgent</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Daily sales & stock log</h2><p>Latest product movement and availability across outlets</p></div><PackageCheck size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Units</th><th>Availability</th><th>Last updated</th></tr></thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td data-label="SKU"><code>{product.sku}</code></td>
                          <td data-label="Product"><b>{product.name}</b></td>
                          <td data-label="Category">{product.category}</td>
                          <td data-label="Units">{product.quantity ?? 0}</td>
                          <td data-label="Availability">
                            <span
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 5, padding: "3px 9px",
                                fontWeight: 700, fontSize: 10, whiteSpace: "nowrap",
                                color: product.availability === "In stock" ? "#0b3b2c" : product.availability === "Low stock" ? "#7a4a00" : "#991b1b",
                                background: product.availability === "In stock" ? "#c8f3d1" : product.availability === "Low stock" ? "#f6d7a5" : "#fbdcdc",
                              }}
                            >
                              {product.availability}
                            </span>
                          </td>
                          <td data-label="Last updated">{product.lastUpdated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "vehicle" && (
            <>
              <section className="reference-kpis">
                <article><span>Checks cleared <MoreHorizontal size={14} /></span><b>{checkedCount} / {vehicleItems.length}</b><small>{vehiclePct}% complete</small></article>
                <article><span>Vehicle status <MoreHorizontal size={14} /></span><b>{vehiclePct === 100 ? "Ready" : "Pending"}</b><small>pre-trip readiness</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Pre-trip vehicle inspection</h2><p>Tick each item once verified before starting your route</p></div><ShieldCheck size={16} /></header>
                <div className="vsr-check-list">
                  {vehicleItems.map((item) => (
                    <button type="button" key={item.id} className={checks[item.id] ? "checked" : ""} onClick={() => toggleCheck(item.id)}>
                      <span><i>{checks[item.id] ? <CheckCircle2 size={15} /> : <i className="dot" />}</i>{item.label}</span>
                      {checks[item.id] ? "Cleared" : "Check"}
                    </button>
                  ))}
                </div>
                <div className="vsr-check-actions">
                  <button className="reference-filters>button" type="button" onClick={submitVehicleCheck} style={{ background: "#07535a", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", fontWeight: 700, fontSize: 11 }}>
                    <CheckCircle2 size={14} /> Submit vehicle check
                  </button>
                </div>
              </section>
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
                <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>VS</div>
                  <div><b style={{ fontSize: 14 }}>Shittu Akinsanya</b><br /><small style={{ color: "var(--muted)" }}>VSR · Lagos Central · Ikeja North</small></div>
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
