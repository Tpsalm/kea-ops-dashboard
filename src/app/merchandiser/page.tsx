"use client";

export const dynamic = "force-dynamic";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Bell, Camera, CheckCircle2, ChevronDown, Home, Layers, LogOut, Menu,
  Moon, MoreHorizontal, PackageCheck, Presentation, Search, Settings, Store, Sun,
  Target, TrendingDown, TrendingUp, Users, X, Building2,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { staff } from "../data";
import { activities, getProductsByMerchandiser, getStoresByMerchandiser, products } from "../hierarchy-data";
import { FadeIn, SelectBox } from "../shared";
import { KpiCard, Magnetic, TiltCard, premiumEase } from "../motion-components";
import { useGsapInView } from "../use-gsap";
import { FieldHero } from "../../components/field-hero";
import { ScrollProgress } from "../../components/motion-primitives/scroll-progress";
import { AnimatedNumber } from "../../components/motion-primitives/animated-number";
import { Badge } from "../../components/ui/badge";

type PageKey = "home" | "stores" | "shelf" | "posm" | "products" | "photos" | "settings";

const navItems: { key: PageKey; label: string; icon: typeof Store }[] = [
  { key: "home", label: "Dashboard", icon: Home },
  { key: "stores", label: "Assigned stores", icon: Store },
  { key: "shelf", label: "Share of shelf log", icon: Layers },
  { key: "posm", label: "POSM deployment", icon: Presentation },
  { key: "products", label: "Product list", icon: PackageCheck },
  { key: "photos", label: "Activity photos", icon: Camera },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "DASHBOARD", subtitle: "Your stores, share of shelf, tasks and target progress at a glance." },
  stores: { title: "ASSIGNED STORES", subtitle: "Your retail outlets, coverage and execution health." },
  shelf: { title: "SHARE OF SHELF LOG", subtitle: "Shelf visibility and product availability share per store." },
  posm: { title: "POSM DEPLOYMENT", subtitle: "Point-of-sale material placement across your stores." },
  products: { title: "PRODUCT LIST", subtitle: "SKUs, stock levels and availability for your outlets." },
  photos: { title: "ACTIVITY PHOTOS", subtitle: "Field evidence captured during store visits." },
  settings: { title: "SETTINGS", subtitle: "Profile, preferences, theme and security." },
};

const posmItems = ["Shelf talkers", "Brand posters", "Wobblers", "Standees", "Price cards", "Gondola branding"];

export default function MerchandiserDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [merchandiserId, setMerchandiserId] = useState("KEA-MER-001");
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [posm, setPosm] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState({ daily: true, alerts: true });
  const [period, setPeriod] = useState("This month");
  const [region, setRegion] = useState("My region");

  const shelfTrend = [
    { label: "Wk 24", share: 78 }, { label: "Wk 25", share: 82 },
    { label: "Wk 26", share: 80 }, { label: "Wk 27", share: 86 },
    { label: "Wk 28", share: 85 }, { label: "Wk 29", share: 90 },
  ];

  const merchandisers = useMemo(() => staff.filter((person) => person.role === "Merchandiser"), []);
  const myStores = useMemo(() => getStoresByMerchandiser(merchandiserId), [merchandiserId]);
  const myProducts = useMemo(() => getProductsByMerchandiser(merchandiserId), [merchandiserId]);
  const myActivities = useMemo(() => activities.filter((activity) => activity.staffId === merchandiserId), [merchandiserId]);

  const healthyStores = myStores.filter((store) => store.status === "Healthy").length;
  const totalSkus = myProducts.length;
  const lowStockSkus = myProducts.filter((product) => product.availability === "Low stock" || product.availability === "Out of stock").length;
  const photosCount = myActivities.reduce((sum, activity) => sum + (activity.photos?.length ?? 0), 0);
  const me = useMemo(() => merchandisers.find((person) => person.id === merchandiserId) ?? merchandisers[0], [merchandisers, merchandiserId]);
  const posmTarget = posmItems.length;

  const shelfLog = useMemo(() => myStores.map((store) => {
    const storeProducts = products.filter((product) => product.storeId === store.id);
    const inStockCount = storeProducts.filter((product) => product.availability === "In stock").length;
    const share = storeProducts.length ? Math.round((inStockCount / storeProducts.length) * 100) : 0;
    return { store, total: storeProducts.length, inStock: inStockCount, share };
  }), [myStores]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    return myProducts.filter((product) => {
      const categoryMatch = category === "All categories" || product.category === category;
      const queryMatch = !query || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query);
      return categoryMatch && queryMatch;
    });
  }, [myProducts, search, category]);

  const photoEntries = useMemo(() => myActivities
    .filter((activity) => activity.photos && activity.photos.length > 0)
    .flatMap((activity) => (activity.photos ?? []).map((photo) => ({ photo, activity }))), [myActivities]);

  const categories = ["All categories", ...Array.from(new Set(myProducts.map((product) => product.category)))];
  const posmDone = Object.values(posm).filter(Boolean).length;
  const posmPct = Math.round((posmDone / posmItems.length) * 100);

  function togglePosm(id: string) {
    setPosm((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function signOut() {
    try {
      localStorage.removeItem("kea_user");
      localStorage.removeItem("kea_merch_posm");
    } catch {
      // storage unavailable
    }
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  /* GSAP scroll-driven reveal for the dashboard home section */
  const homeRef = useGsapInView<HTMLDivElement>(({ gsap }, scope) => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>("[data-kx-reveal]");
      targets.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
          }
        );
      });
    }, scope);
    return () => ctx.revert();
  });

  function savePosm() {
    try {
      localStorage.setItem("kea_merch_posm", JSON.stringify(posm));
    } catch {
      // storage unavailable
    }
    alert(`POSM deployment saved — ${posmDone} of ${posmItems.length} materials deployed.`);
  }

  return (
    <div className={dark ? "merch-reference dark" : "merch-reference"}>
      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>Merchandiser Console</small>
          <button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <motion.button
              type="button"
              key={key}
              className={activePage === key ? "active" : ""}
              onClick={() => { setActivePage(key); setMobileNav(false); setSearch(""); }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Icon size={15} /> {label}
            </motion.button>
          ))}
        </nav>
        <button className="reference-settings" type="button" onClick={signOut}><LogOut size={15} /> Sign out</button>
      </aside>

      <main className="reference-main">
        <header className="reference-topbar">
          <button className="reference-menu" type="button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <span className="vsr-page-title">{pageTitles[activePage].title}</span>
          <div className="reference-actions">
            <button type="button" aria-label="Notifications"><Bell size={15} /></button>
            <span>MD</span>
          </div>
        </header>

        <div className="reference-content">
          <ScrollProgress className="fixed top-0 left-0 right-0 z-[60]" />

          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Aug 31, 2026</span>
          </div>

          <div style={{ marginBottom: 10, maxWidth: 240 }}>
            <MerchandiserSelect value={merchandiserId} options={merchandisers} onChange={setMerchandiserId} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: premiumEase }}
            >
          {activePage === "home" && (
            <>
              <div className="page-admin page-merchandiser" ref={homeRef} style={{ padding: "28px 30px", display: "grid", gap: 22 }}>
                <FieldHero
                  eyebrow="MERCHANDISER OVERVIEW"
                  title={<>Welcome back, {me?.name}</>}
                  subtitle={`Merchandiser · ${me?.territory}, ${me?.region} — your stores, share of shelf and execution snapshot.`}
                  badge="Live"
                  variant="morph"
                  colors={["#c2410c", "#ea580c", "#f58220", "#9a3412"]}
                  stat={
                    <Magnetic strength={0.12}>
                      <Badge variant="success">
                        <AnimatedNumber value={myStores.length} /> stores
                      </Badge>
                    </Magnetic>
                  }
                />

                <div className="filters" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <SelectBox label="Period" value={period} onChange={setPeriod} options={["This week", "This month", "This quarter"]} />
                  <SelectBox label="Region" value={region} onChange={setRegion} options={["My region", me?.region, me?.territory]} />
                </div>

                <div className="kx-kpi-grid" data-kx-reveal>
                  {[
                    { label: "Assigned stores", value: String(myStores.length), trend: `${healthyStores} healthy`, up: true, sub: "my outlets", icon: Store, tone: "teal" },
                    { label: "Total SKUs", value: String(totalSkus), trend: "across stores", up: true, sub: "assigned", icon: PackageCheck, tone: "blue" },
                    { label: "Avg completion", value: `${me?.completion ?? 0}%`, trend: "this period", up: (me?.completion ?? 0) >= 90, sub: "target 90%", icon: Target, tone: "violet" },
                    { label: "Visits", value: String(me?.visits ?? 0), trend: "store visits", up: true, sub: "completed", icon: Building2, tone: "amber" },
                    { label: "Low / out of stock", value: String(lowStockSkus), trend: "review", up: false, sub: "SKUs needing action", icon: AlertTriangle, tone: "amber" },
                    { label: "POSM deployed", value: `${posmDone} / ${posmTarget}`, trend: `${posmPct}%`, up: posmPct >= 100, sub: "complete", icon: Presentation, tone: "teal" },
                  ].map((item, i) => (
                    <TiltCard key={item.label} intensity={5} style={{ borderRadius: 18 }}>
                      <KpiCard item={item} index={i} />
                    </TiltCard>
                  ))}
                </div>

                <FadeIn delay={0.05} className="charts-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                  <div className="card">
                    <div className="card-head"><div><h3>Share of shelf trend</h3><p>Average in-stock visibility across your stores over time</p></div></div>
                    <div style={{ height: 240, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={shelfTrend}>
                          <defs>
                            <linearGradient id="gShare" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9a3412" stopOpacity={0.35} /><stop offset="95%" stopColor="#9a3412" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} width={32} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                          <Area type="monotone" dataKey="share" name="Shelf share %" stroke="#9a3412" strokeWidth={2.5} fill="url(#gShare)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><h3>Stock availability</h3><p>Product availability mix across your stores</p></div></div>
                    <div style={{ height: 240, marginTop: 8, position: "relative" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[
                            { name: "In stock", value: myProducts.filter((p) => p.availability === "In stock").length, color: "#16a34a" },
                            { name: "Low / out", value: lowStockSkus, color: "#f59e0b" },
                          ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                            {[{ name: "In stock", value: myProducts.filter((p) => p.availability === "In stock").length, color: "#16a34a" }, { name: "Low / out", value: lowStockSkus, color: "#f59e0b" }].map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <b style={{ fontSize: 26 }}>{totalSkus}</b><span style={{ fontSize: 11, color: "var(--muted)" }}>total SKUs</span>
                      </div>
                    </div>
                    <div className="legend" style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 11 }}>
                      <span><i style={{ width: 9, height: 9, borderRadius: 3, background: "#16a34a", display: "inline-block" }} />In stock · {myProducts.filter((p) => p.availability === "In stock").length}</span>
                      <span><i style={{ width: 9, height: 9, borderRadius: 3, background: "#f59e0b", display: "inline-block" }} />Low / out · {lowStockSkus}</span>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1} className="charts-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div className="card">
                    <div className="card-head"><div><h3>Shelf share by store</h3><p>In-stock visibility across your outlets</p></div></div>
                    <div style={{ height: 220, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={shelfLog.map((item) => ({ name: item.store.name.split(" ")[0], share: item.share }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8a9499" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} width={32} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                          <Bar dataKey="share" name="Shelf share %" radius={[6, 6, 0, 0]} fill="#9a3412" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><h3>Task status</h3><p>POSM and store execution health</p></div></div>
                    <div style={{ height: 220, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "Store health", value: Math.round((healthyStores / Math.max(1, myStores.length)) * 100) },
                          { name: "POSM done", value: posmPct },
                          { name: "Completion", value: me?.completion ?? 0 },
                          { name: "Shelf share", value: shelfLog.length ? Math.round(shelfLog.reduce((s, i) => s + i.share, 0) / shelfLog.length) : 0 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eceff0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8a9499" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#8a9499" }} axisLine={false} tickLine={false} width={32} domain={[0, 100]} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e9e8", fontSize: 12 }} />
                          <Bar dataKey="value" name="%" radius={[6, 6, 0, 0]} fill="#0d9488" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.15} className="card">
                  <div className="card-head"><div><h3>Target progress</h3><p>Completion against the 90% execution target</p></div><Target size={16} /></div>
                  <div style={{ padding: 16 }}>
                    <div style={{ height: 12, background: "#eef1ef", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, me?.completion ?? 0)}%`, background: (me?.completion ?? 0) >= 90 ? "#16a34a" : "#f59e0b", borderRadius: 6 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
                      <span>{me?.completion ?? 0}% completion</span>
                      <span>{((me?.completion ?? 0) >= 90) ? "On track" : "Below target"}</span>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </>
          )}

          {activePage === "stores" && (
            <>
              <section className="reference-kpis">
                <article><span>Assigned stores <MoreHorizontal size={14} /></span><b>{myStores.length}</b><small>my outlets</small></article>
                <article><span>Healthy stores <MoreHorizontal size={14} /></span><b>{healthyStores}</b><small>execution health</small></article>
                <article><span>Total SKUs <MoreHorizontal size={14} /></span><b>{totalSkus}</b><small>across stores</small></article>
                <article><span>Low / out of stock <MoreHorizontal size={14} /></span><b>{lowStockSkus}</b><small>needs attention</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>My assigned stores</h2><p>Retail outlets under your merchandising coverage</p></div><Store size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Store</th><th>Address</th><th>Region</th><th>Territory</th><th>Products</th><th>Status</th></tr></thead>
                    <tbody>
                      {myStores.map((store) => {
                        const count = products.filter((product) => product.storeId === store.id).length;
                        return (
                          <tr key={store.id}>
                            <td data-label="Store"><b>{store.name}</b></td>
                            <td data-label="Address">{store.address}</td>
                            <td data-label="Region">{store.region}</td>
                            <td data-label="Territory">{store.territory}</td>
                            <td data-label="Products">{count}</td>
                            <td data-label="Status"><span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}><i />{store.status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "shelf" && (
            <>
              <section className="reference-kpis">
                <article><span>Stores tracked <MoreHorizontal size={14} /></span><b>{shelfLog.length}</b><small>shelf share</small></article>
                <article><span>Avg shelf share <MoreHorizontal size={14} /></span><b>{shelfLog.length ? Math.round(shelfLog.reduce((sum, item) => sum + item.share, 0) / shelfLog.length) : 0}%</b><small>in-stock SKUs</small></article>
                <article><span>Full shelves <MoreHorizontal size={14} /></span><b>{shelfLog.filter((item) => item.share === 100).length}</b><small>100% in stock</small></article>
                <article><span>Needs restock <MoreHorizontal size={14} /></span><b>{shelfLog.filter((item) => item.share < 100).length}</b><small>below full share</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Share of shelf by store</h2><p>Proportion of assigned SKUs currently in stock and visible</p></div><Layers size={16} /></header>
                <div className="vsr-target-list">
                  {shelfLog.map(({ store, total, inStock, share }) => (
                    <div key={store.id} className="vsr-target-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <b style={{ fontSize: 12 }}>{store.name}</b>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{inStock}/{total} SKUs in stock</span>
                        </div>
                        <div style={{ height: 9, background: "#eef1ef", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                          <div style={{ height: "100%", width: `${share}%`, background: share === 100 ? "#12a472" : "#f59e0b", borderRadius: 5 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: share === 100 ? "#0c9b6b" : "#d8900b" }}>{share}%</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activePage === "posm" && (
            <>
              <section className="reference-kpis">
                <article><span>Materials deployed <MoreHorizontal size={14} /></span><b>{posmDone} / {posmItems.length}</b><small>{posmPct}% complete</small></article>
                <article><span>Deployment status <MoreHorizontal size={14} /></span><b>{posmPct === 100 ? "Complete" : "In progress"}</b><small>POSM placement</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>POSM deployment checklist</h2><p>Mark each material once placed in your stores</p></div><Presentation size={16} /></header>
                <div className="vsr-check-list">
                  {posmItems.map((item) => (
                    <button type="button" key={item} className={posm[item] ? "checked" : ""} onClick={() => togglePosm(item)}>
                      <span><i>{posm[item] ? <CheckCircle2 size={15} /> : <i className="dot" />}</i>{item}</span>
                      {posm[item] ? "Deployed" : "Pending"}
                    </button>
                  ))}
                </div>
                <div className="vsr-check-actions">
                  <button type="button" onClick={savePosm} style={{ background: "#c2410c", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", fontWeight: 700, fontSize: 11 }}>
                    <CheckCircle2 size={14} /> Save deployment
                  </button>
                </div>
              </section>
            </>
          )}

          {activePage === "products" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <div className="reference-search" style={{ flex: 1, minWidth: 200 }}>
                  <Search size={13} /><input placeholder="Search SKU, product, category..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
                <label className="admin-select" style={{ minWidth: 180 }}>
                  <span>CATEGORY</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown size={13} />
                </label>
              </div>
              <section className="reference-kpis">
                <article><span>Total SKUs <MoreHorizontal size={14} /></span><b>{myProducts.length}</b><small>assigned</small></article>
                <article><span>In stock <MoreHorizontal size={14} /></span><b>{myProducts.filter((product) => product.availability === "In stock").length}</b><small>healthy</small></article>
                <article><span>Low stock <MoreHorizontal size={14} /></span><b>{myProducts.filter((product) => product.availability === "Low stock").length}</b><small>reorder</small></article>
                <article><span>Out of stock <MoreHorizontal size={14} /></span><b>{myProducts.filter((product) => product.availability === "Out of stock").length}</b><small>urgent</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Product list</h2><p>SKUs and availability for your stores</p></div><PackageCheck size={16} /></header>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Units</th><th>Availability</th><th>Last updated</th></tr></thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td data-label="SKU"><code>{product.sku}</code></td>
                          <td data-label="Product"><b>{product.name}</b></td>
                          <td data-label="Category">{product.category}</td>
                          <td data-label="Units">{product.quantity ?? 0}</td>
                          <td data-label="Availability">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 5, padding: "3px 9px", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", color: product.availability === "In stock" ? "#0b3b2c" : product.availability === "Low stock" ? "#7a4a00" : "#991b1b", background: product.availability === "In stock" ? "#c8f3d1" : product.availability === "Low stock" ? "#f6d7a5" : "#fbdcdc" }}>
                              {product.availability}
                            </span>
                          </td>
                          <td data-label="Last updated">{product.lastUpdated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === "photos" && (
            <>
              <section className="reference-kpis">
                <article><span>Activities logged <MoreHorizontal size={14} /></span><b>{myActivities.length}</b><small>store visits</small></article>
                <article><span>Photos captured <MoreHorizontal size={14} /></span><b>{photosCount}</b><small>field evidence</small></article>
              </section>
              <section className="admin-panel">
                <header><div><h2>Activity photos</h2><p>Evidence captured during your store visits</p></div><Camera size={16} /></header>
                <div className="merch-photo-grid">
                  {photoEntries.map(({ photo, activity }, index) => (
                    <figure key={`${activity.id}-${index}`}>
                      <img src={photo} alt={`${activity.type} evidence`} loading="lazy" />
                      <figcaption><b>{activity.type}</b><small>{activity.storeName ?? "Store"} · {activity.date}</small></figcaption>
                    </figure>
                  ))}
                  {photoEntries.length === 0 && <div className="empty"><Camera size={24} /><b>No photos yet</b><span>Complete store visits to capture evidence.</span></div>}
                </div>
              </section>
            </>
          )}

          {activePage === "settings" && (
            <>
              <section className="admin-panel">
                <header><div><h2>Profile</h2><p>Your account details</p></div><Users size={16} /></header>
                <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>MD</div>
                  <div><b style={{ fontSize: 14 }}>Toluwaleni Adio</b><br /><small style={{ color: "var(--muted)" }}>Merchandiser · Lagos Central · Justrite</small></div>
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>Preferences</h2><p>Theme and notifications</p></div></header>
                <div className="vsr-settings-list">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{dark ? <Moon size={15} /> : <Sun size={15} />} Dark mode</span>
                    <button type="button" className={dark ? "vsr-toggle on" : "vsr-toggle"} onClick={() => setDark(!dark)} aria-label="Toggle dark mode"><i /></button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><Bell size={15} /> Daily store reminders</span>
                    <button type="button" className={notifications.daily ? "vsr-toggle on" : "vsr-toggle"} onClick={() => setNotifications((n) => ({ ...n, daily: !n.daily }))} aria-label="Toggle daily reminders"><i /></button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><AlertTriangle size={15} /> Stock & availability alerts</span>
                    <button type="button" className={notifications.alerts ? "vsr-toggle on" : "vsr-toggle"} onClick={() => setNotifications((n) => ({ ...n, alerts: !n.alerts }))} aria-label="Toggle alerts"><i /></button>
                  </div>
                </div>
              </section>
              <section className="admin-panel">
                <header><div><h2>Security</h2><p>Session and account access</p></div></header>
                <div style={{ padding: 14 }}>
                  <button type="button" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#b42318", color: "#fff", border: "none", borderRadius: 6, padding: "11px 16px", fontWeight: 700, fontSize: 11, cursor: "pointer" }} onClick={signOut}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </section>
            </>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function MerchandiserSelect({ value, options, onChange }: { value: string; options: { id: string; name: string }[]; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <label className="admin-select" style={{ width: "100%" }} htmlFor={id}>
      <span>MERCHANDISER</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
      <ChevronDown size={13} />
    </label>
  );
}
