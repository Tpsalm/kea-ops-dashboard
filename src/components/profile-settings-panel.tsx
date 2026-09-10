"use client";

import { useEffect, useState } from "react";
import {
  Camera, Check, Moon, Settings, ShieldAlert, ShieldCheck,
  Store, Sun, Trash2, UserRound, Bell, MapPin, Zap, Banknote
} from "lucide-react";
import { useTheme } from "../lib/theme-provider";

export interface ProfileSettingsProps {
  role: "super-admin" | "supervisor" | "vsr" | "merchandiser" | "tsr";
  defaultName: string;
  defaultEmail: string;
  roleLabel: string;
  territoryLabel?: string;
  isModal?: boolean;
  onClose?: () => void;
  onSave?: (saved: { name: string; email: string; avatar: string }) => void;
  onFlash?: (msg: string) => void;
}

export function ProfileSettingsPanel({
  role,
  defaultName,
  defaultEmail,
  roleLabel,
  territoryLabel,
  isModal = false,
  onClose,
  onSave,
  onFlash,
}: ProfileSettingsProps) {
  const { theme, setTheme } = useTheme();

  const storageKeyPrefix = `kea_${role}`;
  const [avatar, setAvatar] = useState<string>("");
  const [profileName, setProfileName] = useState<string>(defaultName);
  const [profileEmail, setProfileEmail] = useState<string>(defaultEmail);
  const [phone, setPhone] = useState<string>("+234 803 456 7890");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [geoTracking, setGeoTracking] = useState(true);

  useEffect(() => {
    try {
      const storedAvatar = localStorage.getItem(`${storageKeyPrefix}_avatar`) || localStorage.getItem("kea_user_avatar");
      if (storedAvatar) setAvatar(storedAvatar);

      const storedName = localStorage.getItem(`${storageKeyPrefix}_name`);
      if (storedName) setProfileName(storedName);
      else setProfileName(defaultName);

      const storedEmail = localStorage.getItem(`${storageKeyPrefix}_email`);
      if (storedEmail) setProfileEmail(storedEmail);
      else setProfileEmail(defaultEmail);

      const storedPhone = localStorage.getItem(`${storageKeyPrefix}_phone`);
      if (storedPhone) setPhone(storedPhone);
    } catch {}
  }, [role, defaultName, defaultEmail, storageKeyPrefix]);

  function notify(msg: string) {
    if (onFlash) onFlash(msg);
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      notify("Image size exceeds 3MB limit");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setAvatar(res);
      try {
        localStorage.setItem(`${storageKeyPrefix}_avatar`, res);
        localStorage.setItem("kea_user_avatar", res);
        window.dispatchEvent(new Event("kea-avatar-updated"));
      } catch {}
      notify("Profile photo updated successfully!");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatar("");
    try {
      localStorage.removeItem(`${storageKeyPrefix}_avatar`);
      localStorage.removeItem("kea_user_avatar");
      window.dispatchEvent(new Event("kea-avatar-updated"));
    } catch {}
    notify("Profile photo removed");
  }

  function handleSave() {
    try {
      localStorage.setItem(`${storageKeyPrefix}_name`, profileName);
      localStorage.setItem(`${storageKeyPrefix}_email`, profileEmail);
      localStorage.setItem(`${storageKeyPrefix}_phone`, phone);
      if (avatar) {
        localStorage.setItem(`${storageKeyPrefix}_avatar`, avatar);
        localStorage.setItem("kea_user_avatar", avatar);
      }
      window.dispatchEvent(new Event("kea-avatar-updated"));
    } catch {}

    notify("Profile settings & preferences saved successfully!");
    if (onSave) onSave({ name: profileName, email: profileEmail, avatar });
    if (isModal && onClose) onClose();
  }

  const initials = profileName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KA";

  const RoleIcon = role === "super-admin"
    ? ShieldAlert
    : role === "supervisor"
    ? ShieldCheck
    : role === "vsr"
    ? Banknote
    : Store;

  const content = (
    <div className={isModal ? "settings-body-clean" : "settings-content-wrapper"} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* SECTION 1: PROFILE & IDENTITY */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <UserRound size={15} />
          <span>Profile Settings & Avatar</span>
        </div>

        <div className="profile-avatar-row">
          <div className="profile-avatar-preview">
            {avatar ? (
              <img src={avatar} alt="Profile preview" />
            ) : (
              initials
            )}
          </div>

          <div className="avatar-upload-actions">
            <div className="avatar-upload-btns">
              <label className="btn-upload-photo" tabIndex={0}>
                <Camera size={13} />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                />
              </label>
              {avatar && (
                <button type="button" className="btn-remove-photo" onClick={handleRemoveAvatar}>
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              )}
            </div>
            <span className="avatar-hint">Supports JPG, PNG, WebP (max 3MB)</span>
          </div>
        </div>

        <div className="profile-fields-grid">
          <div className="profile-field-group">
            <label>Full Display Name</label>
            <input
              type="text"
              className="profile-field-input"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="profile-field-group">
            <label>Work Email Address</label>
            <input
              type="email"
              className="profile-field-input"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              placeholder="e.g. user@kea.com"
            />
          </div>
          <div className="profile-field-group">
            <label>Contact Phone</label>
            <input
              type="tel"
              className="profile-field-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
            />
          </div>
          <div className="profile-field-group">
            <label>Assigned Territory / Hub</label>
            <input
              type="text"
              className="profile-field-input"
              value={territoryLabel || "Lagos Regional Hub"}
              readOnly
              style={{ background: "var(--soft)", color: "var(--text)", fontWeight: 700 }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Operational Role:</span>
            <div className="profile-role-badge">
              <RoleIcon size={12} />
              <span>{roleLabel}</span>
            </div>
          </div>
          <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, background: "#f0fdf4", padding: "3px 8px", borderRadius: 6, border: "1px solid #dcfce7" }}>
            ● Active Status
          </span>
        </div>
      </div>

      {/* SECTION 2: DISPLAY LIGHTING & THEME */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <Sun size={15} />
          <span>Display Lighting & Theme Mode</span>
        </div>

        <div className="theme-selector-grid">
          <button
            type="button"
            className={`theme-card-btn ${theme === "light" ? "active" : ""}`}
            onClick={() => { setTheme("light"); notify("Light theme applied"); }}
          >
            {theme === "light" && <div className="theme-card-check"><Check size={11} /></div>}
            <div className="theme-card-icon"><Sun size={18} /></div>
            <strong>Light Mode</strong>
            <span>Crisp daylight contrast</span>
          </button>

          <button
            type="button"
            className={`theme-card-btn ${theme === "dark" ? "active" : ""}`}
            onClick={() => { setTheme("dark"); notify("Dark theme applied"); }}
          >
            {theme === "dark" && <div className="theme-card-check"><Check size={11} /></div>}
            <div className="theme-card-icon"><Moon size={18} /></div>
            <strong>Dark Mode</strong>
            <span>Low-light night contrast</span>
          </button>

          <button
            type="button"
            className={`theme-card-btn ${theme === "system" ? "active" : ""}`}
            onClick={() => { setTheme("system"); notify("System theme synced"); }}
          >
            {theme === "system" && <div className="theme-card-check"><Check size={11} /></div>}
            <div className="theme-card-icon"><Settings size={18} /></div>
            <strong>Auto System</strong>
            <span>Matches operating system</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: NOTIFICATIONS & FIELD SYNC */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <Bell size={15} />
          <span>Workspace Preferences & Field Sync</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="settings-toggle-row">
            <div className="settings-toggle-row-info">
              <b>Instant Field Alerts & Notifications</b>
              <span>Receive live push alerts when leaves, stockouts, or reports are logged</span>
            </div>
            <button
              type="button"
              className={`settings-toggle ${emailAlerts ? "active" : ""}`}
              onClick={() => { setEmailAlerts(!emailAlerts); notify(emailAlerts ? "Notifications muted" : "Notifications enabled"); }}
              aria-label="Toggle notifications"
            >
              <i />
            </button>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-row-info">
              <b>High-Accuracy GPS Geotagging</b>
              <span>Auto-attach coordinates (&lt;5m accuracy) on photo evidence & POD uploads</span>
            </div>
            <button
              type="button"
              className={`settings-toggle ${geoTracking ? "active" : ""}`}
              onClick={() => { setGeoTracking(!geoTracking); notify(geoTracking ? "GPS high precision disabled" : "GPS high precision active"); }}
              aria-label="Toggle GPS tracking"
            >
              <i />
            </button>
          </div>
        </div>
      </div>

      {/* SAVE ACTIONS */}
      <div style={{ display: "flex", justifyContent: isModal ? "space-between" : "flex-end", alignItems: "center", gap: 10, marginTop: 4 }}>
        {isModal && onClose && (
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            style={{ padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)" }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          style={{
            background: role === "supervisor" ? "#0d9488" : role === "vsr" ? "#2563eb" : role === "merchandiser" ? "#0d9488" : "#2563eb",
            color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 12, fontWeight: 800,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
          }}
        >
          <Check size={14} /> Save Profile & Settings
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
        <section className="action-modal settings-modal-clean" role="dialog" aria-modal="true" aria-label="Settings and Profile">
          <div className="modal-head">
            <div>
              <small>KEA OPERATIONS · {role.toUpperCase()} PREFERENCES</small>
              <h2>Settings & Profile</h2>
            </div>
            {onClose && <button type="button" onClick={onClose} aria-label="Close settings"><Settings size={18} /></button>}
          </div>
          {content}
        </section>
      </div>
    );
  }

  return content;
}
