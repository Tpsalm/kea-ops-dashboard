"use client";

import { useState } from "react";
import { ArrowUpRight, Building2, CheckCircle2, Download, Users } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { CompletionCard, PageHeading } from "../shared";

const clients = [
  { name: "Nova Consumer", sector: "Consumer goods", stores: "684", completion: "91.8%", status: "On track" },
  { name: "Aria Foods", sector: "Food & beverage", stores: "564", completion: "84.6%", status: "On track" },
];

export default function ClientPortalPage() {
  const [client, setClient] = useState(clients[0].name);
  const selected = clients.find((item) => item.name === client) ?? clients[0];
  return (
    <AppShell>
      <PageHeading eyebrow="CLIENT REPORTING · SECURE WORKSPACE" title="Client portal" subtitle="Review client-specific coverage, execution outcomes, and operational reporting." actions={<button className="primary" type="button"><Download size={16} /> Export report</button>} />
      <section className="filters"><div className="filter-title"><Building2 size={16} /><b>Client workspace</b></div>{clients.map((item) => <button key={item.name} type="button" className={`secondary ${client === item.name ? "chosen" : ""}`} onClick={() => setClient(item.name)}>{item.name}</button>)}</section>
      <section className="kpi-grid">
        <article className="kpi"><div className="kpi-icon blue"><Building2 size={20} /></div><span>Selected client</span><strong>{selected.name === "Nova Consumer" ? "Nova" : "Aria"}</strong><div className="trend up"><CheckCircle2 size={14} /><b>{selected.status}</b></div></article>
        <article className="kpi"><div className="kpi-icon teal"><Users size={20} /></div><span>Stores covered</span><strong>{selected.stores}</strong><div className="trend up"><b>12.4%</b><small>this month</small></div></article>
        <article className="kpi"><div className="kpi-icon violet"><CheckCircle2 size={20} /></div><span>Completion rate</span><strong>{selected.completion}</strong><div className="trend up"><b>4.6%</b><small>vs last period</small></div></article>
        <article className="kpi"><div className="kpi-icon amber"><ArrowUpRight size={20} /></div><span>Reporting status</span><strong>Live</strong><div className="trend up"><b>Updated</b><small>4 min ago</small></div></article>
      </section>
      <section className="row ops-row"><CompletionCard onMore={() => undefined} /><article className="card"><div className="card-head"><div><h2>{selected.name} workspace</h2><p>{selected.sector} · managed operations view</p></div><span className="live-badge"><i /> LIVE</span></div><div className="modal-body"><div className="healthy-state"><CheckCircle2 size={25} /><div><b>Client reporting is current</b><span>Coverage, completion, and store execution data are available for review.</span></div></div><div className="client-list"><button type="button"><Building2 size={18} /><span><b>Coverage report</b><small>Territory and store coverage by region</small></span><ArrowUpRight size={16} /></button><button type="button"><Download size={18} /><span><b>Latest data pack</b><small>Download the current operational extract</small></span><ArrowUpRight size={16} /></button></div></div></article></section>
    </AppShell>
  );
}
