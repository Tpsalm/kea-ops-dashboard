"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2, AlertCircle, AlertTriangle, Search, ChevronLeft, ChevronRight,
  Download, RefreshCw, MapPin, UserRound, Store as StoreIcon, PackageCheck,
  MoreHorizontal, Eye, ArrowLeft, Database, ShieldCheck
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, KpiGrid, EmptyState, SelectBox } from "../shared";
import { 
  allStaff, stores, products, activities, vsrRoutes,
  getStaffById, getStoresByMerchandiser, getProductsByStore,
  type Staff, type Store, type Product
} from "../hierarchy-data";

type IssueType = "Missing GPS" | "Duplicate Staff" | "Duplicate Store" | "Missing Assignment" | "Incorrect Territory" | "Missing Products" | "Incomplete Record" | "Invalid Location";
type IssueSeverity = "Critical" | "Warning" | "Info";

interface DataQualityIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  entity: "Staff" | "Store" | "Product" | "Activity";
  entityId: string;
  entityName: string;
  field: string;
  description: string;
  suggestedFix: string;
  detectedAt: string;
}

export default function DataQualityPage() {
  const [severity, setSeverity] = useState<"All" | IssueSeverity>("All");
  const [issueType, setIssueType] = useState<"All" | IssueType>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<DataQualityIssue | null>(null);
  const [autoFixMode, setAutoFixMode] = useState(false);

  // Generate data quality issues
  const issues = useMemo((): DataQualityIssue[] => {
    const issues: DataQualityIssue[] = [];
    const now = new Date().toISOString().split("T")[0];

    // Check staff for missing GPS
    allStaff.forEach(staff => {
      if (!staff.lat || !staff.lng || staff.lat === 0 || staff.lng === 0) {
        issues.push({
          id: `DQ-${staff.id}-GPS`,
          type: "Missing GPS",
          severity: "Critical",
          entity: "Staff",
          entityId: staff.id,
          entityName: staff.name,
          field: "lat/lng",
          description: `${staff.name} (${staff.role}) has no GPS coordinates`,
          suggestedFix: "Update staff record with valid latitude/longitude",
          detectedAt: now,
        });
      }
      
      // Check for invalid coordinates (outside Nigeria bounds)
      if (staff.lat && (staff.lat < 4 || staff.lat > 14 || staff.lng < 2 || staff.lng > 15)) {
        issues.push({
          id: `DQ-${staff.id}-INVALID-GPS`,
          type: "Invalid Location",
          severity: "Warning",
          entity: "Staff",
          entityId: staff.id,
          entityName: staff.name,
          field: "lat/lng",
          description: `${staff.name} has coordinates outside Nigeria bounds: ${staff.lat}, ${staff.lng}`,
          suggestedFix: "Verify and correct GPS coordinates",
          detectedAt: now,
        });
      }

      // Check for missing assignments
      if (!staff.route || staff.route.trim() === "") {
        issues.push({
          id: `DQ-${staff.id}-ROUTE`,
          type: "Missing Assignment",
          severity: "Warning",
          entity: "Staff",
          entityId: staff.id,
          entityName: staff.name,
          field: "route",
          description: `${staff.name} has no assigned route/territory`,
          suggestedFix: "Assign route or territory to staff member",
          detectedAt: now,
        });
      }

      // Check for missing territory
      if (!staff.territory || staff.territory.trim() === "") {
        issues.push({
          id: `DQ-${staff.id}-TERRITORY`,
          type: "Incorrect Territory",
          severity: "Warning",
          entity: "Staff",
          entityId: staff.id,
          entityName: staff.name,
          field: "territory",
          description: `${staff.name} has no territory assigned`,
          suggestedFix: "Assign territory to staff member",
          detectedAt: now,
        });
      }
    });

    // Check for duplicate staff (same name)
    const staffNames = new Map<string, Staff[]>();
    allStaff.forEach(s => {
      const key = s.name.toLowerCase();
      if (!staffNames.has(key)) staffNames.set(key, []);
      staffNames.get(key)!.push(s);
    });
    staffNames.forEach((staffList, name) => {
      if (staffList.length > 1) {
        staffList.forEach((staff, idx) => {
          if (idx > 0) {
            issues.push({
              id: `DQ-${staff.id}-DUP`,
              type: "Duplicate Staff",
              severity: "Warning",
              entity: "Staff",
              entityId: staff.id,
              entityName: staff.name,
              field: "name",
              description: `Duplicate staff name: ${staff.name} (also ${staffList[0].id})`,
              suggestedFix: "Verify if these are different people or merge records",
              detectedAt: now,
            });
          }
        });
      }
    });

    // Check stores for missing GPS
    stores.forEach(store => {
      if (!store.lat || !store.lng || store.lat === 0 || store.lng === 0) {
        issues.push({
          id: `DQ-${store.id}-GPS`,
          type: "Missing GPS",
          severity: "Critical",
          entity: "Store",
          entityId: store.id,
          entityName: store.name,
          field: "lat/lng",
          description: `Store ${store.name} has no GPS coordinates`,
          suggestedFix: "Add GPS coordinates for store location",
          detectedAt: now,
        });
      }

      // Check for missing merchandiser assignment
      if (!store.merchandiserId) {
        issues.push({
          id: `DQ-${store.id}-MERCH`,
          type: "Missing Assignment",
          severity: "Critical",
          entity: "Store",
          entityId: store.id,
          entityName: store.name,
          field: "merchandiserId",
          description: `Store ${store.name} has no assigned merchandiser`,
          suggestedFix: "Assign a merchandiser to this store",
          detectedAt: now,
        });
      } else {
        const merchandiser = getStaffById(store.merchandiserId);
        if (!merchandiser) {
          issues.push({
            id: `DQ-${store.id}-MERCH-INVALID`,
            type: "Missing Assignment",
            severity: "Critical",
            entity: "Store",
            entityId: store.id,
            entityName: store.name,
            field: "merchandiserId",
            description: `Store ${store.name} references non-existent merchandiser ${store.merchandiserId}`,
            suggestedFix: "Correct merchandiser assignment",
            detectedAt: now,
          });
        }
      }
    });

    // Check for duplicate stores (same name)
    const storeNames = new Map<string, Store[]>();
    stores.forEach(s => {
      const key = s.name.toLowerCase();
      if (!storeNames.has(key)) storeNames.set(key, []);
      storeNames.get(key)!.push(s);
    });
    storeNames.forEach((storeList, name) => {
      if (storeList.length > 1) {
        storeList.forEach((store, idx) => {
          if (idx > 0) {
            issues.push({
              id: `DQ-${store.id}-DUP`,
              type: "Duplicate Store",
              severity: "Warning",
              entity: "Store",
              entityId: store.id,
              entityName: store.name,
              field: "name",
              description: `Duplicate store name: ${store.name} (also ${storeList[0].id})`,
              suggestedFix: "Verify if these are different locations or merge records",
              detectedAt: now,
            });
          }
        });
      }
    });

    // Check products for missing data
    products.forEach(product => {
      if (!product.quantity && product.availability !== "Out of stock") {
        issues.push({
          id: `DQ-${product.id}-QTY`,
          type: "Incomplete Record",
          severity: "Info",
          entity: "Product",
          entityId: product.id,
          entityName: product.name,
          field: "quantity",
          description: `Product ${product.name} (${product.sku}) has no quantity recorded`,
          suggestedFix: "Update product quantity during next audit",
          detectedAt: now,
        });
      }

      // Check for products without store
      const store = stores.find(s => s.id === product.storeId);
      if (!store) {
        issues.push({
          id: `DQ-${product.id}-STORE`,
          type: "Missing Assignment",
          severity: "Critical",
          entity: "Product",
          entityId: product.id,
          entityName: product.name,
          field: "storeId",
          description: `Product ${product.name} references non-existent store ${product.storeId}`,
          suggestedFix: "Correct store assignment or remove orphaned product",
          detectedAt: now,
        });
      }
    });

    // Check for stores without products
    stores.forEach(store => {
      const storeProducts = getProductsByStore(store.id);
      if (storeProducts.length === 0) {
        issues.push({
          id: `DQ-${store.id}-NOPROD`,
          type: "Missing Products",
          severity: "Warning",
          entity: "Store",
          entityId: store.id,
          entityName: store.name,
          field: "products",
          description: `Store ${store.name} has no products assigned`,
          suggestedFix: "Add product assignments for this store",
          detectedAt: now,
        });
      }
    });

    // Check merchandisers without stores
    const merchandisers = allStaff.filter(s => s.role === "Merchandiser");
    merchandisers.forEach(mer => {
      const merStores = getStoresByMerchandiser(mer.id);
      if (merStores.length === 0) {
        issues.push({
          id: `DQ-${mer.id}-NOSTORE`,
          type: "Missing Assignment",
          severity: "Warning",
          entity: "Staff",
          entityId: mer.id,
          entityName: mer.name,
          field: "stores",
          description: `Merchandiser ${mer.name} has no stores assigned`,
          suggestedFix: "Assign stores to this merchandiser",
          detectedAt: now,
        });
      }
    });

    // Check VSRs without routes
    const vsrs = allStaff.filter(s => s.role === "VSR");
    vsrs.forEach(vsr => {
      const route = vsrRoutes.find(r => r.vsrId === vsr.id);
      if (!route) {
        issues.push({
          id: `DQ-${vsr.id}-NOROUTE`,
          type: "Missing Assignment",
          severity: "Warning",
          entity: "Staff",
          entityId: vsr.id,
          entityName: vsr.name,
          field: "route",
          description: `VSR ${vsr.name} has no defined route geometry`,
          suggestedFix: "Define route coordinates for this VSR",
          detectedAt: now,
        });
      }
    });

    return issues;
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (severity !== "All" && issue.severity !== severity) return false;
      if (issueType !== "All" && issue.type !== issueType) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!issue.entityName.toLowerCase().includes(q) &&
            !issue.description.toLowerCase().includes(q) &&
            !issue.entityId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [issues, severity, issueType, query]);

  const stats = useMemo(() => {
    const critical = issues.filter(i => i.severity === "Critical").length;
    const warning = issues.filter(i => i.severity === "Warning").length;
    const info = issues.filter(i => i.severity === "Info").length;
    const byType = new Map<IssueType, number>();
    issues.forEach(i => byType.set(i.type, (byType.get(i.type) || 0) + 1));
    return { critical, warning, info, byType };
  }, [issues]);

  const kpis = [
    { label: "Critical Issues", value: String(stats.critical), trend: "", up: false, sub: "Require immediate action", icon: AlertCircle, tone: "red" },
    { label: "Warnings", value: String(stats.warning), trend: "", up: false, sub: "Should be reviewed", icon: AlertTriangle, tone: "amber" },
    { label: "Info", value: String(stats.info), trend: "", up: true, sub: "Minor improvements", icon: CheckCircle2, tone: "blue" },
    { label: "Total Records", value: String(allStaff.length + stores.length + products.length), trend: "", up: true, sub: "Staff + Stores + Products", icon: Database, tone: "violet" },
    { label: "GPS Coverage", value: `${Math.round((allStaff.filter(s => s.lat && s.lng).length / allStaff.length) * 100)}%`, trend: "", up: true, sub: "Staff with coordinates", icon: MapPin, tone: "teal" },
    { label: "Assignment Rate", value: `${Math.round((allStaff.filter(s => s.route && s.territory).length / allStaff.length) * 100)}%`, trend: "", up: true, sub: "Staff with route/territory", icon: UserRound, tone: "green" },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / 10));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleIssues = filteredIssues.slice((safePage - 1) * 10, safePage * 10);

  const severityColors: Record<IssueSeverity, string> = {
    Critical: "red",
    Warning: "amber",
    Info: "blue",
  };

  const severityIcons: Record<IssueSeverity, any> = {
    Critical: AlertCircle,
    Warning: AlertTriangle,
    Info: CheckCircle2,
  };

  function SeverityIcon({ severity, size = 14 }: { severity: IssueSeverity; size?: number }) {
    const Icon = severityIcons[severity];
    return Icon ? <Icon size={size} /> : null;
  }

  function handleReset() {
    setSeverity("All");
    setIssueType("All");
    setQuery("");
    setPage(1);
  }

  function runValidation() {
    // In real app, this would trigger server-side validation
    alert("Validation completed! Found " + issues.length + " issues.");
  }

  return (
    <AppShell contentClassName="page-data-quality">
      <PageHeading
        eyebrow="DATA QUALITY · VALIDATION & EXCEPTIONS"
        title="Data Quality Dashboard"
        subtitle="Identify and resolve data issues across staff, stores, products, and activities"
        actions={
          <>
            <button className="secondary" onClick={runValidation}><RefreshCw size={16} /> Run Validation</button>
            <button className="primary" onClick={() => setAutoFixMode(!autoFixMode)}>
              {autoFixMode ? (
                <> <ShieldCheck size={16} /> Auto-fix Enabled </>
              ) : (
                <> <ShieldCheck size={16} /> Enable Auto-fix </>
              )}
            </button>
          </>
        }
      />
      
      <div className="filters" style={{marginTop: 8}}>
        <SelectBox 
          label="SEVERITY" 
          value={severity} 
          options={["All", "Critical", "Warning", "Info"]} 
          onChange={(v) => setSeverity(v as "All" | IssueSeverity)} 
        />
        <SelectBox 
          label="ISSUE TYPE" 
          value={issueType} 
          options={["All", "Missing GPS", "Duplicate Staff", "Duplicate Store", "Missing Assignment", "Incorrect Territory", "Missing Products", "Incomplete Record", "Invalid Location"]} 
          onChange={(v) => setIssueType(v as "All" | IssueType)} 
        />
        <div className="mini-search" style={{flex: 1}}>
          <Search size={15} />
          <input placeholder="Search issues..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <button className="reset" type="button" onClick={handleReset}><RefreshCw size={14} /> Reset</button>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <div className="detail-grid narrow">
        <section className="card table-card">
          <div className="card-head table-head">
            <div>
              <h2>Data Quality Issues</h2>
              <p>{filteredIssues.length} issues found · {visibleIssues.length} shown</p>
            </div>
            <div className="table-tools">
              <button className="secondary" onClick={() => {}}><Download size={15} /> Export Report</button>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Entity</th>
                  <th>Name</th>
                  <th>Field</th>
                  <th>Description</th>
                  <th>Detected</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleIssues.map(issue => (
                  <tr key={issue.id} onClick={() => setSelectedIssue(issue)} style={{cursor: "pointer"}}>
                    <td data-label="Severity">
                      <span className={`status ${severityColors[issue.severity].toLowerCase()}`}>
                        <SeverityIcon severity={issue.severity} size={14} /> {issue.severity}
                      </span>
                    </td>
                    <td data-label="Type"><span className="role-badge" style={{background: "var(--card)", color: "var(--text)", border: "1px solid var(--line)"}}>{issue.type}</span></td>
                    <td data-label="Entity"><span className="role-badge">{issue.entity}</span></td>
                    <td data-label="Name"><b>{issue.entityName}</b><br /><small>{issue.entityId}</small></td>
                    <td data-label="Field"><code>{issue.field}</code></td>
                    <td data-label="Description"><small>{issue.description}</small></td>
                    <td data-label="Detected"><small>{issue.detectedAt}</small></td>
                    <td data-label=""><MoreHorizontal size={17} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredIssues.length === 0 && (
            <EmptyState title="No issues found" hint="All data appears healthy!" icon={CheckCircle2} />
          )}

          <div className="pagination">
            <span>Showing {(safePage - 1) * 10 + 1}–{Math.min(safePage * 10, filteredIssues.length)} of {filteredIssues.length}</span>
            <div>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
              <span>{safePage} / {totalPages}</span>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        </section>

        <section className="card" style={{height: "fit-content"}}>
          <div className="card-head">
            <div><h2>Issue Details</h2><p>Select an issue to view suggested fix</p></div>
          </div>
          
          {selectedIssue ? (
            <div style={{padding: 16}}>
              <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)"}}>
                <span className={`status ${severityColors[selectedIssue.severity].toLowerCase()}`}>
                  <SeverityIcon severity={selectedIssue.severity} size={14} /> {selectedIssue.severity}
                </span>
                <span className="role-badge">{selectedIssue.type}</span>
              </div>

              <div style={{marginBottom: 16}}>
                <h4>Entity</h4>
                <div className="person" style={{marginTop: 8}}>
                  <div>{selectedIssue.entity[0]}</div>
                  <span><b>{selectedIssue.entityName}</b><small>{selectedIssue.entity} · {selectedIssue.entityId}</small></span>
                </div>
              </div>

              <div style={{marginBottom: 16, padding: 12, background: "var(--card)", borderRadius: 8}}>
                <h4>Issue Description</h4>
                <p style={{marginTop: 8, color: "var(--text)"}}>{selectedIssue.description}</p>
              </div>

              <div style={{marginBottom: 16, padding: 12, background: "var(--card)", borderRadius: 8, borderLeft: "4px solid var(--primary)"}}>
                <h4>Suggested Fix</h4>
                <p style={{marginTop: 8, color: "var(--text)"}}>{selectedIssue.suggestedFix}</p>
              </div>

              <div style={{marginBottom: 16, fontSize: 12, color: "var(--muted)"}}>
                <strong>Detected:</strong> {selectedIssue.detectedAt} · <strong>ID:</strong> {selectedIssue.id}
              </div>

              {autoFixMode && (
                <button className="primary" style={{width: "100%", marginBottom: 8}} onClick={() => {
                  alert(`Auto-fix applied for ${selectedIssue.id}`);
                  setSelectedIssue(null);
                }}>
                  <ShieldCheck size={16} /> Apply Auto-fix
                </button>
              )}

              <div style={{display: "flex", gap: 8}}>
                <button className="secondary" style={{flex: 1}} onClick={() => setSelectedIssue(null)}>
                  <ArrowLeft size={16} /> Close
                </button>
                <button className="secondary" style={{flex: 1}} onClick={() => {
                  alert(`Navigate to ${selectedIssue.entity} ${selectedIssue.entityId} for editing`);
                }}>
                  <Eye size={16} /> View Record
                </button>
              </div>
            </div>
          ) : (
            <div style={{padding: 32, textAlign: "center", color: "var(--muted)"}}>
              <ShieldCheck size={48} style={{marginBottom: 16, opacity: 0.3}} />
              <p>Select an issue from the list to view details and suggested fixes</p>
              {autoFixMode && <p style={{marginTop: 8, fontSize: 13}}>Auto-fix mode enabled - click "Apply Auto-fix" to automatically resolve</p>}
            </div>
          )}
        </section>
      </div>

      {/* Issue Type Summary */}
      <section className="card" style={{marginTop: 16}}>
        <div className="card-head"><div><h2>Issues by Type</h2><p>Breakdown of data quality issues across all entities</p></div></div>
        <div style={{padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12}}>
          {Array.from(stats.byType.entries()).map(([type, count]) => (
            <div key={type} className="kpi" style={{textAlign: "center"}}>
              <small>{type}</small>
              <h3>{count}</h3>
              <small style={{color: "var(--muted)"}}>{((count/issues.length)*100).toFixed(1)}% of total</small>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}