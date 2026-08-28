"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Activity, BarChart3, Bell, Building2, CalendarDays, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Download,
  FileSpreadsheet, Filter, LayoutDashboard, Map, Menu, Moon, MoreHorizontal,
  PackageCheck, RefreshCw, Route, Search, Settings, ShieldCheck, Store, Sun,
  TrendingDown, TrendingUp, UserRound, Users, X, Zap, Network, KeyRound
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { nigeriaLocations } from "./nigeria-locations";

const OperationsMap = dynamic(() => import("./operations-map"), {
  ssr: false,
  loading: () => <div className="map-loading"><RefreshCw size={20} /> Loading live Nigerian map…</div>,
});

type Role = "VSR" | "TSR" | "Supervisor" | "Merchandiser";
type Status = "Active" | "On route" | "Needs review" | "Inactive";
type Staff = {
  id: string; name: string; role: Role; region: string; territory: string;
  route: string; status: Status; visits: number; completion: number;
  lat: number; lng: number;
};

// Real Nigerian city coordinates by territory, with small offsets so multiple
// staff in the same territory render as distinct pins on the map.
const staff: Staff[] = [
  { id: "KEA-1048", name: "Shittu Akinsanya", role: "VSR", region: "Lagos", territory: "Lagos Central", route: "Ikeja North", status: "On route", visits: 31, completion: 94, lat: 6.6018, lng: 3.3515 },
  { id: "KEA-1082", name: "Abel Nduka", role: "VSR", region: "Lagos", territory: "Lagos West", route: "Surulere A2", status: "Active", visits: 28, completion: 91, lat: 6.4969, lng: 3.3532 },
  { id: "KEA-1103", name: "Maria Uchechukwu", role: "Merchandiser", region: "Lagos", territory: "Lagos Island", route: "VI Retail", status: "Active", visits: 34, completion: 97, lat: 6.4281, lng: 3.4219 },
  { id: "KEA-1127", name: "Oluchukwu Onyeike", role: "Supervisor", region: "Lagos", territory: "Lagos Central", route: "8 stores", status: "Active", visits: 29, completion: 88, lat: 6.6108, lng: 3.3605 },
  { id: "KEA-1164", name: "Paul Olakonipekun", role: "VSR", region: "Ogun", territory: "Abeokuta", route: "ABK North", status: "Needs review", visits: 18, completion: 63, lat: 7.1475, lng: 3.3619 },
  { id: "KEA-1190", name: "Abubakar Hassan", role: "TSR", region: "Lagos", territory: "Lagos West", route: "4 teams", status: "Active", visits: 32, completion: 95, lat: 6.5049, lng: 3.3612 },
  { id: "KEA-1206", name: "Ologbonori Toyosi", role: "Merchandiser", region: "Ogun", territory: "Ijebu", route: "Ijebu Retail", status: "On route", visits: 26, completion: 86, lat: 6.8200, lng: 3.9165 },
  { id: "KEA-1221", name: "Timothy Ogunmokun", role: "VSR", region: "Ogun", territory: "Abeokuta", route: "ABK South", status: "Inactive", visits: 12, completion: 48, lat: 7.1385, lng: 3.3529 },
  { id: "KEA-1245", name: "Jonathan Okena", role: "Merchandiser", region: "Oyo", territory: "Ibadan", route: "Ring Road", status: "Active", visits: 30, completion: 93, lat: 7.3776, lng: 3.9470 },
  { id: "KEA-1263", name: "Moses Akindiran", role: "Supervisor", region: "Lagos", territory: "Lagos East", route: "11 stores", status: "Active", visits: 27, completion: 89, lat: 6.4550, lng: 3.5450 },
  { id: "KEA-1281", name: "Ikechukwu Maduora", role: "VSR", region: "Delta", territory: "Asaba", route: "Asaba Core", status: "Needs review", visits: 16, completion: 59, lat: 6.1982, lng: 6.7319 },
  { id: "KEA-1309", name: "Arorundade Adewale", role: "Merchandiser", region: "Oyo", territory: "Ibadan", route: "Dugbe Retail", status: "Active", visits: 33, completion: 96, lat: 7.3866, lng: 3.9560 },
  { id: "KEA-1341", name: "Yusuf Abimbola Rasheed", role: "TSR", region: "Ogun", territory: "Abeokuta", route: "6 teams", status: "Active", visits: 30, completion: 92, lat: 7.1560, lng: 3.3710 },
  { id: "KEA-1367", name: "Abiola Felicia Omowuni", role: "Merchandiser", region: "Lagos", territory: "Lagos Island", route: "Marina Retail", status: "Active", visits: 25, completion: 84, lat: 6.4381, lng: 3.4319 },
  { id: "KEA-1389", name: "Michael Olayiwola", role: "Supervisor", region: "Ogun", territory: "Ijebu", route: "5 stores", status: "Active", visits: 24, completion: 82, lat: 6.8300, lng: 3.9265 },
];

const activityData = [
  { day: "01 Aug", visits: 282, checks: 350 }, { day: "04 Aug", visits: 335, checks: 398 },
  { day: "07 Aug", visits: 312, checks: 376 }, { day: "10 Aug", visits: 401, checks: 455 },
  { day: "13 Aug", visits: 372, checks: 442 }, { day: "16 Aug", visits: 448, checks: 516 },
  { day: "19 Aug", visits: 421, checks: 485 }, { day: "22 Aug", visits: 502, checks: 570 },
  { day: "25 Aug", visits: 478, checks: 544 }, { day: "28 Aug", visits: 542, checks: 618 },
];
const completionData = [
  { name: "Lagos", planned: 1240, completed: 1128 }, { name: "Ogun", planned: 810, completed: 682 },
  { name: "Oyo", planned: 690, completed: 601 }, { name: "Delta", planned: 430, completed: 344 },
  { name: "Enugu", planned: 380, completed: 325 }
];
const roleData = [
  { name: "Merchandisers", value: 182, color: "#2563eb" }, { name: "VSRs", value: 96, color: "#14b8a6" },
  { name: "Supervisors", value: 28, color: "#f59e0b" }, { name: "TSRs", value: 14, color: "#8b5cf6" }
];
const nav = [
  { label: "Overview", icon: LayoutDashboard, path: "/" }, { label: "Live map", icon: Map, path: "/live-map" },
  { label: "Workforce", icon: Users, path: "/workforce" }, { label: "Stores & products", icon: Store, path: "/stores" },
  { label: "Performance", icon: BarChart3, path: "/performance" },
  { label: "Client portal", icon: Building2, path: "/client-portal" }
];

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{name:string; value:number; color:string}>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tip"><b>{label}</b>{payload.map((p) => <span key={p.name}><i style={{background:p.color}} />{p.name}: <strong>{p.value.toLocaleString()}</strong></span>)}</div>;
}

function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (s:string)=>void }) {
  return <label className="select-box"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={14}/></label>;
}

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [activeNav] = useState("Overview");
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [period, setPeriod] = useState("Last 30 days");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<keyof Staff>("completion");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedPin, setSelectedPin] = useState(0);
  const [notice, setNotice] = useState("");
  const [kpiFocus, setKpiFocus] = useState("All operations");
  const [client, setClient] = useState("All clients");
  const [panel, setPanel] = useState<null | "data" | "reports" | "settings" | "activity" | "workforce" | "completion" | "filters" | "profile" | "client" | "model">(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [fullMap, setFullMap] = useState(false);

  const filtered = useMemo(() => staff.filter(s =>
    (region === "All regions" || s.region === region) &&
    (role === "All roles" || s.role === role) &&
    (client === "All clients" || (client === "Nova Consumer" ? s.id !== "KEA-1082" && s.id !== "KEA-1206" : s.id === "KEA-1082" || s.id === "KEA-1206")) &&
    (`${s.name} ${s.id} ${s.territory}`.toLowerCase().includes(query.toLowerCase()))
  ).sort((a,b) => {
    const av = a[sort], bv = b[sort];
    return (typeof av === "number" && typeof bv === "number" ? av-bv : String(av).localeCompare(String(bv))) * (asc ? 1 : -1);
  }), [region, role, client, query, sort, asc]);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2600); }
  function exportReport(_format: "csv" | "pbix") { flash("Downloads are managed by your administrator"); }
  function goTo(id: string) { window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  function chooseSort(key: keyof Staff) { if (sort === key) setAsc(!asc); else { setSort(key); setAsc(true); } }
  function reset() { setRegion("All regions"); setRole("All roles"); setPeriod("Last 30 days"); setQuery(""); setClient("All clients"); setKpiFocus("All operations"); setSelectedPin(0); setPage(1); flash("All filters reset"); }
  function selectRegion(value: string) {
    setRegion(value);
    const first = value === "All regions" ? 0 : staff.findIndex(s => s.region === value);
    setSelectedPin(first >= 0 ? first : 0);
    setPage(1);
  }

  const periodFactor = period === "Today" ? 0.08 : period === "Last 7 days" ? 0.24 : period === "This quarter" ? 2.8 : 1;
  const scopeFactor = staff.length ? Math.max(filtered.length / staff.length, 0.05) : 0;
  const clientFactor = client === "All clients" ? 1 : client === "Nova Consumer" ? 0.58 : 0.42;
  const activeStaff = filtered.filter(member => member.status !== "Inactive").length;
  const storesCovered = Math.round(1248 * scopeFactor * clientFactor);
  const activitiesCompleted = Math.round(4862 * scopeFactor * clientFactor * periodFactor);
  const productsMonitored = Math.max(1, Math.round(386 * scopeFactor * clientFactor));
  const completionRate = filtered.length ? Math.round(filtered.reduce((sum, member) => sum + member.completion, 0) / filtered.length) : 0;
  const chartActivityData = activityData.map(point => ({ ...point, visits: Math.max(0, Math.round(point.visits * scopeFactor * clientFactor * periodFactor)), checks: Math.max(0, Math.round(point.checks * scopeFactor * clientFactor * periodFactor)) }));
  const chartRoleData = (["Merchandiser", "VSR", "Supervisor", "TSR"] as Role[]).map((staffRole, index) => ({ name: `${staffRole}s`, value: filtered.filter(member => member.role === staffRole).length, color: roleData[index].color }));
  const chartCompletionData = ["Lagos", "Ogun", "Oyo", "Delta", "Enugu"].map(name => {
    const regionStaff = filtered.filter(member => member.region === name);
    const planned = Math.round((regionStaff.reduce((sum, member) => sum + member.visits, 0) + regionStaff.length * 5) * periodFactor);
    const completion = regionStaff.length ? regionStaff.reduce((sum, member) => sum + member.completion, 0) / regionStaff.length / 100 : 0;
    return { name, planned, completed: Math.min(planned, Math.round(planned * completion)) };
  });
  const kpis = [
    { label:"Active field staff", value: activeStaff.toLocaleString(), trend: activeStaff ? "8.2%" : "0%", up: activeStaff > 0, sub:"matching current filters", icon:Users, tone:"blue" },
    { label:"Stores covered", value: storesCovered.toLocaleString(), trend: scopeFactor > .5 ? "12.4%" : "4.1%", up: storesCovered > 0, sub:`${completionRate}% average completion`, icon:Store, tone:"teal" },
    { label:"Activities completed", value: activitiesCompleted.toLocaleString(), trend: periodFactor < 1 ? "6.1%" : "8.6%", up: activitiesCompleted > 0, sub:`${period} activity scope`, icon:ClipboardCheck, tone:"violet" },
    { label:"Products monitored", value: productsMonitored.toLocaleString(), trend: role === "All roles" ? "2.3%" : "5.8%", up: productsMonitored > 0, sub:`${role === "All roles" ? "all roles" : role} coverage`, icon:PackageCheck, tone:"amber" },
  ];

  return <div className={dark ? "app dark" : "app"}>
    {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
    <aside className={mobileNav ? "sidebar open" : "sidebar"}>
      <div className="brand"><div className="brand-logo" aria-label="KEA Corporate Hospitality Services"><b className="logo-k">k</b><b className="logo-e">e</b><b className="logo-a">a</b><small>Corporate Hospitality Services</small></div><div><strong>KEA GROUP</strong><span>Talent Management System</span></div><button className="close-nav" onClick={()=>setMobileNav(false)}><X size={20}/></button></div>
      <div className="workspace"><div className="avatar">KG</div><div><small>WORKSPACE</small><b>KEA GROUP</b></div><ChevronDown size={15}/></div>
      <nav><p>ANALYTICS</p>{nav.map(({label,icon:Icon,path})=><Link key={label} href={path} className={activeNav===label?"active":""} onClick={()=>setMobileNav(false)}><Icon size={18}/><span>{label}</span>{label==="Live map"&&<i>LIVE</i>}</Link>)}</nav>
      <nav className="manage"><p>MANAGE</p><button type="button" onClick={()=>{setPanel("data");setMobileNav(false)}}><ShieldCheck size={18}/><span>Data quality</span></button><button type="button" onClick={()=>{setPanel("settings");setMobileNav(false)}}><Settings size={18}/><span>Settings</span></button></nav>
      <div className="sidebar-foot"><div className="user-avatar">KA</div><div><b>KEA Administrator</b><span>Operations · Full access</span></div><MoreHorizontal size={18}/></div>
    </aside>

    <main className="main">
      <header className="topbar"><button type="button" className="mobile-menu" onClick={()=>setMobileNav(true)} aria-label="Open navigation"><Menu size={21}/></button><div className="top-search"><Search size={17}/><input id="global-search" placeholder="Search people, stores, routes..." value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/><kbd>⌘ K</kbd></div><div className="top-actions"><button type="button" onClick={()=>setDark(!dark)} aria-label="Toggle dark mode">{dark?<Sun size={19}/>:<Moon size={19}/>}</button><button type="button" className="bell" onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-label="Open notifications"><Bell size={19}/><i/></button><button type="button" className="user-avatar small profile-button" onClick={()=>setPanel("profile")} aria-label="Open profile">KA</button></div>{notificationsOpen&&<div className="notification-popover"><div><b>Notifications</b><button type="button" onClick={()=>setNotificationsOpen(false)}><X size={15}/></button></div><p><span className="notice-dot"/> Lagos Central reached 92% coverage.</p><p><span className="notice-dot teal"/> 142 stores were added this month.</p><button type="button" onClick={()=>{setNotificationsOpen(false);flash("Notifications marked as read")}}>Mark all as read</button></div>}</header>

      <div className="content" id="overview">
        <section className="heading"><div><div className="eyebrow"><span className="live-dot"/> LIVE TALENT OPERATIONS · UPDATED 4 MIN AGO</div><h1>KEA Talent Management System</h1><p>KEA Group workforce, outlet, and field performance at a glance.</p></div></section>

        <section className="filters"><div className="filter-title"><Filter size={16}/><b>Filters</b></div><SelectBox label="DATE RANGE" value={period} options={["Today","Last 7 days","Last 30 days","This quarter"]} onChange={setPeriod}/><SelectBox label="REGION" value={region} options={["All regions","Lagos","Ogun","Oyo","Delta"]} onChange={selectRegion}/><SelectBox label="ROLE" value={role} options={["All roles","VSR","TSR","Supervisor","Merchandiser"]} onChange={v=>{setRole(v);setPage(1)}}/><label className="select-box wide"><span>CLIENT</span><select value={client} onChange={e=>{setClient(e.target.value);setKpiFocus(e.target.value==="All clients"?"All operations":e.target.value+" contract")}}><option>All clients</option><option>Nova Consumer</option><option>Aria Foods</option></select><ChevronDown size={14}/></label><button className="reset" onClick={reset}><RefreshCw size={14}/> Reset</button></section>

        <div className="view-context"><span>Showing: <b>{kpiFocus}</b></span>{kpiFocus!=="All operations"&&<button onClick={()=>setKpiFocus("All operations")}><X size={13}/> Clear focus</button>}</div>

        <section className="kpi-grid">{kpis.map(({label,value,trend,up,sub,icon:Icon,tone})=><button className={`kpi ${kpiFocus===label?"selected":""}`} key={label} onClick={()=>setKpiFocus(label)}><div className={`kpi-icon ${tone}`}><Icon size={20}/></div><MoreHorizontal className="kpi-more" size={18}/><span>{label}</span><strong>{value}</strong><div className={up?"trend up":"trend down"}>{up?<TrendingUp size={14}/>:<TrendingDown size={14}/>}<b>{trend}</b><small>{sub}</small></div></button>)}</section>

        <section className="row charts-row" id="performance">
          <article className="card activity-card"><div className="card-head"><div><h2>Field activity</h2><p>Visits and product checks over time</p></div><div className="legend"><span><i className="blue"/>Visits</span><span><i className="teal"/>Product checks</span><button type="button" aria-label="Field activity options" onClick={()=>setPanel("activity")}><MoreHorizontal size={18}/></button></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartActivityData} margin={{top:10,right:8,left:-22,bottom:0}}><defs><linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={.22}/><stop offset="100%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:11}}/><Tooltip content={<Tip/>}/><Area type="monotone" dataKey="checks" stroke="#14b8a6" strokeWidth={2} fill="transparent"/><Area type="monotone" dataKey="visits" stroke="#2563eb" strokeWidth={2.5} fill="url(#blueFill)"/></AreaChart></ResponsiveContainer></div></article>
          <article className="card workforce-card"><div className="card-head"><div><h2>Workforce mix</h2><p>Active staff by role</p></div><button type="button" aria-label="Workforce chart options" onClick={()=>setPanel("workforce")}><MoreHorizontal size={18}/></button></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartRoleData} innerRadius={62} outerRadius={82} paddingAngle={3} dataKey="value" stroke="none">{chartRoleData.map(d=><Cell key={d.name} fill={d.color}/>)}</Pie><Tooltip content={<Tip/>}/></PieChart></ResponsiveContainer><div className="donut-total"><strong>{filtered.length}</strong><span>STAFF</span></div></div><div className="role-legend">{chartRoleData.map(d=><div key={d.name}><span><i style={{background:d.color}}/>{d.name}</span><b>{d.value}</b></div>)}</div></article>
        </section>

        <section className="row ops-row">
          <article className="card map-card" id="live-map"><div className="card-head"><div><h2>Geographic operations</h2><p>Live Nigerian map · every staff member with GPS coordinates</p></div><button type="button" className="text-btn" onClick={()=>setFullMap(true)}>Open full map <ChevronRight size={15}/></button></div><OperationsMap staff={staff} selected={selectedPin} onSelect={setSelectedPin} region={region} role={role}/></article>
          <article className="card completion-card"><div className="card-head"><div><h2>Visit completion</h2><p>Planned vs completed by region</p></div><button type="button" aria-label="Completion chart options" onClick={()=>setPanel("completion")}><MoreHorizontal size={18}/></button></div><div className="completion-summary"><strong>{completionRate}%</strong><span><TrendingUp size={13}/> {completionRate ? "4.6%" : "0%"}</span><small>current filtered completion</small></div><div className="bar-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartCompletionData} margin={{top:5,right:5,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:10}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"var(--muted)",fontSize:10}}/><Tooltip content={<Tip/>}/><Bar dataKey="planned" fill="var(--bar-muted)" radius={[4,4,0,0]}/><Bar dataKey="completed" fill="#2563eb" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></article>
        </section>

        <section className="card table-card" id="workforce"><div className="card-head table-head"><div><h2>Workforce performance</h2><p>Live performance across active field teams</p></div><div className="table-tools"><div className="mini-search"><Search size={15}/><input placeholder="Search workforce" value={query} onChange={e=>setQuery(e.target.value)}/></div><button type="button" className="secondary" onClick={()=>setPanel("filters")}><Filter size={15}/> Filter</button><button className="secondary" onClick={()=>exportReport("csv")}><Download size={15}/></button></div></div><div className="table-scroll"><table><thead><tr><th onClick={()=>chooseSort("name")}>Team member ↕</th><th onClick={()=>chooseSort("role")}>Role ↕</th><th>Region / territory</th><th>Assignment</th><th>Status</th><th onClick={()=>chooseSort("visits")}>Visits ↕</th><th onClick={()=>chooseSort("completion")}>Completion ↕</th><th></th></tr></thead><tbody>{filtered.slice((page-1)*6,page*6).map(s=><tr key={s.id}><td data-label="Team member"><div className="person"><div>{s.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</div><span><b>{s.name}</b><small>{s.id}</small></span></div></td><td data-label="Role"><span className={`role-badge ${s.role.toLowerCase()}`}>{s.role}</span></td><td data-label="Region"><b className="cell-main">{s.region}</b><small className="cell-sub">{s.territory}</small></td><td data-label="Assignment">{s.route}</td><td data-label="Status"><span className={`status ${s.status.toLowerCase().replace(" ","-")}`}><i/>{s.status}</span></td><td data-label="Visits"><b>{s.visits}</b></td><td data-label="Completion"><div className="progress-cell"><div><i style={{width:`${s.completion}%`}}/></div><b>{s.completion}%</b></div></td><td data-label=""><button type="button" aria-label={`View ${s.name}`} onClick={()=>setSelectedStaff(s)}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty"><CircleHelp size={24}/><b>No matching staff</b><span>Try changing your filters or search.</span></div>}</div><div className="pagination"><span>Showing {filtered.length?Math.min((page-1)*6+1,filtered.length):0}–{Math.min(page*6,filtered.length)} of {filtered.length}</span><div><button disabled={page===1} onClick={()=>setPage(Math.max(1,page-1))}><ChevronLeft size={16}/></button><button className="page-active">{page}</button><button disabled={page*6>=filtered.length} onClick={()=>setPage(page+1)}><ChevronRight size={16}/></button></div></div></section>

        <footer><span>KEA GROUP · Secure talent workspace</span><span><Zap size={13}/> All systems operational</span></footer>
      </div>
    </main>

    {panel && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setPanel(null)}}><section className={panel==="model"?"action-modal model-modal":"action-modal"} role="dialog" aria-modal="true" aria-label="Dashboard action panel"><div className="modal-head"><div><small>KEA OPERATIONS</small><h2>{panel==="data"?"Data quality":panel==="reports"?"Reports & exports":panel==="settings"?"Display settings":panel==="activity"?"Field activity options":panel==="workforce"?"Workforce mix options":panel==="completion"?"Visit completion options":panel==="filters"?"Advanced workforce filters":panel==="profile"?"Administrator profile":panel==="model"?"KEA operational data model":"Client dashboard"}</h2></div><button type="button" onClick={()=>setPanel(null)} aria-label="Close panel"><X size={19}/></button></div><div className="modal-body">
      {panel==="data"&&<><div className="healthy-state"><CheckCircle2 size={25}/><div><b>All records are healthy</b><span>GPS, staff IDs and product records are validated.</span></div></div><button type="button" className="modal-row" onClick={()=>{setPanel(null);flash("Data validation completed successfully")}}><RefreshCw size={17}/><span><b>Run validation now</b><small>Recheck the current operational dataset</small></span><ChevronRight size={16}/></button></>}
      {panel==="model"&&<div className="model-view"><div className="model-summary"><Network size={20}/><div><b>Operational relationship model</b><span>Normalized hierarchy powering workforce, geographic, merchandising and client reporting.</span></div><em>12 entities · 13 relationships</em></div><div className="model-scroll"><div className="shared-dimensions"><div className="entity-card dimension"><div><Building2 size={15}/><b>Client</b></div><span><KeyRound size={10}/> client_id <i>PK</i></span><span>client_name</span><span>contract_status</span></div><div className="relationship"><b>1</b><i/><b>∞</b></div><div className="entity-card dimension"><div><Map size={15}/><b>Geography</b></div><span><KeyRound size={10}/> geography_id <i>PK</i></span><span>region · state · LGA</span><span>territory_id <i>FK</i></span></div><div className="relationship"><b>1</b><i/><b>∞</b></div><div className="entity-card root"><div><Users size={15}/><b>TSR</b></div><span><KeyRound size={10}/> tsr_id <i>PK</i></span><span>territory_id <i>FK</i></span><span>staff_status</span></div></div><div className="model-branch"><header><Store size={15}/><span><b>Merchandising hierarchy</b><small>Store execution and product availability</small></span></header><div className="entity-flow">{[["Supervisor","supervisor_id","tsr_id"],["Merchandiser","merchandiser_id","supervisor_id"],["Store","store_id","merchandiser_id"],["Product","product_id","store_id"],["Activity","activity_id","product_id"]].map((entity,index)=><div className="flow-unit" key={entity[0]}><div className="entity-card"><div><b>{entity[0]}</b></div><span><KeyRound size={10}/> {entity[1]} <i>PK</i></span><span>{entity[2]} <i>FK</i></span></div>{index<4&&<div className="relationship"><b>1</b><i/><b>∞</b></div>}</div>)}</div></div><div className="model-branch vsr-branch"><header><Route size={15}/><span><b>VSR operations hierarchy</b><small>Route assignment and geographic coverage</small></span></header><div className="entity-flow compact"><div className="entity-card"><div><b>VSR</b></div><span><KeyRound size={10}/> vsr_id <i>PK</i></span><span>tsr_id <i>FK</i></span></div><div className="relationship"><b>1</b><i/><b>∞</b></div><div className="entity-card"><div><b>Route</b></div><span><KeyRound size={10}/> route_id <i>PK</i></span><span>vsr_id <i>FK</i></span></div><div className="relationship"><b>1</b><i/><b>∞</b></div><div className="entity-card"><div><b>Coverage Area</b></div><span><KeyRound size={10}/> coverage_id <i>PK</i></span><span>route_id <i>FK</i></span></div></div></div></div><div className="model-legend"><span><i className="pk-dot"/> PK · Primary key</span><span><i className="fk-dot"/> FK · Foreign key</span><span><b>1 — ∞</b> One-to-many relationship</span></div></div>}
      {panel==="reports"&&<div className="modal-grid"><button type="button" onClick={()=>{setPanel(null);exportReport("csv")}}><Download size={20}/><b>Workforce CSV</b><span>Filtered operational records</span></button><button type="button" onClick={()=>{setPanel(null);exportReport("pbix")}}><BarChart3 size={20}/><b>Power BI pack (.zip)</b><span>Extract, then use Get data ▸ Folder in Power BI Desktop</span></button></div>}
      {panel==="settings"&&<><p className="modal-label">COLOR THEME</p><div className="theme-options"><button type="button" className={!dark?"chosen":""} onClick={()=>{setDark(false);flash("Light theme applied")}}><Sun size={18}/> Light</button><button type="button" className={dark?"chosen":""} onClick={()=>{setDark(true);flash("Dark theme applied")}}><Moon size={18}/> Dark</button></div></>}
      {(panel==="activity"||panel==="workforce"||panel==="completion")&&<div className="modal-grid"><button type="button" onClick={()=>{setPanel(null);exportReport("csv")}}><Download size={20}/><b>Download data</b><span>Export the current filtered view</span></button><button type="button" onClick={()=>{setPanel(null);goTo("workforce")}}><Users size={20}/><b>View records</b><span>Open supporting workforce detail</span></button></div>}
      {panel==="filters"&&<><p className="modal-label">QUICK ROLE FILTER</p><div className="filter-buttons">{["All roles","VSR","TSR","Supervisor","Merchandiser"].map(r=><button type="button" key={r} className={role===r?"chosen":""} onClick={()=>setRole(r)}>{r}</button>)}</div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>{setRole("All roles");setRegion("All regions")}}>Clear</button><button type="button" className="primary" onClick={()=>{setPanel(null);setPage(1);flash("Workforce filters applied")}}>Apply filters</button></div></>}
      {panel==="profile"&&<><div className="profile-summary"><div className="user-avatar">KA</div><div><b>KEA Administrator</b><span>Operations · Full access</span></div></div><button type="button" className="modal-row" onClick={()=>{setPanel("settings")}}><Settings size={17}/><span><b>Display preferences</b><small>Theme and dashboard appearance</small></span><ChevronRight size={16}/></button><button type="button" className="modal-row" onClick={()=>{setPanel(null);flash("Profile is up to date")}}><UserRound size={17}/><span><b>Review profile</b><small>Account details and access role</small></span><ChevronRight size={16}/></button></>}
      {panel==="client"&&<><p className="modal-label">SELECT CLIENT WORKSPACE</p><div className="client-list">{["Nova Consumer","Aria Foods"].map(c=><button type="button" key={c} onClick={()=>{setClient(c);setKpiFocus(c+" contract");setPanel(null);flash(c+" dashboard loaded")}}><Building2 size={18}/><span><b>{c}</b><small>Open isolated client performance view</small></span><ChevronRight size={16}/></button>)}</div></>}
    </div></section></div>}

    {selectedStaff&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedStaff(null)}}><section className="action-modal staff-modal" role="dialog" aria-modal="true"><div className="modal-head"><div><small>STAFF RECORD</small><h2>{selectedStaff.name}</h2></div><button type="button" onClick={()=>setSelectedStaff(null)} aria-label="Close staff details"><X size={19}/></button></div><div className="staff-detail-grid"><span><small>STAFF ID</small><b>{selectedStaff.id}</b></span><span><small>ROLE</small><b>{selectedStaff.role}</b></span><span><small>REGION</small><b>{selectedStaff.region}</b></span><span><small>TERRITORY</small><b>{selectedStaff.territory}</b></span><span><small>ASSIGNMENT</small><b>{selectedStaff.route}</b></span><span><small>COMPLETION</small><b>{selectedStaff.completion}%</b></span></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setSelectedStaff(null)}>Close</button><button type="button" className="primary" onClick={()=>{const idx=staff.findIndex(x=>x.id===selectedStaff.id);setSelectedPin(idx>=0?idx:0);setSelectedStaff(null);goTo("live-map");flash("Map focused on "+selectedStaff.name)}}><Map size={15}/> View on map</button></div></section></div>}

    {fullMap&&<div className="full-map-modal"><div className="full-map-head"><div><small>LIVE GEOGRAPHIC OPERATIONS</small><b>Nigeria field coverage · {staff.length} staff</b></div><div><button type="button" className="secondary" onClick={()=>selectRegion("All regions")}>Show all regions</button><button type="button" onClick={()=>setFullMap(false)} aria-label="Close full map"><X size={20}/></button></div></div><OperationsMap staff={staff} selected={selectedPin} onSelect={setSelectedPin} region={region} role={role}/></div>}
  </div>;
}
