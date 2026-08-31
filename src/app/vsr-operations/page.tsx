"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, ChevronDown, Flag, Gauge, MapPinned, Menu,
  MoreHorizontal, RefreshCw, Route, Search, Settings, ShieldCheck, Timer, Users, X,
} from "lucide-react";
import { staff, vsrTrackerRows } from "../data";

const regionOptions = ["All regions", "Lagos", "Ogun", "Oyo", "Delta", "Enugu", "Ibadan", "Asaba", "Benin", "Osogbo", "Abuja"];
const statusOptions = ["Funded", "Awaiting Funding", "No Loan Required", "Under Review - Risk & Compliance", "Cleared by Risk & Compliance"];
const typeOptions = ["New", "Existing"];

const statusStyles: Record<string, { color: string; bg: string }> = {
  "Funded": { color: "#0b3b2c", bg: "#c8f3d1" },
  "Awaiting Funding": { color: "#7a4a00", bg: "#f6d7a5" },
  "No Loan Required": { color: "#3c2e6c", bg: "#e9d8ff" },
  "Under Review - Risk & Compliance": { color: "#7a4a00", bg: "#fbe8aa" },
  "Cleared by Risk & Compliance": { color: "#0a5b46", bg: "#d4f3e8" },
};
const statusColors: Record<string, string> = {
  "Funded": "#12a472",
  "Awaiting Funding": "#f59e0b",
  "No Loan Required": "#8b5cf6",
  "Under Review - Risk & Compliance": "#ef4444",
  "Cleared by Risk & Compliance": "#14b8a6",
};

function normalizeLocation(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <label className="admin-select" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown size={13} />
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? { color: "#334155", bg: "#e2e8f0" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        padding: "3px 9px",
        fontWeight: 700,
        fontSize: 10,
        whiteSpace: "nowrap",
        color: style.color,
        background: style.bg,
      }}
    >
      {status}
    </span>
  );
}

export default function VsrOperationsPage() {
  const [region, setRegion] = useState("All regions");
  const [status, setStatus] = useState("All statuses");
  const [vsrType, setVsrType] = useState("All types");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [mobileNav, setMobileNav] = useState(false);
  const [activeSection, setActiveSection] = useState("vsr-overview");

  const trackerRows = useMemo(() => {
    return vsrTrackerRows.filter((row) => {
      const locMatch =
        region === "All regions" ||
        normalizeLocation(row.location).includes(normalizeLocation(region)) ||
        normalizeLocation(row.location).includes(normalizeLocation(region === "Oyo" ? "Ibadan" : region));
      const statusMatch = status === "All statuses" || row.status === status;
      const typeMatch = vsrType === "All types" || row.vsrType === vsrType;
      const queryMatch =
        !query ||
        `${row.fullName} ${row.location} ${row.email} ${row.status} ${row.riskAlert}`.toLowerCase().includes(query.toLowerCase());
      return locMatch && statusMatch && typeMatch && queryMatch;
    });
  }, [region, status, vsrType, query]);

  const routes = useMemo(
    () => staff.filter((person) => person.role === "VSR" && (region === "All regions" || person.region === region)),
    [region],
  );

  const fundedCount = trackerRows.filter((row) => row.status === "Funded").length;
  const awaitingCount = trackerRows.filter((row) => row.status === "Awaiting Funding").length;
  const riskCount = trackerRows.filter((row) => row.status === "Under Review - Risk & Compliance").length;
  const clearedCount = trackerRows.filter((row) => row.status === "Cleared by Risk & Compliance").length;

  const totalPages = Math.max(1, Math.ceil(trackerRows.length / 10));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleRows = trackerRows.slice((safePage - 1) * 10, safePage * 10);

  const activeRoutes = routes.filter((person) => person.status === "Active" || person.status === "On route").length;
  const completedVisits = routes.reduce((sum, person) => sum + person.visits, 0);
  const avgCompletion = routes.length ? Math.round(routes.reduce((sum, person) => sum + person.completion, 0) / routes.length) : 0;
  const fundedPct = trackerRows.length ? Math.round((fundedCount / trackerRows.length) * 100) : 0;

  function handleReset() {
    setRegion("All regions");
    setStatus("All statuses");
    setVsrType("All types");
    setQuery("");
    setPage(1);
  }

  function navigateTo(id: string) {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (!el) return;
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const top = Math.max(0, el.getBoundingClientRect().top + currentScroll - 48);
    window.scrollTo(0, top);
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }

  return (
    <div className="vsr-reference">
      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>VSR Operations Console</small>
          <button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav>
          <button type="button" className={activeSection === "vsr-overview" ? "active" : ""} onClick={() => navigateTo("vsr-overview")}><Gauge size={15} /> Overview</button>
          <button type="button" className={activeSection === "vsr-funding" ? "active" : ""} onClick={() => navigateTo("vsr-funding")}><Flag size={15} /> Funding tracker</button>
          <button type="button" className={activeSection === "vsr-routes" ? "active" : ""} onClick={() => navigateTo("vsr-routes")}><Route size={15} /> Route board</button>
          <button type="button" className={activeSection === "vsr-risk" ? "active" : ""} onClick={() => navigateTo("vsr-risk")}><ShieldCheck size={15} /> Risk & compliance</button>
        </nav>
        <button className="reference-settings"><Settings size={15} /> Settings <MoreHorizontal size={15} /></button>
      </aside>

      <main className="reference-main">
        <header className="reference-topbar">
          <button className="reference-menu" type="button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <div className="reference-search"><Search size={13} /><input placeholder="Search VSR records..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
          <span className="reference-chip">VSR</span>
          <div className="reference-actions"><button type="button" aria-label="Notifications"><Bell size={15} /></button><span>KA</span></div>
        </header>

        <div className="reference-content">
          <div className="reference-title"><h1>VSR DASHBOARD</h1><span>Aug 31, 2026</span></div>

          <section className="reference-filters" id="vsr-overview">
            <SelectControl label="REGION" value={region} options={regionOptions} onChange={(value) => { setRegion(value); setPage(1); }} />
            <SelectControl label="STATUS" value={status} options={["All statuses", ...statusOptions]} onChange={(value) => { setStatus(value); setPage(1); }} />
            <SelectControl label="VSR TYPE" value={vsrType} options={["All types", ...typeOptions]} onChange={(value) => { setVsrType(value); setPage(1); }} />
            <button type="button" onClick={handleReset}><RefreshCw size={13} /> Reset filters</button>
          </section>

          <section className="reference-kpis">
            <article><span>Total VSR records <MoreHorizontal size={14} /></span><b>{trackerRows.length}</b><small>onboarding pipeline</small></article>
            <article><span>Funded <MoreHorizontal size={14} /></span><b>{fundedCount}</b><small>{fundedPct}% of records</small></article>
            <article><span>Awaiting funding <MoreHorizontal size={14} /></span><b>{awaitingCount}</b><small>in queue</small></article>
            <article><span>Risk / review <MoreHorizontal size={14} /></span><b>{riskCount}</b><small>{clearedCount} cleared by risk</small></article>
          </section>

          <div className="vsr-panel-grid">
            <section className="admin-panel" id="vsr-funding">
              <header><div><h2>Funding status breakdown</h2><p>VSR pipeline by funding state</p></div><button type="button" aria-label="Funding options"><MoreHorizontal size={16} /></button></header>
              <div className="vsr-status-bars">
                {statusOptions.map((name) => {
                  const count = trackerRows.filter((row) => row.status === name).length;
                  const pct = trackerRows.length ? Math.round((count / trackerRows.length) * 100) : 0;
                  return (
                    <div key={name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: "#52615b" }}>{name}</span>
                        <b style={{ fontSize: 12, color: "#18231f" }}>{count}</b>
                      </div>
                      <div style={{ height: 10, background: "#eef1ef", borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: statusColors[name], borderRadius: 5 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="admin-panel" id="vsr-routes">
              <header><div><h2>Route board</h2><p>Live VSR field execution</p></div><button type="button" aria-label="Route options"><MoreHorizontal size={16} /></button></header>
              <div className="vsr-route-stats">
                <div><Route size={15} /><span><b>{routes.length} routes</b><small>{activeRoutes} on plan</small></span></div>
                <div><MapPinned size={15} /><span><b>{completedVisits} visits</b><small>completed</small></span></div>
                <div><Timer size={15} /><span><b>{avgCompletion}%</b><small>avg completion</small></span></div>
              </div>
            </section>
          </div>

          <section className="admin-panel vsr-table-panel" id="vsr-risk">
            <header>
              <div><h2>VSR onboarding & funding tracker</h2><p>{trackerRows.length} records · {visibleRows.length} shown</p></div>
              <Users size={16} />
            </header>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Date funded</th>
                    <th>Risk alert</th>
                    <th>Priority</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Full name"><b>{row.fullName}</b></td>
                      <td data-label="Type">{row.vsrType}</td>
                      <td data-label="Status"><StatusBadge status={row.status} /></td>
                      <td data-label="Location">{row.location}</td>
                      <td data-label="Date funded">{row.dateFunded || "—"}</td>
                      <td data-label="Risk alert">
                        {row.riskAlert ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#b42318", fontWeight: 700, fontSize: 10 }}>
                            <AlertTriangle size={12} /> {row.riskAlert}
                          </span>
                        ) : "—"}
                      </td>
                      <td data-label="Priority">{row.priority}</td>
                      <td data-label="Email">{row.email || "—"}</td>
                      <td data-label="Phone">{row.phone || "—"}</td>
                      <td data-label="Notes">{row.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {trackerRows.length === 0 && (
              <div className="empty"><AlertTriangle size={22} /><b>No VSR records match the selected filters.</b><span>Try adjusting your filters or search.</span></div>
            )}

            <div className="pagination">
              <span>Showing {trackerRows.length ? (safePage - 1) * 10 + 1 : 0}–{Math.min(safePage * 10, trackerRows.length)} of {trackerRows.length}</span>
              <div>
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronDown size={16} style={{ transform: "rotate(90deg)" }} /></button>
                <span>{safePage} / {totalPages}</span>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} /></button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
