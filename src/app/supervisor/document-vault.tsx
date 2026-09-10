"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Upload, FileSpreadsheet, FileText, CheckCircle2, User, Send } from "lucide-react";
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

  return (
    <div style={{
      background: "var(--card, #fff)", borderRadius: 16, border: "1px solid var(--line, #e5e7eb)",
      padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: 8, background: "#eef2ff", color: "#4f46e5", borderRadius: 8 }}>
            <FolderOpen size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #111)" }}>
              Document Vault
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted, #6b7280)", margin: 0 }}>
              Upload POD Tracker Templates & Monthly VSR Performance Reports (Alerts Super Admin instantly)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}
        >
          <Upload size={14} /> Upload Document
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

      {/* Uploaded Documents List */}
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
                  <div>No documents uploaded yet in this vault.</div>
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
                      {doc.type === "pod_tracker" ? "POD Tracker" : "Monthly Performance Report"}
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
    </div>
  );
}
