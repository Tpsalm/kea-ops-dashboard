"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, CheckCircle2, Download, Eye, MapPin, ShieldCheck, TrendingUp, Users, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../components/app-shell";
import { KpiGrid, PageHeading, SelectBox } from "../shared";
import { allStaff, clients, getActivitiesByClient, getProductsByClient, getStoresByClient, type Client } from "../hierarchy-data";

const OperationsMap = dynamic(() => import("../operations-map"), { ssr: false, loading: () => <div className="map-loading">Loading map...</div> });
const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6"];
function average(values: number[]) { return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }

export default function ClientPortalPage() {
  const [clientId, setClientId] = useState(clients[0].id);
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [selectedPin, setSelectedPin] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [detail, setDetail] = useState<{ title: string; text: string } | null>(null);
  const client = useMemo<Client>(() => clients.find(item => item.id === clientId) ?? clients[0], [clientId]);
  const staff = useMemo(() => allStaff.filter(item => item.clientId === clientId), [clientId]);
  const stores = useMemo(() => getStoresByClient(clientId), [clientId]);
  const products = useMemo(() => getProductsByClient(clientId), [clientId]);
  const activities = useMemo(() => getActivitiesByClient(clientId), [clientId]);
  const completion = average(staff.map(item => item.completion));
  const activityBreakdown = ["Store visit", "Product check", "Merchandising", "Route completion", "Evidence upload"].map(type => ({ name: type.replace("Store visit", "Visits").replace("Product check", "Checks").replace("Route completion", "Routes").replace("Evidence upload", "Evidence"), total: activities.filter(activity => activity.type === type).length }));
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
    <section className="filters" style={{ justifyContent: "space-between", marginBottom: 10 }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{clients.map(item => <button key={item.id} className={`secondary ${clientId === item.id ? "chosen" : ""}`} onClick={() => { setClientId(item.id); setSelectedPin(0); }}>{item.name}</button>)}</div><button className="reset" onClick={() => setDateRange("Last 30 days")}><TrendingUp size={14} /> Reset</button></section>
    <KpiGrid items={kpis} focus="" onFocus={label => openDetail(label, `${label}: ${kpis.find(item => item.label === label)?.value ?? "0"}.`)} />
    <section className="row charts-row client-top-row">
      <article className="card chart-clickable" role="button" tabIndex={0} onClick={() => openDetail("Activity breakdown", `${activities.length} activities recorded for ${client.name}, grouped by operational type.`)}><div className="card-head"><div><h2>Activity breakdown</h2><p>Work completed by activity type</p></div><div className="legend"><span><i className="blue" />Completed work</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={activityBreakdown}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 10 }} /><Tooltip /><Bar dataKey="total" name="Activities" fill="#2563eb" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
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
