"use client";

import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Activity, AlertTriangle, BarChart3, Bell, Building2, ChevronDown,
  Database, FileText, Flag, Gauge, KeyRound, Layers3, Map, Menu,
  MoreHorizontal, Network, PieChart as PieIcon, Settings, ShieldCheck,
  Store, Users, X,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Funnel,
  FunnelChart, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from "recharts";
import { staff, vsrTrackerRows, type Role } from "../data";

const OperationsMap = dynamic(() => import("../operations-map"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading operations map...</div>,
});

const roleColors: Record<Role, string> = {
  VSR: "#0e918a", TSR: "#f39a28", Supervisor: "#8fc63d", Merchandiser: "#55b8bb",
};
const regions = ["All regions", "Lagos", "Ogun", "Oyo", "Delta", "South West", "South East", "South South", "North", "Port Harcourt", "Owerri"];
const roles = ["All roles", "VSR", "TSR", "Supervisor", "Merchandiser"];

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="admin-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={13} /></label>;
}

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <section className={`admin-panel ${className}`}><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" aria-label={`${title} options`}><MoreHorizontal size={16} /></button></header>{children}</section>;
}

export default function SuperAdminDashboard() {
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [client, setClient] = useState("All clients");
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedPin, setSelectedPin] = useState(0);
  const [search, setSearch] = useState("");

  const filteredStaff = useMemo(() => staff.filter((person) =>
    (region === "All regions" || person.region === region) &&
    (role === "All roles" || person.role === role) &&
    (client === "All clients" || person.clientId === (client === "Nova Consumer" ? "client-a" : "client-b")) &&
    `${person.name} ${person.region} ${person.territory}`.toLowerCase().includes(search.toLowerCase())
  ), [client, region, role, search]);

  const roleBreakdown = useMemo(() => (roles.slice(1) as Role[]).map((item) => ({ name: item, value: filteredStaff.filter((person) => person.role === item).length, color: roleColors[item] })), [filteredStaff]);
  const funding = useMemo(() => [
    { name: "Lead", value: vsrTrackerRows.length },
    { name: "Funded", value: vsrTrackerRows.filter((row) => row.status === "Funded").length },
    { name: "Deployed", value: filteredStaff.filter((person) => person.role === "VSR" && person.status !== "Inactive").length },
  ], [filteredStaff]);
  const healthData = useMemo(() => [
    { day: "7 Aug", requests: 74, errors: 3 }, { day: "11 Aug", requests: 91, errors: 4 }, { day: "16 Aug", requests: 83, errors: 2 },
    { day: "20 Aug", requests: 118, errors: 5 }, { day: "23 Aug", requests: 108, errors: 3 }, { day: "26 Aug", requests: 152, errors: 11 }, { day: "27 Aug", requests: 138, errors: 4 },
  ], []);
  const qualityRows = useMemo(() => regions.slice(1, 6).map((name, index) => ({ state: name, errors: Math.max(0, Math.round((filteredStaff.filter((person) => person.region === name).length || 1) * (index % 3 === 0 ? 1.4 : .3))), region: regions[index + 2] ?? "Lagos", error: index % 3 === 0 ? 1 : 0 })), [filteredStaff]);

  const resetFilters = () => { setRegion("All regions"); setRole("All roles"); setClient("All clients"); setSearch(""); setSelectedPin(0); };

  return <div className="super-admin-reference">
    <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
      <div className="reference-brand"><div className="reference-logo"><b>k</b><b>e</b><b>a</b></div><strong>KEA GROUP</strong><small>Talent Management System</small><button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <nav><a className="active"><Gauge size={15} /> Global performance</a><a><Users size={15} /> Users & roles</a><a><Map size={15} /> Territories & routes</a><a><Network size={15} /> API integrations</a><a><Store size={15} /> Funding & deployment</a><a><Database size={15} /> System logs</a><a><FileText size={15} /> Audit trail</a></nav>
      <button className="reference-settings"><Settings size={15} /> Settings <MoreHorizontal size={15} /></button>
    </aside>
    <main className="reference-main">
      <header className="reference-topbar"><button className="reference-menu" type="button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="reference-search"><KeyRound size={13} /><input placeholder="KEA Talent Management System" value={search} onChange={(event) => setSearch(event.target.value)} /></div><span className="reference-chip">x 1</span><div className="reference-actions"><button type="button" aria-label="Toggle theme"><Activity size={15} /></button><button type="button" aria-label="Notifications"><Bell size={15} /></button><span>KA</span></div></header>
      <div className="reference-content">
        <div className="reference-title"><h1>SUPER ADMIN DASHBOARD</h1><span>Aug 27, 2026</span></div>
        <section className="reference-filters"><SelectControl label="REGION" value={region} options={regions} onChange={(value) => { setRegion(value); setSelectedPin(0); }} /><SelectControl label="ROLE" value={role} options={roles} onChange={setRole} /><SelectControl label="CLIENT" value={client} options={["All clients", "Nova Consumer", "Aria Foods"]} onChange={setClient} /><button type="button" onClick={resetFilters}>Reset filters</button></section>
        <section className="reference-kpis">
          <article><span>Total system users <MoreHorizontal size={14} /></span><b>{filteredStaff.length + 116}</b><small>↑ 137% system users only</small></article>
          <article><span>Total active staff <MoreHorizontal size={14} /></span><b>{filteredStaff.filter((person) => person.status !== "Inactive").length + 95}</b><small>Aggregates merchandisers, supervisors, VSRs & TSRs</small></article>
          <article><span>Active projects (clients) <MoreHorizontal size={14} /></span><b>{client === "All clients" ? 12 : 1}</b><small>↑ 12 architecture only</small></article>
          <article className="territory-kpi"><span>Territory coverage <MoreHorizontal size={14} /></span><div>{regions.slice(1, 10).map((item) => <i key={item}>{item}</i>)}</div></article>
          <article><span>Funding deployed <MoreHorizontal size={14} /></span><b>${(vsrTrackerRows.filter((row) => row.status === "Funded").length * 24).toLocaleString()}K</b><small>Aggregated approved dollar</small></article>
        </section>
        <div className="reference-grid top-grid">
          <Panel title="System health monitor" subtitle="Time-series: API request volume and error rates" className="health-panel"><div className="alert-tag"><AlertTriangle size={11} /> Alerts</div><ResponsiveContainer width="100%" height="100%"><AreaChart data={healthData} margin={{ top: 16, right: 18, left: -12, bottom: 0 }}><CartesianGrid stroke="#edf0ed" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 8, fill: "#68766f" }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fontSize: 8, fill: "#68766f" }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: "#68766f" }} axisLine={false} tickLine={false} /><Tooltip /><Area yAxisId="left" type="monotone" dataKey="requests" stroke="#158e88" fill="#d8f0ec" strokeWidth={2} /><Area yAxisId="right" type="monotone" dataKey="errors" stroke="#c99d47" fill="transparent" strokeWidth={1.5} /></AreaChart></ResponsiveContainer><div className="chart-legend"><span><i className="teal-dot" /> API Request Volume</span><span><i className="gold-dot" /> Error Rates</span></div></Panel>
          <Panel title="Headcount by role & region" subtitle="Constraint & raw data" className="role-panel"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={roleBreakdown} dataKey="value" nameKey="name" innerRadius="42%" outerRadius="72%" paddingAngle={1}><>{roleBreakdown.map((item) => <Cell key={item.name} fill={item.color} />)}</></Pie><Tooltip /></PieChart></ResponsiveContainer><div className="ring-label">{filteredStaff.length}<small>STAFF</small></div></Panel>
          <Panel title="Funding deployment funnel" subtitle="Proposed → Funded → Deployed" className="funnel-panel"><ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip /><Funnel dataKey="value" data={funding} isAnimationActive><LabelList position="right" fill="#5e6a62" stroke="none" dataKey="name" />{funding.map((item, index) => <Cell key={item.name} fill={["#356bc2", "#85c83b", "#e89a26"][index]} />)}</Funnel></FunnelChart></ResponsiveContainer></Panel>
        </div>
        <div className="reference-grid bottom-grid">
          <Panel title="Recent audit trail entries" subtitle="Constraint 20" className="audit-panel"><div className="audit-table"><div className="audit-head"><span>User</span><span>Action</span><span>Item</span><span>Timestamp</span></div>{["Action Log", "Action Log", "Bench mark", "API Request Volume", "Action Log"].map((item, index) => <div key={`${item}-${index}`}><span>KEA Administor</span><span>{item}</span><span>{index % 2 ? "Merchandisers supervisors" : "Merchandisers here"}</span><span>27 Jun 2026 3:2{index} PM</span></div>)}</div></Panel>
          <Panel title="Data quality audit" subtitle="Overview in state-level error (as mentioned in meeting update)" className="quality-panel"><div className="quality-table"><div className="audit-head"><span>State</span><span>Error</span><span>Region</span><span>Error</span></div>{qualityRows.map((item) => <div key={item.state}><span>{item.state}</span><span>{item.errors}</span><span>{item.region}</span><span>{item.error}</span></div>)}</div></Panel>
        </div>
        <div className="reference-map-row"><Panel title="Territories & routes" subtitle={`${filteredStaff.length} filtered field records · interactive map scope`} className="reference-map-panel"><OperationsMap staff={filteredStaff} selected={selectedPin} onSelect={setSelectedPin} region={region} role={role} /></Panel><div className="reference-map-summary"><h3>Data scope</h3><p><ShieldCheck size={14} /> Filters are applied to staff, charts, and map pins.</p><p><Flag size={14} /> {vsrTrackerRows.filter((row) => row.status === "Awaiting Funding").length} VSR records await funding.</p><p><PieIcon size={14} /> {roleBreakdown.filter((item) => item.value > 0).length} active role groups.</p></div></div>
      </div>
    </main>
  </div>;
}
