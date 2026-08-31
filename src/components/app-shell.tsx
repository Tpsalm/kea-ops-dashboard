"use client";

// Shared application chrome (sidebar + topbar + notifications + toast + modals)
// used by every dedicated tab page so navigation is consistent across routes.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, CheckCircle2, ChevronRight, Database, FileText, LayoutDashboard, Map, Menu, Moon,
  MoreHorizontal, Network, PackageCheck, Search, Settings, ShieldCheck, Store, Sun, UserRound, Users, X,
} from "lucide-react";
import { NAV } from "../app/data";
import useAuth from "../lib/useAuth";

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
  const { user, loading } = useAuth();
  const superAdminNav = [
    { label: "Global performance", path: "/admin", icon: LayoutDashboard },
    { label: "Users & roles", path: "/hierarchy", icon: Users },
    { label: "Territories & routes", path: "/live-map", icon: Map },
    { label: "API integrations", path: "/reports", icon: Network },
    { label: "Funding & deployment", path: "/vsr-operations", icon: Store },
    { label: "Merchandising", path: "/merchandiser", icon: PackageCheck },
    { label: "System logs", path: "/system-logs", icon: Database },
    { label: "Audit trail", path: "/audit-trail", icon: FileText },
  ];
  const shellNav = user?.role === "super-admin" ? superAdminNav : NAV;
  const activeNav = shellNav.find((item) => item.path === pathname)?.label ?? "Overview";
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [panel, setPanel] = useState<null | "settings" | "profile" | "manage">(null);
  const [notice, setNotice] = useState("");

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  if (loading || !user) {
    if (!loading && !user) router.replace("/login");
    return <main className="auth-loading">Checking secure workspace...</main>;
  }

  return (
    <div className={`${dark ? "app dark" : "app"}${user.role === "super-admin" ? " super-admin-shell" : ""}`}>
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
        </nav>
        <nav className="manage">
          <p>MANAGE</p>
          <button type="button" onClick={() => { setPanel("manage"); setMobileNav(false); }}><ShieldCheck size={18} /><span>Data quality</span></button>
          <button type="button" onClick={() => { setPanel("settings"); setMobileNav(false); }}><Settings size={18} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-foot"><div className="user-avatar">KA</div><div><b>KEA Administrator</b><span>Operations · Full access</span></div><MoreHorizontal size={18} /></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button type="button" className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="top-search"><Search size={17} /><input id="global-search" placeholder="Search people, stores, routes..." value={searchValue} onChange={(e) => onSearch?.(e.target.value)} /><kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <button type="button" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button type="button" className="bell" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Open notifications"><Bell size={19} /><i /></button>
            <button type="button" className="user-avatar small profile-button" onClick={() => setPanel("profile")} aria-label="Open profile">KA</button>
          </div>
          {notificationsOpen && (
            <div className="notification-popover">
              <div><b>Notifications</b><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={15} /></button></div>
              <p><span className="notice-dot" /> Lagos Central reached 92% coverage.</p>
              <p><span className="notice-dot teal" /> 142 stores were added this month.</p>
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

      {panel === "settings" && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Display settings">
            <div className="modal-head"><div><small>KEA OPERATIONS</small><h2>Display settings</h2></div><button type="button" onClick={() => setPanel(null)} aria-label="Close panel"><X size={19} /></button></div>
            <div className="modal-body">
              <p className="modal-label">COLOR THEME</p>
              <div className="theme-options">
                <button type="button" className={!dark ? "chosen" : ""} onClick={() => { setDark(false); flash("Light theme applied"); }}><Sun size={18} /> Light</button>
                <button type="button" className={dark ? "chosen" : ""} onClick={() => { setDark(true); flash("Dark theme applied"); }}><Moon size={18} /> Dark</button>
              </div>
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
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
