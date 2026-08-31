"use client";

import { useState, useMemo } from "react";
import {
  Clock, Search, ChevronLeft, ChevronRight, Download, Filter, RefreshCw,
  UserRound, Database, Edit, Eye, AlertCircle, CheckCircle2, MoreHorizontal,
  ArrowLeft, ShieldCheck, AlertTriangle
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, KpiGrid, SelectBox, EmptyState } from "../shared";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT" | "IMPORT" | "ASSIGN" | "UNASSIGN";
type AuditEntity = "Staff" | "Store" | "Product" | "Activity" | "Route" | "Client" | "User" | "Report";
type IssueSeverity = "Critical" | "Warning" | "Info";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

const mockUsers = [
  { id: "usr-001", name: "KEA Administrator", role: "Admin" },
  { id: "usr-002", name: "Operations Manager", role: "Management" },
  { id: "usr-003", name: "Field Supervisor Lagos", role: "Operations" },
  { id: "usr-004", name: "Data Analyst", role: "Operations" },
  { id: "usr-005", name: "Client Portal - Nova", role: "Client" },
];

const mockAuditData: AuditEntry[] = [
  {
    id: "audit-001", timestamp: "2024-08-23 08:45:12", user: "KEA Administrator", userRole: "Admin",
    action: "UPDATE", entity: "Staff", entityId: "KEA-MER-001", entityName: "Maria Uchechukwu",
    field: "territory", oldValue: "Lagos Central", newValue: "Lagos Island",
    ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", success: true,
  },
  {
    id: "audit-002", timestamp: "2024-08-23 08:30:45", user: "Operations Manager", userRole: "Management",
    action: "CREATE", entity: "Store", entityId: "STORE-009", entityName: "New Ikeja Mall",
    ipAddress: "192.168.1.101", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", success: true,
  },
  {
    id: "audit-003", timestamp: "2024-08-23 08:15:22", user: "Field Supervisor Lagos", userRole: "Operations",
    action: "UPDATE", entity: "Product", entityId: "PROD-003", entityName: "Nova Snacks 50g",
    field: "quantity", oldValue: "12", newValue: "45",
    ipAddress: "192.168.1.102", userAgent: "Mozilla/5.0 (Linux; Android 13)", success: true,
  },
  {
    id: "audit-004", timestamp: "2024-08-23 07:55:10", user: "Data Analyst", userRole: "Operations",
    action: "EXPORT", entity: "Report", entityId: "rpt-workforce", entityName: "Workforce Report",
    ipAddress: "192.168.1.103", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", success: true,
  },
  {
    id: "audit-005", timestamp: "2024-08-23 07:40:33", user: "KEA Administrator", userRole: "Admin",
    action: "ASSIGN", entity: "Staff", entityId: "KEA-VSR-001", entityName: "Shittu Akinsanya",
    field: "route", oldValue: "Unassigned", newValue: "Ikeja North",
    ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", success: true,
  },
  {
    id: "audit-006", timestamp: "2024-08-23 07:20:15", user: "Client Portal - Nova", userRole: "Client",
    action: "EXPORT", entity: "Report", entityId: "rpt-client-perf", entityName: "Client Performance Report",
    ipAddress: "203.0.113.45", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)", success: true,
  },
  {
    id: "audit-007", timestamp: "2024-08-22 18:30:00", user: "Operations Manager", userRole: "Management",
    action: "DELETE", entity: "Activity", entityId: "ACT-999", entityName: "Test Activity",
    ipAddress: "192.168.1.101", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", success: true,
  },
  {
    id: "audit-008", timestamp: "2024-08-22 17:45:22", user: "Data Analyst", userRole: "Operations",
    action: "IMPORT", entity: "Product", entityId: "BATCH-001", entityName: "Bulk Product Import",
    ipAddress: "192.168.1.103", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", success: false,
    errorMessage: "Invalid SKU format in row 45",
  },
  {
    id: "audit-009", timestamp: "2024-08-22 16:20:11", user: "Field Supervisor Lagos", userRole: "Operations",
    action: "UPDATE", entity: "Store", entityId: "STORE-003", entityName: "Abeokuta North Market",
    field: "status", oldValue: "Needs review", newValue: "Healthy",
    ipAddress: "192.168.1.102", userAgent: "Mozilla/5.0 (Linux; Android 13)", success: true,
  },
  {
    id: "audit-010", timestamp: "2024-08-22 15:10:05", user: "KEA Administrator", userRole: "Admin",
    action: "LOGIN", entity: "User", entityId: "usr-001", entityName: "KEA Administrator",
    ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", success: true,
  },
  {
    id: "audit-011", timestamp: "2024-08-22 14:30:44", user: "Operations Manager", userRole: "Management",
    action: "UPDATE", entity: "Route", entityId: "KEA-VSR-002", entityName: "Surulere A2",
    field: "coordinates", oldValue: "[[6.49,3.35],[6.50,3.36]]", newValue: "[[6.4969,3.3532],[6.5049,3.3612],[6.507,3.364]]",
    ipAddress: "192.168.1.101", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", success: true,
  },
  {
    id: "audit-012", timestamp: "2024-08-22 13:15:30", user: "Data Analyst", userRole: "Operations",
    action: "CREATE", entity: "Activity", entityId: "ACT-013", entityName: "Store visit - Marina Retail",
    ipAddress: "192.168.1.103", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", success: true,
  },
  {
    id: "audit-013", timestamp: "2024-08-22 12:00:00", user: "KEA Administrator", userRole: "Admin",
    action: "UNASSIGN", entity: "Staff", entityId: "KEA-MER-005", entityName: "Arorundade Adewale",
    field: "storeId", oldValue: "STORE-005", newValue: "Unassigned",
    ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", success: true,
  },
  {
    id: "audit-014", timestamp: "2024-08-22 11:45:18", user: "Client Portal - Nova", userRole: "Client",
    action: "LOGIN", entity: "User", entityId: "usr-005", entityName: "Client Portal - Nova",
    ipAddress: "203.0.113.45", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)", success: true,
  },
  {
    id: "audit-015", timestamp: "2024-08-22 10:30:00", user: "Operations Manager", userRole: "Management",
    action: "UPDATE", entity: "Client", entityId: "client-a", entityName: "Nova Consumer",
    field: "contract_status", oldValue: "Active", newValue: "Renewal pending",
    ipAddress: "192.168.1.101", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", success: true,
  },
];

const actionColors: Record<AuditAction, string> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  LOGIN: "violet",
  EXPORT: "amber",
  IMPORT: "teal",
  ASSIGN: "green",
  UNASSIGN: "amber",
};

const actionIcons: Record<AuditAction, any> = {
  CREATE: CheckCircle2,
  UPDATE: Edit,
  DELETE: AlertCircle,
  LOGIN: UserRound,
  EXPORT: Download,
  IMPORT: Database,
  ASSIGN: ShieldCheck,
  UNASSIGN: AlertCircle,
};

const severityIcons: Record<IssueSeverity, any> = {
  Critical: AlertCircle,
  Warning: AlertTriangle,
  Info: CheckCircle2,
};

function ActionIcon({ action, size = 14, style }: { action: AuditAction; size?: number; style?: React.CSSProperties }) {
  const Icon = actionIcons[action];
  return Icon ? <Icon size={size} style={style} /> : null;
}

function SeverityIcon({ severity, size = 14 }: { severity: IssueSeverity; size?: number }) {
  const Icon = severityIcons[severity];
  return Icon ? <Icon size={size} /> : null;
}

export default function AuditTrailPage() {
  const [action, setAction] = useState<"All" | AuditAction>("All");
  const [entity, setEntity] = useState<"All" | AuditEntity>("All");
  const [user, setUser] = useState("All users");
  const [dateRange, setDateRange] = useState("Last 7 days");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showSuccessOnly, setShowSuccessOnly] = useState(false);

  const filteredEntries = useMemo(() => {
    return mockAuditData.filter(entry => {
      if (action !== "All" && entry.action !== action) return false;
      if (entity !== "All" && entry.entity !== entity) return false;
      if (user !== "All users" && entry.user !== user) return false;
      if (showSuccessOnly && !entry.success) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!entry.entityName.toLowerCase().includes(q) &&
            !entry.user.toLowerCase().includes(q) &&
            !entry.entityId.toLowerCase().includes(q) &&
            !entry.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [action, entity, user, dateRange, query, showSuccessOnly]);

  const stats = useMemo(() => {
    const total = mockAuditData.length;
    const successful = mockAuditData.filter(e => e.success).length;
    const failed = mockAuditData.filter(e => !e.success).length;
    const today = mockAuditData.filter(e => e.timestamp.startsWith("2024-08-23")).length;
    const byAction = new Map<AuditAction, number>();
    mockAuditData.forEach(e => byAction.set(e.action, (byAction.get(e.action) || 0) + 1));
    return { total, successful, failed, today, byAction };
  }, []);

  const kpis = [
    { label: "Total Events", value: String(stats.total), trend: "", up: true, sub: "All time", icon: Clock, tone: "blue" },
    { label: "Successful", value: String(stats.successful), trend: "", up: true, sub: `${Math.round(stats.successful/stats.total*100)}% success rate`, icon: CheckCircle2, tone: "green" },
    { label: "Failed", value: String(stats.failed), trend: "", up: false, sub: "Require review", icon: AlertCircle, tone: "red" },
    { label: "Today", value: String(stats.today), trend: "", up: true, sub: "Last 24 hours", icon: Clock, tone: "violet" },
    { label: "Unique Users", value: String(mockUsers.length), trend: "", up: true, sub: "Active in period", icon: UserRound, tone: "teal" },
    { label: "Entities Tracked", value: "8", trend: "", up: true, sub: "Staff, Stores, Products, etc.", icon: Database, tone: "amber" },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / 15));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleEntries = filteredEntries.slice((safePage - 1) * 15, safePage * 15);

  const users = ["All users", ...mockUsers.map(u => u.name)];

  function handleReset() {
    setAction("All");
    setEntity("All");
    setUser("All users");
    setDateRange("Last 7 days");
    setQuery("");
    setShowSuccessOnly(false);
    setPage(1);
  }

  function exportAudit() {
    alert(`Exporting ${filteredEntries.length} audit entries...`);
  }

  return (
    <AppShell contentClassName="page-audit-trail">
      <PageHeading
        eyebrow="AUDIT TRAIL · DATA CHANGE HISTORY"
        title="Audit Trail"
        subtitle="Track all data changes, user actions, and system events"
        actions={
          <>
            <label style={{display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)"}}>
              <input type="checkbox" checked={showSuccessOnly} onChange={e => setShowSuccessOnly(e.target.checked)} />
              Show successful only
            </label>
            <button className="secondary" onClick={exportAudit}><Download size={16} /> Export</button>
          </>
        }
      />
      
      <div className="filters" style={{marginTop: 8}}>
        <SelectBox 
          label="ACTION" 
          value={action} 
          options={["All", "CREATE", "UPDATE", "DELETE", "LOGIN", "EXPORT", "IMPORT", "ASSIGN", "UNASSIGN"]} 
          onChange={(v) => setAction(v as "All" | AuditAction)} 
        />
        <SelectBox 
          label="ENTITY" 
          value={entity} 
          options={["All", "Staff", "Store", "Product", "Activity", "Route", "Client", "User", "Report"]} 
          onChange={(v) => setEntity(v as "All" | AuditEntity)} 
        />
        <SelectBox 
          label="USER" 
          value={user} 
          options={users} 
          onChange={setUser} 
        />
        <SelectBox 
          label="DATE RANGE" 
          value={dateRange} 
          options={["Last 24 hours", "Last 7 days", "Last 30 days", "This quarter", "All time"]} 
          onChange={setDateRange} 
        />
        <div className="mini-search" style={{flex: 1}}>
          <Search size={15} />
          <input placeholder="Search audit log..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <button className="reset" type="button" onClick={handleReset}><RefreshCw size={14} /> Reset</button>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <div className="detail-grid">
        <section className="card table-card">
          <div className="card-head table-head">
            <div>
              <h2>Audit Log</h2>
              <p>{filteredEntries.length} entries · {visibleEntries.length} shown</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Record</th>
                  <th>Field</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map(entry => (
                  <tr key={entry.id} onClick={() => setSelectedEntry(entry)} style={{cursor: "pointer"}}>
                    <td data-label="Time"><small>{entry.timestamp}</small></td>
                    <td data-label="User">
                      <div style={{display: "flex", alignItems: "center", gap: 6}}>
                        <div style={{width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10}}>
                          {entry.user.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div style={{fontSize: 13}}>{entry.user}</div>
                          <small style={{color: "var(--muted)"}}>{entry.userRole}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Action">
                      <span className={`status ${actionColors[entry.action]}`}>
                        <ActionIcon action={entry.action} size={12} />
                        {entry.action}
                      </span>
                    </td>
                    <td data-label="Entity"><span className="role-badge">{entry.entity}</span></td>
                    <td data-label="Record">
                      <b>{entry.entityName}</b>
                      <br /><small>{entry.entityId}</small>
                    </td>
                    <td data-label="Field"><code>{entry.field || "—"}</code></td>
                    <td data-label="Status">
                      <span className={`status ${entry.success ? "active" : "inactive"}`}>
                        {entry.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {entry.success ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td data-label=""><MoreHorizontal size={17} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <EmptyState title="No audit entries found" hint="Try adjusting your filters" icon={Clock} />
          )}

          <div className="pagination">
            <span>Showing {(safePage - 1) * 15 + 1}–{Math.min(safePage * 15, filteredEntries.length)} of {filteredEntries.length}</span>
            <div>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
              <span>{safePage} / {totalPages}</span>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        </section>

        <section className="card" style={{height: "fit-content"}}>
          <div className="card-head">
            <div><h2>Entry Details</h2><p>Select an entry to view full details</p></div>
          </div>
          
          {selectedEntry ? (
            <div style={{padding: 16}}>
              <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)"}}>
                <span className={`status ${actionColors[selectedEntry.action]}`}>
                  <ActionIcon action={selectedEntry.action} size={14} /> {selectedEntry.action}
                </span>
                <span className="role-badge">{selectedEntry.entity}</span>
                <span className={`status ${selectedEntry.success ? "active" : "inactive"}`} style={{marginLeft: "auto"}}>
                  {selectedEntry.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {selectedEntry.success ? "Success" : "Failed"}
                </span>
              </div>

              <div style={{marginBottom: 12}}>
                <h4>Timestamp</h4>
                <code>{selectedEntry.timestamp}</code>
              </div>

              <div style={{marginBottom: 12}}>
                <h4>User</h4>
                <div className="person">
                  <div>{selectedEntry.user.split(" ").map(n => n[0]).join("")}</div>
                  <span><b>{selectedEntry.user}</b><small>{selectedEntry.userRole}</small></span>
                </div>
              </div>

              <div style={{marginBottom: 12}}>
                <h4>Record</h4>
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                  <div style={{width: 36, height: 36, borderRadius: 8, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white"}}>
                    <Database size={18} />
                  </div>
                  <div>
                    <b>{selectedEntry.entityName}</b>
                    <br /><small>{selectedEntry.entityId}</small>
                  </div>
                </div>
              </div>

              {selectedEntry.field && (
                <div style={{marginBottom: 12, padding: 12, background: "var(--card)", borderRadius: 8}}>
                  <h4>Field Change</h4>
                  <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8}}>
                    <div>
                      <small style={{color: "var(--muted)"}}>Old Value</small>
                      <p style={{fontFamily: "monospace", wordBreak: "break-all"}}>{selectedEntry.oldValue || "(empty)"}</p>
                    </div>
                    <div>
                      <small style={{color: "var(--muted)"}}>New Value</small>
                      <p style={{fontFamily: "monospace", wordBreak: "break-all", color: "var(--primary)"}}>{selectedEntry.newValue || "(empty)"}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEntry.errorMessage && (
                <div style={{marginBottom: 12, padding: 12, background: "#fee", borderRadius: 8, border: "1px solid #fcc"}}>
                  <h4 style={{color: "#c00"}}>Error Details</h4>
                  <p style={{marginTop: 4, color: "#c00", fontFamily: "monospace", fontSize: 13}}>{selectedEntry.errorMessage}</p>
                </div>
              )}

              <div style={{marginBottom: 12, fontSize: 12, color: "var(--muted)"}}>
                <strong>IP:</strong> {selectedEntry.ipAddress} · <strong>ID:</strong> {selectedEntry.id}
              </div>

              <div style={{marginBottom: 12, fontSize: 11, color: "var(--muted)", wordBreak: "break-all"}}>
                <strong>User Agent:</strong> {selectedEntry.userAgent}
              </div>

              <div style={{display: "flex", gap: 8}}>
                <button className="secondary" style={{flex: 1}} onClick={() => setSelectedEntry(null)}>
                  <ArrowLeft size={16} /> Close
                </button>
                <button className="secondary" style={{flex: 1}} onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedEntry, null, 2));
                  alert("Entry copied to clipboard");
                }}>
                  <Eye size={16} /> Copy JSON
                </button>
              </div>
            </div>
          ) : (
            <div style={{padding: 32, textAlign: "center", color: "var(--muted)"}}>
              <Clock size={48} style={{marginBottom: 16, opacity: 0.3}} />
              <p>Select an audit entry from the list to view complete details</p>
              <p style={{marginTop: 8, fontSize: 13}}>Shows user, action, entity, field changes, and technical metadata</p>
            </div>
          )}
        </section>
      </div>

      {/* Action Summary */}
      <section className="card" style={{marginTop: 16}}>
        <div className="card-head"><div><h2>Activity Summary</h2><p>Breakdown of actions in current filter</p></div></div>
        <div style={{padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12}}>
          {Array.from(stats.byAction.entries()).map(([actionType, count]) => (
            <div key={actionType} className="kpi" style={{textAlign: "center"}}>
              <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 8}}>
                <ActionIcon action={actionType} size={20} style={{color: `var(--${actionColors[actionType]})`}} />
                <span style={{fontWeight: 600}}>{actionType}</span>
              </div>
              <h3>{count}</h3>
              <small style={{color: "var(--muted)"}}>{((count/stats.total)*100).toFixed(1)}%</small>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}