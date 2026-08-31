"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Download, FileText, BarChart3, Clock, CheckCircle2,
  AlertCircle, RefreshCw, Mail, Printer, Share2, ChevronLeft, ChevronRight,
  MoreHorizontal, Eye, Edit, Trash2, Plus, Search
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, KpiGrid, SelectBox, EmptyState } from "../shared";
import { 
  allStaff, stores, products, activities, vsrRoutes, calculateKPIs,
  getStaffByClient, getStoresByClient, getProductsByClient, getActivitiesByClient,
  type Staff, type Store, type Product, type Activity
} from "../hierarchy-data";

type ReportType = "daily" | "weekly" | "monthly" | "workforce" | "store-coverage" | "product-availability" | "merchandising" | "geographic-coverage" | "client-performance";
type ReportStatus = "Generated" | "Generating" | "Failed" | "Scheduled";

interface Report {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  lastGenerated: string | null;
  nextScheduled: string | null;
  status: ReportStatus;
  format: ("PDF" | "Excel" | "CSV")[];
  recipients: string[];
  clientId?: string;
}

interface GeneratedReport {
  id: string;
  reportId: string;
  name: string;
  generatedAt: string;
  format: "PDF" | "Excel" | "CSV";
  size: string;
  status: "Ready" | "Processing" | "Failed";
  downloadUrl?: string;
}

const reportTemplates: Report[] = [
  {
    id: "rpt-daily",
    name: "Daily Activity Report",
    type: "daily",
    description: "Summary of all field activities, visits, and completion rates for the day",
    lastGenerated: "2024-08-22 06:00",
    nextScheduled: "2024-08-23 06:00",
    status: "Generated",
    format: ["PDF", "Excel"],
    recipients: ["operations@kea.com", "management@kea.com"],
  },
  {
    id: "rpt-weekly",
    name: "Weekly Operations Report",
    type: "weekly",
    description: "Weekly summary of workforce performance, store coverage, and key metrics",
    lastGenerated: "2024-08-19 06:00",
    nextScheduled: "2024-08-26 06:00",
    status: "Generated",
    format: ["PDF", "Excel", "CSV"],
    recipients: ["management@kea.com", "director@kea.com"],
  },
  {
    id: "rpt-monthly",
    name: "Monthly Performance Report",
    type: "monthly",
    description: "Comprehensive monthly analysis of all field operations and trends",
    lastGenerated: "2024-08-01 06:00",
    nextScheduled: "2024-09-01 06:00",
    status: "Generated",
    format: ["PDF", "Excel"],
    recipients: ["director@kea.com", "board@kea.com"],
  },
  {
    id: "rpt-workforce",
    name: "Workforce Report",
    type: "workforce",
    description: "Detailed staff listings, assignments, performance, and hierarchy",
    lastGenerated: "2024-08-22 10:00",
    nextScheduled: null,
    status: "Generated",
    format: ["Excel", "CSV"],
    recipients: ["hr@kea.com", "operations@kea.com"],
  },
  {
    id: "rpt-store-coverage",
    name: "Store Coverage Report",
    type: "store-coverage",
    description: "Store-level coverage analysis with GPS validation and merchandiser assignments",
    lastGenerated: "2024-08-22 09:00",
    nextScheduled: "2024-08-29 09:00",
    status: "Generated",
    format: ["PDF", "Excel", "CSV"],
    recipients: ["operations@kea.com"],
  },
  {
    id: "rpt-product-availability",
    name: "Product Availability Report",
    type: "product-availability",
    description: "Product stock levels, availability rates, and category performance across stores",
    lastGenerated: "2024-08-22 08:00",
    nextScheduled: "2024-08-23 08:00",
    status: "Generated",
    format: ["Excel", "CSV"],
    recipients: ["merchandising@kea.com", "supply-chain@kea.com"],
  },
  {
    id: "rpt-merchandising",
    name: "Merchandising Execution Report",
    type: "merchandising",
    description: "Merchandiser activities, store visits, planogram compliance, and evidence",
    lastGenerated: "2024-08-22 11:00",
    nextScheduled: null,
    status: "Generated",
    format: ["PDF", "Excel"],
    recipients: ["merchandising@kea.com"],
  },
  {
    id: "rpt-geo-coverage",
    name: "Geographic Coverage Report",
    type: "geographic-coverage",
    description: "Territory and route coverage analysis with GPS mapping and gap identification",
    lastGenerated: "2024-08-22 12:00",
    nextScheduled: "2024-08-29 12:00",
    status: "Generated",
    format: ["PDF", "Excel"],
    recipients: ["operations@kea.com", "management@kea.com"],
  },
  {
    id: "rpt-client-perf",
    name: "Client Performance Report",
    type: "client-performance",
    description: "Client-specific delivery metrics, store coverage, and SLA compliance",
    lastGenerated: "2024-08-22 14:00",
    nextScheduled: "2024-08-29 14:00",
    status: "Generated",
    format: ["PDF", "Excel"],
    recipients: ["client-services@kea.com"],
    clientId: "client-a",
  },
];

const generatedReports: GeneratedReport[] = [
  { id: "gen-001", reportId: "rpt-daily", name: "Daily Activity Report - 2024-08-22", generatedAt: "2024-08-22 06:05", format: "PDF", size: "2.4 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-002", reportId: "rpt-daily", name: "Daily Activity Report - 2024-08-22", generatedAt: "2024-08-22 06:05", format: "Excel", size: "1.8 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-003", reportId: "rpt-weekly", name: "Weekly Operations Report - Week 33", generatedAt: "2024-08-19 06:10", format: "PDF", size: "5.2 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-004", reportId: "rpt-weekly", name: "Weekly Operations Report - Week 33", generatedAt: "2024-08-19 06:10", format: "Excel", size: "3.8 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-005", reportId: "rpt-monthly", name: "Monthly Performance Report - July 2024", generatedAt: "2024-08-01 06:15", format: "PDF", size: "12.6 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-006", reportId: "rpt-workforce", name: "Workforce Report - August 2024", generatedAt: "2024-08-22 10:05", format: "Excel", size: "890 KB", status: "Ready", downloadUrl: "#" },
  { id: "gen-007", reportId: "rpt-workforce", name: "Workforce Report - August 2024", generatedAt: "2024-08-22 10:05", format: "CSV", size: "450 KB", status: "Ready", downloadUrl: "#" },
  { id: "gen-008", reportId: "rpt-store-coverage", name: "Store Coverage Report - August 2024", generatedAt: "2024-08-22 09:05", format: "PDF", size: "3.1 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-009", reportId: "rpt-product-availability", name: "Product Availability Report - 2024-08-22", generatedAt: "2024-08-22 08:05", format: "Excel", size: "2.1 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-010", reportId: "rpt-merchandising", name: "Merchandising Execution Report - August 2024", generatedAt: "2024-08-22 11:05", format: "PDF", size: "4.5 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-011", reportId: "rpt-geo-coverage", name: "Geographic Coverage Report - August 2024", generatedAt: "2024-08-22 12:05", format: "PDF", size: "6.8 MB", status: "Ready", downloadUrl: "#" },
  { id: "gen-012", reportId: "rpt-client-perf", name: "Client Performance Report - Nova Consumer - August 2024", generatedAt: "2024-08-22 14:05", format: "PDF", size: "2.9 MB", status: "Ready", downloadUrl: "#" },
];

const typeLabels: Record<ReportType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  workforce: "Workforce",
  "store-coverage": "Store Coverage",
  "product-availability": "Product Availability",
  merchandising: "Merchandising",
  "geographic-coverage": "Geographic Coverage",
  "client-performance": "Client Performance",
};

const typeIcons: Record<ReportType, any> = {
  daily: CalendarDays,
  weekly: CalendarDays,
  monthly: CalendarDays,
  workforce: FileText,
  "store-coverage": FileText,
  "product-availability": BarChart3,
  merchandising: BarChart3,
  "geographic-coverage": BarChart3,
  "client-performance": BarChart3,
};

function TypeIcon({ type, size = 18 }: { type: ReportType; size?: number }) {
  const Icon = typeIcons[type];
  return Icon ? <Icon size={size} /> : null;
}

export default function ReportsPage() {
  const [client, setClient] = useState("All clients");
  const [reportType, setReportType] = useState<"All" | ReportType>("All");
  const [status, setStatus] = useState<"All" | ReportStatus>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"templates" | "generated">("templates");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return reportTemplates.filter(r => {
      if (reportType !== "All" && r.type !== reportType) return false;
      if (client !== "All clients" && r.clientId !== client) return false;
      if (status !== "All" && r.status !== status) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reportType, client, status, query]);

  const filteredGenerated = useMemo(() => {
    return generatedReports.filter(r => {
      const template = reportTemplates.find(t => t.id === r.reportId);
      if (!template) return false;
      if (reportType !== "All" && template.type !== reportType) return false;
      if (client !== "All clients" && template.clientId !== client) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!r.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reportType, client, query]);

  const kpis = useMemo(() => {
    const totalTemplates = reportTemplates.length;
    const totalGenerated = generatedReports.length;
    const readyCount = generatedReports.filter(r => r.status === "Ready").length;
    const scheduledCount = reportTemplates.filter(r => r.nextScheduled).length;
    const clientSpecific = reportTemplates.filter(r => r.clientId).length;
    
    return [
      { label: "Report Templates", value: String(totalTemplates), trend: "", up: true, sub: "Available types", icon: FileText, tone: "blue" },
      { label: "Generated Reports", value: String(totalGenerated), trend: "", up: true, sub: "All time", icon: CheckCircle2, tone: "green" },
      { label: "Ready to Download", value: String(readyCount), trend: "", up: true, sub: "Available now", icon: Download, tone: "teal" },
      { label: "Scheduled", value: String(scheduledCount), trend: "", up: true, sub: "Auto-generated", icon: Clock, tone: "violet" },
      { label: "Client Reports", value: String(clientSpecific), trend: "", up: true, sub: "Client-specific", icon: FileText, tone: "amber" },
    ];
  }, []);

  const totalPages = Math.max(1, Math.ceil((viewMode === "templates" ? filteredTemplates : filteredGenerated).length / 8));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleTemplates = filteredTemplates.slice((safePage - 1) * 8, safePage * 8);
  const visibleGenerated = filteredGenerated.slice((safePage - 1) * 8, safePage * 8);

  function generateReport(report: Report, format: "PDF" | "Excel" | "CSV") {
    setGenerating(report.id);
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: `gen-${Date.now()}`,
        reportId: report.id,
        name: `${report.name} - ${new Date().toISOString().split("T")[0]}`,
        generatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        format,
        size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
        status: "Ready",
        downloadUrl: "#",
      };
      generatedReports.unshift(newReport);
      setGenerating(null);
      alert(`Report generated: ${newReport.name} (${format})`);
    }, 1500);
  }

  function handleReset() {
    setClient("All clients");
    setReportType("All");
    setStatus("All");
    setQuery("");
    setPage(1);
  }

  return (
    <AppShell>
      <PageHeading
        eyebrow="AUTOMATED REPORTS · SCHEDULE & GENERATE"
        title="Reports Center"
        subtitle="Generate, schedule, and download operational reports"
        actions={
          <>
            <button className="secondary" onClick={() => setViewMode("generated")} style={{opacity: viewMode === "generated" ? 1 : 0.5}}><FileText size={16} /> Generated</button>
            <button className="secondary" onClick={() => setViewMode("templates")} style={{opacity: viewMode === "templates" ? 1 : 0.5}}><Plus size={16} /> Templates</button>
          </>
        }
      />
      
      <div className="filters" style={{marginTop: 8}}>
        <SelectBox 
          label="CLIENT" 
          value={client} 
          options={["All clients", "Nova Consumer", "Aria Foods"]} 
          onChange={setClient} 
        />
        <SelectBox 
          label="REPORT TYPE" 
          value={reportType} 
          options={["All", "daily", "weekly", "monthly", "workforce", "store-coverage", "product-availability", "merchandising", "geographic-coverage", "client-performance"]} 
          onChange={(v) => setReportType(v as "All" | ReportType)} 
        />
        <SelectBox 
          label="STATUS" 
          value={status} 
          options={["All", "Generated", "Generating", "Failed", "Scheduled"]} 
          onChange={(v) => setStatus(v as "All" | ReportStatus)} 
        />
        <div className="mini-search" style={{flex: 1}}>
          <Search size={15} />
          <input placeholder="Search reports..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <button className="reset" type="button" onClick={handleReset}><RefreshCw size={14} /> Reset</button>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      {viewMode === "templates" ? (
        <section className="card table-card">
          <div className="card-head table-head">
            <div>
              <h2>Report Templates</h2>
              <p>{filteredTemplates.length} templates · Click to generate</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Last Generated</th>
                  <th>Next Scheduled</th>
                  <th>Status</th>
                  <th>Formats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTemplates.map(report => (
                  <tr key={report.id}>
                    <td data-label="Report">
                      <div style={{display: "flex", alignItems: "center", gap: 8}}>
                        <div style={{width: 36, height: 36, borderRadius: 8, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white"}}>
                          <TypeIcon type={report.type} size={18} />
                        </div>
                        <div>
                          <b>{report.name}</b>
                          {report.clientId && (
                            <>
                              <br />
                              <small style={{color: "var(--accent)"}}>Client: {report.clientId === "client-a" ? "Nova Consumer" : "Aria Foods"}</small>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="Type"><span className="role-badge">{typeLabels[report.type]}</span></td>
                    <td data-label="Description"><small>{report.description}</small></td>
                    <td data-label="Last Generated"><small>{report.lastGenerated || "Never"}</small></td>
                    <td data-label="Next Scheduled"><small>{report.nextScheduled || "Manual only"}</small></td>
                    <td data-label="Status">
                      <span className={`status ${report.status === "Generated" ? "active" : report.status === "Generating" ? "on-route" : "inactive"}`}>
                        <CheckCircle2 size={12} /> {report.status}
                      </span>
                    </td>
                    <td data-label="Formats">
                      <div style={{display: "flex", gap: 4}}>
                        {report.format.map(f => (
                          <span key={f} className="role-badge" style={{fontSize: 10, padding: "2 6"}}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div style={{display: "flex", gap: 4}}>
                        {report.format.map(f => (
                          <button key={f} className="secondary" style={{padding: "4 8", fontSize: 11}} 
                            onClick={() => generateReport(report, f)}
                            disabled={generating === report.id}>
                            {generating === report.id ? <RefreshCw size={12} /> : <Download size={12} />} {f}
                          </button>
                        ))}
                        <button className="secondary" style={{padding: "4 8"}} onClick={() => setSelectedReport(report)}>
                          <MoreHorizontal size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>Showing {(safePage - 1) * 8 + 1}–{Math.min(safePage * 8, filteredTemplates.length)} of {filteredTemplates.length}</span>
            <div>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
              <span>{safePage} / {totalPages}</span>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        </section>
      ) : (
        <section className="card table-card">
          <div className="card-head table-head">
            <div>
              <h2>Generated Reports</h2>
              <p>{filteredGenerated.length} reports · Ready for download</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Generated</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleGenerated.map(report => (
                  <tr key={report.id}>
                    <td data-label="Report"><b>{report.name}</b></td>
                    <td data-label="Generated"><small>{report.generatedAt}</small></td>
                    <td data-label="Format"><span className="role-badge">{report.format}</span></td>
                    <td data-label="Size"><small>{report.size}</small></td>
                    <td data-label="Status">
                      <span className={`status ${report.status === "Ready" ? "active" : report.status === "Processing" ? "on-route" : "inactive"}`}>
                        {report.status === "Ready" ? <CheckCircle2 size={12} /> : report.status === "Processing" ? <RefreshCw size={12} /> : <AlertCircle size={12} />}
                        {report.status}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div style={{display: "flex", gap: 4}}>
                        <button className="secondary" style={{padding: "4 8"}} onClick={() => alert(`Downloading ${report.name}...`)}>
                          <Download size={12} /> Download
                        </button>
                        <button className="secondary" style={{padding: "4 8"}}><Mail size={12} /> Email</button>
                        <button className="secondary" style={{padding: "4 8"}}><Share2 size={12} /> Share</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredGenerated.length === 0 && (
            <EmptyState title="No generated reports" hint="Generate reports from the Templates tab" icon={FileText} />
          )}

          <div className="pagination">
            <span>Showing {(safePage - 1) * 8 + 1}–{Math.min(safePage * 8, filteredGenerated.length)} of {filteredGenerated.length}</span>
            <div>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
              <span>{safePage} / {totalPages}</span>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        </section>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedReport(null); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Report details" style={{maxWidth: 600}}>
            <div className="modal-head">
              <div>
                <small>REPORT TEMPLATE</small>
                <h2>{selectedReport.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} aria-label="Close"><MoreHorizontal size={19} /></button>
            </div>
            <div className="modal-body" style={{padding: 16}}>
              <div style={{marginBottom: 16}}>
                <h4>Description</h4>
                <p style={{marginTop: 8, color: "var(--muted)"}}>{selectedReport.description}</p>
              </div>
              
              <div className="modal-two-col" style={{marginBottom: 16}}>
                <div>
                  <h4>Schedule</h4>
                  <p><strong>Frequency:</strong> {typeLabels[selectedReport.type]}</p>
                  <p><strong>Last Generated:</strong> {selectedReport.lastGenerated || "Never"}</p>
                  <p><strong>Next Scheduled:</strong> {selectedReport.nextScheduled || "Manual only"}</p>
                </div>
                <div>
                  <h4>Delivery</h4>
                  <p><strong>Formats:</strong> {selectedReport.format.join(", ")}</p>
                  <p><strong>Recipients:</strong></p>
                  <ul style={{marginTop: 4, fontSize: 13, color: "var(--muted)"}}>
                    {selectedReport.recipients.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{display: "flex", gap: 8, marginBottom: 16, paddingTop: 16, borderTop: "1px solid var(--line)"}}>
                {selectedReport.format.map(f => (
                  <button key={f} className="primary" style={{flex: 1}} onClick={() => generateReport(selectedReport, f)} disabled={generating === selectedReport.id}>
                    {generating === selectedReport.id ? <RefreshCw size={16} /> : <Download size={16} />} Generate {f}
                  </button>
                ))}
              </div>

              <button className="secondary" style={{width: "100%"}} onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}