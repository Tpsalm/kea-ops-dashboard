"use client";

import { useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Building2, Flag, PieChart as PieIcon, ShieldCheck, Users } from "lucide-react";
import { staff, vsrTrackerRows, type Role } from "../data";
import { AppShell } from "../../components/app-shell";
import { FilterBar, KpiGrid, MapCard, PageHeading } from "../shared";

const roleColors: Record<Role, string> = {
  VSR: "#0e918a", TSR: "#f39a28", Supervisor: "#8fc63d", Merchandiser: "#55b8bb",
};
const regions = ["All regions", "Lagos", "Ogun", "Oyo", "Delta", "South West", "South East", "South South", "North", "Port Harcourt", "Owerri"];
const roles = ["All roles", "VSR", "TSR", "Supervisor", "Merchandiser"];

export default function SuperAdminDashboard() {
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [client, setClient] = useState("All clients");
  const [selectedPin, setSelectedPin] = useState(0);
  const [search, setSearch] = useState("");

  const filteredStaff = useMemo(() => staff.filter((person) =>
    (region === "All regions" || person.region === region) &&
    (role === "All roles" || person.role === role) &&
    (client === "All clients" || person.clientId === (client === "Nova Consumer" ? "client-a" : "client-b")) &&
    `${person.name} ${person.region} ${person.territory}`.toLowerCase().includes(search.toLowerCase())
  ), [client, region, role, search]);

  const roleBreakdown = useMemo(() => (roles.slice(1) as Role[]).map((item) => ({ name: item, value: filteredStaff.filter((person) => person.role === item).length, color: roleColors[item] })), [filteredStaff]);
  const filteredVsrRows = useMemo(() => vsrTrackerRows.filter((row) => {
    const normalizedRegion = region === "Oyo" ? "Ibadan" : region;
    return region === "All regions" || row.location.toLowerCase().includes(normalizedRegion.toLowerCase());
  }), [region]);
  const funding = useMemo(() => [
    { name: "Lead", value: role === "All roles" || role === "VSR" ? filteredVsrRows.length : 0 },
    { name: "Funded", value: role === "All roles" || role === "VSR" ? filteredVsrRows.filter((row) => row.status === "Funded").length : 0 },
    { name: "Deployed", value: filteredStaff.filter((person) => person.role === "VSR" && person.status !== "Inactive").length },
  ], [filteredStaff, filteredVsrRows, role]);
  const healthData = useMemo(() => {
    const scope = Math.max(filteredStaff.length / Math.max(staff.length, 1), .08);
    const errorScope = Math.max(1, Math.round((role === "All roles" ? 1 : .7) * scope * 8));
    return [
      { day: "7 Aug", requests: Math.round(74 * scope), errors: errorScope }, { day: "11 Aug", requests: Math.round(91 * scope), errors: errorScope + 1 }, { day: "16 Aug", requests: Math.round(83 * scope), errors: errorScope },
      { day: "20 Aug", requests: Math.round(118 * scope), errors: errorScope + 2 }, { day: "23 Aug", requests: Math.round(108 * scope), errors: errorScope + 1 }, { day: "26 Aug", requests: Math.round(152 * scope), errors: errorScope + 4 }, { day: "27 Aug", requests: Math.round(138 * scope), errors: errorScope + 1 },
    ];
  }, [filteredStaff.length, role]);
  const qualityRows = useMemo(() => regions.slice(1, 6).map((name, index) => ({ state: name, errors: Math.max(0, Math.round((filteredStaff.filter((person) => person.region === name).length || 1) * (index % 3 === 0 ? 1.4 : .3))), region: regions[index + 2] ?? "Lagos", error: index % 3 === 0 ? 1 : 0 })), [filteredStaff]);

  const resetFilters = () => { setRegion("All regions"); setRole("All roles"); setClient("All clients"); setSearch(""); setSelectedPin(0); };

  const kpis = [
    { label: "Total system users", value: String(filteredStaff.length + 116), trend: "137%", up: true, sub: "system users only", icon: Users, tone: "blue" },
    { label: "Total active staff", value: String(filteredStaff.filter((person) => person.status !== "Inactive").length + 95), trend: "", up: true, sub: "merchandisers, supervisors, VSRs & TSRs", icon: ShieldCheck, tone: "teal" },
    { label: "Active projects", value: String(client === "All clients" ? 12 : 1), trend: "12", up: true, sub: "client architecture", icon: Building2, tone: "violet" },
    { label: "Funding deployed", value: `₦${(vsrTrackerRows.filter((row) => row.status === "Funded").length * 24).toLocaleString()}K`, trend: "", up: true, sub: "aggregated approved naira", icon: Flag, tone: "amber" },
  ];

  return (
    <AppShell contentClassName="page-admin" searchValue={search} onSearch={setSearch}>
      <PageHeading
        eyebrow="SUPER ADMIN · GLOBAL PERFORMANCE"
        title="Global performance"
        subtitle="Cross-client operational overview across workforce, funding, data quality and territories."
      />

      <FilterBar
        region={region}
        onRegion={(value) => { setRegion(value); setSelectedPin(0); }}
        role={role}
        onRole={setRole}
        client={client}
        onClient={setClient}
        onReset={resetFilters}
      />

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <section className="row charts-row">
        <article className="card">
          <div className="card-head">
            <div><h2>System health monitor</h2><p>API request volume and error rates</p></div>
            <span className="status active"><i /> Live</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <Tooltip />
                <Area yAxisId="left" type="monotone" dataKey="requests" stroke="#158e88" strokeWidth={2} fill="transparent" />
                <Area yAxisId="right" type="monotone" dataKey="errors" stroke="#c99d47" strokeWidth={1.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="legend" style={{ padding: "0 17px 14px" }}>
            <span><i className="teal" />API Request Volume</span>
            <span><i className="amber" />Error Rates</span>
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <div><h2>Headcount by role</h2><p>Active staff distribution</p></div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleBreakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={3} stroke="none">
                  {roleBreakdown.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-total"><strong>{filteredStaff.length}</strong><span>STAFF</span></div>
          </div>
          <div className="role-legend">
            {roleBreakdown.map((item) => (
              <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><b>{item.value}</b></div>
            ))}
          </div>
        </article>
      </section>

      <section className="card" style={{ marginBottom: 13 }}>
        <div className="card-head">
          <div><h2>Funding deployment funnel</h2><p>Proposed → Funded → Deployed</p></div>
        </div>
        <div style={{ padding: "6px 17px 20px", display: "grid", gap: 14 }}>
          {funding.map((item, index) => {
            const max = Math.max(...funding.map((f) => f.value), 1);
            const width = Math.max(16, Math.round((item.value / max) * 100));
            const colors = ["#356bc2", "#85c83b", "#e89a26"];
            return (
              <div key={item.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <b style={{ fontSize: 12, color: "var(--text)" }}>{item.name}</b>
                  <span style={{ fontSize: 12, fontWeight: 800, color: colors[index] }}>{item.value}</span>
                </div>
                <div style={{ height: 26, background: "var(--soft)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${width}%`, background: colors[index], borderRadius: 6, transition: "width .4s ease", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{item.value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="row ops-row">
        <MapCard
          staff={filteredStaff}
          selected={selectedPin}
          onSelect={setSelectedPin}
          region={region}
          role={role}
          title="Territories & routes"
          subtitle={`${filteredStaff.length} filtered field records · interactive map scope`}
        />

        <article className="card">
          <div className="card-head">
            <div><h2>Data scope</h2><p>Current filter coverage</p></div>
          </div>
          <div style={{ padding: "6px 17px 16px", display: "grid", gap: 10 }}>
            <p style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: "var(--muted)" }}><ShieldCheck size={14} style={{ color: "#14b8a6", flex: "none" }} /> Filters are applied to staff, charts, and map pins.</p>
            <p style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: "var(--muted)" }}><Flag size={14} style={{ color: "#f59e0b", flex: "none" }} /> {vsrTrackerRows.filter((row) => row.status === "Awaiting Funding").length} VSR records await funding.</p>
            <p style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: "var(--muted)" }}><PieIcon size={14} style={{ color: "#2563eb", flex: "none" }} /> {roleBreakdown.filter((item) => item.value > 0).length} active role groups.</p>
          </div>
        </article>
      </section>

      <section className="row charts-row">
        <article className="card table-card">
          <div className="card-head table-head">
            <div><h2>Recent audit trail entries</h2><p>Latest system actions</p></div>
          </div>
          <div className="table-scroll">
            <table style={{ minWidth: 560 }}>
              <thead><tr><th>User</th><th>Action</th><th>Item</th><th>Timestamp</th></tr></thead>
              <tbody>
                {["Action Log", "Action Log", "Bench mark", "API Request Volume", "Action Log"].map((item, index) => (
                  <tr key={`${item}-${index}`}>
                    <td data-label="User">KEA Administor</td>
                    <td data-label="Action">{item}</td>
                    <td data-label="Item">{index % 2 ? "Merchandisers supervisors" : "Merchandisers here"}</td>
                    <td data-label="Timestamp">27 Jun 2026 3:2{index} PM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card table-card">
          <div className="card-head table-head">
            <div><h2>Data quality audit</h2><p>State-level error overview</p></div>
          </div>
          <div className="table-scroll">
            <table style={{ minWidth: 560 }}>
              <thead><tr><th>State</th><th>Errors</th><th>Region</th><th>Error</th></tr></thead>
              <tbody>
                {qualityRows.map((item) => (
                  <tr key={item.state}>
                    <td data-label="State">{item.state}</td>
                    <td data-label="Errors">{item.errors}</td>
                    <td data-label="Region">{item.region}</td>
                    <td data-label="Error">{item.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
