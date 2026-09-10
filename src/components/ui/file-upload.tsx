"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  accept?: string;
  onUpload: (file: File) => Promise<string>;
  onFileUrl?: (url: string) => void;
}

export function FileUpload({ accept = ".pdf,.doc,.docx,.xlsx,.csv", onUpload, onFileUrl }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUploading(true);
    try {
      const url = await onUpload(f);
      setUploadedUrl(url);
      onFileUrl?.(url);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setFile(null);
    setUploadedUrl("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} style={{ display: "none" }} />
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%", padding: "24px 16px", borderRadius: 12,
            border: "2px dashed var(--line, #e5e7eb)", background: "var(--bg, #f9fafb)",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 8, color: "var(--muted, #6b7280)",
          }}
        >
          <Upload size={24} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Click to upload</span>
          <span style={{ fontSize: 11 }}>PDF, DOC, XLSX, CSV</span>
        </button>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          borderRadius: 10, border: "1px solid var(--line, #e5e7eb)", background: "var(--bg, #f9fafb)",
        }}>
          <FileText size={18} style={{ color: "var(--teal, #0e918a)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>
              {uploading ? "Uploading…" : uploadedUrl ? "Uploaded ✓" : `${(file.size / 1024).toFixed(0)} KB`}
            </div>
          </div>
          <button onClick={clear} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
