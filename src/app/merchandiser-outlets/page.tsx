"use client";

import { useState, useMemo } from "react";
import {
  Users, Store, MapPin, Search, Filter, Calendar, CheckCircle2,
  Clock, AlertTriangle, ArrowUpRight, TrendingUp, CheckCircle,
  Building2, Phone, UserCheck, ShieldCheck, ChevronRight, Eye, RefreshCw
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { staff, outletData } from "../data";
import { stores as hierarchyStores, allStaff } from "../hierarchy-data";

interface MerchandiserViewItem {
  id: string;
  name: string;
  phone?: string;
  region: string;
  state: string;
  territory: string;
  route: string;
  supervisor: string;
  assignedOutlets: number;
  completedVisits: number;
  completionRate: number;
  status: "Active" | "On route" | "On leave" | "Inactive";
  leaveDetails?: {
    startDate: string;
    endDate: string;
    reason: string;
    reliefStaff: string;
  };
}

interface OutletViewItem {
  id: string;
  name: string;
  code: string;
  tier: "Tier 1 Key Account" | "Tier 2 Supermarket" | "Tier 3 Neighborhood Store";
  address: string;
  state: string;
  region: string;
  territory: string;
  assignedMerchandiser: string;
  supervisor: string;
  status: "Healthy" | "Needs Review" | "Stockout Risk";
  lastVisited: string;
  gpsVerified: boolean;
}

export default function MerchandiserOutletsPage() {
  const [activeTab, setActiveTab] = useState<"merchandisers" | "outlets" | "leaves">("merchandisers");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Format merchandiser list
  const merchandisersList: MerchandiserViewItem[] = useMemo(() => {
    const rawMerchs = staff.filter((s) => s.role === "Merchandiser");
    return rawMerchs.map((m, index) => {
      const isOnLeave = index === 3 || index === 8 || index === 14;
      return {
        id: m.id,
        name: m.name,
        phone: `+234 80${(index + 2) * 3} 456 ${1000 + index}`,
        region: m.region,
        state: m.state || m.region,
        territory: m.territory,
        route: m.route,
        supervisor: m.region === "Lagos" ? "Michael Olayiwola" : m.region === "Ogun" ? "Adeleke Vance" : "Chukwuma Eze",
        assignedOutlets: 12 + (index % 6),
        completedVisits: m.visits,
        completionRate: m.completion,
        status: isOnLeave ? "On leave" : (m.status as any),
        leaveDetails: isOnLeave ? {
          startDate: "2026-09-08",
          endDate: "2026-09-15",
          reason: "Annual Statutory Rest & Relocation",
          reliefStaff: "Toluwaleni Adio (Covering Route)"
        } : undefined
      };
    });
  }, []);

  // Format outlets list
  const outletsList: OutletViewItem[] = useMemo(() => {
    return hierarchyStores.slice(0, 40).map((s, index) => {
      const tiers: OutletViewItem["tier"][] = ["Tier 1 Key Account", "Tier 2 Supermarket", "Tier 3 Neighborhood Store"];
      const statuses: OutletViewItem["status"][] = ["Healthy", "Healthy", "Needs Review", "Healthy", "Stockout Risk"];
      const merch = merchandisersList[index % merchandisersList.length];
      return {
        id: s.id,
        name: s.name,
        code: `KEA-OUT-${1000 + index}`,
        tier: tiers[index % tiers.length],
        address: s.address,
        state: s.state,
        region: s.region,
        territory: s.territory,
        assignedMerchandiser: merch?.name || "Toluwaleni Adio",
        supervisor: merch?.supervisor || "Michael Olayiwola",
        status: statuses[index % statuses.length],
        lastVisited: "2026-09-10",
        gpsVerified: true,
      };
    });
  }, [merchandisersList]);

  // Derived metrics
  const totalMerchandisers = 182;
  const activeMerchandisers = 168;
  const onLeaveMerchandisers = 9;
  const inactiveMerchandisers = 5;
  const totalOutletsCount = 2850;
  const avgStoreVisits = "26.4";

  // Filtered Merchandisers
  const filteredMerchandisers = merchandisersList.filter((m) => {
    if (selectedRegion !== "all" && m.region !== selectedRegion) return false;
    if (statusFilter !== "all" && m.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.territory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filtered Outlets
  const filteredOutlets = outletsList.filter((o) => {
    if (selectedRegion !== "all" && o.region !== selectedRegion) return false;
    if (statusFilter !== "all" && o.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    const matchesSearch =
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.assignedMerchandiser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.territory.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Merchandisers on Leave
  const onLeaveList = merchandisersList.filter((m) => m.status === "On leave");

  return (
    <AppShell contentClassName="page-merchandiser-outlets">
      {/* ─── 1. HEADER ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0e918a", letterSpacing: ".08em", textTransform: "uppercase" }}>
              FIELD OPERATIONS · SUPER ADMIN SURVEILLANCE
            </span>
            <span style={{ fontSize: 11, background: "rgba(14, 145, 138, 0.1)", color: "#0e918a", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
              Live Roster Synced
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text, #111)", margin: "4px 0 2px" }}>
            Merchandiser Activity & Outlets
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted, #6b7280)", margin: 0 }}>
            Global workforce count, live retail footprint coverage, daily store execution, and leave coverage tracking.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            fontSize: 12, padding: "6px 12px", background: "#f0fdf4", color: "#16a34a",
            borderRadius: 8, border: "1px solid #bbf7d0", fontWeight: 700, display: "flex", alignItems: "center", gap: 6
          }}>
            <ShieldCheck size={16} /> Supervisor Provisioning Chain Active
          </div>
        </div>
      </div>

      {/* ─── 2. HIGH-LEVEL KPI METRICS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard
          label="Total Merchandisers"
          value={totalMerchandisers}
          icon={Users}
          tone="teal"
          subtitle="Global active workforce"
        />
        <KpiCard
          label="Active in Field"
          value={activeMerchandisers}
          icon={UserCheck}
          tone="green"
          subtitle="Currently on route"
        />
        <KpiCard
          label="On Scheduled Leave"
          value={onLeaveMerchandisers}
          icon={Calendar}
          tone="amber"
          subtitle="Covered by relief staff"
        />
        <KpiCard
          label="Total Retail Outlets"
          value={totalOutletsCount}
          icon={Store}
          tone="blue"
          subtitle="Monitored retail accounts"
        />
        <KpiCard
          label="Avg Visits / Staff"
          value={avgStoreVisits}
          icon={CheckCircle2}
          tone="violet"
          subtitle="Target: 25.0 visits/day"
        />
      </div>

      {/* ─── 3. MAIN SECTION WITH TABS ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 12, border: "1px solid var(--line, #e5e7eb)",
        padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        {/* Navigation Tabs & Search Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", background: "var(--soft, #f3f4f6)", border: "1px solid var(--line)", padding: 3, borderRadius: 8, flexWrap: "wrap", gap: 2 }}>
            <button
              onClick={() => { setActiveTab("merchandisers"); setStatusFilter("all"); }}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeTab === "merchandisers" ? "var(--card, #fff)" : "transparent",
                color: activeTab === "merchandisers" ? "#0e918a" : "var(--muted, #6b7280)",
                boxShadow: activeTab === "merchandisers" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Merchandisers ({totalMerchandisers})
            </button>
            <button
              onClick={() => { setActiveTab("outlets"); setStatusFilter("all"); }}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeTab === "outlets" ? "var(--card, #fff)" : "transparent",
                color: activeTab === "outlets" ? "#2563eb" : "var(--muted, #6b7280)",
                boxShadow: activeTab === "outlets" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Retail Outlets ({totalOutletsCount})
            </button>
            <button
              onClick={() => { setActiveTab("leaves"); setStatusFilter("all"); }}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeTab === "leaves" ? "var(--card, #fff)" : "transparent",
                color: activeTab === "leaves" ? "#d97706" : "var(--muted, #6b7280)",
                boxShadow: activeTab === "leaves" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Leave Management Logs ({onLeaveList.length})
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                fontSize: 12, background: "var(--card, #fff)", color: "var(--text, #111)", fontWeight: 600
              }}
            >
              <option value="all">All Regions</option>
              <option value="Lagos">Lagos State</option>
              <option value="Ogun">Ogun State</option>
              <option value="Oyo">Oyo State</option>
              <option value="Delta">Delta State</option>
              <option value="Enugu">Enugu State</option>
            </select>

            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted, #9ca3af)" }} />
              <input
                type="text"
                placeholder={
                  activeTab === "merchandisers" ? "Search merchandiser, route, supervisor..." :
                  activeTab === "outlets" ? "Search outlet name, code, territory..." :
                  "Search leave records..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "7px 12px 7px 30px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                  background: "var(--card, #fff)", color: "var(--text, #111)",
                  fontSize: 12, outline: "none", width: 240
                }}
              />
            </div>
          </div>
        </div>

        {/* TAB 1: MERCHANDISERS LIST */}
        {activeTab === "merchandisers" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "var(--soft, #f9fafb)" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Merchandiser Name</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Region & Territory</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Supervisor in Charge</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Assigned Route</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Store Outlets</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Today's Visits</th>
                  <th style={{ textAlign: "right", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchandisers.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>ID: {m.id} · {m.phone}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text, #111)" }}>{m.territory}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{m.region} State</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted, #6b7280)" }}>
                      <div style={{ fontWeight: 600, color: "var(--text, #111)" }}>{m.supervisor}</div>
                      <div style={{ fontSize: 10, color: "#0e918a" }}>Supervisor Tier</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text, #111)", fontWeight: 600 }}>
                      {m.route} Route
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontWeight: 800, color: "var(--text, #111)" }}>{m.assignedOutlets}</span> Stores
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 800, color: m.completionRate >= 88 ? "#16a34a" : "#d97706" }}>
                          {m.completedVisits} visits
                        </span>
                        <span style={{ fontSize: 10, color: "var(--muted, #6b7280)" }}>
                          ({m.completionRate}%)
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      {m.status === "On leave" ? (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                          background: "#fef3c7", color: "#d97706"
                        }}>
                          On Leave
                        </span>
                      ) : (
                        <StatusBadge value={m.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RETAIL OUTLETS DIRECTORY */}
        {activeTab === "outlets" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "var(--soft, #f9fafb)" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Retail Outlet</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Account Tier</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Territory / State</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Assigned Merchandiser</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Supervisor</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Last Visit</th>
                  <th style={{ textAlign: "right", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Health Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutlets.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{o.code} · {o.address}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: "#eff6ff", color: "#2563eb"
                      }}>
                        {o.tier}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text, #111)" }}>{o.territory}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{o.region} State</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text, #111)", fontWeight: 600 }}>
                      {o.assignedMerchandiser}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted, #6b7280)" }}>
                      {o.supervisor}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text, #111)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} style={{ color: "#0e918a" }} />
                        <span>Today</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                        background: o.status === "Healthy" ? "#dcfce7" : o.status === "Needs Review" ? "#fef3c7" : "#fee2e2",
                        color: o.status === "Healthy" ? "#16a34a" : o.status === "Needs Review" ? "#d97706" : "#dc2626"
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: LEAVE & COVERAGE CALENDAR */}
        {activeTab === "leaves" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              padding: 12, background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 8, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8
            }}>
              <Calendar size={16} />
              <span>
                <strong>Supervisor Leave Registry:</strong> Merchandiser leave periods are entered by Supervisors and automatically synchronize here so relief coverage can be verified.
              </span>
            </div>

            {onLeaveList.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 16, borderRadius: 10, border: "1px solid #fed7aa",
                  background: "#fffaf0", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: "#fef3c7",
                    color: "#d97706", display: "grid", placeItems: "center"
                  }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text, #111)" }}>
                        {m.name}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                        background: "#fef3c7", color: "#d97706"
                      }}>
                        On Leave
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>
                        ({m.region} · {m.territory})
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#78350f", marginTop: 4 }}>
                      Duration: <strong>{m.leaveDetails?.startDate}</strong> to <strong>{m.leaveDetails?.endDate}</strong> · Reason: {m.leaveDetails?.reason}
                    </div>
                    <div style={{ fontSize: 11, color: "#16a34a", marginTop: 2, fontWeight: 600 }}>
                      Relief Stand-in: {m.leaveDetails?.reliefStaff}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 11, background: "#ecfdf5", color: "#0e918a",
                    padding: "4px 10px", borderRadius: 6, fontWeight: 700
                  }}>
                    Supervisor Approved
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
