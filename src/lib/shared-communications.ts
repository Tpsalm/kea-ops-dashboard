"use client";

/**
 * KEA Operations Real-Time Field Communications & Report Synchronization
 * Enables instant two-way delivery between VSR, Merchandiser, and Supervisor dashboards:
 * 1. VSR Weekly/Monthly Field Reports -> Received instantly by Supervisor
 * 2. Merchandiser POD Tracker Uploads -> Received instantly by Supervisor
 * 3. Supervisor Broadcast Directives -> Received instantly by VSRs and Merchandisers
 * 4. Supervisor Verifications & Reconciliations -> Reflected on VSR & Merchandiser portals
 */

export interface SharedVsrReport {
  id: string;
  vsrName: string;
  vsrId: string;
  route: string;
  type: string;
  period: string;
  grossSales: number;
  cash: number;
  transfer: number;
  credit: number;
  fileName: string;
  uploadedAt: string;
  notes: string;
  status: string;
  feedback?: string;
  isNew?: boolean;
}

export interface SharedMerchandiserPod {
  id: string;
  merchandiserName: string;
  merchandiserId: string;
  storeName: string;
  storeId?: string;
  deliveryRef: string;
  fileName: string;
  uploadedAt: string;
  notes: string;
  status: string;
  isNew?: boolean;
}

export interface SupervisorBroadcast {
  id: string;
  supervisorName: string;
  supervisorId: string;
  title: string;
  message: string;
  targetRole: "all" | "vsr" | "merchandiser" | "specific";
  targetStaffName?: string;
  priority: "urgent" | "guideline" | "target" | "info";
  timestamp: string;
  fileName?: string;
  acknowledgedBy: string[];
}

const DEFAULT_VSR_REPORTS: SharedVsrReport[] = [
  {
    id: "REP-902",
    vsrName: "Shittu Akinsanya",
    vsrId: "KEA-VSR-001",
    route: "Route Ikeja North A1",
    type: "Weekly Summary",
    period: "Week 36 (Sep 01 - Sep 07, 2026)",
    grossSales: 1850000,
    cash: 1420000,
    transfer: 330000,
    credit: 100000,
    fileName: "VSR_Shittu_Wk36_RouteReport.xlsx",
    uploadedAt: "Today, 17:40",
    notes: "Route completed at 94% on-time delivery rate.",
    status: "Received - Under Review",
    feedback: "Supervisor reviewing collection reconciliation.",
  },
  {
    id: "REP-850",
    vsrName: "Babatunde Adeleke",
    vsrId: "KEA-VSR-002",
    route: "Route Surulere Central B2",
    type: "Monthly Reconciliation",
    period: "August 2026",
    grossSales: 7420000,
    cash: 5800000,
    transfer: 1420000,
    credit: 200000,
    fileName: "Babatunde_August_Reconciliation.pdf",
    uploadedAt: "Sep 01, 10:20",
    notes: "Full month reconciliation with verified bank deposits.",
    status: "Reconciled & Approved by Supervisor",
    feedback: "Clean audit. Zero open debt maintained.",
  },
  {
    id: "REP-810",
    vsrName: "Paul Olakonipekun",
    vsrId: "KEA-VSR-003",
    route: "Route Abeokuta Express C1",
    type: "Weekly Summary",
    period: "Week 35 (Aug 25 - Aug 31, 2026)",
    grossSales: 1620000,
    cash: 1300000,
    transfer: 220000,
    credit: 100000,
    fileName: "Paul_Wk35_RouteSummary.xlsx",
    uploadedAt: "Aug 31, 18:10",
    notes: "100% route stops completed on time.",
    status: "Reconciled & Approved by Supervisor",
    feedback: "Verified against store manager slips.",
  },
];

const DEFAULT_MERCHANDISER_PODS: SharedMerchandiserPod[] = [
  {
    id: "POD-891",
    merchandiserName: "Maria Uchechukwu",
    merchandiserId: "KEA-MER-001",
    storeName: "Royal Prince Ikosi",
    storeId: "OL-4001",
    deliveryRef: "WB-2026-09-842",
    fileName: "RoyalPrince_POD_Signed_Sep10.xlsx",
    uploadedAt: "Today, 14:15",
    notes: "Full batch delivery confirmed. Store manager stamp attached.",
    status: "Received - Pending Verification",
  },
  {
    id: "POD-840",
    merchandiserName: "Toluwaleni Adio",
    merchandiserId: "KEA-MER-002",
    storeName: "Jendel Surulere",
    storeId: "OL-4002",
    deliveryRef: "WB-2026-09-771",
    fileName: "Jendel_POD_Tracker_Sep08.xlsx",
    uploadedAt: "Sep 08, 11:30",
    notes: "18 cartons delivered. Stamped by receiving supervisor.",
    status: "Verified & Approved",
  },
  {
    id: "POD-812",
    merchandiserName: "Mopelola Sebilau",
    merchandiserId: "KEA-MER-003",
    storeName: "Justrite Dopemu",
    storeId: "OL-4003",
    deliveryRef: "WB-2026-09-640",
    fileName: "Justrite_POD_Signed_Sep06.xlsx",
    uploadedAt: "Sep 06, 16:45",
    notes: "22 cartons delivered. Quantity fully matched invoice.",
    status: "Verified & Approved",
  },
];

const DEFAULT_SUPERVISOR_BROADCASTS: SupervisorBroadcast[] = [
  {
    id: "DIR-501",
    supervisorName: "Michael Olayiwola",
    supervisorId: "KEA-SUP-001",
    title: "Weekend Route Sales Target & Cash Reconciliation Deadline",
    message: "All VSRs must submit their weekly collection logs before 17:00 on Saturday. Ensure all POS slips and bank transfer references are attached to your weekly Excel summary.",
    targetRole: "vsr",
    priority: "urgent",
    timestamp: "Today, 08:30 AM",
    fileName: "VSR_Weekly_Reconciliation_Standard_Wk36.xlsx",
    acknowledgedBy: ["Babatunde Adeleke"],
  },
  {
    id: "DIR-502",
    supervisorName: "Michael Olayiwola",
    supervisorId: "KEA-SUP-001",
    title: "Mandatory Shelf Share & Gondola Visibility Audit",
    message: "Merchandisers covering Victoria Island and Ikeja corridors must upload geotagged shelf audit photos for all 400g milk stock by Friday midday. Ensure competing brand positioning is logged.",
    targetRole: "merchandiser",
    priority: "guideline",
    timestamp: "Yesterday, 11:15 AM",
    fileName: "KEA_Retail_Visibility_Planogram_2026.pdf",
    acknowledgedBy: ["Maria Uchechukwu"],
  },
  {
    id: "DIR-503",
    supervisorName: "Michael Olayiwola",
    supervisorId: "KEA-SUP-001",
    title: "Capital Float & Zero-Debt Policy Reminder",
    message: "Super Admin has mandated that new capital funding tranches will only be disbursed to VSRs with an active ₦0 debt balance. Ensure previous loan cycles are reconciled before re-applying.",
    targetRole: "all",
    priority: "urgent",
    timestamp: "Sep 09, 2026",
    acknowledgedBy: [],
  },
];

// --- Helper Functions ---

export function getSharedVsrReports(): SharedVsrReport[] {
  if (typeof window === "undefined") return DEFAULT_VSR_REPORTS;
  try {
    const raw = localStorage.getItem("kea_shared_vsr_reports");
    if (!raw) {
      localStorage.setItem("kea_shared_vsr_reports", JSON.stringify(DEFAULT_VSR_REPORTS));
      return DEFAULT_VSR_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_VSR_REPORTS;
  }
}

export function saveSharedVsrReport(report: SharedVsrReport): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSharedVsrReports();
    const updated = [{ ...report, isNew: true }, ...existing.filter((r) => r.id !== report.id)];
    localStorage.setItem("kea_shared_vsr_reports", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("kea-document-submitted", { detail: { type: "vsr_report", data: report } }));
  } catch {}
}

export function updateVsrReportStatus(id: string, status: string, feedback: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSharedVsrReports();
    const updated = existing.map((r) => (r.id === id ? { ...r, status, feedback, isNew: false } : r));
    localStorage.setItem("kea_shared_vsr_reports", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("kea-document-reconciled", { detail: { type: "vsr_report", id, status } }));
  } catch {}
}

export function getSharedMerchandiserPods(): SharedMerchandiserPod[] {
  if (typeof window === "undefined") return DEFAULT_MERCHANDISER_PODS;
  try {
    const raw = localStorage.getItem("kea_shared_merchandiser_pods");
    if (!raw) {
      localStorage.setItem("kea_shared_merchandiser_pods", JSON.stringify(DEFAULT_MERCHANDISER_PODS));
      return DEFAULT_MERCHANDISER_PODS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MERCHANDISER_PODS;
  }
}

export function saveSharedMerchandiserPod(pod: SharedMerchandiserPod): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSharedMerchandiserPods();
    const updated = [{ ...pod, isNew: true }, ...existing.filter((p) => p.id !== pod.id)];
    localStorage.setItem("kea_shared_merchandiser_pods", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("kea-document-submitted", { detail: { type: "merchandiser_pod", data: pod } }));
  } catch {}
}

export function updateMerchandiserPodStatus(id: string, status: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSharedMerchandiserPods();
    const updated = existing.map((p) => (p.id === id ? { ...p, status, isNew: false } : p));
    localStorage.setItem("kea_shared_merchandiser_pods", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("kea-document-reconciled", { detail: { type: "merchandiser_pod", id, status } }));
  } catch {}
}

export function getSupervisorBroadcasts(): SupervisorBroadcast[] {
  if (typeof window === "undefined") return DEFAULT_SUPERVISOR_BROADCASTS;
  try {
    const raw = localStorage.getItem("kea_supervisor_broadcasts");
    if (!raw) {
      localStorage.setItem("kea_supervisor_broadcasts", JSON.stringify(DEFAULT_SUPERVISOR_BROADCASTS));
      return DEFAULT_SUPERVISOR_BROADCASTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SUPERVISOR_BROADCASTS;
  }
}

export function publishSupervisorBroadcast(broadcast: SupervisorBroadcast): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSupervisorBroadcasts();
    const updated = [broadcast, ...existing];
    localStorage.setItem("kea_supervisor_broadcasts", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("kea-directive-dispatched", { detail: broadcast }));
  } catch {}
}

export function acknowledgeSupervisorBroadcast(id: string, staffName: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSupervisorBroadcasts();
    const updated = existing.map((b) => {
      if (b.id === id && !b.acknowledgedBy.includes(staffName)) {
        return { ...b, acknowledgedBy: [...b.acknowledgedBy, staffName] };
      }
      return b;
    });
    localStorage.setItem("kea_supervisor_broadcasts", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("kea-directive-acknowledged", { detail: { id, staffName } }));
  } catch {}
}
