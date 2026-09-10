"use client";

import { FormEvent, useState } from "react";

interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

interface FormProps {
  fields: Field[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onCancel?: () => void;
}

export function Form({ fields, submitLabel = "Submit", onSubmit, onCancel }: FormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.name] = f.defaultValue ?? ""; });
    return init;
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {fields.map((f) => (
        <label key={f.name} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--text, #111)" }}>
          {f.label}
          {f.type === "textarea" ? (
            <textarea
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              placeholder={f.placeholder}
              required={f.required}
              rows={3}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", fontSize: 13, resize: "vertical", outline: "none" }}
            />
          ) : f.type === "select" ? (
            <select
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              required={f.required}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", fontSize: 13, outline: "none", background: "#fff" }}
            >
              <option value="">Select…</option>
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input
              type={f.type ?? "text"}
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              placeholder={f.placeholder}
              required={f.required}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", fontSize: 13, outline: "none" }}
            />
          )}
        </label>
      ))}
      {error && <div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "8px 10px", borderRadius: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={busy}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 8, border: "none",
            background: "var(--teal, #0e918a)", color: "#fff",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 16px", borderRadius: 8,
              border: "1px solid var(--line, #e5e7eb)", background: "#fff",
              fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--muted, #6b7280)",
            }}
          >Cancel</button>
        )}
      </div>
    </form>
  );
}
