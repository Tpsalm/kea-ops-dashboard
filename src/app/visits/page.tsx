"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../components/app-shell";
import { EmptyState, FilterBar, KpiGrid, PageHeading, Tip } from "../shared";
import { visitData, type VisitOutcome, type VisitRecord } from "../data";

const outcomeClass: Record<VisitOutcome, string> = {
  Completed: "active",
  Partial: "on-route",
  Rescheduled: "inactive",
  Missed: "needs-review",
};

export default function VisitsPage() {
  const [region, setRegion] = useState("All regions");
  const [outcome, setOutcome] = useState("All outcomes");
  const [type, setType] = useState("All types");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return visitData.filter((v) => {
      if (region !== "All regions" && v.region !== region) return false;
      if (outcome !== "All outcomes" && v.outcome !== outcome) return false;
      if (type !== "All types" && v.type !== type) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!v.staff.toLowerCase().includes(q) && !v.outlet.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [region, outcome, type, query]);

  const total = visitData.length;
  const completed = visitData.filter((v) => v.outcome === "Completed").length;
  const partial = visitData.filter((v) => v.outcome === "Partial").length;
  const missed = visitData.filter((v) => v.outcome === "Missed").length;
  const completionRate = Math.round((completed / total) * 100);
  const avgCompletion = Math.round(visitData.reduce((s, v) => s + v.completion, 0) / total);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    visitData.forEach((v) => map.set(v.type, (map.get(v.type) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, []);

  const outcomeBreakdown = useMemo(() => {
    const labels: VisitOutcome[] = ["Completed", "Partial", "Missed", "Rescheduled"];
    const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#94a3b8"];
    return labels.map((s, i) => ({
      name: s,
      value: visitData.filter((v) => v.outcome === s).length,
      color: colors[i],
    }));
  }, []);

  const kpis = [
    { label: "Scheduled visits", value: String(total), trend: "6.8%", up: true, sub: "vs last period", icon: CalendarCheck, tone: "blue" },
    { label: "Completion rate", value: completionRate + "%", trend: "2.1%", up: true, sub: "fully completed", icon: CheckCircle2, tone: "teal" },
    { label: "Avg execution", value: avgCompletion + "%", trend: "1.3%", up: true, sub: "average check score", icon: CalendarClock, tone: "violet" },
    { label: "Missed visits", value: String(missed), trend: `${partial} partial`, up: false, sub: "need reschedule", icon: XCircle, tone: "amber" },
  ];

  return (
    <AppShell contentClassName="page-visits">
      <PageHeading
        eyebrow="FIELD ACTIVITY · VISIT EXECUTION"
        title="Visits"
        subtitle="Field visits by type and outcome: retail checks, merchandising, collection, and new accounts."
      />
      <FilterBar
        region={region} onRegion={setRegion}
        onReset={() => { setRegion("All regions"); setOutcome("All outcomes"); setType("All types"); setQuery(""); }}
      />

      <div className="filters" style={{ marginTop: 8 }}>
        <label className="select-box">
          <span>OUTCOME</span>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {["All outcomes", "Completed", "Partial", "Missed", "Rescheduled"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="select-box">
          <span>TYPE</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {["All types", "Retail Check", "Merchandising", "Credit Collection", "New Account"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <div className="mini-search" style={{ flex: 1 }}>
          <CalendarCheck size={15} />
          <input placeholder="Search staff or outlet" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className="reset" onClick={() => { setRegion("All regions"); setOutcome("All outcomes"); setType("All types"); setQuery(""); }}><RefreshCw size={14} /> Reset</button>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <section className="row charts-row">
        <article className="card">
          <div className="card-head">
            <div><h2>Visits by type</h2><p>Field activity split by visit category</p></div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card workforce-card">
          <div className="card-head">
            <div><h2>Visit outcomes</h2><p>Execution results across all visits</p></div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomeBreakdown} innerRadius={62} outerRadius={82} paddingAngle={3} dataKey="value" stroke="none">
                  {outcomeBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-total"><strong>{total}</strong><span>VISITS</span></div>
          </div>
          <div className="role-legend">
            {outcomeBreakdown.map((d) => (
              <div key={d.name}><span><i style={{ background: d.color }} />{d.name}</span><b>{d.value}</b></div>
            ))}
          </div>
        </article>
      </section>

      <section className="card table-card">
        <div className="card-head table-head">
          <div><h2>Visit log</h2><p>{visible.length} visits · execution and outcome per field visit</p></div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="No matching visits" hint="Try adjusting your filters or search." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Outlet</th>
                  <th>Region / territory</th>
                  <th>Type</th>
                  <th>Scheduled</th>
                  <th>Execution</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Staff">
                      <div className="person">
                        <div>{v.staff.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                        <span><b>{v.staff}</b><small>{v.id}</small></span>
                      </div>
                    </td>
                    <td data-label="Role"><span className={`role-badge ${v.role.toLowerCase()}`}>{v.role}</span></td>
                    <td data-label="Outlet"><b>{v.outlet}</b></td>
                    <td data-label="Region"><b className="cell-main">{v.region}</b><small className="cell-sub">{v.territory}</small></td>
                    <td data-label="Type"><span className="role-badge" style={{ background: "var(--soft)", color: "var(--text)" }}>{v.type}</span></td>
                    <td data-label="Scheduled"><b className="cell-main">{v.scheduled.replace("2026-", "")}</b></td>
                    <td data-label="Execution">
                      <div className="progress-cell">
                        <div><i style={{ width: `${v.completion}%` }} /></div>
                        <b>{v.completion}%</b>
                      </div>
                    </td>
                    <td data-label="Outcome"><span className={`status ${outcomeClass[v.outcome]}`}><i />{v.outcome}</span></td>
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