"use client";

import { useMemo, useState } from "react";
import { PackageCheck, Store, TrendingUp } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { FilterBar, PageHeading } from "../shared";

const stores = [
  { name: "Ikeja North Hub", region: "Lagos", territory: "Lagos Central", products: 42, visits: 96, availability: 94, status: "Healthy" },
  { name: "Surulere A2 Retail", region: "Lagos", territory: "Lagos West", products: 38, visits: 88, availability: 91, status: "Healthy" },
  { name: "Abeokuta North Market", region: "Ogun", territory: "Abeokuta", products: 31, visits: 64, availability: 76, status: "Needs review" },
  { name: "Ring Road Superstore", region: "Oyo", territory: "Ibadan", products: 46, visits: 93, availability: 97, status: "Healthy" },
  { name: "Asaba Core Trade", region: "Delta", territory: "Asaba", products: 27, visits: 52, availability: 68, status: "Needs review" },
];

export default function StoresPage() {
  const [region, setRegion] = useState("All regions");
  const visible = useMemo(() => stores.filter((store) => region === "All regions" || store.region === region), [region]);
  return (
    <AppShell>
      <PageHeading eyebrow="RETAIL EXECUTION · STORES & PRODUCTS" title="Stores & products" subtitle="Monitor store coverage, product availability, and execution health across every territory." />
      <FilterBar region={region} onRegion={setRegion} onReset={() => setRegion("All regions")} />
      <section className="kpi-grid">
        <article className="kpi"><div className="kpi-icon blue"><Store size={20} /></div><span>Stores covered</span><strong>1,248</strong><div className="trend up"><TrendingUp size={14} /><b>12.4%</b><small>this month</small></div></article>
        <article className="kpi"><div className="kpi-icon teal"><PackageCheck size={20} /></div><span>Product availability</span><strong>91.6%</strong><div className="trend up"><TrendingUp size={14} /><b>4.8%</b><small>vs last period</small></div></article>
        <article className="kpi"><div className="kpi-icon amber"><Store size={20} /></div><span>Stores needing review</span><strong>86</strong><div className="trend down"><span>●</span><b>7.1%</b><small>of store base</small></div></article>
        <article className="kpi"><div className="kpi-icon violet"><PackageCheck size={20} /></div><span>Products monitored</span><strong>386</strong><div className="trend up"><TrendingUp size={14} /><b>2.3%</b><small>across 18 categories</small></div></article>
      </section>
      <section className="card table-card">
        <div className="card-head table-head"><div><h2>Territory store health</h2><p>Latest product and visit checks from the field</p></div></div>
        <div className="table-scroll"><table><thead><tr><th>Store</th><th>Region / territory</th><th>Products</th><th>Visits</th><th>Availability</th><th>Status</th></tr></thead><tbody>{visible.map((store) => <tr key={store.name}><td data-label="Store"><div className="person"><div>{store.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><span><b>{store.name}</b><small>Retail execution account</small></span></div></td><td data-label="Region"><b className="cell-main">{store.region}</b><small className="cell-sub">{store.territory}</small></td><td data-label="Products"><b>{store.products}</b></td><td data-label="Visits"><b>{store.visits}%</b></td><td data-label="Availability"><div className="progress-cell"><div><i style={{ width: `${store.availability}%` }} /></div><b>{store.availability}%</b></div></td><td data-label="Status"><span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}><i />{store.status}</span></td></tr>)}</tbody></table></div>
      </section>
    </AppShell>
  );
}
