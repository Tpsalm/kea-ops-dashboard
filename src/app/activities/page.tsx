"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Filter, Download, Search, ChevronLeft, ChevronRight,
  Image, MapPin, CheckCircle2, AlertCircle, Clock, UserRound,
  Store, PackageCheck, MoreHorizontal, Eye, ArrowLeft, ClipboardCheck
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, FilterBar, WorkforceTable, KpiGrid, EmptyState, SelectBox } from "../shared";
import { 
  activities, allStaff, stores, getActivitiesByStaff, getActivitiesByStore, getStaffById,
  type Activity, type Staff
} from "../hierarchy-data";

type ActivityType = "Store visit" | "Merchandising" | "Product check" | "Route completion" | "Evidence upload";

export default function ActivitiesPage() {
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [activityType, setActivityType] = useState<"All types" | ActivityType>("All types");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<keyOfActivity>("date");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "map">("list");

  type keyOfActivity = keyof Activity;

  const filteredActivities = useMemo(() => {
    let result = [...activities];
    const latestDate = Math.max(...activities.map((activity) => Date.parse(activity.date)));
    const rangeDays = dateRange === "Today" ? 1 : dateRange === "Last 7 days" ? 7 : dateRange === "This quarter" ? 92 : 30;
    result = result.filter((activity) => latestDate - Date.parse(activity.date) < rangeDays * 24 * 60 * 60 * 1000);
    
    if (region !== "All regions") {
      const staffInRegion = allStaff.filter(s => s.region === region).map(s => s.id);
      result = result.filter(a => staffInRegion.includes(a.staffId));
    }
    
    if (role !== "All roles") {
      const staffInRole = allStaff.filter(s => s.role === role).map(s => s.id);
      result = result.filter(a => staffInRole.includes(a.staffId));
    }
    
    if (activityType !== "All types") {
      result = result.filter(a => a.type === activityType);
    }
    
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(a => 
        a.staffName.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q) ||
        a.storeName?.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    
    return result.sort((a, b) => {
      const av = a[sort]; const bv = b[sort];
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * (asc ? 1 : -1);
    });
  }, [region, role, activityType, dateRange, query, sort, asc]);

  const kpis = useMemo(() => {
    const total = filteredActivities.length;
    const visits = filteredActivities.filter(a => a.type === "Store visit").length;
    const merchandising = filteredActivities.filter(a => a.type === "Merchandising").length;
    const productChecks = filteredActivities.filter(a => a.type === "Product check").length;
    const routeCompletions = filteredActivities.filter(a => a.type === "Route completion").length;
    const withPhotos = filteredActivities.filter(a => a.photos && a.photos.length > 0).length;
    const avgCompletion = total > 0 ? Math.round(filteredActivities.reduce((s, a) => s + a.completion, 0) / total) : 0;
    
    return [
      { label: "Total Activities", value: String(total), trend: "", up: true, sub: "All types", icon: CheckCircle2, tone: "blue" },
      { label: "Store Visits", value: String(visits), trend: "", up: true, sub: "Field visits", icon: Store, tone: "teal" },
      { label: "Product Checks", value: String(productChecks), trend: "", up: true, sub: "Inventory audits", icon: PackageCheck, tone: "amber" },
      { label: "Route Completions", value: String(routeCompletions), trend: "", up: true, sub: "VSR routes", icon: MapPin, tone: "violet" },
      { label: "With Evidence", value: String(withPhotos), trend: "", up: true, sub: `${total > 0 ? Math.round(withPhotos/total*100) : 0}% have photos`, icon: Image, tone: "green" },
      { label: "Avg Completion", value: `${avgCompletion}%`, trend: "", up: true, sub: "Quality score", icon: CheckCircle2, tone: "purple" },
    ];
  }, [filteredActivities]);

  function chooseSort(key: keyOfActivity) {
    if (sort === key) setAsc(!asc);
    else { setSort(key); setAsc(true); }
  }

  function handleReset() {
    setRegion("All regions");
    setRole("All roles");
    setActivityType("All types");
    setDateRange("Last 30 days");
    setQuery("");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / 10));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleActivities = filteredActivities.slice((safePage - 1) * 10, safePage * 10);

  return (
    <AppShell contentClassName="page-activities">
      <PageHeading
        eyebrow="FIELD ACTIVITIES · EVIDENCE TRACKING"
        title="Field Activities"
        subtitle="Track all field operations with photos, GPS, and completion status"
        actions={<button className="secondary" onClick={() => {}}><Download size={16} /> Export</button>}
      />
      
      <FilterBar
        region={region}
        onRegion={(v) => { setRegion(v); setPage(1); }}
        role={role}
        onRole={(v) => { setRole(v); setPage(1); }}
        onReset={handleReset}
      />
      
      <div className="filters" style={{marginTop: 8}}>
        <SelectBox 
          label="ACTIVITY TYPE" 
          value={activityType} 
          options={["All types", "Store visit", "Merchandising", "Product check", "Route completion", "Evidence upload"]} 
          onChange={(v) => setActivityType(v as "All types" | ActivityType)} 
        />
        <SelectBox 
          label="DATE RANGE" 
          value={dateRange} 
          options={["Today", "Last 7 days", "Last 30 days", "This quarter"]} 
          onChange={setDateRange} 
        />
        <div className="mini-search" style={{flex: 1}}>
          <Search size={15} />
          <input placeholder="Search activities..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </div>
      </div>

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <div style={{display: "grid", gridTemplateColumns: "1fr 380px", gap: 16}}>
        <section className="card table-card">
          <div className="card-head table-head">
            <div>
              <h2>Activity Log</h2>
              <p>{filteredActivities.length} activities · {visibleActivities.length} shown</p>
            </div>
            <div className="table-tools">
              <button className="secondary" onClick={() => setViewMode("list")} style={{opacity: viewMode === "list" ? 1 : 0.5}}><CheckCircle2 size={15} /> List</button>
              <button className="secondary" onClick={() => setViewMode("calendar")} style={{opacity: viewMode === "calendar" ? 1 : 0.5}}><CalendarDays size={15} /> Calendar</button>
              <button className="secondary" onClick={() => setViewMode("map")} style={{opacity: viewMode === "map" ? 1 : 0.5}}><MapPin size={15} /> Map</button>
            </div>
          </div>

          {viewMode === "list" && (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => chooseSort("date")}>Date ↕</th>
                      <th onClick={() => chooseSort("time")}>Time ↕</th>
                      <th>Staff</th>
                      <th>Role</th>
                      <th>Type</th>
                      <th>Store</th>
                      <th>Completion</th>
                      <th>Evidence</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleActivities.map(act => (
                      <tr key={act.id} onClick={() => setSelectedActivity(act)} style={{cursor: "pointer"}}>
                        <td data-label="Date"><small>{act.date}</small></td>
                        <td data-label="Time"><small>{act.time}</small></td>
                        <td data-label="Staff"><div className="person"><div>{act.staffName.split(" ").map(n=>n[0]).join("")}</div><span><b>{act.staffName}</b></span></div></td>
                        <td data-label="Role"><span className={`role-badge ${act.role.toLowerCase()}`}>{act.role}</span></td>
                        <td data-label="Type">
                          <span className={`status ${act.type === "Route completion" ? "active" : act.type === "Store visit" ? "on-route" : "needs-review"}`}>
                            {act.type}
                          </span>
                        </td>
                        <td data-label="Store"><small>{act.storeName || "—"}</small></td>
                        <td data-label="Completion">
                          <div className="progress-cell">
                            <div><i style={{width: `${act.completion}%`}}/></div>
                            <b>{act.completion}%</b>
                          </div>
                        </td>
                        <td data-label="Evidence">
                          {act.photos && act.photos.length > 0 ? (
                            <span className="status active"><Image size={14} /> {act.photos.length} photo(s)</span>
                          ) : (
                            <span className="status inactive"><i /> No evidence</span>
                          )}
                        </td>
                        <td data-label=""><MoreHorizontal size={17} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredActivities.length === 0 && (
                <EmptyState title="No activities found" hint="Try adjusting your filters or search." />
              )}

              <div className="pagination">
                <span>Showing {(safePage - 1) * 10 + 1}–{Math.min(safePage * 10, filteredActivities.length)} of {filteredActivities.length}</span>
                <div>
                  <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
                  <span>{safePage} / {totalPages}</span>
                  <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
                </div>
              </div>
            </>
          )}

          {viewMode === "calendar" && (
            <div style={{padding: 16}}>
              <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 16}}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} style={{textAlign: "center", fontWeight: 600, fontSize: 12, color: "var(--muted)", padding: 8}}>{d}</div>
                ))}
              </div>
              <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4}}>
                {/* Calendar days would go here - simplified for now */}
                {Array.from({length: 31}).map((_, i) => (
                  <div key={i} style={{aspectRatio: 1, border: "1px solid var(--line)", borderRadius: 8, padding: 4, fontSize: 11}}>
                    <div style={{fontWeight: 600}}>{i + 1}</div>
                    <div style={{fontSize: 10, color: "var(--muted)"}}>
                      {filteredActivities.filter(a => a.date.includes(String(i + 1).padStart(2, '0'))).length} activities
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "map" && (
            <div style={{height: 400, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)"}}>
              <div style={{height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)"}}>
                Map view - shows activity locations with GPS coordinates
                <br />
                <small>Integrate with OperationsMap component for full functionality</small>
              </div>
            </div>
          )}
        </section>

        <section className="card" style={{height: "fit-content"}}>
          <div className="card-head">
            <div><h2>Activity Details</h2><p>Select an activity to view evidence</p></div>
          </div>
          
          {selectedActivity ? (
            <div style={{padding: 16}}>
              <div className="kpi-grid" style={{gridTemplateColumns: "1fr 1fr"}}>
                <div className="kpi"><small>Type</small><h3 style={{fontSize: 14}}>{selectedActivity.type}</h3></div>
                <div className="kpi"><small>Date</small><h3 style={{fontSize: 14}}>{selectedActivity.date}</h3></div>
                <div className="kpi"><small>Time</small><h3 style={{fontSize: 14}}>{selectedActivity.time}</h3></div>
                <div className="kpi"><small>Completion</small><h3 style={{fontSize: 14}}>{selectedActivity.completion}%</h3></div>
              </div>

              <div style={{marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)"}}>
                <h4>Staff</h4>
                <div className="person"><div>{selectedActivity.staffName.split(" ").map(n=>n[0]).join("")}</div><span><b>{selectedActivity.staffName}</b><small>{selectedActivity.role}</small></span></div>
              </div>

              {selectedActivity.storeName && (
                <div style={{marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)"}}>
                  <h4>Store</h4>
                  <div style={{display: "flex", alignItems: "center", gap: 8}}>
                    <Store size={18} />
                    <div><b>{selectedActivity.storeName}</b></div>
                  </div>
                </div>
              )}

              {selectedActivity.lat && selectedActivity.lng && (
                <div style={{marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)"}}>
                  <h4>GPS Location</h4>
                  <code>{selectedActivity.lat.toFixed(5)}° N, {selectedActivity.lng.toFixed(5)}° E</code>
                </div>
              )}

              <div style={{marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)"}}>
                <h4>Notes</h4>
                <p style={{whiteSpace: "pre-wrap", color: "var(--muted)"}}>{selectedActivity.notes}</p>
              </div>

              {selectedActivity.photos && selectedActivity.photos.length > 0 && (
                <div style={{marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)"}}>
                  <h4>Evidence Photos</h4>
                  <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginTop: 8}}>
                    {selectedActivity.photos.map((photo, i) => (
                      <div key={i} style={{aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", position: "relative"}}>
                        <img src={photo} alt={`Evidence ${i+1}`} style={{width: "100%", height: "100%", objectFit: "cover"}} />
                        <div style={{position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "white", padding: 4, fontSize: 11, textAlign: "center"}}>
                          Photo {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="secondary" style={{marginTop: 16, width: "100%"}} onClick={() => setSelectedActivity(null)}>
                <ArrowLeft size={16} /> Close Details
              </button>
            </div>
          ) : (
            <div style={{padding: 32, textAlign: "center", color: "var(--muted)"}}>
              <ClipboardCheck size={48} style={{marginBottom: 16, opacity: 0.3}} />
              <p>Select an activity from the list to view details and evidence</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}