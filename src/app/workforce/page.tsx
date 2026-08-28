"use client";

import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { FilterBar, PageHeading, WorkforceTable, MapCard } from "../shared";
import { type Staff, activityData, completionData } from "../data";
import { stores as hierarchyStores } from "../hierarchy-data";
import { downloadWorkforceCsv } from "../export-powerbi";
import useAuth from "../../lib/useAuth";

// This page now fetches staff rows from a server API that enforces RBAC. The
// client sends user role and allowed client IDs in headers for the demo server
// endpoint; replace this with real authentication (cookies/JWT) in production.

export default function WorkforcePage() {
  const { user: authUser } = useAuth();
  const user = authUser ?? { role: "super-admin" as const, allowedClientIds: ["client-a", "client-b"] };
  const [viewerType, setViewerType] = useState<"client" | "internal">("internal");

  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<keyof Staff>("completion");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedPin, setSelectedPin] = useState(0);

  const [serverRows, setServerRows] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/workforce', {
          headers: {
            'x-user-role': user.role,
            'x-client-ids': (user.allowedClientIds || []).join(','),
          },
        });
        if (res.ok) {
          const json = await res.json();
          setServerRows(json.staff || []);
        } else {
          setServerRows([]);
        }
      } catch (e) {
        setServerRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const rows = useMemo(() => {
    const filtered = serverRows.filter((s) =>
      (region === "All regions" || s.region === region) &&
      (role === "All roles" || s.role === role) &&
      `${s.name} ${s.id} ${s.territory}`.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const av = a[sort]; const bv = b[sort];
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * (asc ? 1 : -1);
    });
  }, [serverRows, region, role, query, sort, asc]);

  const clientScopedRows = useMemo(() => {
    const allowedIds = user.allowedClientIds.length ? user.allowedClientIds : ["client-a"];
    return rows.filter((staffRow) => staffRow.clientId && allowedIds.includes(staffRow.clientId));
  }, [rows, user.allowedClientIds]);

  function chooseSort(key: keyof Staff) {
    if (sort === key) setAsc(!asc);
    else { setSort(key); setAsc(true); }
  }

  // Lightweight client dashboard using server-provided rows and local demo data.
  function ClientDashboard({ rows }: { rows: Staff[] }) {
    const allowedIds = user.allowedClientIds.length ? user.allowedClientIds : ["client-a"];
    const storesCovered = hierarchyStores.filter((store) => allowedIds.includes(store.clientId)).length;
    const locationsCovered = new Set(rows.map((r) => r.region)).size;
    const workCompletedPct = rows.length ? Math.round(rows.reduce((s, r) => s + r.completion, 0) / rows.length) : 0;

    return (
      <section>
        <div className="client-dashboard-head">
          <PageHeading
            eyebrow="CLIENT PORTAL · SUMMARY"
            title="Client view"
            subtitle="Simplified, project-specific view of coverage, activity and results."
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="secondary" onClick={() => downloadWorkforceCsv(rows)}>Download report</button>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi"><small>Stores covered</small><h3>{storesCovered}</h3></div>
          <div className="kpi"><small>Locations</small><h3>{locationsCovered}</h3></div>
          <div className="kpi"><small>Work completed</small><h3>{workCompletedPct}%</h3></div>
        </div>

        <div className="charts">
          <section className="chart-card">
            <h4>Activity (recent)</h4>
            <pre style={{fontSize:12}}>Visits over time: {activityData.map(a => `${a.day}:${a.visits}`).join(', ')}</pre>
          </section>
          <section className="chart-card">
            <h4>Completion by region</h4>
            <pre style={{fontSize:12}}>{completionData.map(c => `${c.name}:${Math.round((c.completed/c.planned)*100)}%`).join(', ')}</pre>
          </section>
        </div>

        <div style={{ marginTop: 18 }}>
          <h4>Staff on this project</h4>
          <MapCard
            staff={rows}
            selected={selectedPin}
            onSelect={setSelectedPin}
            region="All regions"
            role="All roles"
            title="Client geographic coverage"
            subtitle="Staff and operational locations included in this client project"
          />
          <WorkforceTable
            rows={rows}
            page={page}
            pageSize={8}
            onPage={setPage}
            sort={sort}
            asc={asc}
            onSort={chooseSort}
            onView={setSelectedStaff}
            query={query}
            onQuery={(q) => { setQuery(q); setPage(1); }}
            onExport={() => downloadWorkforceCsv(rows)}
          />
        </div>
      </section>
    );
  }

  return (
    <AppShell searchValue={query} onSearch={(q) => { setQuery(q); setPage(1); }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeading
          eyebrow={viewerType === 'client' ? "CLIENT PORTAL" : "FIELD FORCE · WORKFORCE"}
          title={viewerType === 'client' ? "Client dashboard" : "Workforce"}
          subtitle={viewerType === 'client' ? "Simplified view for clients." : "Full visibility across all active field teams and their performance."}
        />

        <div>
          {user.role !== 'field-team' ? (
            <div className="viewer-toggle" role="tablist" aria-label="Viewer type">
              <button className={viewerType === 'internal' ? 'active' : ''} onClick={() => setViewerType('internal')}>Internal</button>
              <button className={viewerType === 'client' ? 'active' : ''} onClick={() => setViewerType('client')}>Client</button>
            </div>
          ) : (
            <div className="viewer-badge">Client</div>
          )}
        </div>
      </div>

      <FilterBar
        region={region}
        onRegion={(v) => { setRegion(v); setPage(1); }}
        role={role}
        onRole={(v) => { setRole(v); setPage(1); }}
        onReset={() => { setRegion("All regions"); setRole("All roles"); setQuery(""); setPage(1); }}
      />

      {viewerType === 'client' ? (
        <ClientDashboard rows={clientScopedRows} />
      ) : (
        <>
          <MapCard
            staff={serverRows}
            selected={selectedPin}
            onSelect={setSelectedPin}
            region={region}
            role={role}
            title="Role-aware geographic workforce"
            subtitle="Select a role or region to focus the operational map"
          />
          <WorkforceTable
            rows={rows}
            page={page}
            pageSize={8}
            onPage={setPage}
            sort={sort}
            asc={asc}
            onSort={chooseSort}
            onView={setSelectedStaff}
            query={query}
            onQuery={(q) => { setQuery(q); setPage(1); }}
            onExport={() => downloadWorkforceCsv(rows)}
          />
        </>
      )}

      {selectedStaff && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedStaff(null); }}>
          <section className="action-modal staff-modal" role="dialog" aria-modal="true" aria-label={`Staff record for ${selectedStaff.name}`}>
            <div className="modal-head"><div><small>STAFF RECORD</small><h2>{selectedStaff.name}</h2></div><button type="button" onClick={() => setSelectedStaff(null)} aria-label="Close staff details"><X size={19} /></button></div>
            <div className="staff-detail-grid">
              {/* Hide sensitive fields for client viewers */}
              {viewerType !== 'client' && <span><small>STAFF ID</small><b>{selectedStaff.id}</b></span>}
              <span><small>ROLE</small><b>{selectedStaff.role}</b></span>
              <span><small>REGION</small><b>{selectedStaff.region}</b></span>
              <span><small>TERRITORY</small><b>{selectedStaff.territory}</b></span>
              {viewerType !== 'client' && <span><small>ASSIGNMENT</small><b>{selectedStaff.route}</b></span>}
              <span><small>COMPLETION</small><b>{selectedStaff.completion}%</b></span>
            </div>

            {selectedStaff.photos && selectedStaff.photos.length > 0 && (
              <div className="photo-gallery">
                <h4>Photos / Evidence</h4>
                <div className="photos-grid">
                  {selectedStaff.photos.map((p, i) => (
                    // These images are sample placeholders — replace with real URLs
                    <img key={i} src={p} alt={`Photo ${i+1}`} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions"><button type="button" className="secondary" onClick={() => setSelectedStaff(null)}>Close</button></div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
