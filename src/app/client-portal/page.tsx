"use client";

import { useState, useMemo } from "react";
import {
  Building2, CheckCircle2, Download, Users, Store as StoreIcon, PackageCheck,
  MapPin, BarChart3, TrendingUp, FileText, Mail, Share2, Clock,
  CalendarDays, ChevronLeft, ChevronRight, Search, Filter, MoreHorizontal,
  Eye, AlertCircle, ShieldCheck
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, FilterBar, KpiGrid, SelectBox } from "../shared";
import { 
  clients, allStaff, stores, products, activities, calculateKPIs,
  getStaffByClient, getStoresByClient, getProductsByClient, getActivitiesByClient,
  type Client, type Staff, type Store, type Product, type Activity
} from "../hierarchy-data";

type ClientView = "overview" | "stores" | "products" | "activities" | "reports" | "coverage";

export default function ClientPortalPage() {
  const [selectedClientId, setSelectedClientId] = useState(clients[0].id);
  const [view, setView] = useState<ClientView>("overview");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId) ?? clients[0], [selectedClientId]);
  
  const clientStaff = useMemo(() => getStaffByClient(selectedClientId), [selectedClientId]);
  const clientStores = useMemo(() => getStoresByClient(selectedClientId), [selectedClientId]);
  const clientProducts = useMemo(() => getProductsByClient(selectedClientId), [selectedClientId]);
  const clientActivities = useMemo(() => getActivitiesByClient(selectedClientId), [selectedClientId]);
  const clientKPIs = useMemo(() => calculateKPIs(selectedClientId), [selectedClientId]);

  const filteredStores = useMemo(() => {
    if (!query) return clientStores;
    const q = query.toLowerCase();
    return clientStores.filter(s => s.name.toLowerCase().includes(q) || s.territory.toLowerCase().includes(q));
  }, [clientStores, query]);

  const filteredProducts = useMemo(() => {
    if (!query) return clientProducts;
    const q = query.toLowerCase();
    return clientProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [clientProducts, query]);

  const filteredActivities = useMemo(() => {
    if (!query) return clientActivities;
    const q = query.toLowerCase();
    return clientActivities.filter(a => a.staffName.toLowerCase().includes(q) || a.storeName?.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
  }, [clientActivities, query]);

  const overviewKPIs = useMemo(() => [
    { label: "Stores Covered", value: String(clientKPIs.totalStores), trend: "+12.4%", up: true, sub: "vs last period", icon: StoreIcon, tone: "blue" },
    { label: "Completion Rate", value: `${Math.round(clientStaff.reduce((s, st) => s + st.completion, 0) / (clientStaff.length || 1))}%`, trend: "+4.6%", up: true, sub: "Overall average", icon: CheckCircle2, tone: "green" },
    { label: "Products Monitored", value: String(clientKPIs.totalProducts), trend: "+2.3%", up: true, sub: "Across categories", icon: PackageCheck, tone: "teal" },
    { label: "Active Staff", value: String(clientStaff.filter(s => s.status === "Active" || s.status === "On route").length), trend: "", up: true, sub: "Field team", icon: Users, tone: "violet" },
    { label: "Territories", value: String([...new Set(clientStaff.map(s => s.territory))].length), trend: "", up: true, sub: "Geographic coverage", icon: MapPin, tone: "amber" },
    { label: "Activities (30d)", value: String(clientActivities.length), trend: "+6.1%", up: true, sub: "Field operations", icon: BarChart3, tone: "purple" },
  ], [clientStaff, clientActivities, clientKPIs]);

  const storeKPIs = useMemo(() => [
    { label: "Total Stores", value: String(clientStores.length), trend: "", up: true, sub: "", icon: StoreIcon, tone: "blue" },
    { label: "Healthy", value: String(clientStores.filter(s => s.status === "Healthy").length), trend: "", up: true, sub: "", icon: CheckCircle2, tone: "green" },
    { label: "Needs Review", value: String(clientStores.filter(s => s.status === "Needs review").length), trend: "", up: false, sub: "", icon: AlertCircle, tone: "amber" },
    { label: "With GPS", value: String(clientStores.filter(s => s.lat && s.lng).length), trend: "", up: true, sub: `${Math.round(clientStores.filter(s => s.lat && s.lng).length / clientStores.length * 100)}%`, icon: MapPin, tone: "teal" },
  ], [clientStores]);

  const productKPIs = useMemo(() => [
    { label: "Total Products", value: String(clientProducts.length), trend: "", up: true, sub: "", icon: PackageCheck, tone: "blue" },
    { label: "In Stock", value: String(clientProducts.filter(p => p.availability === "In stock").length), trend: "", up: true, sub: "", icon: CheckCircle2, tone: "green" },
    { label: "Low Stock", value: String(clientProducts.filter(p => p.availability === "Low stock").length), trend: "", up: false, sub: "", icon: AlertCircle, tone: "amber" },
    { label: "Out of Stock", value: String(clientProducts.filter(p => p.availability === "Out of stock").length), trend: "", up: false, sub: "", icon: AlertCircle, tone: "red" },
  ], [clientProducts]);

  const activityKPIs = useMemo(() => [
    { label: "Total Activities", value: String(clientActivities.length), trend: "", up: true, sub: "", icon: BarChart3, tone: "blue" },
    { label: "Store Visits", value: String(clientActivities.filter(a => a.type === "Store visit").length), trend: "", up: true, sub: "", icon: StoreIcon, tone: "green" },
    { label: "Product Checks", value: String(clientActivities.filter(a => a.type === "Product check").length), trend: "", up: true, sub: "", icon: PackageCheck, tone: "teal" },
    { label: "With Evidence", value: String(clientActivities.filter(a => a.photos && a.photos.length > 0).length), trend: "", up: true, sub: "", icon: Eye, tone: "violet" },
  ], [clientActivities]);

  const totalPages = Math.max(1, Math.ceil(
    (view === "stores" ? filteredStores : view === "products" ? filteredProducts : view === "activities" ? filteredActivities : []).length / 8
  ));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return (
    <AppShell>
      <PageHeading
        eyebrow="CLIENT REPORTING · SECURE WORKSPACE"
        title={selectedClient.name}
        subtitle={`${selectedClient.sector} · ${clientStores.length} stores · ${clientStaff.length} staff · Live data`}
        actions={
          <>
            <SelectBox 
              label="DATE RANGE" 
              value={dateRange} 
              options={["Today", "Last 7 days", "Last 30 days", "This quarter"]} 
              onChange={setDateRange} 
            />
            <button className="primary" onClick={() => alert("Generating client report...")}>
              <Download size={16} /> Download Report
            </button>
          </>
        }
      />

      <div className="filters" style={{marginBottom: 16}}>
        <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
          {([
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "stores", label: "Stores", icon: StoreIcon },
            { id: "products", label: "Products", icon: PackageCheck },
            { id: "activities", label: "Activities", icon: BarChart3 },
            { id: "reports", label: "Reports", icon: FileText },
            { id: "coverage", label: "Coverage", icon: MapPin },
          ] as const).map(tab => (
            <button
              key={tab.id}
              className={`secondary ${view === tab.id ? "chosen" : ""}`}
              onClick={() => { setView(tab.id); setPage(1); }}
              style={{display: "flex", alignItems: "center", gap: 6}}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap"}}>
          {clients.map(client => (
            <button
              key={client.id}
              className={`secondary ${selectedClientId === client.id ? "chosen" : ""}`}
              onClick={() => { setSelectedClientId(client.id); setView("overview"); setPage(1); }}
            >
              <Building2 size={14} /> {client.name}
            </button>
          ))}
        </div>

        <div className="mini-search" style={{marginTop: 12, flex: 1}}>
          <Search size={15} />
          <input placeholder="Search..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </div>
      </div>

      <KpiGrid items={view === "overview" ? overviewKPIs : view === "stores" ? storeKPIs : view === "products" ? productKPIs : activityKPIs} focus="" onFocus={() => {}} />

      {view === "overview" && (
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
          <section className="card">
            <div className="card-head"><div><h2>Store Coverage by Region</h2><p>Geographic distribution of covered stores</p></div></div>
            <div style={{padding: 16}}>
              {(() => {
                const byRegion = new Map<string, number>();
                clientStores.forEach(s => byRegion.set(s.region, (byRegion.get(s.region) || 0) + 1));
                return Array.from(byRegion.entries()).map(([region, count]) => (
                  <div key={region} style={{display: "flex", justifyContent: "space-between", padding: "8 0", borderBottom: "1px solid var(--line)"}}>
                    <span>{region}</span>
                    <b>{count} stores</b>
                  </div>
                ));
              })()}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><div><h2>Team Performance</h2><p>Completion rates by role</p></div></div>
            <div style={{padding: 16}}>
              {(() => {
                const byRole = new Map<string, { total: number; sum: number }>();
                clientStaff.forEach(s => {
                  const existing = byRole.get(s.role) || { total: 0, sum: 0 };
                  existing.total += 1;
                  existing.sum += s.completion;
                  byRole.set(s.role, existing);
                });
                return Array.from(byRole.entries()).map(([role, data]) => (
                  <div key={role} style={{display: "flex", justifyContent: "space-between", padding: "8 0", borderBottom: "1px solid var(--line)"}}>
                    <span>{role}s ({data.total})</span>
                    <b>{Math.round(data.sum / data.total)}% avg</b>
                  </div>
                ));
              })()}
            </div>
          </section>

          <section className="card" style={{gridColumn: "1 / -1"}}>
            <div className="card-head"><div><h2>Recent Activities</h2><p>Latest field operations</p></div></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Date</th><th>Staff</th><th>Role</th><th>Type</th><th>Store</th><th>Completion</th><th>Evidence</th></tr></thead>
                <tbody>
                  {clientActivities.slice(0, 8).map(act => (
                    <tr key={act.id}>
                      <td><small>{act.date} {act.time}</small></td>
                      <td><b>{act.staffName}</b></td>
                      <td><span className={`role-badge ${act.role.toLowerCase()}`}>{act.role}</span></td>
                      <td>{act.type}</td>
                      <td><small>{act.storeName || "—"}</small></td>
                      <td><span className={`status ${act.completion >= 90 ? "active" : "on-route"}`}>{act.completion}%</span></td>
                      <td>{act.photos && act.photos.length > 0 ? <span className="status active"><Eye size={12} /> {act.photos.length}</span> : <span className="status inactive">None</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {view === "stores" && (
        <section className="card table-card">
          <div className="card-head table-head">
            <div><h2>Stores</h2><p>{filteredStores.length} stores covered for {selectedClient.name}</p></div>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Store</th><th>Region/Territory</th><th>Address</th><th>GPS</th><th>Merchandiser</th><th>Status</th></tr></thead>
              <tbody>
                {filteredStores.slice((safePage - 1) * 8, safePage * 8).map(store => (
                  <tr key={store.id}>
                    <td data-label="Store"><b>{store.name}</b></td>
                    <td data-label="Region"><b>{store.region}</b><br /><small>{store.territory}</small></td>
                    <td data-label="Address"><small>{store.address}</small></td>
                    <td data-label="GPS">
                      {store.lat && store.lng ? (
                        <code>{store.lat.toFixed(4)}°, {store.lng.toFixed(4)}°</code>
                      ) : (
                        <span className="status inactive">Missing</span>
                      )}
                    </td>
                    <td data-label="Merchandiser">
                      {(() => {
                        const mer = allStaff.find(s => s.id === store.merchandiserId);
                        return mer ? <span>{mer.name}</span> : <span className="status inactive">Unassigned</span>;
                      })()}
                    </td>
                    <td data-label="Status"><span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}>{store.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <span>Page {safePage} / {totalPages}</span>
              <div>
                <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
                <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </section>
      )}

      {view === "products" && (
        <section className="card table-card">
          <div className="card-head table-head">
            <div><h2>Products</h2><p>{filteredProducts.length} products monitored across {clientStores.length} stores</p></div>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Store</th><th>Availability</th><th>Qty</th><th>Updated</th></tr></thead>
              <tbody>
                {filteredProducts.slice((safePage - 1) * 8, safePage * 8).map(product => (
                  <tr key={product.id}>
                    <td data-label="Product"><b>{product.name}</b></td>
                    <td data-label="SKU"><code>{product.sku}</code></td>
                    <td data-label="Category">{product.category}</td>
                    <td data-label="Store">
                      {(() => {
                        const store = clientStores.find(s => s.id === product.storeId);
                        return store ? store.name : "Unknown";
                      })()}
                    </td>
                    <td data-label="Availability">
                      <span className={`status ${product.availability === "In stock" ? "active" : product.availability === "Low stock" ? "on-route" : "inactive"}`}>
                        {product.availability}
                      </span>
                    </td>
                    <td data-label="Qty">{product.quantity ?? "—"}</td>
                    <td data-label="Updated"><small>{product.lastUpdated}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <span>Page {safePage} / {totalPages}</span>
              <div>
                <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
                <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </section>
      )}

      {view === "activities" && (
        <section className="card table-card">
          <div className="card-head table-head">
            <div><h2>Field Activities</h2><p>{filteredActivities.length} activities in selected period</p></div>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Date/Time</th><th>Staff</th><th>Role</th><th>Type</th><th>Store</th><th>Completion</th><th>Evidence</th><th>Notes</th></tr></thead>
              <tbody>
                {filteredActivities.slice((safePage - 1) * 8, safePage * 8).map(act => (
                  <tr key={act.id}>
                    <td data-label="Date"><small>{act.date} {act.time}</small></td>
                    <td data-label="Staff"><b>{act.staffName}</b></td>
                    <td data-label="Role"><span className={`role-badge ${act.role.toLowerCase()}`}>{act.role}</span></td>
                    <td data-label="Type">{act.type}</td>
                    <td data-label="Store"><small>{act.storeName || "Route"}</small></td>
                    <td data-label="Completion"><span className={`status ${act.completion >= 90 ? "active" : "on-route"}`}>{act.completion}%</span></td>
                    <td data-label="Evidence">{act.photos && act.photos.length > 0 ? <span className="status active"><Eye size={12} /> {act.photos.length}</span> : <span className="status inactive">None</span>}</td>
                    <td data-label="Notes"><small style={{maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{act.notes}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <span>Page {safePage} / {totalPages}</span>
              <div>
                <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
                <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </section>
      )}

      {view === "reports" && (
        <section className="card">
          <div className="card-head"><div><h2>Available Reports</h2><p>Download or schedule reports for {selectedClient.name}</p></div></div>
          <div style={{padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16}}>
            {[
              { name: "Store Coverage Report", desc: "Territory and store coverage analysis", format: "PDF", date: "2024-08-22" },
              { name: "Product Availability Report", desc: "Stock levels and availability by store", format: "Excel", date: "2024-08-22" },
              { name: "Merchandising Execution Report", desc: "Field activities and planogram compliance", format: "PDF", date: "2024-08-22" },
              { name: "Client Performance Report", desc: "SLA compliance and delivery metrics", format: "PDF", date: "2024-08-22" },
              { name: "Weekly Operations Summary", desc: "Weekly field operations overview", format: "PDF", date: "2024-08-19" },
              { name: "Monthly Performance Report", desc: "Comprehensive monthly analysis", format: "PDF", date: "2024-08-01" },
            ].map((report, i) => (
              <div key={i} className="card" style={{padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <div>
                  <b>{report.name}</b>
                  <p style={{fontSize: 13, color: "var(--muted)", marginTop: 4}}>{report.desc}</p>
                  <small>{report.format} · Generated {report.date}</small>
                </div>
                <div style={{display: "flex", gap: 8}}>
                  <button className="secondary" style={{padding: "6 12"}}><Download size={14} /> Download</button>
                  <button className="secondary" style={{padding: "6 12"}}><Mail size={14} /> Email</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "coverage" && (
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
          <section className="card">
            <div className="card-head"><div><h2>Geographic Coverage</h2><p>Store locations and territory mapping</p></div></div>
            <div style={{padding: 16, height: 300, border: "1px dashed var(--line)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)"}}>
              Interactive map showing {clientStores.length} store locations across {new Set(clientStores.map(s => s.region)).size} regions
              <br /><small>Integrate with OperationsMap for full functionality</small>
            </div>
          </section>

          <section className="card">
            <div className="card-head"><div><h2>Territory Summary</h2><p>Coverage by territory</p></div></div>
            <div style={{padding: 16}}>
              {(() => {
                const byTerritory = new Map<string, { stores: number; staff: number }>();
                clientStores.forEach(s => {
                  const existing = byTerritory.get(s.territory) || { stores: 0, staff: 0 };
                  existing.stores += 1;
                  byTerritory.set(s.territory, existing);
                });
                clientStaff.forEach(s => {
                  const existing = byTerritory.get(s.territory) || { stores: 0, staff: 0 };
                  existing.staff += 1;
                  byTerritory.set(s.territory, existing);
                });
                return Array.from(byTerritory.entries()).map(([territory, data]) => (
                  <div key={territory} className="kpi" style={{marginBottom: 8}}>
                    <small>{territory}</small>
                    <div style={{display: "flex", gap: 16, marginTop: 4}}>
                      <span><StoreIcon size={14} /> {data.stores} stores</span>
                      <span><Users size={14} /> {data.staff} staff</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </section>
        </div>
      )}

      <footer style={{marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 13}}>
        <span>KEA Operations Intelligence · Client Portal</span>
        <span>Data isolated to {selectedClient.name} · <ShieldCheck size={12} /> Secure access</span>
      </footer>
    </AppShell>
  );
}