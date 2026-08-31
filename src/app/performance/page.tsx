"use client";

import { useState } from "react";
import { Activity, BarChart3, CheckCircle2, TrendingUp } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { ActivityCard, CompletionCard, FilterBar, KpiGrid, PageHeading, WorkforceMixCard } from "../shared";
import { activities, allStaff, stores } from "../hierarchy-data";
import { activityData } from "../data";

export default function PerformancePage() {
  const [period, setPeriod] = useState("Last 30 days");
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const visibleStaff = allStaff.filter((member) => (region === "All regions" || member.region === region) && (role === "All roles" || member.role === role));
  const visibleStaffIds = new Set(visibleStaff.map((member) => member.id));
  const visibleActivities = activities.filter((activity) => visibleStaffIds.has(activity.staffId));
  const completion = visibleStaff.length ? Math.round(visibleStaff.reduce((sum, member) => sum + member.completion, 0) / visibleStaff.length) : 0;
  const periodFactor = period === "Today" ? 0.08 : period === "Last 7 days" ? 0.24 : period === "This quarter" ? 2.8 : 1;
  const chartActivity = activityData.map((point) => ({ ...point, visits: Math.round(point.visits * periodFactor * Math.max(0.1, visibleActivities.length / activities.length)), checks: Math.round(point.checks * periodFactor * Math.max(0.1, visibleActivities.length / activities.length)) }));
  const chartRoles = ["Merchandiser", "VSR", "Supervisor", "TSR"].map((staffRole, index) => ({ name: `${staffRole}s`, value: visibleStaff.filter((member) => member.role === staffRole).length, color: ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6"][index] }));
  const chartCompletion = ["Lagos", "Ogun", "Oyo", "Delta", "Enugu"].map((name) => {
    const regionalStaff = visibleStaff.filter((member) => member.region === name);
    const planned = Math.round(regionalStaff.reduce((sum, member) => sum + member.visits, 0) * periodFactor);
    return { name, planned, completed: Math.round(planned * (regionalStaff.length ? regionalStaff.reduce((sum, member) => sum + member.completion, 0) / regionalStaff.length / 100 : 0)) };
  });
  const kpis = [
    { label: "Total activities", value: String(Math.round(visibleActivities.length * periodFactor)), trend: "6.1%", up: true, sub: "selected period", icon: Activity, tone: "blue" },
    { label: "Overall completion", value: `${completion}%`, trend: "4.6%", up: true, sub: "selected workforce", icon: CheckCircle2, tone: "teal" },
    { label: "Average staff output", value: String(visibleStaff.length ? Math.round(visibleStaff.reduce((sum, member) => sum + member.visits, 0) / visibleStaff.length) : 0), trend: "3.8%", up: true, sub: "visits per staff", icon: BarChart3, tone: "violet" },
    { label: "Quality score", value: `${visibleActivities.length ? Math.round(visibleActivities.reduce((sum, activity) => sum + activity.completion, 0) / visibleActivities.length) : 0}%`, trend: "2.1%", up: true, sub: "activity completion", icon: Activity, tone: "amber" },
  ];
  return (
    <AppShell contentClassName="page-performance">
      <PageHeading eyebrow="OPERATIONS ANALYTICS · PERFORMANCE" title="Performance" subtitle="Understand productivity, completion, and workforce output across the operation." />
      <FilterBar period={period} onPeriod={setPeriod} region={region} onRegion={setRegion} role={role} onRole={setRole} onReset={() => { setPeriod("Last 30 days"); setRegion("All regions"); setRole("All roles"); }} />
      <KpiGrid items={kpis} focus="" onFocus={() => undefined} />
      <section className="row charts-row"><ActivityCard data={chartActivity} onMore={() => undefined} /><WorkforceMixCard data={chartRoles} total={visibleStaff.length} onMore={() => undefined} /></section>
      <section className="row ops-row"><CompletionCard data={chartCompletion} completion={`${completion}%`} onMore={() => undefined} /><article className="card"><div className="card-head"><div><h2>Performance notes</h2><p>Signals from the current operating period</p></div></div><div className="modal-body"><div className="healthy-state"><CheckCircle2 size={25} /><div><b>Coverage is trending up</b><span>{visibleStaff.length} staff match the selected filters.</span></div></div><div className="healthy-state"><Activity size={25} /><div><b>Activity volume is healthy</b><span>{visibleActivities.length} activities match the selected workforce.</span></div></div></div></article></section>
    </AppShell>
  );
}
