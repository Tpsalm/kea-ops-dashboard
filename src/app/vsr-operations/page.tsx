"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Filter, MapPinned,
  RefreshCw, Route, Search, Timer, Users,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "../../components/app-shell";
import { PageHeading, SelectBox } from "../shared";
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

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? { color: "#334155", bg: "#e2e8f0" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        padding: "4px 10px",
        fontWeight: 700,
        fontSize: 11,
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

  const statusBreakdown = statusOptions
    .map((name) => ({ name, value: trackerRows.filter((row) => row.status === name).length, color: statusColors[name] }))
    .filter((item) => item.value > 0);

  const kpis = [
    { label: "Total VSR records", value: String(trackerRows.length), trend: "", up: true, sub: "onboarding pipeline", icon: Users, tone: "blue" },
    { label: "Funded", value: String(fundedCount), trend: trackerRows.length ? `${Math.round((fundedCount / trackerRows.length) * 100)}%` : "0%", up: true, sub: "funds disbursed", icon: CheckCircle2, tone: "teal" },
    { label: "Awaiting funding", value: String(awaitingCount), trend: "", up: true, sub: "in queue", icon: Timer, tone: "amber" },
    { label: "Risk / review", value: String(riskCount), trend: "", up: false, sub: `${clearedCount} cleared by risk`, icon: AlertTriangle, tone: "violet" },
  ];

  const totalPages = Math.max(1, Math.ceil(trackerRows.length / 10));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleRows = trackerRows.slice((safePage - 1) * 10, safePage * 10);

  const completedVisits = routes.reduce((sum, person) => sum + person.visits, 0);
  const avgCompletion = routes.length
    ? Math.round(routes.reduce((sum, person) => sum + person.completion, 0) / routes.length)
    : 0;

  function handleReset() {
    setRegion("All regions");
    setStatus("All statuses");
    setVsrType("All types");
    setQuery("");
    setPage(1);
  }

  return (
    <AppShell searchValue={query} onSearch={(q) => { setQuery(q); setPage(1); }}>
      <PageHeading
        eyebrow="FIELD EXECUTION · VSR DASHBOARD"
        title="VSR dashboard"
        subtitle="Track VSR onboarding, funding status, risk review, and route coverage across every territory."
      />

      <section className="filters">
        <div className="filter-title"><Filter size={16} /><b>Filters</b></div>
        <SelectBox label="REGION" value={region} options={regionOptions} onChange={(value) => { setRegion(value); setPage(1); }} />
        <SelectBox label="STATUS" value={status} options={["All statuses", ...statusOptions]} onChange={(value) => { setStatus(value); setPage(1); }} />
        <SelectBox label="VSR TYPE" value={vsrType} options={["All types", ...typeOptions]} onChange={(value) => { setVsrType(value); setPage(1); }} />
        <div className="mini-search" style={{ flex: 1 }}>
          <Search size={15} />
          <input placeholder="Search VSRs, locations, status..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        </div>
        <button className="reset" type="button" onClick={handleReset}><RefreshCw size={14} /> Reset</button>
      </section>

      <section className="kpi-grid">
        {kpis.map(({ label, value, trend, up, sub, icon: Icon, tone }) => (
          <article className="kpi" key={label}>
            <div className={`kpi-icon ${tone}`}><Icon size={20} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
            <div className={up ? "trend up" : "trend down"}>
              {trend ? <b>{trend}</b> : null}
              <small>{sub}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="row charts-row">
        <article className="card">
          <div className="card-head">
            <div><h2>Funding status breakdown</h2><p>VSR pipeline by funding state</p></div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={3} stroke="none">
                  {statusBreakdown.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-total"><strong>{trackerRows.length}</strong><span>VSRS</span></div>
          </div>
          <div className="role-legend">
            {statusBreakdown.map((item) => (
              <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><b>{item.value}</b></div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <div><h2>Field route coverage</h2><p>VSR route execution from live field data</p></div>
          </div>
          <div style={{ padding: "6px 17px 18px", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="kpi-icon blue"><Route size={20} /></div>
              <div><b style={{ fontSize: 13 }}>{routes.length} active routes</b><br /><small style={{ color: "var(--muted)" }}>{routes.filter((person) => person.status === "Active" || person.status === "On route").length} currently on plan</small></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="kpi-icon teal"><MapPinned size={20} /></div>
              <div><b style={{ fontSize: 13 }}>{completedVisits} visits completed</b><br /><small style={{ color: "var(--muted)" }}>across visible VSR routes</small></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="kpi-icon amber"><Timer size={20} /></div>
              <div><b style={{ fontSize: 13 }}>{avgCompletion}% completion</b><br /><small style={{ color: "var(--muted)" }}>average route completion</small></div>
            </div>
          </div>
        </article>
      </section>

      <section className="card table-card">
        <div className="card-head table-head">
          <div>
            <h2>VSR onboarding & funding tracker</h2>
            <p>{trackerRows.length} records · {visibleRows.length} shown</p>
          </div>
        </div>

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
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#b42318", fontWeight: 700, fontSize: 11 }}>
                        <AlertTriangle size={13} /> {row.riskAlert}
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
          <div className="empty"><AlertTriangle size={24} /><b>No VSR records match the selected filters.</b><span>Try adjusting your filters or search.</span></div>
        )}

        <div className="pagination">
          <span>Showing {trackerRows.length ? (safePage - 1) * 10 + 1 : 0}–{Math.min(safePage * 10, trackerRows.length)} of {trackerRows.length}</span>
          <div>
            <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
            <span>{safePage} / {totalPages}</span>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
