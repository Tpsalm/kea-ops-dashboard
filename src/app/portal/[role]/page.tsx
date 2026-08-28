"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, MapPin, PackageCheck, Route, Store, Users, UserPlus, CheckCircle2, Navigation, BarChart3 } from "lucide-react";
import { AppShell } from "../../../components/app-shell";
import useAuth, { type AppRole } from "../../../lib/useAuth";

const roleCopy: Record<AppRole, { title: string; subtitle: string; focus: string; icon: typeof Users }> = {
  "super-admin": { title: "Super Admin control centre", subtitle: "Authorise divisions, accounts, and new outlet requests.", focus: "Governance & approvals", icon: Users },
  vsr: { title: "VSR workspace", subtitle: "Stay on top of routes, visits, and store coverage.", focus: "My route execution", icon: Route },
  supervisor: { title: "Supervisor workspace", subtitle: "Coordinate teams, approvals, and territory performance.", focus: "Team performance", icon: Users },
  "field-team": { title: "Merchandiser & TSR workspace", subtitle: "Capture store execution, products, and daily activity.", focus: "Today's field work", icon: Store },
};

function RoleContent({ role, copy, user, navigate }: { role: AppRole; copy: typeof roleCopy[AppRole]; user: { name: string; email: string }; navigate: (path: string) => void }) {
  if (role === "super-admin") return <><section className="portal-hero"><div className="eyebrow"><span className="live-dot" /> SUPER ADMIN ACCESS</div><h1>{copy.title}</h1><p>{copy.subtitle}</p><span className="portal-user">Signed in as {user.name} · {user.email}</span></section><section className="admin-action-grid"><button className="admin-action" onClick={() => navigate("/hierarchy")}><UserPlus size={23} /><b>Authorise accounts</b><span>Review division access and staff onboarding requests.</span></button><button className="admin-action" onClick={() => navigate("/stores")}><Store size={23} /><b>Approve new outlets</b><span>Review outlet creation, territory, and client assignments.</span></button><button className="admin-action" onClick={() => navigate("/audit-trail")}><CheckCircle2 size={23} /><b>Audit decisions</b><span>Trace approvals, changes, and account activity.</span></button></section></>;
  if (role === "vsr") return <><section className="portal-hero"><div className="eyebrow"><span className="live-dot" /> VSR ACCESS</div><h1>{copy.title}</h1><p>{copy.subtitle}</p><span className="portal-user">Signed in as {user.name} · {user.email}</span></section><section className="portal-workspace-grid"><article className="portal-focus"><Navigation size={24} /><small>ROUTE BOARD</small><h2>Today&apos;s route</h2><p>8 assigned stores · 6 visits completed · 2 remaining.</p><button className="primary" onClick={() => navigate("/live-map")}>Open live route</button></article><article className="portal-focus"><ClipboardCheck size={24} /><small>VSR STATUS</small><h2>Deployed · funded</h2><p>Route funding is approved. Submit visit outcomes, photos, and coverage evidence from the field.</p><button className="secondary" onClick={() => navigate("/activities")}>View activities</button></article></section></>;
  if (role === "supervisor") return <><section className="portal-hero"><div className="eyebrow"><span className="live-dot" /> SUPERVISOR ACCESS</div><h1>{copy.title}</h1><p>{copy.subtitle}</p><span className="portal-user">Signed in as {user.name} · {user.email}</span></section><section className="portal-workspace-grid"><article className="portal-focus"><Users size={24} /><small>TEAM PULSE</small><h2>12 direct reports</h2><p>89% average completion across Lagos Central and Lagos East.</p><button className="primary" onClick={() => navigate("/workforce")}>Review team</button></article><article className="portal-focus"><BarChart3 size={24} /><small>APPROVAL QUEUE</small><h2>5 items need review</h2><p>Approve attendance exceptions, route changes, outlet requests, and team deployment.</p><button className="secondary" onClick={() => navigate("/performance")}>Open performance</button></article></section></>;
  return <><section className="portal-hero"><div className="eyebrow"><span className="live-dot" /> MERCHANDISER / TSR ACCESS</div><h1>{copy.title}</h1><p>{copy.subtitle}</p><span className="portal-user">Signed in as {user.name} · {user.email}</span></section><section className="portal-workspace-grid"><article className="portal-focus"><Store size={24} /><small>STORE EXECUTION</small><h2>34 stores assigned</h2><p>Update stock counts, pricing, visibility, outlet notes, and daily sales observations.</p><button className="primary" onClick={() => navigate("/stores")}>Open store board</button></article><article className="portal-focus"><PackageCheck size={24} /><small>PRODUCT MONITORING</small><h2>7 products below target</h2><p>Review availability, record visit timestamps, and submit product observations for today.</p><button className="secondary" onClick={() => navigate("/activities")}>Log activity</button></article></section></>;
}

export default function RolePortalPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const role = (params.role in roleCopy ? params.role : "field-team") as AppRole;
  const copy = roleCopy[role];
  const Icon = copy.icon;

  if (loading) return <main className="auth-loading">Loading secure workspace...</main>;
  if (!user) { router.replace("/login"); return <main className="auth-loading">Redirecting to sign in...</main>; }
  if (user.role !== "super-admin" && user.role !== role) return <main className="auth-loading">This role dashboard is not assigned to your account.</main>;

  return <AppShell contentClassName={`role-portal role-${role}`}><div className="portal-top"><button className="back-link" onClick={() => { signOut(); router.push("/login"); }}><ArrowLeft size={15} /> Sign out</button></div><RoleContent role={role} copy={copy} user={user} navigate={(path) => router.push(path)} /></AppShell>;
}
