"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Activity, BarChart3, Bell, Building2, CalendarDays, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Download,
  FileSpreadsheet, Filter, LayoutDashboard, Map, Menu, Moon, MoreHorizontal,
  PackageCheck, RefreshCw, Route, Search, Settings, ShieldCheck, Store, Sun,
  TrendingDown, TrendingUp, UserRound, Users, X, Zap, Network, KeyRound, ArrowLeft
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { nigeriaLocations } from "../nigeria-locations";
import useAuth from "../../lib/useAuth";
import { AppShell } from "../../components/app-shell";

const OperationsMap = dynamic(() => import("../operations-map"), {
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
function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{name:string; value:number; color:string}>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tip"><b>{label}</b>{payload.map((p) => <span key={p.name}><i style={{background:p.color}} />{p.name}: <strong>{p.value.toLocaleString()}</strong></span>)}</div>;
}

function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (s:string)=>void }) {
  return <label className="select-box"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={14}/></label>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
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

  if (loading) return <main className="auth-loading">Loading secure workspace...</main>;
  if (!user) { router.replace("/login"); return <main className="auth-loading">Redirecting to sign in...</main>; }
  // Supervisors and above can access the dashboard
  if (!["supervisor", "tsr", "vsr", "merchandiser", "admin", "super-admin"].includes(user.role)) {
    return <main className="auth-loading">You don't have access to this dashboard.</main>;
  }

  const filtered = useMemo(() => {
    return staff
      .filter(p => {
        const matchRegion = region === "All regions" || p.region === region;
        const matchRole = role === "All roles" || p.role === role;
        const matchQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.id.includes(query);
        return matchRegion && matchRole && matchQuery;
      })
      .sort((a, b) => (asc ? a[sort] > b[sort] : a[sort] < b[sort]) ? 1 : -1);
  }, [region, role, query, sort, asc]);

  const pageSize = 6;
  const pages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const KPI = [
    { title: "Active staff", value: "362", change: "↑ 12%", chart: <AreaChart data={activityData}><defs><linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,.1)" /><XAxis dataKey="day" stroke="rgba(255,255,255,.5)" style={{fontSize:"11px"}} /><YAxis stroke="rgba(255,255,255,.5)" style={{fontSize:"11px"}} /><Area type="monotone" dataKey="visits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisits)" /><Tooltip content={<Tip />} /></AreaChart> },
    { title: "Completion rate", value: "87%", change: "↑ 3%", chart: <AreaChart data={activityData}><defs><linearGradient id="colorChecks" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,.1)" /><XAxis dataKey="day" stroke="rgba(255,255,255,.5)" style={{fontSize:"11px"}} /><YAxis stroke="rgba(255,255,255,.5)" style={{fontSize:"11px"}} /><Area type="monotone" dataKey="checks" stroke="#06b6d4" fillOpacity={1} fill="url(#colorChecks)" /><Tooltip content={<Tip />} /></AreaChart> },
    { title: "Store coverage", value: "1,204", change: "↑ 8%", chart: <AreaChart data={activityData}><defs><linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,.1)" /><XAxis dataKey="day" stroke="rgba(255,255,255,.5)" style={{fontSize:"11px"}} /><YAxis stroke="rgba(255,255,255,.5)" style={{fontSize:"11px"}} /><Area type="monotone" dataKey="visits" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorActivity)" /><Tooltip content={<Tip />} /></AreaChart> },
  ];

  return <AppShell contentClassName="dashboard-container"><main className={dark ? "dark" : ""}>
    <section className="dashboard-top">
      <div style={{display:"flex", gap:"12px", alignItems:"center"}}>
        <h1>{kpiFocus}</h1>
        <button className="secondary small" onClick={() => setPanel(panel === "filters" ? null : "filters")}><Filter size={14} /> Filter</button>
      </div>
      <div style={{display:"flex", gap:"8px"}}>
        <button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button className="icon-btn" onClick={() => { signOut(); router.push("/login"); }}><ArrowLeft size={18} /></button>
      </div>
    </section>

    {panel === "filters" && <section className="filter-panel">
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:"16px"}}>
        <SelectBox label="Region" value={region} options={["All regions", "Lagos", "Ogun", "Oyo", "Delta", "Enugu"]} onChange={setRegion} />
        <SelectBox label="Role" value={role} options={["All roles", "VSR", "TSR", "Supervisor", "Merchandiser"]} onChange={setRole} />
        <SelectBox label="Period" value={period} options={["Last 7 days", "Last 30 days", "Last 90 days", "This year"]} onChange={setPeriod} />
        <SelectBox label="Focus" value={kpiFocus} options={["All operations", "Route execution", "Store coverage", "Team performance"]} onChange={setKpiFocus} />
      </div>
    </section>}

    <section className="kpi-grid">
      {KPI.map((item, i) => <article key={i} className="kpi-card">
        <div className="kpi-header"><span>{item.title}</span><span className="positive">{item.change}</span></div>
        <div style={{fontSize:"32px", fontWeight:700, marginBottom:"8px"}}>{item.value}</div>
        <div style={{height:"60px", marginTop:"12px"}}><ResponsiveContainer width="100%" height="100%">{item.chart}</ResponsiveContainer></div>
      </article>)}
    </section>

    <section className="two-col">
      <article>
        <div className="card-header"><h3>Live operations map</h3></div>
        <div style={{height:"320px", borderRadius:"8px", overflow:"hidden"}}>
          <OperationsMap staff={filtered.length ? filtered : staff} selected={selectedPin} onSelect={setSelectedPin} region={region} role={role} />
        </div>
      </article>
      <article>
        <div className="card-header"><h3>Activity by region</h3><button className="secondary small" onClick={() => router.push("/performance")}><BarChart3 size={14} /> View report</button></div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={completionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="name" stroke="rgba(0,0,0,0.5)" style={{fontSize:"12px"}} />
            <YAxis stroke="rgba(0,0,0,0.5)" style={{fontSize:"12px"}} />
            <Tooltip />
            <Bar dataKey="planned" fill="#e5e7eb" /><Bar dataKey="completed" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </section>

    <section>
      <article>
        <div className="card-header">
          <div><h3>Team overview</h3><p className="muted">{filtered.length} staff</p></div>
          <input type="text" className="search-input" placeholder="Search name or ID..." value={query} onChange={e => {setQuery(e.target.value); setPage(1);}} />
        </div>
        <div className="table-scroll">
          <table className="staff-table">
            <thead><tr><th>Name</th><th>Role</th><th>Region</th><th>Territory</th><th>Status</th><th>Completion</th></tr></thead>
            <tbody>
              {paginated.map((item) => <tr key={item.id} style={{cursor:"pointer"}} onClick={() => setSelectedStaff(item)}>
                <td><strong>{item.name}</strong><br /><small>{item.id}</small></td>
                <td><span className={`badge role-${item.role.toLowerCase()}`}>{item.role}</span></td>
                <td>{item.region}</td>
                <td>{item.territory}</td>
                <td><span className={`status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></td>
                <td><div className="progress"><div style={{width:`${item.completion}%`}} /></div>{item.completion}%</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button className="secondary small" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}><ChevronLeft size={14} /> Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="secondary small" onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}>Next <ChevronRight size={14} /></button>
        </div>
      </article>
    </section>

    {selectedStaff && <section className="modal-overlay" onClick={() => setSelectedStaff(null)}>
      <article className="modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={() => setSelectedStaff(null)}><X size={20} /></button>
        <h2>{selectedStaff.name}</h2>
        <p className="muted">{selectedStaff.id}</p>
        <div className="modal-grid">
          <div><span className="label">Role</span><span className="badge role-{selectedStaff.role.toLowerCase()}">{selectedStaff.role}</span></div>
          <div><span className="label">Region</span><span>{selectedStaff.region}</span></div>
          <div><span className="label">Territory</span><span>{selectedStaff.territory}</span></div>
          <div><span className="label">Status</span><span className={`status ${selectedStaff.status.toLowerCase().replace(" ", "-")}`}>{selectedStaff.status}</span></div>
          <div><span className="label">Visits</span><span>{selectedStaff.visits}</span></div>
          <div><span className="label">Completion</span><span>{selectedStaff.completion}%</span></div>
        </div>
      </article>
    </section>}
  </main></AppShell>;
}
