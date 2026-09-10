"use client";

interface CalendarPickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  minDate?: string;
}

export function CalendarPicker({ startDate, endDate, onStartChange, onEndChange, minDate }: CalendarPickerProps) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--text, #111)" }}>
        Start date
        <input
          type="date"
          value={startDate}
          min={minDate}
          onChange={(e) => onStartChange(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", fontSize: 13, outline: "none" }}
        />
      </label>
      <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--text, #111)" }}>
        End date
        <input
          type="date"
          value={endDate}
          min={startDate || minDate}
          onChange={(e) => onEndChange(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", fontSize: 13, outline: "none" }}
        />
      </label>
    </div>
  );
}
