"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MapPinned, Route, Timer } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { FilterBar, PageHeading } from "../shared";
import { staff } from "../data";

export default function VsrOperationsPage() {
  const [region, setRegion] = useState("All regions");
  const routes = useMemo(() => staff.filter((person) => person.role === "VSR" && (region === "All regions" || person.region === region)), [region]);
  return (
    <AppShell>
      <PageHeading eyebrow="FIELD EXECUTION · VSR OPERATIONS" title="VSR operations" subtitle="Track route execution, store visits, and field coverage for every VSR team." />
      <FilterBar region={region} onRegion={setRegion} onReset={() => setRegion("All regions")} />
      <section className="kpi-grid">
        <article className="kpi"><div className="kpi-icon blue"><Route size={20} /></div><span>Active routes</span><strong>48</strong><div className="trend up"><CheckCircle2 size={14} /><b>42 on plan</b></div></article>
        <article className="kpi"><div className="kpi-icon teal"><MapPinned size={20} /></div><span>Visits completed</span><strong>2,184</strong><div className="trend up"><b>89.4%</b><small>completion</small></div></article>
        <article className="kpi"><div className="kpi-icon amber"><Timer size={20} /></div><span>Average route time</span><strong>6.8h</strong><div className="trend up"><b>0.4h</b><small>faster this week</small></div></article>
        <article className="kpi"><div className="kpi-icon violet"><CheckCircle2 size={20} /></div><span>Coverage achieved</span><strong>92.1%</strong><div className="trend up"><b>5.2%</b><small>vs last period</small></div></article>
      </section>
      <section className="card table-card"><div className="card-head table-head"><div><h2>VSR route board</h2><p>Current assignment and route completion by field representative</p></div></div><div className="table-scroll"><table><thead><tr><th>Representative</th><th>Territory</th><th>Assignment</th><th>Status</th><th>Visits</th><th>Completion</th></tr></thead><tbody>{routes.map((person) => <tr key={person.id}><td data-label="Representative"><div className="person"><div>{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><span><b>{person.name}</b><small>{person.id}</small></span></div></td><td data-label="Territory"><b className="cell-main">{person.region}</b><small className="cell-sub">{person.territory}</small></td><td data-label="Assignment">{person.route}</td><td data-label="Status"><span className={`status ${person.status.toLowerCase().replace(" ", "-")}`}><i />{person.status}</span></td><td data-label="Visits"><b>{person.visits}</b></td><td data-label="Completion"><div className="progress-cell"><div><i style={{ width: `${person.completion}%` }} /></div><b>{person.completion}%</b></div></td></tr>)}</tbody></table></div></section>
    </AppShell>
  );
}
