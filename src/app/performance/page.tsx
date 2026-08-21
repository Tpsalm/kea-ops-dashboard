"use client";

import { useState } from "react";
import { Activity, BarChart3, CheckCircle2, TrendingUp } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { ActivityCard, CompletionCard, FilterBar, PageHeading, WorkforceMixCard } from "../shared";

export default function PerformancePage() {
  const [period, setPeriod] = useState("Last 30 days");
  return (
    <AppShell>
      <PageHeading eyebrow="OPERATIONS ANALYTICS · PERFORMANCE" title="Performance" subtitle="Understand productivity, completion, and workforce output across the operation." />
      <FilterBar period={period} onPeriod={setPeriod} onReset={() => setPeriod("Last 30 days")} />
      <section className="kpi-grid">
        <article className="kpi"><div className="kpi-icon blue"><Activity size={20} /></div><span>Total activities</span><strong>4,862</strong><div className="trend up"><TrendingUp size={14} /><b>6.1%</b><small>vs previous period</small></div></article>
        <article className="kpi"><div className="kpi-icon teal"><CheckCircle2 size={20} /></div><span>Overall completion</span><strong>87.4%</strong><div className="trend up"><TrendingUp size={14} /><b>4.6%</b><small>vs previous period</small></div></article>
        <article className="kpi"><div className="kpi-icon violet"><BarChart3 size={20} /></div><span>Average staff output</span><strong>30.4</strong><div className="trend up"><b>3.8%</b><small>visits per day</small></div></article>
        <article className="kpi"><div className="kpi-icon amber"><Activity size={20} /></div><span>Quality score</span><strong>93.2%</strong><div className="trend up"><b>2.1%</b><small>field audit score</small></div></article>
      </section>
      <section className="row charts-row"><ActivityCard onMore={() => undefined} /><WorkforceMixCard onMore={() => undefined} /></section>
      <section className="row ops-row"><CompletionCard onMore={() => undefined} /><article className="card"><div className="card-head"><div><h2>Performance notes</h2><p>Signals from the current operating period</p></div></div><div className="modal-body"><div className="healthy-state"><CheckCircle2 size={25} /><div><b>Coverage is trending up</b><span>Lagos and Oyo are leading completion this period.</span></div></div><div className="healthy-state"><Activity size={25} /><div><b>Activity volume is healthy</b><span>Visits and product checks are above the previous period.</span></div></div></div></article></section>
    </AppShell>
  );
}
