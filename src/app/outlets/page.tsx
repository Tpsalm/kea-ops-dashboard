"use client";

import { useMemo, useState } from "react";
import { MapPin, Route, RefreshCw, Store, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../components/app-shell";
import { EmptyState, FilterBar, KpiGrid, PageHeading, Tip } from "../shared";
import { outletData, type OutletRecord, type OutletStatus } from "../data";

const statusClass: Record<OutletStatus, string> = {
  Active: "active",
  Dormant: "inactive",
  New: "on-route",
  Suspended: "needs-review",
  Pending: "on-route",
};

export default function OutletsPage() {
  const [region, setRegion] = useState("All regions");
  const [status, setStatus] = useState("All statuses");
  const [tier, setTier] = useState("All tiers");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return outletData.filter((o) => {
      if (region !== "All regions" && o.region !== region) return false;
      if (status !== "All statuses" && o.status !== status) return false;
      if (tier !== "All tiers" && o.tier !== tier) return false;
      if (query && !o.name.toLowerCase().includes(query.toLowerCase()) && !o.chain.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [region, status, tier, query]);

  const active = useMemo(() => outletData.filter((o) => o.status === "Active").length, []);
  const newOnboard = useMemo(() => outletData.filter((o) => o.status === "New").length, []);
  const dormant = useMemo(() => outletData.filter((o) => o.status === "Dormant").length, []);
  const suspended = useMemo(() => outletData.filter((o) => o.status === "Suspended").length, []);
  const covered = useMemo(() => outletData.filter((o) => o.weeklyVisits > 0).length, []);
  const coverage = Math.round((covered / outletData.length) * 100);

  const typeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    outletData.forEach((o) => map.set(o.type, (map.get(o.type) ?? 0) + 1));
    const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#f58220", "#0ea5e9"];
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, []);

  const coverageByRegion = useMemo(() => {
    const map = new Map<string, { total: number; visited: number }>();
    outletData.forEach((o) => {
      const cur = map.get(o.region) ?? { total: 0, visited: 0 };
      cur.total += 1;
      if (o.weeklyVisits > 0) cur.visited += 1;
      map.set(o.region, cur);
    });
    return Array.from(map.entries()).map(([name, v]) => ({
      name,
      total: v.total,
      visited: v.visited,
    })).sort((a, b) => b.total - a.total);
  }, []);

  const kpis = [
    { label: "Total outlets", value: String(outletData.length), trend: "4.1%", up: true, sub: "vs last period", icon: Store, tone: "blue" },
    { label: "Visit coverage", value: coverage + "%", trend: `${covered} of ${outletData.length}`, up: true, sub: "visited this week", icon: Route, tone: "teal" },
    { label: "New / active", value: `${active} / ${newOnboard}`, trend: `${newOnboard} new`, up: true, sub: "onboarded this month", icon: MapPin, tone: "amber" },
    { label: "Dormant + suspended", value: String(dormant + suspended), trend: `${dormant} + ${suspended}`, up: false, sub: "need attention", icon: Users, tone: "violet" },
  ];

  return (
    <AppShell contentClassName="page-outlets">
      <PageHeading
        eyebrow="RETAIL · OUTLET NETWORK"
        title="Outlets"
        subtitle="Complete directory of retail accounts with visit frequency, coverage, and health status."
      />
      <FilterBar
        region={region} onRegion={setRegion}
        onReset={() => { setRegion("All regions"); setStatus("All statuses"); setTier("All tiers"); setQuery(""); }}
      />

      <div className="filters" style={{ marginTop: 8 }}>
        <label className="select-box">
          <span>STATUS</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["All statuses", "Active", "Dormant", "New", "Pending", "Suspended"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="select-box">
          <span>TIER</span>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            {["All tiers", "A", "B", "C"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <div className="mini-search" style={{ flex: 1 }}>
          <MapPin size={15} />
          <input placeholder="Search outlets" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className="reset" onClick={() => { setRegion("All regions"); setStatus("All statuses"); setTier("All tiers"); setQuery(""); }}><RefreshCw size={14} /> Reset</button>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <section className="row charts-row">
        <article className="card">
          <div className="card-head">
            <div><h2>Outlet coverage by region</h2><p>Total outlets vs those visited this week</p></div>
            <div className="legend">
              <span><i className="blue" />Total</span>
              <span><i className="teal" />Visited</span>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageByRegion} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="visited" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card workforce-card">
          <div className="card-head">
            <div><h2>Outlets by type</h2><p>Network composition across categories</p></div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeBreakdown} innerRadius={62} outerRadius={82} paddingAngle={3} dataKey="value" stroke="none">
                  {typeBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-total"><strong>{outletData.length}</strong><span>OUTLETS</span></div>
          </div>
          <div className="role-legend">
            {typeBreakdown.map((d) => (
              <div key={d.name}><span><i style={{ background: d.color }} />{d.name}</span><b>{d.value}</b></div>
            ))}
          </div>
        </article>
      </section>

      <section className="card table-card">
        <div className="card-head table-head">
          <div><h2>Outlet directory</h2><p>{visible.length} outlets · coverage and merchandiser assignment</p></div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="No matching outlets" hint="Try adjusting your filters or search." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Outlet</th>
                  <th>Type</th>
                  <th>Region / territory</th>
                  <th>Merchandiser</th>
                  <th>Weekly visits</th>
                  <th>Last visit</th>
                  <th>Tier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td data-label="Outlet">
                      <div className="person">
                        <div>{o.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                        <span><b>{o.name}</b><small>{o.chain} · {o.id}</small></span>
                      </div>
                    </td>
                    <td data-label="Type"><span className="role-badge" style={{ background: "var(--soft)", color: "var(--text)" }}>{o.type}</span></td>
                    <td data-label="Region"><b className="cell-main">{o.region}</b><small className="cell-sub">{o.territory}</small></td>
                    <td data-label="Merchandiser"><b>{o.merchandiser}</b></td>
                    <td data-label="Weekly visits"><b>{o.weeklyVisits}×</b></td>
                    <td data-label="Last visit"><b className="cell-main">{o.lastVisit.replace("2026-", "")}</b></td>
                    <td data-label="Tier">
                      <span className={`status ${o.tier === "A" ? "active" : o.tier === "B" ? "on-route" : "inactive"}`}><i />{o.tier}</span>
                    </td>
                    <td data-label="Status"><span className={`status ${statusClass[o.status]}`}><i />{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}