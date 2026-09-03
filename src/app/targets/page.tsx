"use client";

import { useMemo, useState } from "react";
import { Flag, RefreshCw, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../components/app-shell";
import { EmptyState, FilterBar, KpiGrid, PageHeading, Tip } from "../shared";
import { targetData, type TargetRecord } from "../data";

const formats: Record<TargetRecord["metric"], (n: number) => string> = {
  Sales: (n) => "₦" + (n / 1000000).toFixed(1) + "M",
  Collection: (n) => "₦" + (n / 1000000).toFixed(1) + "M",
  Visits: (n) => String(n),
  "New Outlets": (n) => String(n),
};

export default function TargetsPage() {
  const [region, setRegion] = useState("All regions");
  const [metric, setMetric] = useState("All metrics");

  const visible = useMemo(() => {
    return targetData.filter((t) => {
      if (region !== "All regions" && t.region !== region) return false;
      if (metric !== "All metrics" && t.metric !== metric) return false;
      return true;
    });
  }, [region, metric]);

  const overall = useMemo(() => {
    const sum = targetData.reduce((s, t) => s + t.achieved, 0);
    const total = targetData.reduce((s, t) => s + t.target, 0);
    return total ? Math.round((sum / total) * 100) : 0;
  }, []);
  const met = useMemo(() => targetData.filter((t) => t.achieved >= t.target).length, []);
  const near = useMemo(() => targetData.filter((t) => t.achieved < t.target && t.achieved / t.target >= 0.9).length, []);
  const short = useMemo(() => targetData.filter((t) => t.achieved / t.target < 0.9).length, []);

  const byMetric = useMemo(() => {
    const metrics: TargetRecord["metric"][] = ["Sales", "Visits", "New Outlets", "Collection"];
    return metrics.map((m) => {
      const rows = targetData.filter((t) => t.metric === m);
      const target = rows.reduce((s, t) => s + t.target, 0);
      const achieved = rows.reduce((s, t) => s + t.achieved, 0);
      return {
        name: m === "Sales" ? "Sales" : m === "Collection" ? "Collection" : m === "Visits" ? "Visits" : "New outlets",
        target: Math.round(target / (m === "Visits" || m === "New Outlets" ? 1 : 1000000)),
        achieved: Math.round(achieved / (m === "Visits" || m === "New Outlets" ? 1 : 1000000)),
      };
    });
  }, []);

  const byRegion = useMemo(() => {
    const map = new Map<string, { target: number; achieved: number }>();
    targetData.forEach((t) => {
      const cur = map.get(t.region) ?? { target: 0, achieved: 0 };
      cur.target += t.target;
      cur.achieved += t.achieved;
      map.set(t.region, cur);
    });
    return Array.from(map.entries()).map(([name, v]) => ({
      name,
      attainment: v.target ? Math.round((v.achieved / v.target) * 100) : 0,
    })).sort((a, b) => b.attainment - a.attainment);
  }, []);

  const kpis = [
    { label: "Overall attainment", value: overall + "%", trend: "3.2%", up: true, sub: "vs last period", icon: Target, tone: "blue" },
    { label: "Targets met", value: String(met), trend: `${met} of ${targetData.length}`, up: true, sub: "fully achieved", icon: Flag, tone: "teal" },
    { label: "Near target (≥90%)", value: String(near), trend: `${near} of ${targetData.length}`, up: true, sub: "within reach", icon: TrendingUp, tone: "amber" },
    { label: "Below target", value: String(short), trend: `${short} of ${targetData.length}`, up: false, sub: "need intervention", icon: Flag, tone: "violet" },
  ];

  return (
    <AppShell contentClassName="page-targets">
      <PageHeading
        eyebrow="OPERATIONS · TARGETS & ACHIEVEMENT"
        title="Targets"
        subtitle="Scorecard of planned vs achieved targets for sales, visits, new outlets, and collections."
      />
      <FilterBar
        region={region} onRegion={setRegion}
        onReset={() => { setRegion("All regions"); setMetric("All metrics"); }}
      />

      <div className="filters" style={{ marginTop: 8 }}>
        <label className="select-box">
          <span>METRIC</span>
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            {["All metrics", "Sales", "Visits", "New Outlets", "Collection"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <button className="reset" onClick={() => { setRegion("All regions"); setMetric("All metrics"); }}><RefreshCw size={14} /> Reset</button>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <section className="row charts-row">
        <article className="card">
          <div className="card-head">
            <div><h2>Attainment by metric</h2><p>Planned vs achieved (₦ millions for value metrics)</p></div>
            <div className="legend">
              <span><i className="blue" />Achieved</span>
              <span><i className="teal" />Target</span>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMetric} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="achieved" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <div><h2>Attainment by region</h2><p>Combined target achievement by region</p></div>
          </div>
          <div className="chart-wrap" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion} layout="vertical" margin={{ top: 5, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={92} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="attainment" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="card table-card">
        <div className="card-head table-head">
          <div><h2>Target scorecard · Aug 2026</h2><p>{visible.length} targets · attainment shown as progress vs plan</p></div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="No matching targets" hint="Try adjusting your filters." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Region / territory</th>
                  <th>Metric</th>
                  <th>Owner</th>
                  <th>Target</th>
                  <th>Achieved</th>
                  <th>Attainment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const pct = Math.round((t.achieved / t.target) * 100);
                  const metFlag = t.achieved >= t.target;
                  return (
                    <tr key={t.id}>
                      <td data-label="Region"><b className="cell-main">{t.region}</b><small className="cell-sub">{t.territory}</small></td>
                      <td data-label="Metric"><span className="role-badge" style={{ background: "var(--soft)", color: "var(--text)" }}>{t.metric}</span></td>
                      <td data-label="Owner"><b>{t.owner}</b></td>
                      <td data-label="Target"><b>{formats[t.metric](t.target)}</b></td>
                      <td data-label="Achieved"><b>{formats[t.metric](t.achieved)}</b></td>
                      <td data-label="Attainment">
                        <div className="progress-cell">
                          <div><i style={{ width: `${Math.min(pct, 100)}%`, background: metFlag ? "#2563eb" : "#f59e0b" }} /></div>
                          <b>{pct}%</b>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`status ${metFlag ? "active" : pct >= 90 ? "on-route" : "needs-review"}`}>
                          <i />{metFlag ? "Met" : pct >= 90 ? "Near" : "Short"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}