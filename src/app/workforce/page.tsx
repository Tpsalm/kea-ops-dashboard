"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { FilterBar, PageHeading, WorkforceTable } from "../shared";
import { staff, type Staff } from "../data";
import { downloadWorkforceCsv } from "../export-powerbi";

export default function WorkforcePage() {
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<keyof Staff>("completion");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const rows = useMemo(() => {
    const filtered = staff.filter((s) =>
      (region === "All regions" || s.region === region) &&
      (role === "All roles" || s.role === role) &&
      `${s.name} ${s.id} ${s.territory}`.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const av = a[sort]; const bv = b[sort];
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * (asc ? 1 : -1);
    });
  }, [region, role, query, sort, asc]);

  function chooseSort(key: keyof Staff) {
    if (sort === key) setAsc(!asc);
    else { setSort(key); setAsc(true); }
  }

  return (
    <AppShell searchValue={query} onSearch={(q) => { setQuery(q); setPage(1); }}>
      <PageHeading
        eyebrow="FIELD FORCE · WORKFORCE"
        title="Workforce"
        subtitle="Full visibility across all active field teams and their performance."
      />
      <FilterBar
        region={region}
        onRegion={(v) => { setRegion(v); setPage(1); }}
        role={role}
        onRole={(v) => { setRole(v); setPage(1); }}
        onReset={() => { setRegion("All regions"); setRole("All roles"); setQuery(""); setPage(1); }}
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

      {selectedStaff && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedStaff(null); }}>
          <section className="action-modal staff-modal" role="dialog" aria-modal="true" aria-label={`Staff record for ${selectedStaff.name}`}>
            <div className="modal-head"><div><small>STAFF RECORD</small><h2>{selectedStaff.name}</h2></div><button type="button" onClick={() => setSelectedStaff(null)} aria-label="Close staff details"><X size={19} /></button></div>
            <div className="staff-detail-grid">
              <span><small>STAFF ID</small><b>{selectedStaff.id}</b></span>
              <span><small>ROLE</small><b>{selectedStaff.role}</b></span>
              <span><small>REGION</small><b>{selectedStaff.region}</b></span>
              <span><small>TERRITORY</small><b>{selectedStaff.territory}</b></span>
              <span><small>ASSIGNMENT</small><b>{selectedStaff.route}</b></span>
              <span><small>COMPLETION</small><b>{selectedStaff.completion}%</b></span>
            </div>
            <div className="modal-actions"><button type="button" className="secondary" onClick={() => setSelectedStaff(null)}>Close</button></div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
