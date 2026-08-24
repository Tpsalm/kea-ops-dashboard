"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, CheckCircle2, Download, Eye, MapPin, ShieldCheck, TrendingUp, Users, X } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../components/app-shell";
import { FilterBar, KpiGrid, PageHeading, SelectBox } from "../shared";
import { activities as allActivities, allStaff, clients, products as allProducts, stores as allStores, type Client } from "../hierarchy-data";

const OperationsMap = dynamic(() => import("../operations-map"), { ssr: false, loading: () => <div className="map-loading">Loading map...</div> });
const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6"];
function average(values: number[]) { return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }

export default function ClientPortalPage() {
  const [clientFilter, setClientFilter] = useState("All clients");
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [selectedPin, setSelectedPin] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [detail, setDetail] = useState<{ title: string; text: string } | null>(null);
  const client = useMemo<Client>(() => clientFilter === "All clients" ? { id: "all", name: "All clients", sector: "All projects", stores: allStores.length, completion: "", status: "Active" } : clients.find(item => item.name === clientFilter) ?? clients[0], [clientFilter]);
  const staff = useMemo(() => allStaff.filter(item => (clientFilter === "All clients" || item.clientId === client.id) && (region === "All regions" || item.region === region) && (role === "All roles" || item.role === role)), [client, clientFilter, region, role]);
  const stores = useMemo(() => allStores.filter(item => {
    if (clientFilter !== "All clients" && item.clientId !== client.id) return false;
    if (region !== "All regions" && item.region !== region) return false;
    if (role === "All roles") return true;
    if (role === "Merchandiser") return staff.some(member => member.id === item.merchandiserId);
    if (role === "Supervisor") return staff.some(member => member.id === item.supervisorId);
    if (role === "TSR") return staff.some(member => member.id === item.tsrId);
    return staff.some(member => member.role === "VSR" && member.territory === item.territory);
  }), [client, clientFilter, region, role, staff]);
  const products = useMemo(() => allProducts.filter(item => stores.some(store => store.id === item.storeId)), [stores]);
  const activities = useMemo(() => {
    const latest = Math.max(...allActivities.map(item => Date.parse(item.date)));
    const rangeDays = dateRange === "Today" ? 1 : dateRange === "Last 7 days" ? 7 : dateRange === "This quarter" ? 92 : 30;
    return allActivities.filter(item => staff.some(member => member.id === item.staffId) && latest - Date.parse(item.date) < rangeDays * 24 * 60 * 60 * 1000);
  }, [dateRange, staff]);
  const completion = average(staff.map(item => item.completion));
  const activityTrend = useMemo(() => {
    const daily = new Map<string, { day: string; visits: number; checks: number }>();
    activities.forEach(activity => {
      const entry = daily.get(activity.date) ?? { day: activity.date.slice(5), visits: 0, checks: 0 };
      if (activity.type === "Store visit") entry.visits += 1;
      if (activity.type === "Product check") entry.checks += 1;
      daily.set(activity.date, entry);
    });
    return [...daily.values()].sort((a, b) => a.day.localeCompare(b.day));
  }, [activities]);
  const workforceMix = ["Merchandiser", "VSR", "Supervisor", "TSR"].map(role => ({ name: role, value: staff.filter(item => item.role === role).length }));
  const completionByRegion = [...new Set(stores.map(store => store.region))].map(region => ({ name: region, planned: stores.filter(store => store.region === region).length + 2, completed: stores.filter(store => store.region === region && store.status === "Healthy").length + 1 }));
  const kpis = [
    { label: "Total activities", value: activities.length.toLocaleString(), trend: "8.1%", up: true, sub: "vs previous period", icon: BarChart3, tone: "blue" },
    { label: "Overall completion", value: `${completion}%`, trend: "4.6%", up: true, sub: "vs previous period", icon: CheckCircle2, tone: "teal" },
    { label: "Average staff output", value: String(average(staff.map(item => item.visits))), trend: "3.8%", up: true, sub: "visits per day", icon: Users, tone: "violet" },
    { label: "Quality score", value: `${average(activities.map(item => item.completion))}%`, trend: "2.1%", up: true, sub: "field audit score", icon: CheckCircle2, tone: "amber" },
  ];
  const openDetail = (title: string, text: string) => setDetail({ title, text });

  return <AppShell>
    <PageHeading eyebrow="OPERATIONS ANALYTICS · PERFORMANCE" title="Performance" subtitle={`Understand productivity, completion, and workforce output for ${client.name}.`} actions={<><SelectBox label="DATE RANGE" value={dateRange} options={["Today", "Last 7 days", "Last 30 days", "This quarter"]} onChange={setDateRange} /><button className="primary" onClick={() => openDetail("Client report", `${client.name} has ${activities.length} activities across ${stores.length} stores.`)}><Download size={16} /> Export</button></>} />
    <FilterBar region={region} onRegion={value => { setRegion(value); setSelectedPin(0); }} role={role} onRole={value => { setRole(value); setSelectedPin(0); }} client={clientFilter} onClient={value => { setClientFilter(value); setSelectedPin(0); }} onReset={() => { setRegion("All regions"); setRole("All roles"); setClientFilter("All clients"); setDateRange("Last 30 days"); setSelectedPin(0); }} />
    <KpiGrid items={kpis} focus="" onFocus={label => openDetail(label, `${label}: ${kpis.find(item => item.label === label)?.value ?? "0"}.`)} />
    <section className="row charts-row client-top-row">
      <article className="card chart-clickable" role="button" tabIndex={0} onClick={() => openDetail("Activity breakdown", `${activities.length} activities are recorded for ${client.name}. The trend shows visits and product checks across the reporting period.`)}><div className="card-head"><div><h2>Activity breakdown</h2><p>Visits and product checks over time</p></div><div className="legend"><span><i className="blue" />Visits</span><span><i className="teal" />Product checks</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activityTrend} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><defs><linearGradient id="clientActivityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={.2} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} /><Tooltip /><Area type="monotone" dataKey="checks" stroke="#14b8a6" strokeWidth={2} fill="transparent" /><Area type="monotone" dataKey="visits" stroke="#2563eb" strokeWidth={2.5} fill="url(#clientActivityFill)" /></AreaChart></ResponsiveContainer></div></article>
      <article className="card chart-clickable" role="button" tabIndex={0} onClick={() => openDetail("Workforce mix", `${staff.length} staff assigned: ${workforceMix.filter(item => item.value).map(item => `${item.value} ${item.name}`).join(", ") || "none"}.`)}><div className="card-head"><div><h2>Workforce mix</h2><p>Active staff by role</p></div></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={workforceMix} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">{workforceMix.map((item, index) => <Cell key={item.name} fill={colors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-total"><strong>{staff.length}</strong><span>STAFF</span></div></div><div className="role-legend">{workforceMix.map((item, index) => <div key={item.name}><span><i style={{ background: colors[index] }} />{item.name}</span><b>{item.value}</b></div>)}</div></article>
    </section>
    <section className="row charts-row client-bottom-row">
      <article className="card chart-clickable" role="button" tabIndex={0} onClick={() => openDetail("Visit completion", `${completion}% overall completion across ${stores.length} covered stores.`)}><div className="card-head"><div><h2>Visit completion</h2><p>Planned vs completed by region</p></div><span className="text-btn">Details <Eye size={14} /></span></div><div className="completion-summary"><strong>{completion}%</strong><span><TrendingUp size={13} /> 4.6%</span><small>overall completion</small></div><div className="bar-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={completionByRegion}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 10 }} /><Tooltip /><Bar dataKey="planned" fill="var(--bar-muted)" radius={[5, 5, 0, 0]} /><Bar dataKey="completed" fill="#2563eb" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
      <article className="card"><div className="card-head"><div><h2>Performance notes</h2><p>Signals from the current operating period</p></div></div><div style={{ padding: 16, display: "grid", gap: 9 }}><button className="modal-row" onClick={() => openDetail("Coverage is trending up", `${stores.filter(store => store.status === "Healthy").length} of ${stores.length} stores are healthy.`)}><CheckCircle2 size={18} color="#0c9b6b" /><span><b>Coverage is trending up</b><small>Healthy locations are being maintained.</small></span></button><button className="modal-row" onClick={() => openDetail("Activity volume is healthy", `${activities.filter(activity => activity.completion >= 90).length} activities reached at least 90% completion.`)}><TrendingUp size={18} color="#14b8a6" /><span><b>Activity volume is healthy</b><small>Visits and product checks are above target.</small></span></button><button className="secondary" onClick={() => setMapOpen(!mapOpen)}><MapPin size={14} /> {mapOpen ? "Hide coverage map" : "Open coverage map"}</button></div></article>
    </section>
    {mapOpen && <section className="card map-card"><div className="card-head"><div><h2>Client geographic coverage</h2><p>{stores.length} stores · click a marker for location details</p></div><span className="live-badge"><i /> LIVE</span></div><OperationsMap staff={staff} selected={selectedPin} onSelect={setSelectedPin} region="All regions" role="All roles" /></section>}
    <footer style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 12 }}><span>KEA Operations Intelligence · Client Portal</span><span><ShieldCheck size={12} /> Data isolated to {client.name}</span></footer>
    {detail && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDetail(null); }}><section className="action-modal" role="dialog" aria-modal="true" aria-label={detail.title}><div className="modal-head"><div><small>CLIENT DETAIL</small><h2>{detail.title}</h2></div><button type="button" onClick={() => setDetail(null)} aria-label="Close detail"><X size={18} /></button></div><div className="modal-body"><p style={{ margin: 0, lineHeight: 1.6, color: "var(--muted)" }}>{detail.text}</p><div className="modal-actions"><button className="primary" onClick={() => setDetail(null)}>Close</button></div></div></section></div>}
  </AppShell>;
}
