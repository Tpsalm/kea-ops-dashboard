"use client";

// Reusable presentational components shared by all dedicated tab pages.
import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Download, Filter,
  MoreHorizontal, RefreshCw, Search, TrendingDown, TrendingUp,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  activityData, completionData, roleData, type Staff,
} from "./data";

const OperationsMap = dynamic(() => import("./operations-map"), {
  ssr: false,
  loading: () => <div className="map-loading"><RefreshCw size={20} /> Loading live Nigerian map…</div>,
});

/* ----------------------------- primitives ----------------------------- */

export function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <b>{label}</b>
      {payload.map((p) => (
        <span key={p.name}><i style={{ background: p.color }} />{p.name}: <strong>{p.value.toLocaleString()}</strong></span>
      ))}
    </div>
  );
}

export function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (s: string) => void }) {
  return (
    <label className="select-box">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

export function PageHeading({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <section className="heading">
      <div>
        <div className="eyebrow"><span className="live-dot" /> {eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </section>
  );
}

export function FilterBar({
  period, onPeriod, region, onRegion, role, onRole, client, onClient, onReset,
}: {
  period?: string; onPeriod?: (s: string) => void;
  region?: string; onRegion?: (s: string) => void;
  role?: string; onRole?: (s: string) => void;
  client?: string; onClient?: (s: string) => void;
  onReset?: () => void;
}) {
  return (
    <section className="filters">
      <div className="filter-title"><Filter size={16} /><b>Filters</b></div>
      {onPeriod && <SelectBox label="DATE RANGE" value={period!} options={["Today", "Last 7 days", "Last 30 days", "This quarter"]} onChange={onPeriod} />}
      {onRegion && <SelectBox label="REGION" value={region!} options={["All regions", "Lagos", "Ogun", "Oyo", "Delta", "South West", "South East", "South South", "North", "Port Harcourt", "Owerri"]} onChange={onRegion} />}
      {onRole && <SelectBox label="ROLE" value={role!} options={["All roles", "VSR", "TSR", "Supervisor", "Merchandiser"]} onChange={onRole} />}
      {onClient && <SelectBox label="CLIENT" value={client!} options={["All clients", "Nova Consumer", "Aria Foods"]} onChange={onClient} />}
      {onReset && <button className="reset" onClick={onReset}><RefreshCw size={14} /> Reset</button>}
    </section>
  );
}

/* ------------------------------- KPI grid ------------------------------ */

export type Kpi = {
  label: string; value: string; trend: string; up: boolean; sub: string;
  icon: LucideIcon; tone: string;
};

export function KpiGrid({ items, focus, onFocus }: { items: Kpi[]; focus?: string; onFocus?: (label: string) => void }) {
  const [selected, setSelected] = useState("");
  const activeFocus = focus || selected;
  return (
    <section className="kpi-grid">
      {items.map(({ label, value, trend, up, sub, icon: Icon, tone }) => (
        <button className={`kpi ${activeFocus === label ? "selected" : ""}`} key={label} onClick={() => { setSelected(label); onFocus?.(label); }}>
          <div className={`kpi-icon ${tone}`}><Icon size={20} /></div>
          <MoreHorizontal className="kpi-more" size={18} />
          <span>{label}</span>
          <strong>{value}</strong>
          <div className={up ? "trend up" : "trend down"}>
            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <b>{trend}</b><small>{sub}</small>
          </div>
        </button>
      ))}
    </section>
  );
}

/* ----------------------------- chart cards ----------------------------- */

export function ActivityCard({ onMore, data = activityData }: { onMore: () => void; data?: typeof activityData }) {
  return (
    <article className="card activity-card">
      <div className="card-head">
        <div><h2>Field activity</h2><p>Visits and product checks over time</p></div>
        <div className="legend">
          <span><i className="blue" />Visits</span>
          <span><i className="teal" />Product checks</span>
          <button type="button" aria-label="Field activity options" onClick={onMore}><MoreHorizontal size={18} /></button>
        </div>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="checks" stroke="#14b8a6" strokeWidth={2} fill="transparent" />
            <Area type="monotone" dataKey="visits" stroke="#2563eb" strokeWidth={2.5} fill="url(#blueFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function WorkforceMixCard({ onMore, data = roleData, total }: { onMore: () => void; data?: typeof roleData; total?: number }) {
  return (
    <article className="card workforce-card">
      <div className="card-head">
        <div><h2>Workforce mix</h2><p>Active staff by role</p></div>
        <button type="button" aria-label="Workforce chart options" onClick={onMore}><MoreHorizontal size={18} /></button>
      </div>
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={62} outerRadius={82} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-total"><strong>{total ?? data.reduce((sum, item) => sum + item.value, 0)}</strong><span>STAFF</span></div>
      </div>
      <div className="role-legend">
        {data.map((d) => (
          <div key={d.name}><span><i style={{ background: d.color }} />{d.name}</span><b>{d.value}</b></div>
        ))}
      </div>
    </article>
  );
}

export function CompletionCard({ onMore, data = completionData, completion = "87.4%" }: { onMore: () => void; data?: typeof completionData; completion?: string }) {
  return (
    <article className="card completion-card">
      <div className="card-head">
        <div><h2>Visit completion</h2><p>Planned vs completed by region</p></div>
        <button type="button" aria-label="Completion chart options" onClick={onMore}><MoreHorizontal size={18} /></button>
      </div>
      <div className="completion-summary"><strong>{completion}</strong><span><TrendingUp size={13} /> 4.6%</span><small>overall completion</small></div>
      <div className="bar-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="planned" fill="var(--bar-muted)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

/* ------------------------------- map card ------------------------------ */
export function MapCard({
  staff, selected, onSelect, region, role,
  title = "Geographic operations",
  subtitle = "Live Nigerian map · every staff member with GPS coordinates",
  onOpenFull,
}: {
  staff: Staff[];
  selected: number;
  onSelect: (index: number) => void;
  region: string;
  role: string;
  title?: string;
  subtitle?: string;
  onOpenFull?: () => void;
}) {
  return (
    <article className="card map-card" id="live-map">
      <div className="card-head">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        {onOpenFull ? (
          <button type="button" className="text-btn" onClick={onOpenFull}>Open full map <ChevronRight size={15} /></button>
        ) : (
          <span className="live-badge"><i /> LIVE</span>
        )}
      </div>
      <OperationsMap staff={staff} selected={selected} onSelect={onSelect} region={region} role={role} />
    </article>
  );
}

/* --------------------------- workforce table --------------------------- */

export function EmptyState({ icon: Icon = CircleHelp, title = "No matching records", hint = "Try adjusting your filters or search." }: { icon?: LucideIcon; title?: string; hint?: string }) {
  return (
    <div className="empty"><Icon size={24} /><b>{title}</b><span>{hint}</span></div>
  );
}

export function WorkforceTable({
  rows, page, pageSize, onPage, sort, asc, onSort, onView, query, onQuery, onExport,
}: {
  rows: Staff[];
  page: number; pageSize: number; onPage: (p: number) => void;
  sort: keyof Staff; asc: boolean; onSort: (k: keyof Staff) => void;
  onView: (s: Staff) => void;
  query: string; onQuery: (q: string) => void;
  onExport?: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, rows.length);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const header = (label: string, key?: keyof Staff) => (
    <th onClick={key ? () => onSort(key) : undefined}>
      {label}
      {key ? (sort === key ? (asc ? " ↑" : " ↓") : " ↕") : ""}
    </th>
  );

  return (
    <section className="card table-card">
      <div className="card-head table-head">
        <div><h2>Workforce performance</h2><p>Live performance across active field teams</p></div>
        <div className="table-tools">
          <div className="mini-search"><Search size={15} /><input placeholder="Search workforce" value={query} onChange={(e) => onQuery(e.target.value)} /></div>
          {onExport && <button className="secondary" onClick={onExport} aria-label="Export workforce CSV"><Download size={15} /></button>}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No matching staff" hint="Try adjusting your filters or search." />
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {header("Team member", "name")}
                  {header("Role", "role")}
                  <th>Region / territory</th>
                  <th>Assignment</th>
                  <th>Status</th>
                  {header("Visits", "visits")}
                  {header("Completion", "completion")}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Team member">
                      <div className="person">
                        <div>{s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
                        <span><b>{s.name}</b><small>{s.id}</small></span>
                      </div>
                    </td>
                    <td data-label="Role"><span className={`role-badge ${s.role.toLowerCase()}`}>{s.role}</span></td>
                    <td data-label="Region"><b className="cell-main">{s.region}</b><small className="cell-sub">{s.territory}</small></td>
                    <td data-label="Assignment">{s.route}</td>
                    <td data-label="Status"><span className={`status ${s.status.toLowerCase().replace(" ", "-")}`}><i />{s.status}</span></td>
                    <td data-label="Visits"><b>{s.visits}</b></td>
                    <td data-label="Completion"><div className="progress-cell"><div><i style={{ width: `${s.completion}%` }} /></div><b>{s.completion}%</b></div></td>
                    <td data-label=""><button type="button" aria-label={`View ${s.name}`} onClick={() => onView(s)}><MoreHorizontal size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Showing {start}–{end} of {rows.length}</span>
            <div>
              <button type="button" disabled={safePage <= 1} onClick={() => onPage(safePage - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
              <span>{safePage} / {totalPages}</span>
              <button type="button" disabled={safePage >= totalPages} onClick={() => onPage(safePage + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
