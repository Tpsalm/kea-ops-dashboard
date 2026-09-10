"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Upload } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface Document {
  id: string;
  type: string;
  title: string;
  file_url: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

export function DocumentVault() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formType, setFormType] = useState("pod_tracker");
  const [formTitle, setFormTitle] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleUpload() {
    if (!formTitle || !formFile) return;
    setUploading(true);
    try {
      // For demo: create a fake URL. In production, use Supabase Storage.
      const fileUrl = `https://storage.supabase.co/v1/object/public/documents/${formFile.name}`;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          title: formTitle,
          fileUrl,
          fileName: formFile.name,
        }),
      });

      if (!res.ok) throw new Error("Upload failed");
      toast("Document uploaded — Super Admin has been notified");
      setFormTitle("");
      setFormFile(null);
      setShowForm(false);
      fetchDocs();
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #111)", display: "flex", alignItems: "center", gap: 8 }}>
          <FolderOpen size={16} /> Document Vault
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
            borderRadius: 6, border: "none", background: "var(--teal, #0e918a)", color: "#fff",
            fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}
        >
          <Upload size={14} /> Upload
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: 16, borderRadius: 10, border: "1px solid var(--line, #e5e7eb)",
          background: "var(--bg, #f9fafb)", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <label style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>
              Type
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 12 }}
              >
                <option value="pod_tracker">POD Tracker</option>
                <option value="performance_report">Monthly Performance Report</option>
              </select>
            </label>
            <label style={{ flex: 2, fontSize: 12, fontWeight: 600 }}>
              Title
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. August 2026 POD Tracker"
                style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line, #e5e7eb)", fontSize: 12 }}
              />
            </label>
          </div>
          <input
            type="file"
            accept=".pdf,.xlsx,.csv,.doc,.docx"
            onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 12 }}
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !formTitle || !formFile}
            style={{
              padding: "8px 16px", borderRadius: 6, border: "none",
              background: "var(--teal, #0e918a)", color: "#fff",
              fontWeight: 600, fontSize: 12, cursor: "pointer", opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading…" : "Upload & Notify Admin"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: "var(--muted, #6b7280)" }}>Loading…</p>
      ) : docs.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", borderRadius: 12, border: "1px dashed var(--line, #e5e7eb)", color: "var(--muted, #6b7280)", fontSize: 13 }}>
          No documents uploaded yet
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {docs.map((doc) => (
            <div key={doc.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", background: "var(--card, #fff)", fontSize: 13,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{doc.title}</div>
                <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>
                  {doc.type === "pod_tracker" ? "POD Tracker" : "Performance Report"} · {new Date(doc.uploaded_at).toLocaleDateString()}
                </div>
              </div>
              <StatusBadge value={doc.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
