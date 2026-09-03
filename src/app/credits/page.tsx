"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Landmark, RefreshCw, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../components/app-shell";
import { EmptyState, FilterBar, KpiGrid, PageHeading, Tip } from "../shared";
import { creditData, type CreditRecord, type CreditStatus } from "../data";

const naira = (n: number) => "₦" + (n / 1000000).toFixed(1) + "M";

const statusClass: Record<CreditStatus, string> = {
  Outstanding: "active",
  "Partially Paid": "on-route",
  Settled: "inactive",
  Overdue: "needs-review",
};

export default function CreditsPage() {
  const [region, setRegion] = useState("All regions");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("All statuses");

  const visible = useMemo(() => {
    return creditData.filter((c) => {
      if (region !== "All regions" && c.region !== region) return false;
      if (type !== "All types" && c.type !== type) return false;
      if (status !== "All statuses" && c.status !== status) return false;
      return true;
    });
  }, [region, type, status]);

  const outstanding = useMemo(() => creditData.reduce((s, c) => s + c.outstanding, 0), []);
  const issued = useMemo(() => creditData.reduce((s, c) => s + c.amount, 0), []);
  const overdue = useMemo(() => creditData.filter((c) => c.status === "Overdue").length, []);
  const settled = useMemo(() => creditData.filter((c) => c.status === "Settled").length, []);
  const recovery = issued ? Math.round(((issued - outstanding) / issued) * 100) : 0;

  const regionExposure = useMemo(() => {
    const map = new Map<string, { issued: number; outstanding: number }>();
    creditData.forEach((c) => {
      const cur = map.get(c.region) ?? { issued: 0, outstanding: 0 };
      cur.issued += c.amount;
      cur.outstanding += c.outstanding;
      map.set(c.region, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, issued: Math.round(v.issued / 1000000), outstanding: Math.round(v.outstanding / 1000000) }))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, []);

  const statusBreakdown = useMemo(() => {
    const labels: CreditStatus[] = ["Outstanding", "Partially Paid", "Settled", "Overdue"];
    const colors = ["#2563eb", "#14b8a6", "#94a3b8", "#f59e0b"];
    return labels.map((s, i) => ({
      name: s,
      value: creditData.filter((c) => c.status === s).length,
      color: colors[i],
    }));
  }, []);

  const kpis = [
    { label: "Credit outstanding", value: naira(outstanding), trend: "2.9%", up: false, sub: "collection needed", icon: Landmark, tone: "blue" },
    { label: "Total credit issued", value: naira(issued), trend: "6.3%", up: true, sub: "vs previous period", icon: Wallet, tone: "teal" },
    { label: "Overdue accounts", value: String(overdue), trend: "3", up: false, sub: "need attention", icon: AlertTriangle, tone: "amber" },
    { label: "Recovery rate", value: recovery + "%", trend: "1.4%", up: true, sub: "of issued collected", icon: BadgeCheck, tone: "violet" },
  ];

  return (
    <AppShell contentClassName="page-credits">
      <PageHeading
        eyebrow="FINANCE · CREDIT & LOANS"
        title="Credits"
        subtitle="Monitor VSR loans, trade credit, and retail revolving exposure across the field force."
      />
      <FilterBar
        region={region} onRegion={setRegion}
        onReset={() => { setRegion("All regions"); setType("All types"); setStatus("All statuses"); }}
      />

      <div className="filters" style={{ marginTop: 8 }}>
        <label className="select-box">
          <span>TYPE</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {["All types", "VSR Loan", "Trade Credit", "Retail Revolving"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="select-box">
          <span>STATUS</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["All statuses", "Outstanding", "Partially Paid", "Settled", "Overdue"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <button className="reset" onClick={() => { setRegion("All regions"); setType("All types"); setStatus("All statuses"); }}><RefreshCw size={14} /> Reset</button>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <section className="row charts-row">
        <article className="card">
          <div className="card-head">
            <div><h2>Credit exposure by region</h2><p>Issued vs outstanding credit (₦ millions)</p></div>
            <div className="legend">
              <span><i className="blue" />Issued</span>
              <span><i className="amber" />Outstanding</span>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionExposure} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="issued" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card workforce-card">
          <div className="card-head">
            <div><h2>Accounts by status</h2><p>Distribution of credit status</p></div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} innerRadius={62} outerRadius={82} paddingAngle={3} dataKey="value" stroke="none">
                  {statusBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-total"><strong>{creditData.length}</strong><span>ACCOUNTS</span></div>
          </div>
          <div className="role-legend">
            {statusBreakdown.map((d) => (
              <div key={d.name}><span><i style={{ background: d.color }} />{d.name}</span><b>{d.value}</b></div>
            ))}
          </div>
        </article>
      </section>

      <section className="card table-card">
        <div className="card-head table-head">
          <div><h2>Credit ledger</h2><p>{visible.length} accounts · outstanding exposure by account</p></div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="No matching credit accounts" hint="Try adjusting your filters." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Account / owner</th>
                  <th>Type</th>
                  <th>Region / territory</th>
                  <th>Amount</th>
                  <th>Outstanding</th>
                  <th>Issued / due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Account">
                      <div className="person">
                        <div>{c.account.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                        <span><b>{c.account}</b><small>{c.owner}</small></span>
                      </div>
                    </td>
                    <td data-label="Type"><span className="role-badge" style={{ background: "var(--soft)", color: "var(--text)" }}>{c.type}</span></td>
                    <td data-label="Region"><b className="cell-main">{c.region}</b><small className="cell-sub">{c.territory}</small></td>
                    <td data-label="Amount"><b>{naira(c.amount)}</b></td>
                    <td data-label="Outstanding"><b>{naira(c.outstanding)}</b></td>
                    <td data-label="Due"><b className="cell-main">{c.issued}</b><small className="cell-sub">{c.due}</small></td>
                    <td data-label="Status"><span className={`status ${statusClass[c.status]}`}><i />{c.status}</span></td>
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