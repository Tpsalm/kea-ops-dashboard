"use client";

// Shared application chrome (sidebar + topbar + notifications + toast + modals)
// used by every dedicated tab page so navigation is consistent across routes.
import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, CheckCircle2, ChevronRight, LayoutDashboard, LogOut, Menu, Moon,
  MoreHorizontal, Search, Settings, ShieldCheck, Store, Sun, UserRound, X,
  ShieldAlert, Banknote, Laptop, Camera, Trash2, Check, User, AlertTriangle
} from "lucide-react";
import { NAV } from "../app/data";
import useAuth from "../lib/useAuth";
import { useTheme } from "../lib/theme-provider";
import { UrgentLoginModal } from "./urgent-login-modal";

export function AppShell({
  children,
  contentClassName,
  searchValue = "",
  onSearch,
}: {
  children: ReactNode;
  contentClassName?: string;
  searchValue?: string;
  onSearch?: (q: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { theme, isDark, setTheme, toggleTheme, preferences, updatePreferences } = useTheme();

  const superAdminNav = [
    { label: "Global Performance", path: "/admin", icon: LayoutDashboard },
    { label: "Centralized Action Center", path: "/action-center", icon: ShieldAlert },
    { label: "VSR Credit & Loan Surveillance", path: "/vsr-surveillance", icon: Banknote },
    { label: "Merchandiser Activity & Outlets", path: "/merchandiser-outlets", icon: Store },
  ];
  const shellNav = user?.role === "super-admin" ? superAdminNav : NAV;
  const activeNav = shellNav.find((item) => item.path === pathname)?.label ?? "Overview";
  
  const [mobileNav, setMobileNav] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [panel, setPanel] = useState<null | "settings" | "profile" | "manage">(null);
  const [notice, setNotice] = useState("");
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);

  // Auto-pop urgent modal on login
  useEffect(() => {
    try {
      const isUrgentPending = sessionStorage.getItem("kea_urgent_login_alert");
      if (isUrgentPending === "true") {
        setUrgentModalOpen(true);
        sessionStorage.removeItem("kea_urgent_login_alert");
      } else {
        const sessionSeen = sessionStorage.getItem(`kea_seen_alert_${user?.role}`);
        if (!sessionSeen && user?.role) {
          setUrgentModalOpen(true);
          sessionStorage.setItem(`kea_seen_alert_${user?.role}`, "true");
        }
      }
    } catch {}
  }, [user?.role]);

  // Profile avatar & custom info
  const [avatar, setAvatar] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("KEA Administrator");
  const [profileEmail, setProfileEmail] = useState<string>("admin@kea.com");

  useEffect(() => {
    try {
      const storedAvatar = localStorage.getItem("kea_user_avatar");
      if (storedAvatar) setAvatar(storedAvatar);

      const storedName = localStorage.getItem("kea_user_name");
      if (storedName) setProfileName(storedName);
      else if (user?.name) setProfileName(user.name);

      const storedEmail = localStorage.getItem("kea_user_email");
      if (storedEmail) setProfileEmail(storedEmail);
      else if (user?.email) setProfileEmail(user.email);
    } catch {}
  }, [user]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      flash("Image size exceeds 3MB limit");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setAvatar(res);
      try {
        localStorage.setItem("kea_user_avatar", res);
      } catch {}
      flash("Profile photo updated successfully");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatar("");
    try {
      localStorage.removeItem("kea_user_avatar");
    } catch {}
    flash("Profile photo removed");
  }

  function handleSaveSettings() {
    try {
      localStorage.setItem("kea_user_name", profileName);
      localStorage.setItem("kea_user_email", profileEmail);
      if (avatar) {
        localStorage.setItem("kea_user_avatar", avatar);
      }
    } catch {}
    setPanel(null);
    flash("Settings and profile preferences saved!");
  }

  const initials = profileName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KA";

  if (loading || !user) {
    if (!loading && !user) router.replace("/login");
    return <main className="auth-loading">Checking secure workspace...</main>;
  }

  return (
    <div className={`app ${isDark ? "dark" : ""}${user.role === "super-admin" ? " super-admin-shell" : ""}`}>
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}

      <aside className={mobileNav ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-logo" aria-label="KEA Corporate Hospitality Services"><b className="logo-k">k</b><b className="logo-e">e</b><b className="logo-a">a</b><small>Corporate Hospitality Services</small></div>
          <div><strong>KEA GROUP</strong><span>Talent Management System</span></div>
          <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav>
          <p>ANALYTICS</p>
          {shellNav.map(({ label, icon: Icon, path }) => (
            <Link key={label} href={path} className={activeNav === label ? "active" : ""} onClick={() => setMobileNav(false)}>
              <Icon size={18} /><span>{label}</span>{label === "Live map" && <i>LIVE</i>}
            </Link>
          ))}
          {user.role === "super-admin" && (
            <button type="button" onClick={() => { setPanel("settings"); setMobileNav(false); }}><Settings size={18} /><span>Settings</span></button>
          )}
        </nav>
        <nav className="manage">
          <p>MANAGE</p>
          <button type="button" onClick={() => { setPanel("manage"); setMobileNav(false); }}><ShieldCheck size={18} /><span>Data quality</span></button>
          <button type="button" onClick={() => { setPanel("settings"); setMobileNav(false); }}><Settings size={18} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-foot" onClick={() => setPanel("settings")} style={{ cursor: "pointer" }} title="Click to view profile & settings">
          <div className="user-avatar">
            {avatar ? (
              <img src={avatar} alt="Profile" className="user-avatar-img" />
            ) : (
              initials
            )}
          </div>
          <div>
            <b>{profileName}</b>
            <span>{user.role === "super-admin" ? "Super Admin · Full access" : "Operations · Full access"}</span>
          </div>
          <MoreHorizontal size={18} />
        </div>
        <button type="button" className="sidebar-signout" onClick={() => void signOut()}><LogOut size={16} /><span>Sign out</span></button>
      </aside>

      <main className="main">
        <header className="topbar">
          <button type="button" className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="top-search"><Search size={17} /><input id="global-search" placeholder="Search people, stores, routes..." value={searchValue} onChange={(e) => onSearch?.(e.target.value)} /><kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <button
              type="button"
              className="urgent-alert-pill"
              onClick={() => setUrgentModalOpen(true)}
              title="Open Urgent Action Items"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 11px",
                borderRadius: "20px",
                background: "rgba(243, 112, 33, 0.12)",
                border: "1px solid rgba(243, 112, 33, 0.35)",
                color: "#F37021",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                marginRight: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F37021", display: "inline-block" }} className="animate-pulse" />
              <span>Urgent Notice</span>
            </button>
            <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" title={`Switch to ${isDark ? "Light" : "Dark"} mode`}>
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button type="button" className="bell" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Open notifications"><Bell size={19} /><i /></button>
            <button
              type="button"
              className="user-avatar small profile-button"
              onClick={() => setPanel("settings")}
              aria-label="Open settings & profile"
              title="Open profile & settings"
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="user-avatar-img" />
              ) : (
                initials
              )}
            </button>
          </div>
          {notificationsOpen && (
            <div className="notification-popover">
              <div><b>Notifications</b><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={15} /></button></div>
              <p><span className="notice-dot" /> Lagos Central reached 92% coverage.</p>
              <p><span className="notice-dot teal" /> 142 stores were added this month.</p>
              <p><span className="notice-dot" /> Super Admin decision notifications active.</p>
              <button type="button" onClick={() => { setNotificationsOpen(false); flash("Notifications marked as read"); }}>Mark all as read</button>
            </div>
          )}
        </header>

        <div className={contentClassName ? `content ${contentClassName}` : "content"} id="overview">
          {children}
        </div>
      </main>

      {panel === "manage" && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Management tools">
            <div className="modal-head"><div><small>KEA OPERATIONS</small><h2>Management tools</h2></div><button type="button" onClick={() => setPanel(null)} aria-label="Close panel"><X size={19} /></button></div>
            <div className="modal-body">
              <p className="modal-label">ADVANCED TOOLS</p>
              <div className="modal-grid"><button type="button" onClick={() => setPanel(null)}><ShieldCheck size={20} /><b>Data quality</b><span>Validation and record health checks</span></button></div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setPanel(null)}>Close</button>
                <Link href="/" onClick={() => setPanel(null)} className="primary" style={{ textDecoration: "none" }}>Open on Overview</Link>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─── STREAMLINED, NEAT & STRUCTURED SETTINGS & PROFILE MODAL ─── */}
      {panel === "settings" && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <section className="action-modal settings-modal-clean" role="dialog" aria-modal="true" aria-label="System settings and profile">
            <div className="modal-head">
              <div>
                <small>KEA OPERATIONS · WORKSPACE PREFERENCES</small>
                <h2>Settings & Profile</h2>
              </div>
              <button type="button" onClick={() => setPanel(null)} aria-label="Close settings"><X size={19} /></button>
            </div>

            <div className="settings-body-clean">
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
                    <label>Display Name</label>
                    <input
                      type="text"
                      className="profile-field-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. KEA Administrator"
                    />
                  </div>
                  <div className="profile-field-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="profile-field-input"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. admin@kea.com"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Executive Role</span>
                  <div className="profile-role-badge">
                    <ShieldAlert size={12} />
                    <span>{user?.role === "super-admin" ? "Super Admin Executive · Full Access" : `${user?.role?.toUpperCase()} Access`}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DISPLAY LIGHTING MODE */}
              <div className="settings-section-card">
                <div className="settings-section-header">
                  <Sun size={15} />
                  <span>Display Lighting & Theme</span>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                  Adjust workspace lighting. Affects all pages and dashboards seamlessly.
                </p>

                <div className="theme-selector-grid">
                  <button
                    type="button"
                    className={`theme-card-btn ${theme === "light" ? "active" : ""}`}
                    onClick={() => { setTheme("light"); flash("Light theme applied across all pages"); }}
                  >
                    {theme === "light" && <div className="theme-card-check"><Check size={11} /></div>}
                    <div className="theme-card-icon"><Sun size={18} /></div>
                    <strong>Light</strong>
                    <span>Crisp daylight mode</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-card-btn ${theme === "dark" ? "active" : ""}`}
                    onClick={() => { setTheme("dark"); flash("Dark theme applied across all pages"); }}
                  >
                    {theme === "dark" && <div className="theme-card-check"><Check size={11} /></div>}
                    <div className="theme-card-icon"><Moon size={18} /></div>
                    <strong>Dark</strong>
                    <span>Low-light contrast mode</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-card-btn ${theme === "system" ? "active" : ""}`}
                    onClick={() => { setTheme("system"); flash("System theme synchronized"); }}
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
                  <span>Alerts & Notifications</span>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-row-info">
                    <b>Instant Email & In-App Decision Alerts</b>
                    <span>Supervisors immediately receive notifications when requests are Approved or Disapproved.</span>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${preferences.emailAlertsOnApproval ? "active" : ""}`}
                    onClick={() => {
                      updatePreferences({ emailAlertsOnApproval: !preferences.emailAlertsOnApproval });
                      flash(`Instant email dispatch ${!preferences.emailAlertsOnApproval ? "enabled" : "disabled"}`);
                    }}
                    aria-label="Toggle email alerts"
                  >
                    <i />
                  </button>
                </div>

                <div className="settings-toggle-row" style={{ paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                  <div className="settings-toggle-row-info">
                    <b>Audio Chimes on Action</b>
                    <span>Play subtle audio feedback on high-severity actions and loan status updates.</span>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${preferences.soundEnabled ? "active" : ""}`}
                    onClick={() => {
                      updatePreferences({ soundEnabled: !preferences.soundEnabled });
                      flash(`Sound alerts ${!preferences.soundEnabled ? "enabled" : "disabled"}`);
                    }}
                    aria-label="Toggle sound alerts"
                  >
                    <i />
                  </button>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--soft)" }}>
              <button type="button" className="secondary" onClick={() => setPanel(null)}>
                Close
              </button>
              <button type="button" className="primary" onClick={handleSaveSettings}>
                <Check size={14} /> Save Preferences
              </button>
            </div>
          </section>
        </div>
      )}

      {panel === "profile" && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Administrator profile">
            <div className="modal-head"><div><small>KEA OPERATIONS</small><h2>Administrator Profile</h2></div><button type="button" onClick={() => setPanel(null)} aria-label="Close panel"><X size={19} /></button></div>
            <div className="modal-body">
              <div className="profile-summary">
                <div className="user-avatar" style={{ width: 48, height: 48, overflow: "hidden" }}>
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="user-avatar-img" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <b>{profileName}</b>
                  <span>{profileEmail} · Full access</span>
                </div>
              </div>
              <button type="button" className="modal-row" onClick={() => setPanel("settings")}><Settings size={17} /><span><b>Settings & Display Preferences</b><small>Theme lighting, profile photo, and notifications</small></span><ChevronRight size={16} /></button>
              <button type="button" className="modal-row danger" onClick={() => void signOut()}><LogOut size={17} /><span><b>Sign out</b><small>End this session and return to login</small></span><ChevronRight size={16} /></button>
            </div>
          </section>
        </div>
      )}

      {/* ─── URGENT LOGIN ATTENTION POPUP ─── */}
      <UrgentLoginModal
        role={user?.role}
        userName={profileName || user?.name || "User"}
        isOpen={urgentModalOpen}
        onClose={() => setUrgentModalOpen(false)}
      />
    </div>
  );
}
