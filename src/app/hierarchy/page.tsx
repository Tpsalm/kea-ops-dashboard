"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronRight, Users, UserRound, Store as StoreIcon, PackageCheck, MapPin,
  CheckCircle2, AlertCircle, Search, ChevronDown, ChevronUp,
  Download, Eye, MoreHorizontal, ArrowLeft
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { PageHeading, FilterBar, WorkforceTable, KpiGrid, EmptyState } from "../shared";
import { 
  allStaff, stores, products, activities, vsrRoutes,
  getChildren, getParent, getStoresByMerchandiser, getStoresBySupervisor, getStoresByTSR,
  getProductsByStore, getProductsByMerchandiser, getActivitiesByStaff, getActivitiesByStore,
  getVSRRoute, getStaffById, getStaffByClient, getStoresByClient,
  calculateKPIs, type Staff, type Store, type Product, type Activity
} from "../hierarchy-data";

type ViewLevel = "tsr" | "supervisor" | "merchandiser" | "store" | "product" | "activity" | "vsr" | "route";
type SelectedEntity = { level: ViewLevel; id: string; data: any };

export default function HierarchyPage() {
  const [region, setRegion] = useState("All regions");
  const [client, setClient] = useState("All clients");
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [viewMode, setViewMode] = useState<"hierarchy" | "map">("hierarchy");
  const [mapViewMode, setMapViewMode] = useState<"all" | "vsr-routes" | "merchandiser-stores" | "supervisor-team" | "tsr-territory">("all");

  const tsrs = useMemo(() => {
    let staff = allStaff.filter(s => s.role === "TSR");
    if (region !== "All regions") staff = staff.filter(s => s.region === region);
    if (client !== "All clients") staff = staff.filter(s => s.clientId === client);
    return staff;
  }, [region, client]);

  const kpis = useMemo(() => {
    const k = calculateKPIs(client !== "All clients" ? client : undefined);
    return [
      { label: "Total TSRs", value: String(k.totalTSRs), trend: "", up: true, sub: "Territory leads", icon: Users, tone: "violet" },
      { label: "Total Supervisors", value: String(k.totalSupervisors), trend: "", up: true, sub: "Team leads", icon: UserRound, tone: "amber" },
      { label: "Total Merchandisers", value: String(k.totalMerchandisers), trend: "", up: true, sub: "Store execution", icon: StoreIcon, tone: "teal" },
      { label: "Total VSRs", value: String(k.totalVSRs), trend: "", up: true, sub: "Route coverage", icon: MapPin, tone: "blue" },
      { label: "Total Stores", value: String(k.totalStores), trend: "", up: true, sub: "Covered locations", icon: StoreIcon, tone: "green" },
      { label: "Total Products", value: String(k.totalProducts), trend: "", up: true, sub: "Monitored SKUs", icon: PackageCheck, tone: "purple" },
    ];
  }, [client]);

  // Handle drill-down navigation
  const handleDrillDown = (level: ViewLevel, id: string, data: any) => {
    setSelectedEntity({ level, id, data });
  };

  const handleBack = () => {
    if (!selectedEntity) return;
    const levels: ViewLevel[] = ["tsr", "supervisor", "merchandiser", "store", "product", "activity"];
    const vsrLevels: ViewLevel[] = ["tsr", "vsr", "route"];
    const currentIndex = levels.indexOf(selectedEntity.level);
    const vsrIndex = vsrLevels.indexOf(selectedEntity.level);
    
    if (currentIndex > 0) {
      const parentLevel = levels[currentIndex - 1];
      let parentId = "";
      let parentData = null;
      
      if (selectedEntity.level === "supervisor") {
        parentId = selectedEntity.data.parentId || "";
        parentData = getStaffById(parentId);
      } else if (selectedEntity.level === "merchandiser") {
        parentId = selectedEntity.data.parentId || "";
        parentData = getStaffById(parentId);
      } else if (selectedEntity.level === "store") {
        parentId = selectedEntity.data.merchandiserId || "";
        parentData = getStaffById(parentId);
      } else if (selectedEntity.level === "product") {
        parentId = selectedEntity.data.storeId || "";
        parentData = stores.find(s => s.id === parentId);
      }
      
      if (parentData) {
        setSelectedEntity({ level: parentLevel, id: parentId, data: parentData });
      }
    } else if (vsrIndex > 0) {
      const parentLevel = vsrLevels[vsrIndex - 1];
      let parentId = "";
      let parentData = null;
      
      if (selectedEntity.level === "vsr") {
        parentId = selectedEntity.data.parentId || "";
        parentData = getStaffById(parentId);
      } else if (selectedEntity.level === "route") {
        parentId = selectedEntity.data.vsrId || "";
        parentData = getStaffById(parentId);
      }
      
      if (parentData) {
        setSelectedEntity({ level: parentLevel, id: parentId, data: parentData });
      }
    } else {
      setSelectedEntity(null);
    }
  };

  const handleReset = () => {
    setRegion("All regions");
    setClient("All clients");
    setSelectedEntity(null);
  };

  useEffect(() => {
    if (selectedEntity?.level === "merchandiser") setMapViewMode("merchandiser-stores");
    else if (selectedEntity?.level === "vsr") setMapViewMode("vsr-routes");
    else setMapViewMode("all");
  }, [selectedEntity]);

  // Render based on selected entity
  const renderDetailView = () => {
    if (!selectedEntity) return null;

    switch (selectedEntity.level) {
      case "tsr": {
        const tsr = selectedEntity.data as Staff;
        const supervisors = getChildren(tsr.id).filter(s => s.role === "Supervisor");
        const vsrs = getChildren(tsr.id).filter(s => s.role === "VSR");
        const storesList = getStoresByTSR(tsr.id);
        
        return (
          <section className="card table-card">
            <div className="card-head table-head">
              <div>
                <h2>{tsr.name} — Territory Overview</h2>
                <p>TSR: {tsr.territory}, {tsr.region} · {tsr.route}</p>
              </div>
              <button className="secondary" onClick={handleBack}><ArrowLeft size={16} /> Back</button>
            </div>
            
            <div className="kpi-grid" style={{margin: 16}}>
              <div className="kpi"><small>Supervisors</small><h3>{supervisors.length}</h3></div>
              <div className="kpi"><small>VSRs</small><h3>{vsrs.length}</h3></div>
              <div className="kpi"><small>Stores</small><h3>{storesList.length}</h3></div>
              <div className="kpi"><small>Completion</small><h3>{tsr.completion}%</h3></div>
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Supervisors</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {supervisors.map(sup => (
                <button key={sup.id} className="modal-row" onClick={() => handleDrillDown("supervisor", sup.id, sup)} style={{textAlign: "left"}}>
                  <UserRound size={17} /><span><b>{sup.name}</b><small>{sup.territory} · {sup.completion}%</small></span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>VSRs</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {vsrs.map(vsr => (
                <button key={vsr.id} className="modal-row" onClick={() => handleDrillDown("vsr", vsr.id, vsr)} style={{textAlign: "left"}}>
                  <MapPin size={17} style={{color: "#2563eb"}} /><span><b>{vsr.name}</b><small>{vsr.route} · {vsr.completion}%</small></span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Stores in Territory</h4>
            <WorkforceTable
              rows={storesList.map(s => ({ 
                id: s.id, name: s.name, role: "Store" as any, region: s.region, territory: s.territory,
                route: s.merchandiserId || "", status: s.status === "Healthy" ? "Active" : "Needs review" as any, visits: 0, completion: 0, lat: s.lat, lng: s.lng 
              }))}
              page={1} pageSize={5} onPage={()=>{}} sort="name" asc={true} onSort={()=>{}} onView={()=>{}} query="" onQuery={()=>{}}
            />
          </section>
        );
      }

      case "supervisor": {
        const sup = selectedEntity.data as Staff;
        const merchandisers = getChildren(sup.id).filter(m => m.role === "Merchandiser");
        const storesList = getStoresBySupervisor(sup.id);
        
        return (
          <section className="card table-card">
            <div className="card-head table-head">
              <div>
                <h2>{sup.name} — Team Overview</h2>
                <p>Supervisor: {sup.territory}, {sup.region} · {sup.route}</p>
              </div>
              <button className="secondary" onClick={handleBack}><ArrowLeft size={16} /> Back</button>
            </div>
            
            <div className="kpi-grid" style={{margin: 16}}>
              <div className="kpi"><small>Merchandisers</small><h3>{merchandisers.length}</h3></div>
              <div className="kpi"><small>Stores</small><h3>{storesList.length}</h3></div>
              <div className="kpi"><small>Completion</small><h3>{sup.completion}%</h3></div>
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Merchandisers</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {merchandisers.map(mer => (
                <button key={mer.id} className="modal-row" onClick={() => handleDrillDown("merchandiser", mer.id, mer)} style={{textAlign: "left"}}>
                  <UserRound size={17} style={{color: "#14b8a6"}} /><span><b>{mer.name}</b><small>{mer.route} · {mer.completion}%</small></span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Stores Covered</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {storesList.map(store => (
                <button key={store.id} className="modal-row" onClick={() => handleDrillDown("store", store.id, store)} style={{textAlign: "left"}}>
                  <StoreIcon size={17} style={{color: "#2563eb"}} /><span><b>{store.name}</b><small>{store.address}</small></span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </section>
        );
      }

      case "merchandiser": {
        const mer = selectedEntity.data as Staff;
        const storesList = getStoresByMerchandiser(mer.id);
        const activitiesList = getActivitiesByStaff(mer.id);
        const productsList = getProductsByMerchandiser(mer.id);
        
        return (
          <section className="card table-card">
            <div className="card-head table-head">
              <div>
                <h2>{mer.name} — Store & Product View</h2>
                <p>Merchandiser: {mer.territory}, {mer.region} · {mer.route}</p>
              </div>
              <button className="secondary" onClick={handleBack}><ArrowLeft size={16} /> Back</button>
            </div>
            
            <div className="kpi-grid" style={{margin: 16}}>
              <div className="kpi"><small>Stores</small><h3>{storesList.length}</h3></div>
              <div className="kpi"><small>Products</small><h3>{productsList.length}</h3></div>
              <div className="kpi"><small>Activities</small><h3>{activitiesList.length}</h3></div>
              <div className="kpi"><small>Completion</small><h3>{mer.completion}%</h3></div>
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Assigned Stores</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {storesList.map(store => (
                <button key={store.id} className="modal-row" onClick={() => handleDrillDown("store", store.id, store)} style={{textAlign: "left"}}>
                  <StoreIcon size={17} style={{color: "#2563eb"}} /><span><b>{store.name}</b><small>{store.address}</small></span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Recent Activities</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {activitiesList.slice(0, 5).map(act => (
                <div key={act.id} className="modal-row" style={{textAlign: "left", justifyContent: "space-between"}}>
                  <div>
                    <small style={{color: "var(--muted)"}}>{act.date} {act.time}</small>
                    <div><b>{act.type}</b> - {act.storeName || "Route"}</div>
                    <small>{act.notes.substring(0, 80)}...</small>
                  </div>
                  <div style={{textAlign: "right"}}>
                    <span className={`status ${act.completion >= 90 ? "active" : act.completion >= 70 ? "on-route" : "needs-review"}`}>
                      <i />{act.completion}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "store": {
        const store = selectedEntity.data as Store;
        const storeProducts = getProductsByStore(store.id);
        const storeActivities = getActivitiesByStore(store.id);
        const merchandiser = getStaffById(store.merchandiserId);
        const supervisor = getStaffById(store.supervisorId);
        const tsr = getStaffById(store.tsrId);
        
        return (
          <section className="card table-card">
            <div className="card-head table-head">
              <div>
                <h2>{store.name}</h2>
                <p>{store.address} · {store.territory}, {store.region}</p>
              </div>
              <button className="secondary" onClick={handleBack}><ArrowLeft size={16} /> Back</button>
            </div>
            
            <div className="kpi-grid" style={{margin: 16}}>
              <div className="kpi"><small>Products</small><h3>{storeProducts.length}</h3></div>
              <div className="kpi"><small>In Stock</small><h3>{storeProducts.filter(p => p.availability === "In stock").length}</h3></div>
              <div className="kpi"><small>Low Stock</small><h3>{storeProducts.filter(p => p.availability === "Low stock").length}</h3></div>
              <div className="kpi"><small>Out of Stock</small><h3>{storeProducts.filter(p => p.availability === "Out of stock").length}</h3></div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 16px 16px"}}>
              <div>
                <h4>Merchandiser</h4>
                {merchandiser && (
                  <button className="modal-row" onClick={() => handleDrillDown("merchandiser", merchandiser.id, merchandiser)} style={{textAlign: "left"}}>
                    <UserRound size={17} /><span><b>{merchandiser.name}</b><small>{merchandiser.id}</small></span>
                  </button>
                )}
                <h4 style={{marginTop: 12}}>Supervisor</h4>
                {supervisor && (
                  <button className="modal-row" onClick={() => handleDrillDown("supervisor", supervisor.id, supervisor)} style={{textAlign: "left"}}>
                    <UserRound size={17} /><span><b>{supervisor.name}</b><small>{supervisor.id}</small></span>
                  </button>
                )}
                <h4 style={{marginTop: 12}}>TSR</h4>
                {tsr && (
                  <button className="modal-row" onClick={() => handleDrillDown("tsr", tsr.id, tsr)} style={{textAlign: "left"}}>
                    <Users size={17} /><span><b>{tsr.name}</b><small>{tsr.id}</small></span>
                  </button>
                )}
              </div>
              <div>
                <h4>GPS Coordinates</h4>
                <code>{store.lat.toFixed(5)}° N, {store.lng.toFixed(5)}° E</code>
                <h4 style={{marginTop: 12}}>Status</h4>
                <span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}><i />{store.status}</span>
              </div>
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Products</h4>
            <div className="table-scroll" style={{padding: "0 16px 16px"}}>
              <table>
                <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Availability</th><th>Qty</th><th>Updated</th></tr></thead>
                <tbody>
                  {storeProducts.map(p => (
                    <tr key={p.id}>
                      <td><b>{p.name}</b></td>
                      <td><code>{p.sku}</code></td>
                      <td>{p.category}</td>
                      <td><span className={`status ${p.availability === "In stock" ? "active" : p.availability === "Low stock" ? "on-route" : "inactive"}`}><i />{p.availability}</span></td>
                      <td>{p.quantity ?? "—"}</td>
                      <td><small>{p.lastUpdated}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{margin: "16px 16px 8px"}}>Recent Activities</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {storeActivities.slice(0, 5).map(act => (
                <div key={act.id} className="modal-row" style={{textAlign: "left", justifyContent: "space-between"}}>
                  <div>
                    <small style={{color: "var(--muted)"}}>{act.date} {act.time}</small>
                    <div><b>{act.staffName}</b> - {act.type}</div>
                    <small>{act.notes.substring(0, 80)}...</small>
                  </div>
                  <span className={`status ${act.completion >= 90 ? "active" : act.completion >= 70 ? "on-route" : "needs-review"}`}><i />{act.completion}%</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "vsr": {
        const vsr = selectedEntity.data as Staff;
        const route = getVSRRoute(vsr.id);
        const activitiesList = getActivitiesByStaff(vsr.id);
        
        return (
          <section className="card table-card">
            <div className="card-head table-head">
              <div>
                <h2>{vsr.name} — Route Operations</h2>
                <p>VSR: {vsr.territory}, {vsr.region} · {vsr.route}</p>
              </div>
              <button className="secondary" onClick={handleBack}><ArrowLeft size={16} /> Back</button>
            </div>
            
            <div className="kpi-grid" style={{margin: 16}}>
              <div className="kpi"><small>Route</small><h3>{vsr.route}</h3></div>
              <div className="kpi"><small>Visits</small><h3>{vsr.visits}</h3></div>
              <div className="kpi"><small>Completion</small><h3>{vsr.completion}%</h3></div>
              <div className="kpi"><small>Status</small><h3>{vsr.status}</h3></div>
            </div>

            {route && (
              <div style={{padding: "0 16px 16px"}}>
                <h4>Route Coverage</h4>
                <p style={{color: "var(--muted)", fontSize: 13, marginBottom: 8}}>
                  {route.coordinates.length} waypoints · {route.stores.length} stores on route
                </p>
                <button className="secondary" onClick={() => { setViewMode("map"); setMapViewMode("vsr-routes"); }}>
                  <MapPin size={16} /> View Route on Map
                </button>
              </div>
            )}

            <h4 style={{margin: "16px 16px 8px"}}>Recent Activities</h4>
            <div style={{display: "grid", gap: 8, padding: "0 16px 16px"}}>
              {activitiesList.slice(0, 5).map(act => (
                <div key={act.id} className="modal-row" style={{textAlign: "left", justifyContent: "space-between"}}>
                  <div>
                    <small style={{color: "var(--muted)"}}>{act.date} {act.time}</small>
                    <div><b>{act.type}</b></div>
                    <small>{act.notes.substring(0, 80)}...</small>
                  </div>
                  <span className={`status ${act.completion >= 90 ? "active" : act.completion >= 70 ? "on-route" : "needs-review"}`}><i />{act.completion}%</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  // Render hierarchy tree when no entity selected
  const renderHierarchyTree = () => {
    return (
      <section className="card table-card">
        <div className="card-head table-head">
          <div>
            <h2>Workforce Hierarchy</h2>
            <p>TSR → Supervisor → Merchandiser → Store → Products</p>
          </div>
        </div>
        
        <div style={{padding: 16}}>
          {tsrs.map(tsr => (
            <div key={tsr.id} className="hierarchy-node">
              <div className="hierarchy-header" onClick={() => handleDrillDown("tsr", tsr.id, tsr)} style={{cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--card)", borderRadius: 8, marginBottom: 8}}>
                <div style={{width: 40, height: 40, borderRadius: 8, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", color: "white"}}><Users size={20}/></div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 600}}>{tsr.name}</div>
                  <div style={{fontSize: 12, color: "var(--muted)"}}>{tsr.id} · {tsr.territory}, {tsr.region} · {tsr.completion}% completion</div>
                </div>
                <ChevronRight size={20} />
              </div>
              
              <div style={{marginLeft: 52, borderLeft: "2px solid var(--line)", paddingLeft: 16}}>
                {getChildren(tsr.id).filter(s => s.role === "Supervisor").map(sup => (
                  <div key={sup.id} className="hierarchy-node">
                    <div className="hierarchy-header" onClick={() => handleDrillDown("supervisor", sup.id, sup)} style={{cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--card)", borderRadius: 8, marginBottom: 6}}>
                      <div style={{width: 36, height: 36, borderRadius: 8, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", color: "white"}}><UserRound size={18}/></div>
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 600, fontSize: 14}}>{sup.name}</div>
                        <div style={{fontSize: 11, color: "var(--muted)"}}>{sup.id} · {sup.territory} · {sup.completion}%</div>
                      </div>
                      <ChevronRight size={18} />
                    </div>
                    
                    <div style={{marginLeft: 48, borderLeft: "2px solid var(--line)", paddingLeft: 12}}>
                      {getChildren(sup.id).filter(m => m.role === "Merchandiser").map(mer => (
                        <div key={mer.id} className="hierarchy-node">
                          <div className="hierarchy-header" onClick={() => handleDrillDown("merchandiser", mer.id, mer)} style={{cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: 8, background: "var(--card)", borderRadius: 6, marginBottom: 4}}>
                            <div style={{width: 32, height: 32, borderRadius: 6, background: "#14b8a6", display: "flex", alignItems: "center", justifyContent: "center", color: "white"}}><StoreIcon size={16}/></div>
                            <div style={{flex: 1}}>
                              <div style={{fontWeight: 600, fontSize: 13}}>{mer.name}</div>
                              <div style={{fontSize: 11, color: "var(--muted)"}}>{mer.id} · {mer.route} · {mer.completion}%</div>
                            </div>
                            <ChevronRight size={16} />
                          </div>
                          
                          <div style={{marginLeft: 42, borderLeft: "2px solid var(--line)", paddingLeft: 8}}>
{getStoresByMerchandiser(mer.id).map(store => (
                                <div key={store.id} style={{display: "flex", alignItems: "center", gap: 8, padding: "6 8", fontSize: 12, color: "var(--muted)"}}>
                                  <StoreIcon size={14} style={{color: "#2563eb"}} />
                                  <span onClick={() => handleDrillDown("store", store.id, store)} style={{cursor: "pointer"}}><b>{store.name}</b></span>
                                  <small>({store.territory})</small>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {getChildren(tsr.id).filter(v => v.role === "VSR").map(vsr => (
                  <div key={vsr.id} style={{marginTop: 8}}>
                    <div className="hierarchy-header" onClick={() => handleDrillDown("vsr", vsr.id, vsr)} style={{cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--card)", borderRadius: 8, marginBottom: 4}}>
                      <div style={{width: 36, height: 36, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "white"}}><MapPin size={18}/></div>
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 600, fontSize: 14}}>{vsr.name} (VSR)</div>
                        <div style={{fontSize: 11, color: "var(--muted)"}}>{vsr.id} · {vsr.route} · {vsr.completion}%</div>
                      </div>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <AppShell contentClassName="page-hierarchy">
      <PageHeading
        eyebrow="WORKFORCE HIERARCHY · DRILL-DOWN NAVIGATION"
        title="Organizational Hierarchy"
        subtitle="Navigate TSR → Supervisor → Merchandiser → Store → Products and TSR → VSR → Route"
      />
      
      <FilterBar
        region={region}
        onRegion={(v) => { setRegion(v); setSelectedEntity(null); }}
        client={client}
        onClient={(v) => { setClient(v); setSelectedEntity(null); }}
        onReset={handleReset}
      />

      <KpiGrid items={kpis} focus="" onFocus={() => {}} />

      <div style={{display: "grid", gridTemplateColumns: selectedEntity ? "1fr" : "1fr", gap: 16}}>
        {selectedEntity ? (
          <>
            <div style={{display: "flex", alignItems: "center", gap: 12, padding: "0 16px 16px"}}>
              <button className="secondary" onClick={handleBack}><ArrowLeft size={16} /> Back to Hierarchy</button>
              <span style={{color: "var(--muted)"}}>{selectedEntity.level.toUpperCase()}: {selectedEntity.data.name}</span>
            </div>
            {renderDetailView()}
          </>
        ) : (
          renderHierarchyTree()
        )}
      </div>
    </AppShell>
  );
}