"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, PackagePlus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { AppShell } from "../../components/app-shell";
import { EmptyState, FilterBar, KpiGrid, PageHeading, Tip } from "../shared";
import { salesData, salesTrend, type SalesRecord } from "../data";

const naira = (n: number) => "₦" + (n / 1000000).toFixed(1) + "M";

export default function SalesPage() {
  const [region, setRegion] = useState("All regions");
  const [client, setClient] = useState("All clients");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<keyof SalesRecord>("value");
  const [asc, setAsc] = useState(false);

  const visible = useMemo(() => {
    let rows = salesData;
    if (region !== "All regions") rows = rows.filter((r) => r.region === region);
    if (client !== "All clients") rows = rows.filter((r) => r.clientId === (client === "Nova Consumer" ? "client-a" : "client-b"));
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => r.account.toLowerCase().includes(q) || r.territory.toLowerCase().includes(q));
    }
    const dir = asc ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });
  }, [region, client, query, sort, asc]);

  const totalValue = useMemo(() => salesData.reduce((s, r) => s + r.value, 0), []);
  const totalQty = useMemo(() => salesData.reduce((s, r) => s + r.quantity, 0), []);
  const totalOrders = useMemo(() => salesData.reduce((s, r) => s + r.orders, 0), []);
  const totalReturned = useMemo(() => salesData.reduce((s, r) => s + r.returnedValue, 0), []);
  const visCount = visible.length;

  const kpis = [
    { label: "Total sales value", value: naira(totalValue), trend: "8.4%", up: true, sub: "vs previous period", icon: Wallet, tone: "blue" },
    { label: "Units sold", value: totalQty.toLocaleString(), trend: "5.1%", up: true, sub: "vs previous period", icon: PackagePlus, tone: "teal" },
    { label: "Orders", value: totalOrders.toLocaleString(), trend: "3.7%", up: true, sub: "vs previous period", icon: PackagePlus, tone: "violet" },
    { label: "Returns", value: naira(totalReturned), trend: "1.2%", up: false, sub: "of total value", icon: TrendingDown, tone: "amber" },
  ];

  const header = (label: string, key: keyof SalesRecord) => (
    <th onClick={() => { if (sort === key) setAsc(!asc); else { setSort(key); setAsc(false); } }}>
      {label} {sort === key ? (asc ? " ↑" : " ↓") : " ↕"}
    </th>
  );

  return (
    <AppShell contentClassName="page-sales">
      <PageHeading
        eyebrow="COMMERCIAL · SALES PERFORMANCE"
        title="Sales"
        subtitle="Track revenue, volumes, and order intake across every territory and client account."
        actions={<Link className="secondary" href="/reports" style={{ textDecoration: "none" }}>Export report <ChevronRight size={15} /></Link>}
      />
      <FilterBar
        region={region} onRegion={setRegion}
        client={client} onClient={setClient}
        onReset={() => { setRegion("All regions"); setClient("All clients"); setQuery(""); }}
      />

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <section className="card" style={{ marginBottom: 13 }}>
        <div className="card-head">
          <div><h2>Weekly sales vs target</h2><p>Revenue trend across the last six weeks (₦ millions)</p></div>
          <div className="legend">
            <span><i className="blue" />Sales</span>
            <span><i className="teal" />Target</span>
          </div>
        </div>
        <div className="chart-wrap" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="target" stroke="#14b8a6" strokeWidth={2} fill="transparent" />
              <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} fill="url(#salesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card table-card">
        <div className="card-head table-head">
          <div><h2>Territory sales ledger</h2><p>{visCount} matching accounts · sorted by value</p></div>
          <div className="table-tools">
            <div className="mini-search"><span style={{ position: "static" }} />
              <input placeholder="Search account" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className="secondary" onClick={() => setRegion("All regions")}>Clear filter</button>
          </div>
        </div>
        {visCount === 0 ? (
          <EmptyState title="No matching sales records" hint="Try adjusting your filters or search." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Region / territory</th>
                  {header("Units", "quantity")}
                  {header("Orders", "orders")}
                  {header("Value", "value")}
                  {header("Returns", "returnedValue")}
                  <th>Product line</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Account">
                      <div className="person">
                        <div>{r.account.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                        <span><b>{r.account}</b><small>{r.id}</small></span>
                      </div>
                    </td>
                    <td data-label="Region"><b className="cell-main">{r.region}</b><small className="cell-sub">{r.territory}</small></td>
                    <td data-label="Units"><b>{r.quantity.toLocaleString()}</b></td>
                    <td data-label="Orders"><b>{r.orders}</b></td>
                    <td data-label="Value"><b>{naira(r.value)}</b></td>
                    <td data-label="Returns"><span className={r.returnedValue > 200000 ? "trend down" : "trend up"}><TrendingUp size={13} /><b>{naira(r.returnedValue)}</b></span></td>
                    <td data-label="Line"><span className="role-badge" style={{ background: "var(--soft)", color: "var(--text)" }}>{r.productLine}</span></td>
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