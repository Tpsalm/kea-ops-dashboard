"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MapPinned, Route, Timer } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { FilterBar, PageHeading } from "../shared";
import { staff, vsrTrackerRows } from "../data";

const regionOptions = ["All regions", "Lagos", "Ogun", "Oyo", "Delta", "Enugu", "Ibadan", "Asaba", "Benin", "Osogbo", "Abuja"];

function normalizeLocation(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export default function VsrOperationsPage() {
  const [region, setRegion] = useState("All regions");
  const routes = useMemo(() => staff.filter((person) => person.role === "VSR" && (region === "All regions" || person.region === region)), [region]);
  const trackerRows = useMemo(
    () => vsrTrackerRows.filter((row) => region === "All regions" || normalizeLocation(row.location).includes(normalizeLocation(region)) || normalizeLocation(row.location).includes(normalizeLocation(region === "Oyo" ? "Ibadan" : region))),
    [region],
  );
  const fundedCount = trackerRows.filter((row) => row.status === "Funded").length;
  const awaitingCount = trackerRows.filter((row) => row.status === "Awaiting Funding").length;
  const riskCount = trackerRows.filter((row) => row.status === "Under Review - Risk & Compliance" || row.status === "Awaiting Funding").length;

  return (
    <AppShell>
      <PageHeading eyebrow="FIELD EXECUTION · VSR OPERATIONS" title="VSR operations" subtitle="Track route execution, store visits, and field coverage for every VSR team." />
      <FilterBar region={region} onRegion={setRegion} onReset={() => setRegion("All regions")} />
      <section className="kpi-grid">
        <article className="kpi"><div className="kpi-icon blue"><Route size={20} /></div><span>Active routes</span><strong>{routes.length}</strong><div className="trend up"><CheckCircle2 size={14} /><b>{routes.filter((person) => person.status === "Active" || person.status === "On route").length} on plan</b></div></article>
        <article className="kpi"><div className="kpi-icon teal"><MapPinned size={20} /></div><span>Visits completed</span><strong>{routes.reduce((sum, person) => sum + person.visits, 0)}</strong><div className="trend up"><b>{Math.round(routes.reduce((sum, person) => sum + person.completion, 0) / Math.max(routes.length, 1))}%</b><small>completion</small></div></article>
        <article className="kpi"><div className="kpi-icon amber"><Timer size={20} /></div><span>Awaiting funding</span><strong>{awaitingCount}</strong><div className="trend up"><b>{fundedCount}</b><small>funded</small></div></article>
        <article className="kpi"><div className="kpi-icon violet"><CheckCircle2 size={20} /></div><span>Risk / review</span><strong>{riskCount}</strong><div className="trend up"><b>{fundedCount}</b><small>cleared</small></div></article>
      </section>

      <section className="card table-card" style={{ marginTop: 22 }}>
        <div className="card-head table-head">
          <div>
            <h2>VSR onboarding & funding tracker</h2>
            <p>Tracking onboarding state, funding status, and risk review for the VSR pipeline.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>VSR Type</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Date Funded</th>
                <th>Location</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Priority</th>
                <th>Risk Alert</th>
              </tr>
            </thead>
            <tbody>
              {trackerRows.map((row) => (
                <tr key={row.id}>
                  <td data-label="Full Name"><b>{row.fullName}</b></td>
                  <td data-label="VSR Type">{row.vsrType}</td>
                  <td data-label="Status">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontWeight: 700,
                        fontSize: 11,
                        color: row.status === "Funded" ? "#0b3b2c" : row.status === "Awaiting Funding" ? "#7a4a00" : row.status === "No Loan Required" ? "#3c2e6c" : row.status === "Under Review - Risk & Compliance" ? "#7a4a00" : "#0a5b46",
                        background: row.status === "Funded" ? "#c8f3d1" : row.status === "Awaiting Funding" ? "#f6d7a5" : row.status === "No Loan Required" ? "#e9d8ff" : row.status === "Under Review - Risk & Compliance" ? "#fbe8aa" : "#d4f3e8",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td data-label="Notes">{row.notes || "—"}</td>
                  <td data-label="Date Funded">{row.dateFunded || "—"}</td>
                  <td data-label="Location">{row.location}</td>
                  <td data-label="Email">{row.email || "—"}</td>
                  <td data-label="Phone">{row.phone || "—"}</td>
                  <td data-label="Priority">{row.priority}</td>
                  <td data-label="Risk Alert">{row.riskAlert || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card table-card" style={{ marginTop: 22 }}>
        <div className="card-head table-head"><div><h2>VSR route board</h2><p>Current assignment and route completion by field representative</p></div></div>
        <div className="table-scroll"><table><thead><tr><th>Representative</th><th>Territory</th><th>Assignment</th><th>Status</th><th>Visits</th><th>Completion</th></tr></thead><tbody>{routes.map((person) => <tr key={person.id}><td data-label="Representative"><div className="person"><div>{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><span><b>{person.name}</b><small>{person.id}</small></span></div></td><td data-label="Territory"><b className="cell-main">{person.region}</b><small className="cell-sub">{person.territory}</small></td><td data-label="Assignment">{person.route}</td><td data-label="Status"><span className={`status ${person.status.toLowerCase().replace(" ", "-")}`}><i />{person.status}</span></td><td data-label="Visits"><b>{person.visits}</b></td><td data-label="Completion"><div className="progress-cell"><div><i style={{ width: `${person.completion}%` }} /></div><b>{person.completion}%</b></div></td></tr>)}</tbody></table></div>
      </section>
    </AppShell>
  );
}
