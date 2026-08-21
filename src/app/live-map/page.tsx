"use client";

import { useState } from "react";
import { AppShell } from "../../components/app-shell";
import { CompletionCard, FilterBar, MapCard, PageHeading } from "../shared";
import { staff } from "../data";

export default function LiveMapPage() {
  const [region, setRegion] = useState("All regions");
  const [role, setRole] = useState("All roles");
  const [selectedPin, setSelectedPin] = useState(0);

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
          staff={staff}
          selected={selectedPin}
          onSelect={setSelectedPin}
          region={region}
          role={role}
          title="Nigeria field coverage"
          subtitle="15 staff live on the ground · click a pin for details"
        />
        <CompletionCard onMore={() => undefined} />
      </section>
    </AppShell>
  );
}
