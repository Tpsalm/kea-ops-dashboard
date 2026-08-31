"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Database, RefreshCw, Search, Server, ShieldCheck } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, SelectBox } from "../shared";

const logs = [
  { id: "log-001", time: "27 Aug 2026 15:24:11", service: "API Gateway", level: "INFO", message: "Workforce data request completed", duration: "184 ms", status: "Healthy" },
  { id: "log-002", time: "27 Aug 2026 15:23:49", service: "Map Service", level: "INFO", message: "Territory coordinates refreshed", duration: "96 ms", status: "Healthy" },
  { id: "log-003", time: "27 Aug 2026 15:21:06", service: "Funding Service", level: "WARN", message: "VSR funding queue requires review", duration: "241 ms", status: "Review" },
  { id: "log-004", time: "27 Aug 2026 15:18:42", service: "Auth Service", level: "INFO", message: "Super Admin session verified", duration: "73 ms", status: "Healthy" },
  { id: "log-005", time: "27 Aug 2026 15:17:03", service: "Data Quality", level: "ERROR", message: "Invalid location record quarantined", duration: "318 ms", status: "Action required" },
  { id: "log-006", time: "27 Aug 2026 15:12:20", service: "Report Engine", level: "INFO", message: "Weekly operations report generated", duration: "1.4 s", status: "Healthy" },
];

export default function SystemLogsPage() {
  const [level, setLevel] = useState("All levels");
  const [service, setService] = useState("All services");
  const [query, setQuery] = useState("");
  const filteredLogs = useMemo(() => logs.filter((log) =>
    (level === "All levels" || log.level === level.replace(" levels", "").replace(" level", "")) &&
    (service === "All services" || log.service === service) &&
    `${log.service} ${log.message} ${log.status}`.toLowerCase().includes(query.toLowerCase())
  ), [level, query, service]);
  const reset = () => { setLevel("All levels"); setService("All services"); setQuery(""); };

  return <AppShell contentClassName="page-system-logs"><PageHeading eyebrow="SYSTEM LOGS · PLATFORM HEALTH" title="System Logs" subtitle="Monitor platform services, request health, and operational exceptions." actions={<button className="secondary" type="button" onClick={reset}><RefreshCw size={15} /> Reset</button>} />
    <section className="filters"><SelectBox label="LEVEL" value={level} options={["All levels", "INFO", "WARN", "ERROR"]} onChange={setLevel} /><button className="reset" type="button" onClick={reset}><RefreshCw size={14} /> Reset filters</button></section>
    <section className="filters" style={{ marginTop: 8 }}><SelectBox label="SERVICE" value={service} options={["All services", ...Array.from(new Set(logs.map((log) => log.service)))]} onChange={setService} /><label className="mini-search"><Search size={15} /><input placeholder="Search system events" value={query} onChange={(event) => setQuery(event.target.value)} /></label></section>
    <section className="kpi-grid"><article className="kpi"><div className="kpi-icon teal"><Server size={20} /></div><span>Services online</span><strong>6 / 6</strong><div className="trend up"><CheckCircle2 size={14} /><b>Operational</b></div></article><article className="kpi"><div className="kpi-icon blue"><Activity size={20} /></div><span>Events in view</span><strong>{filteredLogs.length}</strong><div className="trend up"><b>Live stream</b></div></article><article className="kpi"><div className="kpi-icon amber"><AlertTriangle size={20} /></div><span>Warnings</span><strong>{filteredLogs.filter((log) => log.level === "WARN").length}</strong><div className="trend down"><b>Review queue</b></div></article><article className="kpi"><div className="kpi-icon violet"><ShieldCheck size={20} /></div><span>Security status</span><strong>Healthy</strong><div className="trend up"><b>Protected</b></div></article></section>
    <section className="card table-card"><div className="card-head table-head"><div><h2>Platform event stream</h2><p>Service-level logs for the current operational window.</p></div></div><div className="table-scroll"><table><thead><tr><th>Timestamp</th><th>Service</th><th>Level</th><th>Event</th><th>Duration</th><th>Status</th></tr></thead><tbody>{filteredLogs.map((log) => <tr key={log.id}><td data-label="Timestamp">{log.time}</td><td data-label="Service"><b className="cell-main">{log.service}</b></td><td data-label="Level"><span className={`role-badge ${log.level === "ERROR" ? "vsr" : log.level === "WARN" ? "supervisor" : "merchandiser"}`}>{log.level}</span></td><td data-label="Event">{log.message}</td><td data-label="Duration">{log.duration}</td><td data-label="Status"><span className={`status ${log.status === "Healthy" ? "active" : "needs-review"}`}><i />{log.status}</span></td></tr>)}</tbody></table>{!filteredLogs.length && <div className="empty"><Database size={24} /><b>No logs match the selected filters.</b></div>}</div></section>
  </AppShell>;
}
