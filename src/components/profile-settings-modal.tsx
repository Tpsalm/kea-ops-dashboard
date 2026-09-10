"use client";

import { useEffect, useState } from "react";
import {
  Camera, Check, Laptop, Moon, Settings, ShieldAlert, ShieldCheck,
  Store, Sun, Trash2, UserRound, Bell, X, Banknote, Users
} from "lucide-react";
import { useTheme } from "../lib/theme-provider";

export interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "super-admin" | "supervisor" | "vsr" | "merchandiser" | "tsr";
  defaultName: string;
  defaultEmail: string;
  roleLabel: string;
  onFlash?: (msg: string) => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  role,
  defaultName,
  defaultEmail,
  roleLabel,
  onFlash,
}: ProfileSettingsModalProps) {
  const { theme, setTheme, preferences, updatePreferences } = useTheme();

  const storageKeyPrefix = `kea_${role}`;
  const [avatar, setAvatar] = useState<string>("");
  const [profileName, setProfileName] = useState<string>(defaultName);
  const [profileEmail, setProfileEmail] = useState<string>(defaultEmail);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const storedAvatar = localStorage.getItem(`${storageKeyPrefix}_avatar`) || localStorage.getItem("kea_user_avatar");
      if (storedAvatar) setAvatar(storedAvatar);

      const storedName = localStorage.getItem(`${storageKeyPrefix}_name`);
      if (storedName) setProfileName(storedName);
      else setProfileName(defaultName);

      const storedEmail = localStorage.getItem(`${storageKeyPrefix}_email`);
      if (storedEmail) setProfileEmail(storedEmail);
      else setProfileEmail(defaultEmail);
    } catch {}
  }, [isOpen, role, defaultName, defaultEmail, storageKeyPrefix]);

  if (!isOpen) return null;

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
      if (avatar) {
        localStorage.setItem(`${storageKeyPrefix}_avatar`, avatar);
        localStorage.setItem("kea_user_avatar", avatar);
      }
      window.dispatchEvent(new Event("kea-avatar-updated"));
    } catch {}

    notify("Preferences and profile saved successfully!");
    onClose();
  }

  const initials = profileName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SA";

  const RoleIcon = role === "super-admin"
    ? ShieldAlert
    : role === "supervisor"
    ? ShieldCheck
    : role === "vsr"
    ? Banknote
    : role === "tsr"
    ? Users
    : Store;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ zIndex: 999 }}
    >
      <section
        className="action-modal settings-modal-clean"
        role="dialog"
        aria-modal="true"
        aria-label="Settings and Profile"
      >
        {/* MODAL HEADER */}
        <div className="modal-head">
          <div>
            <small>KEA OPERATIONS · WORKSPACE PREFERENCES</small>
            <h2>Settings & Profile</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settings">
            <X size={19} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="settings-body-clean">
          {/* SECTION 1: PROFILE SETTINGS & AVATAR */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <UserRound size={15} />
              <span>PROFILE SETTINGS & AVATAR</span>
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
                <label>DISPLAY NAME</label>
                <input
                  type="text"
                  className="profile-field-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Super Admin"
                />
              </div>
              <div className="profile-field-group">
                <label>EMAIL ADDRESS</label>
                <input
                  type="email"
                  className="profile-field-input"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="e.g. superadmin@kea.com"
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Executive Role</span>
              <div className="profile-role-badge">
                <RoleIcon size={12} />
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: DISPLAY LIGHTING & THEME */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <Sun size={15} />
              <span>DISPLAY LIGHTING & THEME</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
              Adjust workspace lighting. Affects all pages and dashboards seamlessly.
            </p>

            <div className="theme-selector-grid">
              <button
                type="button"
                className={`theme-card-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => { setTheme("light"); notify("Light theme applied across all pages"); }}
              >
                {theme === "light" && <div className="theme-card-check"><Check size={11} /></div>}
                <div className="theme-card-icon"><Sun size={18} /></div>
                <strong>Light</strong>
                <span>Crisp daylight mode</span>
              </button>

              <button
                type="button"
                className={`theme-card-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => { setTheme("dark"); notify("Dark theme applied across all pages"); }}
              >
                {theme === "dark" && <div className="theme-card-check"><Check size={11} /></div>}
                <div className="theme-card-icon"><Moon size={18} /></div>
                <strong>Dark</strong>
                <span>Low-light contrast mode</span>
              </button>

              <button
                type="button"
                className={`theme-card-btn ${theme === "system" ? "active" : ""}`}
                onClick={() => { setTheme("system"); notify("System theme synchronized"); }}
              >
                {theme === "system" && <div className="theme-card-check"><Check size={11} /></div>}
                <div className="theme-card-icon"><Laptop size={18} /></div>
                <strong>Auto System</strong>
                <span>Matches operating system</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: CORE PREFERENCES & ALERTS */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <Bell size={15} />
              <span>ALERTS & NOTIFICATIONS</span>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-row-info">
                <b>Instant Email & In-App Decision Alerts</b>
                <span>Receive instant notifications when requests, approvals or escalations are logged.</span>
              </div>
              <button
                type="button"
                className={`settings-toggle ${emailAlerts ? "active" : ""}`}
                onClick={() => {
                  setEmailAlerts(!emailAlerts);
                  notify(`Instant email alerts ${!emailAlerts ? "enabled" : "disabled"}`);
                }}
                aria-label="Toggle email alerts"
              >
                <i />
              </button>
            </div>

            <div className="settings-toggle-row" style={{ paddingTop: 8, borderTop: "1px solid var(--line)" }}>
              <div className="settings-toggle-row-info">
                <b>Audio Feedback on Actions</b>
                <span>Play subtle audio feedback on important operations and status updates.</span>
              </div>
              <button
                type="button"
                className={`settings-toggle ${soundAlerts ? "active" : ""}`}
                onClick={() => {
                  setSoundAlerts(!soundAlerts);
                  notify(`Sound alerts ${!soundAlerts ? "enabled" : "disabled"}`);
                }}
                aria-label="Toggle sound alerts"
              >
                <i />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div
          className="modal-actions"
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--line)",
            background: "var(--soft)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10
          }}
        >
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--card)",
              color: "var(--text)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: "#65a30d",
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(101, 163, 13, 0.3)"
            }}
          >
            <Check size={14} /> Save Preferences
          </button>
        </div>
      </section>
    </div>
  );
}
