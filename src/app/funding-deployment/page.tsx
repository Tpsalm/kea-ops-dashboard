"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Filter, RefreshCw, Search, Timer, Users,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, SelectBox } from "../shared";
import { staff, vsrTrackerRows } from "../data";

const regionOptions = ["All regions", "Lagos", "Ogun", "Oyo", "Delta", "Enugu", "Ibadan", "Asaba", "Benin", "Osogbo", "Abuja"];
const statusOptions = ["Funded", "Awaiting Funding", "No Loan Required", "Under Review - Risk & Compliance", "Cleared by Risk & Compliance"];

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
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, padding: "4px 10px", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", color: style.color, background: style.bg }}>
      {status}
    </span>
  );
}

export default function FundingDeploymentPage() {
  const [region, setRegion] = useState("All regions");
  const [status, setStatus] = useState("All statuses");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const trackerRows = useMemo(() => {
    return vsrTrackerRows.filter((row) => {
      const locMatch =
        region === "All regions" ||
        normalizeLocation(row.location).includes(normalizeLocation(region)) ||
        normalizeLocation(row.location).includes(normalizeLocation(region === "Oyo" ? "Ibadan" : region));
      const statusMatch = status === "All statuses" || row.status === status;
      const queryMatch = !query || `${row.fullName} ${row.location} ${row.email} ${row.status} ${row.riskAlert}`.toLowerCase().includes(query.toLowerCase());
      return locMatch && statusMatch && queryMatch;
    });
  }, [region, status, query]);

  const routes = useMemo(() => staff.filter((person) => person.role === "VSR" && (region === "All regions" || person.region === region)), [region]);

  const fundedCount = trackerRows.filter((row) => row.status === "Funded").length;
  const awaitingCount = trackerRows.filter((row) => row.status === "Awaiting Funding").length;
  const riskCount = trackerRows.filter((row) => row.status === "Under Review - Risk & Compliance").length;
  const clearedCount = trackerRows.filter((row) => row.status === "Cleared by Risk & Compliance").length;

  const totalPages = Math.max(1, Math.ceil(trackerRows.length / 10));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleRows = trackerRows.slice((safePage - 1) * 10, safePage * 10);

  function handleReset() {
    setRegion("All regions");
    setStatus("All statuses");
    setQuery("");
    setPage(1);
  }

  return (
    <AppShell contentClassName="page-admin" searchValue={query} onSearch={(q) => { setQuery(q); setPage(1); }}>
      <PageHeading
        eyebrow="VSR OPERATIONS · FUNDING & DEPLOYMENT"
        title="Funding & deployment"
        subtitle="Track VSR onboarding, funding status, risk review, and field deployment."
      />

      <section className="filters">
        <div className="filter-title"><Filter size={16} /><b>Filters</b></div>
        <SelectBox label="REGION" value={region} options={regionOptions} onChange={(value) => { setRegion(value); setPage(1); }} />
        <SelectBox label="STATUS" value={status} options={["All statuses", ...statusOptions]} onChange={(value) => { setStatus(value); setPage(1); }} />
        <div className="mini-search" style={{ flex: 1 }}>
          <Search size={15} />
          <input placeholder="Search VSRs, locations, status..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        </div>
        <button className="reset" type="button" onClick={handleReset}><RefreshCw size={14} /> Reset</button>
      </section>

      <section className="kpi-grid">
        <article className="kpi"><div className="kpi-icon blue"><Users size={20} /></div><span>Total VSR records</span><strong>{trackerRows.length}</strong><div className="trend up"><b>pipeline</b></div></article>
        <article className="kpi"><div className="kpi-icon teal"><CheckCircle2 size={20} /></div><span>Funded</span><strong>{fundedCount}</strong><div className="trend up"><b>{trackerRows.length ? Math.round((fundedCount / trackerRows.length) * 100) : 0}%</b><small>of records</small></div></article>
        <article className="kpi"><div className="kpi-icon amber"><Timer size={20} /></div><span>Awaiting funding</span><strong>{awaitingCount}</strong><div className="trend up"><b>in queue</b></div></article>
        <article className="kpi"><div className="kpi-icon violet"><AlertTriangle size={20} /></div><span>Risk / review</span><strong>{riskCount}</strong><div className="trend down"><b>{clearedCount}</b><small>cleared by risk</small></div></article>
      </section>

      <section className="card">
        <div className="card-head"><div><h2>Funding status breakdown</h2><p>VSR pipeline by funding state</p></div></div>
        <div style={{ padding: "8px 17px 18px", display: "grid", gap: 12 }}>
          {statusOptions.map((name) => {
            const count = trackerRows.filter((row) => row.status === name).length;
            const pct = trackerRows.length ? Math.round((count / trackerRows.length) * 100) : 0;
            return (
              <div key={name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{name}</span>
                  <b style={{ fontSize: 13 }}>{count}</b>
                </div>
                <div style={{ height: 10, background: "var(--soft)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: statusColors[name], borderRadius: 5 }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card table-card">
        <div className="card-head table-head">
          <div><h2>VSR onboarding & funding tracker</h2><p>{trackerRows.length} records · {visibleRows.length} shown · {routes.length} deployed routes</p></div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Full name</th><th>Type</th><th>Status</th><th>Location</th><th>Date funded</th><th>Risk alert</th><th>Priority</th><th>Email</th><th>Phone</th></tr></thead>
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
