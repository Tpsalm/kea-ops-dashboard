"use client";

import { useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { CompletionCard, FilterBar, MapCard, PageHeading } from "../shared";
import { completionData, staff } from "../data";

export default function LiveMapPage() {
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [selectedPin, setSelectedPin] = useState(0);
  const visibleStaff = useMemo(() => staff.filter((member) => (region === "All regions" || member.region === region) && (role === "All roles" || member.role === role)), [region, role]);
  const completion = visibleStaff.length ? Math.round(visibleStaff.reduce((sum, member) => sum + member.completion, 0) / visibleStaff.length) : 0;
  const visibleCompletion = completionData.map((item) => {
    const matching = visibleStaff.filter((member) => member.region === item.name);
    const planned = matching.reduce((sum, member) => sum + member.visits, 0);
    return { name: item.name, planned, completed: Math.round(planned * (matching.length ? matching.reduce((sum, member) => sum + member.completion, 0) / matching.length / 100 : 0)) };
  });

  return (
    <AppShell contentClassName="map-page">
      <PageHeading
        eyebrow="LIVE GEOGRAPHIC OPERATIONS · UPDATED 4 MIN AGO"
        title="Live map"
        subtitle="Track every field staff member with live GPS coordinates across Nigeria."
      />
      <FilterBar
        region={region}
        onRegion={(v) => { setRegion(v); setSelectedPin(0); }}
        role={role}
        onRole={setRole}
        onReset={() => { setRegion("All regions"); setRole("All roles"); setSelectedPin(0); }}
      />
      <section className="row ops-row">
        <MapCard
          staff={visibleStaff}
          selected={selectedPin}
          onSelect={setSelectedPin}
          region={region}
          role={role}
          title="Nigeria field coverage"
          subtitle="15 staff live on the ground · click a pin for details"
        />
        <CompletionCard data={visibleCompletion} completion={`${completion}%`} onMore={() => undefined} />
      </section>
    </AppShell>
  );
}
