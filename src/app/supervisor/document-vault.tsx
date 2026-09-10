"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FolderOpen, Upload, FileSpreadsheet, FileText, CheckCircle2, User, Send,
  Download, Eye, Check, X, Clock, ShieldCheck, AlertTriangle, Layers, Building2
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface Document {
  id: string;
  type: string;
  title: string;
  file_url: string;
  file_name?: string;
  status: string;
  uploaded_at: string;
  notes?: string;
}

interface VSRItem {
  id: string;
  name: string;
  territory?: string;
}

export function DocumentVault() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"merchandiser_pods" | "vsr_reports" | "supervisor_vault">("merchandiser_pods");
  const [docs, setDocs] = useState<Document[]>([]);
  const [vsrList, setVsrList] = useState<VSRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formType, setFormType] = useState<"pod_tracker" | "performance_report">("pod_tracker");
  const [formTitle, setFormTitle] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [selectedVsrId, setSelectedVsrId] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Incoming Merchandiser POD Submissions state
  const [merchandiserPods, setMerchandiserPods] = useState<Array<{
    id: string;
    merchandiserName: string;
    merchandiserId: string;
    storeName: string;
    deliveryRef: string;
    fileName: string;
    uploadedAt: string;
    notes: string;
    status: string;
  }>>([
    {
      id: "POD-891",
      merchandiserName: "Toluwaleni Adio",
      merchandiserId: "KEA-MER-001",
      storeName: "Royal Prince Ikosi",
      deliveryRef: "WB-2026-09-842",
      fileName: "RoyalPrince_POD_Signed_Sep10.xlsx",
      uploadedAt: "Today, 14:15",
      notes: "Full batch delivery confirmed. Store manager stamp attached.",
      status: "Received - Pending Verification",
    },
    {
      id: "POD-840",
      merchandiserName: "Terapb Chioma",
      merchandiserId: "KEA-MER-002",
      storeName: "Jendel Surulere",
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
      deliveryRef: "WB-2026-09-640",
      fileName: "Justrite_POD_Signed_Sep06.xlsx",
      uploadedAt: "Sep 06, 16:45",
      notes: "22 cartons delivered. Quantity fully matched invoice.",
      status: "Verified & Approved",
    },
  ]);

  // Incoming VSR Weekly & Monthly Reports state
  const [vsrReports, setVsrReports] = useState<Array<{
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
  }>>([
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
    },
    {
      id: "REP-850",
      vsrName: "Shittu Akinsanya",
      vsrId: "KEA-VSR-001",
      route: "Route Ikeja North A1",
      type: "Monthly Reconciliation",
      period: "August 2026",
      grossSales: 7420000,
      cash: 5800000,
      transfer: 1420000,
      credit: 200000,
      fileName: "VSR_Shittu_August_Reconciliation.pdf",
      uploadedAt: "Sep 01, 10:20",
      notes: "Full month reconciliation with verified bank deposits.",
      status: "Reconciled & Approved",
    },
    {
      id: "REP-810",
      vsrName: "Babatunde Adeyemi",
      vsrId: "KEA-VSR-002",
      route: "Route Surulere Central B2",
      type: "Weekly Summary",
      period: "Week 35 (Aug 25 - Aug 31, 2026)",
      grossSales: 1620000,
      cash: 1300000,
      transfer: 220000,
      credit: 100000,
      fileName: "Babatunde_Wk35_RouteSummary.xlsx",
      uploadedAt: "Aug 31, 18:10",
      notes: "100% route stops completed on time.",
      status: "Reconciled & Approved",
    },
  ]);

  const fetchDocsAndVSRs = useCallback(async () => {
    try {
      setLoading(true);
      const [docsRes, vsrRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/users?role=vsr"),
      ]);

      if (docsRes.ok) {
        const d = await docsRes.json();
        setDocs(d.documents ?? []);
      }
      if (vsrRes.ok) {
        const d = await vsrRes.json();
        setVsrList(d.users ?? []);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocsAndVSRs();
  }, [fetchDocsAndVSRs]);

  // Download official Supervisor POD Tracker Template
  function handleDownloadTemplate() {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Store_ID,Store_Name,Delivery_Waybill_Ref,Product_SKU,Quantity_Delivered_Cartons,Quantity_Accepted_Units,Discrepancy_Notes,Store_Manager_Name,Manager_Signature_Confirmed,GPS_Latitude,GPS_Longitude,Timestamp\n" +
      "OL-4001,Royal Prince Ikosi,WB-2026-09-842,KEA-MLK-400G,24,288,None,Alhaji Adeleke,YES,6.5918,3.3315,2026-09-10T14:15:00Z\n" +
      "OL-4002,Jendel Surulere,WB-2026-09-843,KEA-DET-1KG,18,216,None,Mrs. Okonkwo,YES,6.5369,3.3232,2026-09-10T15:30:00Z\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "KEA_Official_POD_Tracker_Template_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Official Supervisor POD Template downloaded!");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formFile) return;

    setUploading(true);
    try {
      const fileUrl = `https://storage.supabase.co/v1/object/public/documents/${Date.now()}_${formFile.name}`;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          title: formTitle,
          fileUrl,
          fileName: formFile.name,
          targetUserId: selectedVsrId || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      toast("Document uploaded — Super Admin has been instantly alerted!");
      setFormTitle("");
      setFormFile(null);
      setNotes("");
      setSelectedVsrId("");
      setShowForm(false);
      fetchDocsAndVSRs();
    } catch (err: any) {
      toast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function verifyPod(id: string) {
    setMerchandiserPods(prev => prev.map(p => p.id === id ? { ...p, status: "Verified & Approved" } : p));
    toast(`POD ${id} verified and approved successfully!`);
  }

  function reconcileReport(id: string) {
    setVsrReports(prev => prev.map(r => r.id === id ? { ...r, status: "Reconciled & Approved" } : r));
    toast(`VSR Report ${id} audited & reconciled!`);
  }

  return (
    <div style={{
      background: "var(--card, #fff)", borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
      padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
    }}>
      {/* Header & Primary Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: 8, background: "#eef2ff", color: "#4f46e5", borderRadius: 8 }}>
            <FolderOpen size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
              Supervisor Document & Ingestion Vault
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
              Receive instant Merchandiser POD Trackers, VSR Field Reports, and manage supervisor templates
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, border: "1px solid #cbd5e1", background: "var(--card, #fff)", color: "var(--text, #111)",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}
          >
            <Download size={14} /> Download POD Template
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}
          >
            <Upload size={14} /> Upload to Super Admin
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--line, #e5e7eb)", paddingBottom: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveTab("merchandiser_pods")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: activeTab === "merchandiser_pods" ? "#0d9488" : "var(--soft, #f3f4f6)",
            color: activeTab === "merchandiser_pods" ? "#fff" : "var(--text, #333)",
            fontWeight: 700, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
          }}
        >
          <FileSpreadsheet size={14} /> Incoming Merchandiser PODs ({merchandiserPods.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vsr_reports")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: activeTab === "vsr_reports" ? "#2563eb" : "var(--soft, #f3f4f6)",
            color: activeTab === "vsr_reports" ? "#fff" : "var(--text, #333)",
            fontWeight: 700, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
          }}
        >
          <FileText size={14} /> Incoming VSR Weekly & Monthly Reports ({vsrReports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("supervisor_vault")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: activeTab === "supervisor_vault" ? "#4f46e5" : "var(--soft, #f3f4f6)",
            color: activeTab === "supervisor_vault" ? "#fff" : "var(--text, #333)",
            fontWeight: 700, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
          }}
        >
          <FolderOpen size={14} /> Supervisor Master Vault & Templates
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} style={{
          padding: 16, borderRadius: 12, border: "1px solid #c7d2fe",
          background: "#eef2ff", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#3730a3" }}>
            Upload Vault Document & Trigger Executive Super Admin Alert
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#312e81" }}>
              Document Type
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #a5b4fc", fontSize: 12, background: "#fff" }}
              >
                <option value="pod_tracker">POD Tracker Template</option>
                <option value="performance_report">Monthly Performance Report for VSR</option>
              </select>
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#312e81" }}>
              Title
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Q3 Route Proof of Delivery Tracker"
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #a5b4fc", fontSize: 12, background: "#fff" }}
              />
            </label>

            {formType === "performance_report" && (
              <label style={{ fontSize: 12, fontWeight: 600, color: "#312e81" }}>
                Target VSR (Optional)
                <select
                  value={selectedVsrId}
                  onChange={(e) => setSelectedVsrId(e.target.value)}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #a5b4fc", fontSize: 12, background: "#fff" }}
                >
                  <option value="">All Supervised VSRs / General</option>
                  {vsrList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.territory || "Lagos"})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#312e81" }}>
              Attachment File (.pdf, .xlsx, .csv)
              <input
                type="file"
                required
                accept=".pdf,.xlsx,.csv,.doc,.docx"
                onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                style={{ display: "block", width: "100%", marginTop: 4, fontSize: 12 }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#312e81" }}>
              Supervisor Field Notes
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add verification notes for the Super Admin..."
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 6, border: "1px solid #a5b4fc", fontSize: 12, background: "#fff" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !formTitle || !formFile}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 18px",
                borderRadius: 6, border: "none", background: "#4f46e5", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: uploading ? 0.6 : 1
              }}
            >
              <Send size={13} />
              {uploading ? "Uploading & Alerting Admin..." : "Upload & Notify Super Admin"}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 1: INCOMING MERCHANDISER POD TRACKERS ─── */}
      {activeTab === "merchandiser_pods" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>POD Record / Store</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Merchandiser</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Waybill Ref</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>File Attachment</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Uploaded</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Status & Action</th>
              </tr>
            </thead>
            <tbody>
              {merchandiserPods.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{p.storeName}</div>
                    <small style={{ color: "var(--muted, #6b7280)" }}>ID: {p.id}</small>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <b>{p.merchandiserName}</b><br />
                    <small style={{ color: "var(--muted, #6b7280)" }}>{p.merchandiserId}</small>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <code style={{ background: "rgba(13, 148, 136, 0.08)", color: "#0d9488", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {p.deliveryRef}
                    </code>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#0d9488", fontWeight: 700, fontSize: 11 }}>
                      <FileSpreadsheet size={14} /> {p.fileName}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--muted, #6b7280)", fontSize: 12 }}>
                    {p.uploadedAt}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                        background: p.status.includes("Verified") ? "#f0fdf4" : "#fffbeb",
                        color: p.status.includes("Verified") ? "#16a34a" : "#d97706"
                      }}>
                        {p.status}
                      </span>
                      {!p.status.includes("Verified") && (
                        <button
                          type="button"
                          onClick={() => verifyPod(p.id)}
                          style={{
                            background: "#0d9488", color: "#fff", border: "none", padding: "4px 8px",
                            borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                          }}
                        >
                          <Check size={11} /> Verify POD
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 2: INCOMING VSR REPORTS ─── */}
      {activeTab === "vsr_reports" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>VSR Name & Route</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Type & Period</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Gross Sales</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Collections (Cash/Transfer)</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Attached File</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Status & Action</th>
              </tr>
            </thead>
            <tbody>
              {vsrReports.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{r.vsrName}</div>
                    <small style={{ color: "var(--muted, #6b7280)" }}>{r.route}</small>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                      background: r.type.includes("Monthly") ? "#eef2ff" : "#f0fdfa",
                      color: r.type.includes("Monthly") ? "#4f46e5" : "#0d9488"
                    }}>
                      {r.type}
                    </span>
                    <br /><b>{r.period}</b>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <b>₦{r.grossSales.toLocaleString()}</b>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12 }}>
                    <div>Cash: ₦{r.cash.toLocaleString()}</div>
                    <div style={{ color: "var(--muted, #6b7280)" }}>Transfer: ₦{r.transfer.toLocaleString()}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontWeight: 700, fontSize: 11 }}>
                      <FileText size={14} /> {r.fileName}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                        background: r.status.includes("Reconciled") ? "#f0fdf4" : "#fffbeb",
                        color: r.status.includes("Reconciled") ? "#16a34a" : "#d97706"
                      }}>
                        {r.status}
                      </span>
                      {!r.status.includes("Reconciled") && (
                        <button
                          type="button"
                          onClick={() => reconcileReport(r.id)}
                          style={{
                            background: "#2563eb", color: "#fff", border: "none", padding: "4px 8px",
                            borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                          }}
                        >
                          <Check size={11} /> Reconcile
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 3: SUPERVISOR MASTER VAULT & TEMPLATES ─── */}
      {activeTab === "supervisor_vault" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Document Title / File</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Type</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Uploaded Date</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontSize: 11, fontWeight: 700 }}>Super Admin Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--muted, #6b7280)" }}>
                    Loading document vault records…
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 28, textAlign: "center", color: "var(--muted, #6b7280)" }}>
                    <FolderOpen size={24} style={{ margin: "0 auto 6px", opacity: 0.4 }} />
                    <div>No custom supervisor uploads yet. Click &apos;Upload to Super Admin&apos; above.</div>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {doc.type === "pod_tracker" ? (
                          <FileSpreadsheet size={16} style={{ color: "#0e918a" }} />
                        ) : (
                          <FileText size={16} style={{ color: "#4f46e5" }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{doc.title}</div>
                          {doc.file_name && (
                            <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{doc.file_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: doc.type === "pod_tracker" ? "#f0fdfa" : "#eef2ff",
                        color: doc.type === "pod_tracker" ? "#0e918a" : "#4f46e5"
                      }}>
                        {doc.type === "pod_tracker" ? "POD Tracker Template" : "Monthly Performance Report"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted, #6b7280)" }}>
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge value={doc.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
