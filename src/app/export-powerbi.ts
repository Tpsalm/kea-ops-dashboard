// Client-only utilities for downloading dashboard data.
// Power BI export = Option A only: a clean folder of CSVs that Power BI
// Desktop imports in one step via Home ▸ Get data ▸ Folder.

import type { NigeriaLocation } from "./nigeria-locations";

type StaffRow = {
  id: string; name: string; role: string; region: string; territory: string;
  route: string; status: string; visits: number; completion: number;
};
type ActivityRow = { day: string; visits: number; checks: number };
type CompletionRow = { name: string; planned: number; completed: number };
type RoleRow = { name: string; value: number; color: string };

export type ExportPayload = {
  staff: StaffRow[];
  activityData: ActivityRow[];
  completionData: CompletionRow[];
  roleData: RoleRow[];
  locations: NigeriaLocation[];
};

function csvEscape(value: unknown) {
  const raw = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function toCsv<T extends Record<string, unknown>>(rows: T[], headers: (keyof T)[]) {
  const head = headers.map(h => csvEscape(String(h))).join(",");
  const body = rows.map(row => headers.map(h => csvEscape(row[h])).join(",")).join("\n");
  return `${head}\n${body}\n`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadWorkforceCsv(rows: StaffRow[]) {
  const csv = toCsv(rows, ["id", "name", "role", "region", "territory", "route", "status", "visits", "completion"]);
  triggerDownload(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), "KEA-workforce-report.csv");
}

const README = `# KEA Field Force Operations — Power BI Pack

This archive contains every dataset that powers the KEA Operations
Intelligence dashboard, ready to import into Microsoft Power BI Desktop.

## How to import (1 minute)

1. Extract this ZIP to any folder (e.g. Desktop or Documents).
2. Open **Power BI Desktop** (free at powerbi.microsoft.com/desktop).
3. Click **Home ▸ Get data ▸ Folder**.
4. Point at the folder where you extracted this ZIP.
5. Click **Combine ▸ Combine & Load**.

Power BI creates one table per CSV automatically.

## Files

| File | Description |
| --- | --- |
| Workforce.csv | Field staff, roles, territories, KPIs |
| Activities.csv | Daily visits and product checks |
| Completion.csv | Planned vs completed visits by region |
| RoleDistribution.csv | Workforce split by role |
| Locations.csv | Territory GPS coordinates across Nigeria |

## Recommended relationships (add in Power BI Model view)

* Workforce[region] → Locations[region]   (many-to-one)
* Completion[name]  → Locations[region]   (many-to-one)

Generated: ${new Date().toISOString()}
`;

export async function downloadPowerBiPack(payload: ExportPayload) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  zip.file("Workforce.csv", toCsv(payload.staff, ["id", "name", "role", "region", "territory", "route", "status", "visits", "completion"]));
  zip.file("Activities.csv", toCsv(payload.activityData, ["day", "visits", "checks"]));
  zip.file("Completion.csv", toCsv(payload.completionData, ["name", "planned", "completed"]));
  zip.file("RoleDistribution.csv", toCsv(payload.roleData, ["name", "value", "color"]));
  zip.file(
    "Locations.csv",
    toCsv(
      payload.locations.map(l => ({
        name: l.name, region: l.region, type: l.type, lat: l.lat, lng: l.lng,
        staff: l.staff, stores: l.stores, coverage: l.coverage, address: l.address, lead: l.lead, status: l.status,
      })),
      ["name", "region", "type", "lat", "lng", "staff", "stores", "coverage", "address", "lead", "status"]
    )
  );
  zip.file("README.md", README);

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  triggerDownload(blob, "KEA-Operations-PowerBI-Pack.zip");
}
