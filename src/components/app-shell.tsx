"use client";

// Shared application chrome (sidebar + topbar + notifications + toast + modals)
// used by every dedicated tab page so navigation is consistent across routes.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, CheckCircle2, ChevronRight, Database, FileText, LayoutDashboard, LogOut, Map, Menu, Moon,
  MoreHorizontal, Network, Search, Settings, ShieldCheck, Store, Sun, UserRound, Users, X,
  ShieldAlert, Banknote, Laptop, Palette, BellRing, Sliders, Globe, Lock, RefreshCw, Download,
  Volume2, VolumeX, Sparkles, Check
} from "lucide-react";
import { NAV } from "../app/data";
import useAuth from "../lib/useAuth";
import { useTheme, type ThemeMode, type UiDensity, type AccentColor } from "../lib/theme-provider";

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
  const { theme, isDark, setTheme, toggleTheme, preferences, updatePreferences, resetPreferences } = useTheme();

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
  const [settingsTab, setSettingsTab] = useState<"appearance" | "notifications" | "surveillance" | "regional" | "security">("appearance");
  const [notice, setNotice] = useState("");

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

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
        <div className="sidebar-foot"><div className="user-avatar">KA</div><div><b>KEA Administrator</b><span>Operations · Full access</span></div><MoreHorizontal size={18} /></div>
        <button type="button" className="sidebar-signout" onClick={() => void signOut()}><LogOut size={16} /><span>Sign out</span></button>
      </aside>

      <main className="main">
        <header className="topbar">
          <button type="button" className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="top-search"><Search size={17} /><input id="global-search" placeholder="Search people, stores, routes..." value={searchValue} onChange={(e) => onSearch?.(e.target.value)} /><kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" title={`Switch to ${isDark ? "Light" : "Dark"} mode`}>
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button type="button" className="bell" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Open notifications"><Bell size={19} /><i /></button>
            <button type="button" className="user-avatar small profile-button" onClick={() => setPanel("profile")} aria-label="Open profile">KA</button>
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

      {/* ─── EXPANDED EXECUTIVE SETTINGS MODAL ─── */}
      {panel === "settings" && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <section className="action-modal settings-modal" role="dialog" aria-modal="true" aria-label="System settings">
            <div className="modal-head">
              <div>
                <small>KEA OPERATIONS · EXECUTIVE CONFIGURATION</small>
                <h2>System Settings & Preferences</h2>
              </div>
              <button type="button" onClick={() => setPanel(null)} aria-label="Close settings"><X size={19} /></button>
            </div>

            {/* Tab Bar */}
            <div className="settings-tab-bar">
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === "appearance" ? "active" : ""}`}
                onClick={() => setSettingsTab("appearance")}
              >
                <Palette size={14} /> Appearance
              </button>
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === "notifications" ? "active" : ""}`}
                onClick={() => setSettingsTab("notifications")}
              >
                <BellRing size={14} /> Notifications & Email
              </button>
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === "surveillance" ? "active" : ""}`}
                onClick={() => setSettingsTab("surveillance")}
              >
                <Sliders size={14} /> Surveillance & Gates
              </button>
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === "regional" ? "active" : ""}`}
                onClick={() => setSettingsTab("regional")}
              >
                <Globe size={14} /> Regional & Currency
              </button>
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === "security" ? "active" : ""}`}
                onClick={() => setSettingsTab("security")}
              >
                <Lock size={14} /> Security & System
              </button>
            </div>

            {/* Tab 1: Appearance */}
            {settingsTab === "appearance" && (
              <div className="settings-tab-content">
                <div className="settings-group">
                  <p className="settings-group-title">Display Lighting & Theme Mode</p>
                  <div className="theme-pill-grid">
                    <button
                      type="button"
                      className={`theme-pill-btn ${theme === "light" ? "active" : ""}`}
                      onClick={() => { setTheme("light"); flash("Light theme applied across all pages"); }}
                    >
                      <Sun size={20} />
                      <span>Light</span>
                      <small style={{ fontSize: 9, opacity: 0.7 }}>Crisp & bright</small>
                    </button>
                    <button
                      type="button"
                      className={`theme-pill-btn ${theme === "dark" ? "active" : ""}`}
                      onClick={() => { setTheme("dark"); flash("Dark theme applied across all pages"); }}
                    >
                      <Moon size={20} />
                      <span>Dark</span>
                      <small style={{ fontSize: 9, opacity: 0.7 }}>Low-light contrast</small>
                    </button>
                    <button
                      type="button"
                      className={`theme-pill-btn ${theme === "system" ? "active" : ""}`}
                      onClick={() => { setTheme("system"); flash("System theme synced across all pages"); }}
                    >
                      <Laptop size={20} />
                      <span>System Auto</span>
                      <small style={{ fontSize: 9, opacity: 0.7 }}>Follows OS setting</small>
                    </button>
                  </div>
                </div>

                <div className="settings-group">
                  <p className="settings-group-title">UI Layout Density</p>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Compact Table & KPI Density</strong>
                      <span>Tighter rows and cards for high-volume field operations monitoring.</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.density === "compact" ? "active" : ""}`}
                      onClick={() => {
                        const next = preferences.density === "compact" ? "comfortable" : "compact";
                        updatePreferences({ density: next });
                        flash(`Layout density set to ${next}`);
                      }}
                      aria-label="Toggle compact density"
                    >
                      <i />
                    </button>
                  </div>
                </div>

                <div className="settings-group">
                  <p className="settings-group-title">Accent Palette</p>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Brand Accent Highlight</strong>
                      <span>Select primary emphasis color across action buttons and active indicators.</span>
                    </div>
                    <div className="accent-swatch-list">
                      {[
                        { key: "emerald", label: "Emerald", color: "#0e918a" },
                        { key: "blue", label: "Blue", color: "#2563eb" },
                        { key: "amber", label: "Amber", color: "#d97706" },
                        { key: "violet", label: "Violet", color: "#7c3aed" },
                      ].map((swatch) => (
                        <button
                          key={swatch.key}
                          type="button"
                          className={`accent-swatch-btn ${preferences.accent === swatch.key ? "active" : ""}`}
                          style={{ background: swatch.color }}
                          onClick={() => {
                            updatePreferences({ accent: swatch.key as AccentColor });
                            flash(`${swatch.label} accent applied`);
                          }}
                          title={swatch.label}
                        >
                          {preferences.accent === swatch.key && <Check size={14} color="#fff" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <p className="settings-group-title">Motion & Micro-interactions</p>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Smooth UI Transitions & Number Counter Animation</strong>
                      <span>Enable framer-motion smooth counter ticker and panel entrances.</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.motion ? "active" : ""}`}
                      onClick={() => {
                        updatePreferences({ motion: !preferences.motion });
                        flash(`Motion animations ${!preferences.motion ? "enabled" : "disabled"}`);
                      }}
                      aria-label="Toggle motion"
                    >
                      <i />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Notifications */}
            {settingsTab === "notifications" && (
              <div className="settings-tab-content">
                <div className="settings-group">
                  <p className="settings-group-title">Super Admin Approval Dispatch Engine</p>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Instant Email & In-App Alerts on Super Admin Review</strong>
                      <span>Supervisors immediately receive an email receipt and dashboard alert when loans or escalations are Approved or Rejected.</span>
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

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Critical Stockout Warning Triggers</strong>
                      <span>Generate urgent escalation alerts when retail outlet inventory buffers drop below safe threshold (&lt;15%).</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.stockoutAlerts ? "active" : ""}`}
                      onClick={() => {
                        updatePreferences({ stockoutAlerts: !preferences.stockoutAlerts });
                        flash(`Stockout warnings ${!preferences.stockoutAlerts ? "enabled" : "disabled"}`);
                      }}
                      aria-label="Toggle stockout alerts"
                    >
                      <i />
                    </button>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Daily Regional Operations Digest (8:00 AM)</strong>
                      <span>Automated morning executive brief with route completion rates, open loan debt, and pending approvals.</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.dailyDigest ? "active" : ""}`}
                      onClick={() => {
                        updatePreferences({ dailyDigest: !preferences.dailyDigest });
                        flash(`Daily digest ${!preferences.dailyDigest ? "enabled" : "disabled"}`);
                      }}
                      aria-label="Toggle daily digest"
                    >
                      <i />
                    </button>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Auditory Chimes on High-Severity Alerts</strong>
                      <span>Play discreet chime for priority 1 emergency route or funding escalations.</span>
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
            )}

            {/* Tab 3: Surveillance & Field Controls */}
            {settingsTab === "surveillance" && (
              <div className="settings-tab-content">
                <div className="settings-group">
                  <p className="settings-group-title">Field Operations Governance</p>
                  
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>VSR Credit Surveillance Gate</strong>
                      <span>Auto-lock new funding requests for VSRs with &gt;₦100,000 in unpaid loan balances until executive clearance.</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.vsrDebtLimitLock ? "active" : ""}`}
                      onClick={() => {
                        updatePreferences({ vsrDebtLimitLock: !preferences.vsrDebtLimitLock });
                        flash(`VSR credit gate ${!preferences.vsrDebtLimitLock ? "enabled" : "disabled"}`);
                      }}
                      aria-label="Toggle VSR credit gate"
                    >
                      <i />
                    </button>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Mandatory Leave Relief Staff Assignment</strong>
                      <span>Require supervisors to select an active relief merchandiser before approving field leaves.</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.requireLeaveRelief ? "active" : ""}`}
                      onClick={() => {
                        updatePreferences({ requireLeaveRelief: !preferences.requireLeaveRelief });
                        flash(`Leave relief rule ${!preferences.requireLeaveRelief ? "enabled" : "disabled"}`);
                      }}
                      aria-label="Toggle leave relief requirement"
                    >
                      <i />
                    </button>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>GPS Geofence Validation (Strict 50m Radius)</strong>
                      <span>Enforce strict 50m proximity (vs 150m standard) for store check-ins to prevent off-site GPS spoofing.</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.strictGpsRadius ? "active" : ""}`}
                      onClick={() => {
                        updatePreferences({ strictGpsRadius: !preferences.strictGpsRadius });
                        flash(`Strict GPS check-in ${!preferences.strictGpsRadius ? "enabled" : "disabled"}`);
                      }}
                      aria-label="Toggle strict GPS"
                    >
                      <i />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Regional & Localization */}
            {settingsTab === "regional" && (
              <div className="settings-tab-content">
                <div className="settings-group">
                  <p className="settings-group-title">Localization & Regional Defaults</p>
                  
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Default Territory Focus on Login</strong>
                      <span>Default region filter applied when opening surveillance dashboards.</span>
                    </div>
                    <select
                      value={preferences.defaultRegion}
                      onChange={(e) => {
                        updatePreferences({ defaultRegion: e.target.value });
                        flash(`Default region set to ${e.target.value}`);
                      }}
                      style={{
                        padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)",
                        background: "var(--card)", color: "var(--text)", fontSize: 11, fontWeight: 600
                      }}
                    >
                      <option value="all">All Nigeria (Global)</option>
                      <option value="Lagos">Lagos Metro (Central & West)</option>
                      <option value="Ogun">Ogun Hub (Abeokuta & Sagamu)</option>
                      <option value="Delta">Delta Axis (Asaba & Warri)</option>
                      <option value="Oyo">Oyo Region (Ibadan Metro)</option>
                      <option value="Enugu">Enugu Metro (North & South)</option>
                    </select>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Currency Symbol Format</strong>
                      <span>Display format for funding amounts, VSR loan surveillance balances, and sales figures.</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className={`secondary ${preferences.currencyFormat === "symbol" ? "primary" : ""}`}
                        style={{ height: 30, fontSize: 11, padding: "0 10px" }}
                        onClick={() => {
                          updatePreferences({ currencyFormat: "symbol" });
                          flash("Currency format: ₦ (Naira Symbol)");
                        }}
                      >
                        ₦ (Symbol)
                      </button>
                      <button
                        type="button"
                        className={`secondary ${preferences.currencyFormat === "code" ? "primary" : ""}`}
                        style={{ height: 30, fontSize: 11, padding: "0 10px" }}
                        onClick={() => {
                          updatePreferences({ currencyFormat: "code" });
                          flash("Currency format: NGN (ISO)");
                        }}
                      >
                        NGN (Code)
                      </button>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Calendar Date Format</strong>
                      <span>Standard date formatting across visit logs, audit trails, and leave trackers.</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className={`secondary ${preferences.dateFormat === "DD/MM/YYYY" ? "primary" : ""}`}
                        style={{ height: 30, fontSize: 11, padding: "0 10px" }}
                        onClick={() => {
                          updatePreferences({ dateFormat: "DD/MM/YYYY" });
                          flash("Date format: DD/MM/YYYY");
                        }}
                      >
                        DD/MM/YYYY
                      </button>
                      <button
                        type="button"
                        className={`secondary ${preferences.dateFormat === "YYYY-MM-DD" ? "primary" : ""}`}
                        style={{ height: 30, fontSize: 11, padding: "0 10px" }}
                        onClick={() => {
                          updatePreferences({ dateFormat: "YYYY-MM-DD" });
                          flash("Date format: YYYY-MM-DD");
                        }}
                      >
                        YYYY-MM-DD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Security & Session */}
            {settingsTab === "security" && (
              <div className="settings-tab-content">
                <div className="settings-group">
                  <p className="settings-group-title">Authentication & Executive Security</p>
                  
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>2-Factor Authentication (2FA) for High-Value Capital Approvals</strong>
                      <span>Require security passkey confirmation for disbursements exceeding ₦200,000.</span>
                    </div>
                    <button
                      type="button"
                      className={`settings-toggle ${preferences.twoFactorApprovals ? "active" : ""}`}
                      onClick={() => {
                        updatePreferences({ twoFactorApprovals: !preferences.twoFactorApprovals });
                        flash(`2FA for high-value approvals ${!preferences.twoFactorApprovals ? "enabled" : "disabled"}`);
                      }}
                      aria-label="Toggle 2FA"
                    >
                      <i />
                    </button>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Executive Session Inactivity Timeout</strong>
                      <span>Automatically locks console after period of administrative inactivity.</span>
                    </div>
                    <select
                      value={preferences.sessionTimeoutMinutes}
                      onChange={(e) => {
                        const mins = Number(e.target.value);
                        updatePreferences({ sessionTimeoutMinutes: mins });
                        flash(`Session timeout set to ${mins} minutes`);
                      }}
                      style={{
                        padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)",
                        background: "var(--card)", color: "var(--text)", fontSize: 11, fontWeight: 600
                      }}
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={240}>4 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="settings-group">
                  <p className="settings-group-title">Diagnostics & Cache</p>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <strong>Purge Local Offline Cache</strong>
                      <span>Clear local storage cache and force refresh all real-time field operations datasets.</span>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
                      onClick={() => {
                        resetPreferences();
                        flash("Local cache cleared & default preferences restored");
                      }}
                    >
                      <RefreshCw size={13} /> Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="modal-actions" style={{ padding: "12px 18px", borderTop: "1px solid var(--line)" }}>
              <button type="button" className="secondary" onClick={() => setPanel(null)}>
                Close Settings
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setPanel(null);
                  flash("All system settings saved and active");
                }}
              >
                Save & Apply
              </button>
            </div>
          </section>
        </div>
      )}

      {panel === "profile" && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Administrator profile">
            <div className="modal-head"><div><small>KEA OPERATIONS</small><h2>Administrator profile</h2></div><button type="button" onClick={() => setPanel(null)} aria-label="Close panel"><X size={19} /></button></div>
            <div className="modal-body">
              <div className="profile-summary"><div className="user-avatar">KA</div><div><b>KEA Administrator</b><span>Operations · Full access</span></div></div>
              <button type="button" className="modal-row" onClick={() => setPanel("settings")}><Settings size={17} /><span><b>Display preferences</b><small>Theme and dashboard appearance</small></span><ChevronRight size={16} /></button>
              <button type="button" className="modal-row" onClick={() => { setPanel(null); flash("Profile is up to date"); }}><UserRound size={17} /><span><b>Review profile</b><small>Account details and access role</small></span><ChevronRight size={16} /></button>
              <button type="button" className="modal-row danger" onClick={() => void signOut()}><LogOut size={17} /><span><b>Sign out</b><small>End this session and return to login</small></span><ChevronRight size={16} /></button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
