"use client";

export const dynamic = "force-dynamic";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Bell, Camera, CheckCircle2, ChevronDown, Home, Layers, LogOut, Menu,
  Moon, MoreHorizontal, PackageCheck, Presentation, Search, Settings, Store, Sun,
  Target, TrendingDown, TrendingUp, Users, X, Building2, Calendar, Send, Plus, Check,
  FileSpreadsheet, Download, UploadCloud, FileCheck, ExternalLink, ShieldCheck,
  MapPin, Maximize2, Eye, Tag, Filter, Sparkles, Image as ImageIcon
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { staff } from "../data";
import { activities, getProductsByMerchandiser, getStoresByMerchandiser, products } from "../hierarchy-data";
import { FadeIn, SelectBox } from "../shared";
import { FieldHero } from "../../components/field-hero";
import { ScrollProgress } from "../../components/motion-primitives/scroll-progress";
import { AnimatedNumber } from "../../components/motion-primitives/animated-number";
import { Badge } from "../../components/ui/badge";
import { ProfileSettingsModal } from "../../components/profile-settings-modal";
import { UrgentLoginModal } from "../../components/urgent-login-modal";
import { useTheme } from "../../lib/theme-provider";

type PageKey = "home" | "stores" | "leave" | "pod-upload" | "photos";

const navItems: { key: PageKey | "settings"; label: string; icon: any }[] = [
  { key: "home", label: "Overview", icon: Home },
  { key: "stores", label: "Assigned Stores", icon: Store },
  { key: "leave", label: "Leave Requests", icon: Calendar },
  { key: "pod-upload", label: "POD Tracker Upload", icon: FileSpreadsheet },
  { key: "photos", label: "Activity Photos", icon: Camera },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  home: { title: "MERCHANDISER DASHBOARD", subtitle: "Your stores, stock health, and target progress at a glance." },
  stores: { title: "ASSIGNED STORES & EXECUTION", subtitle: "Retail outlet inventory, stock checks, and instant stockout escalation to Supervisor." },
  leave: { title: "LEAVE APPLICATION & SCHEDULE", subtitle: "Submit scheduled leave requests with relief coverage directly to your Supervisor." },
  "pod-upload": { title: "POD TRACKER UPLOAD & TEMPLATE", subtitle: "Download the supervisor's official template and upload verified Proof of Delivery trackers." },
  photos: { title: "ACTIVITY PHOTOS & EVIDENCE", subtitle: "Capture, upload and geotag shelf audits, gondola displays, and retail store evidence." },
};

const posmItems = ["Shelf talkers", "Brand posters", "Wobblers", "Standees", "Price cards", "Gondola branding"];

export default function MerchandiserDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [merchandiserId, setMerchandiserId] = useState("KEA-MER-001");
  const [mobileNav, setMobileNav] = useState(false);
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Profile avatar & custom info state
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [userName, setUserName] = useState<string>("Maria Uchechukwu");
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);

  useEffect(() => {
    try {
      const isUrgentPending = sessionStorage.getItem("kea_urgent_login_alert");
      if (isUrgentPending === "true") {
        setUrgentModalOpen(true);
        sessionStorage.removeItem("kea_urgent_login_alert");
      } else {
        const sessionSeen = sessionStorage.getItem("kea_seen_alert_merchandiser");
        if (!sessionSeen) {
          setUrgentModalOpen(true);
          sessionStorage.setItem("kea_seen_alert_merchandiser", "true");
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    function loadProfile() {
      try {
        const av = localStorage.getItem("kea_merchandiser_avatar") || localStorage.getItem("kea_user_avatar");
        if (av) setUserAvatar(av);
        const name = localStorage.getItem("kea_merchandiser_name");
        if (name) setUserName(name);
      } catch {}
    }
    loadProfile();
    window.addEventListener("kea-avatar-updated", loadProfile);
    return () => window.removeEventListener("kea-avatar-updated", loadProfile);
  }, []);
  const [posm, setPosm] = useState<Record<string, boolean>>({
    "Shelf talkers": true,
    "Brand posters": true,
    "Price cards": true,
  });
  const [notice, setNotice] = useState("");

  // Leave application state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("Annual Scheduled Rest & Recovery");
  const [reliefStaff, setReliefStaff] = useState("Maria Uchechukwu");
  const [myLeaves, setMyLeaves] = useState<Array<{
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    reliefStaff: string;
    status: string;
  }>>([
    {
      id: "LV-2041",
      startDate: "2026-09-20",
      endDate: "2026-09-27",
      reason: "Annual field rotation leave",
      reliefStaff: "Arorundade Adewale",
      status: "Approved by Supervisor",
    },
  ]);

  // Stockout escalation state
  const [showStockoutModal, setShowStockoutModal] = useState(false);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [stockoutSku, setStockoutSku] = useState("");

  // POD Tracker Upload State
  const [podStoreId, setPodStoreId] = useState("OL-4001");
  const [podDeliveryRef, setPodDeliveryRef] = useState("WB-2026-09-842");
  const [podDate, setPodDate] = useState("2026-09-10");
  const [podNotes, setPodNotes] = useState("All 24 cartons received intact. Store manager confirmed and stamped receipt.");
  const [podFileName, setPodFileName] = useState("");
  const [isUploadingPod, setIsUploadingPod] = useState(false);
  const [myPodSubmissions, setMyPodSubmissions] = useState<Array<{
    id: string;
    storeName: string;
    storeId: string;
    deliveryRef: string;
    fileName: string;
    date: string;
    notes: string;
    status: string;
  }>>([
    {
      id: "POD-891",
      storeName: "Royal Prince Ikosi",
      storeId: "OL-4001",
      deliveryRef: "WB-2026-09-842",
      fileName: "RoyalPrince_POD_Signed_Sep10.xlsx",
      date: "2026-09-10 14:15",
      notes: "Full batch delivery confirmed. Zero damaged units.",
      status: "Received by Supervisor (Michael Olayiwola)",
    },
    {
      id: "POD-840",
      storeName: "Jendel Surulere",
      storeId: "OL-4002",
      deliveryRef: "WB-2026-09-771",
      fileName: "Jendel_POD_Tracker_Sep08.xlsx",
      date: "2026-09-08 11:30",
      notes: "18 cartons delivered. Stamped by receiving supervisor.",
      status: "Verified by Supervisor",
    },
  ]);

  // Activity Photos Upload & Gallery State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<string>("all");
  const [photoStoreId, setPhotoStoreId] = useState("OL-4005");
  const [photoCategory, setPhotoCategory] = useState("Gondola End Cap");
  const [photoNotes, setPhotoNotes] = useState("Primary eye-level shelf restocked. All SKUs facing forward, competitor brand pushed to lower tier.");
  const [photoGpsTag, setPhotoGpsTag] = useState("6.4369° N, 3.4819° E · Victoria Island");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>("https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80");
  const [selectedPhotoForPreview, setSelectedPhotoForPreview] = useState<any | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [myPhotos, setMyPhotos] = useState<Array<{
    id: string;
    storeName: string;
    storeId: string;
    category: string;
    date: string;
    time: string;
    url: string;
    gps: string;
    notes: string;
    status: string;
  }>>([
    {
      id: "PHT-941",
      storeName: "Ebeano Supermarket VI",
      storeId: "OL-4005",
      category: "Gondola End Cap",
      date: "Sep 10, 2026",
      time: "16:20",
      url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
      gps: "6.4369° N, 3.4819° E · Victoria Island",
      notes: "Primary eye-level gondola branding active. Full SKU facing verified with Store Manager.",
      status: "Verified & Geotagged",
    },
    {
      id: "PHT-920",
      storeName: "Grand Square Mall",
      storeId: "OL-4004",
      category: "Shelf Planogram Frontage",
      date: "Sep 09, 2026",
      time: "14:10",
      url: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80",
      gps: "6.4869° N, 3.4319° E · Maryland",
      notes: "100% shelf compliance. Competing brand restricted to bottom tier.",
      status: "Verified & Geotagged",
    },
    {
      id: "PHT-905",
      storeName: "Hubmart Mega VI",
      storeId: "OL-4005",
      category: "POSM & Brand Posters",
      date: "Sep 08, 2026",
      time: "11:45",
      url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80",
      gps: "6.4569° N, 3.4619° E · Lekki Axis",
      notes: "Standee placed at entrance lobby. Wobblers attached to dairy aisle.",
      status: "Verified & Geotagged",
    },
    {
      id: "PHT-884",
      storeName: "Royal Prince Ikosi",
      storeId: "OL-4001",
      category: "Stock Depletion Evidence",
      date: "Sep 07, 2026",
      time: "15:30",
      url: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80",
      gps: "6.5918° N, 3.3315° E · Ikeja Central",
      notes: "Pre-delivery stock level audit before unloading new waybill.",
      status: "Verified & Geotagged",
    },
  ]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  // Handle image file selection with preview
  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPhotoPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle Photo Evidence Upload Submission
  async function handlePhotoUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsUploadingPhoto(true);
    const selectedStore = myStores.find((s) => s.id === photoStoreId) || myStores[0];

    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "merchandiser_photo_audit",
          title: `Photo Audit: ${selectedStore?.name} (${photoCategory})`,
          fileUrl: photoPreviewUrl || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800",
          fileName: `Photo_${selectedStore?.name?.replace(/\s+/g, "_")}_${Date.now()}.jpg`,
          notes: photoNotes,
          metadata: {
            storeId: photoStoreId,
            storeName: selectedStore?.name,
            category: photoCategory,
            gps: photoGpsTag,
            merchandiserId,
            timestamp: new Date().toISOString(),
          }
        }),
      });
    } catch {
      // local fallback
    }

    const newPhoto = {
      id: `PHT-${Math.floor(100 + Math.random() * 900)}`,
      storeName: selectedStore?.name || "Retail Outlet",
      storeId: photoStoreId,
      category: photoCategory,
      date: "Sep 10, 2026",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      url: photoPreviewUrl || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800",
      gps: photoGpsTag || "6.4369° N, 3.4819° E · Lagos",
      notes: photoNotes,
      status: "Verified & Geotagged",
    };

    setMyPhotos([newPhoto, ...myPhotos]);
    setIsUploadingPhoto(false);
    setShowPhotoModal(false);
    flash(`Field photo audit for ${selectedStore?.name} uploaded! Geotagged & logged with Supervisor.`);
  }

  // Download official Supervisor POD Tracker Template
  function handleDownloadTemplate() {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Store_ID,Store_Name,Delivery_Waybill_Ref,Product_SKU,Quantity_Delivered_Cartons,Quantity_Accepted_Units,Discrepancy_Notes,Store_Manager_Name,Manager_Signature_Confirmed,GPS_Latitude,GPS_Longitude,Timestamp\n" +
      "OL-4001,Royal Prince Ikosi,WB-2026-09-842,KEA-MLK-400G,24,288,None,Alhaji Adeleke,YES,6.5918,3.3315,2026-09-10T14:15:00Z\n" +
      "OL-4002,Jendel Surulere,WB-2026-09-843,KEA-DET-1KG,18,216,None,Mrs. Okonkwo,YES,6.5369,3.3232,2026-09-10T15:30:00Z\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "KEA_Official_POD_Tracker_Template_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    flash("Official Supervisor POD Template downloaded! Fill and re-upload below.");
  }

  // Submit Completed POD Tracker with Instant Alert to Supervisor
  async function handlePodUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podStoreId || !podDeliveryRef) {
      flash("Please provide store and delivery reference!");
      return;
    }
    setIsUploadingPod(true);
    const selectedStore = myStores.find((s) => s.id === podStoreId) || myStores[0];
    const uploadedName = podFileName || `POD_${selectedStore?.name?.replace(/\s+/g, "_")}_${podDate}.xlsx`;

    try {
      // Send to backend API
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "merchandiser_pod",
          title: `POD Tracker: ${selectedStore?.name} (${podDeliveryRef})`,
          fileUrl: `https://storage.supabase.co/v1/object/public/documents/${Date.now()}_${uploadedName}`,
          fileName: uploadedName,
          notes: podNotes,
          metadata: {
            storeId: podStoreId,
            storeName: selectedStore?.name,
            deliveryRef: podDeliveryRef,
            merchandiserId,
            date: podDate,
          }
        }),
      });
    } catch {
      // continue for local responsiveness
    }

    const newSubmission = {
      id: `POD-${Math.floor(100 + Math.random() * 900)}`,
      storeName: selectedStore?.name || "Retail Outlet",
      storeId: podStoreId,
      deliveryRef: podDeliveryRef,
      fileName: uploadedName,
      date: `${podDate} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      notes: podNotes,
      status: "Received by Supervisor (Michael Olayiwola)",
    };

    setMyPodSubmissions([newSubmission, ...myPodSubmissions]);
    setIsUploadingPod(false);
    setPodFileName("");
    flash(`POD Tracker for ${selectedStore?.name} uploaded! Received instantly on Supervisor Dashboard.`);
  }

  const shelfTrend = [
    { label: "Wk 24", share: 78 }, { label: "Wk 25", share: 82 },
    { label: "Wk 26", share: 80 }, { label: "Wk 27", share: 86 },
    { label: "Wk 28", share: 85 }, { label: "Wk 29", share: 90 },
  ];

  const myStores = useMemo(() => getStoresByMerchandiser(merchandiserId), [merchandiserId]);
  const myProducts = useMemo(() => getProductsByMerchandiser(merchandiserId), [merchandiserId]);
  const myActivities = useMemo(() => activities.filter((activity) => activity.staffId === merchandiserId), [merchandiserId]);

  const healthyStores = myStores.filter((store) => store.status === "Healthy").length;
  const photosCount = myActivities.reduce((sum, activity) => sum + (activity.photos?.length ?? 0), 0);
  const posmDone = Object.values(posm).filter(Boolean).length;
  const posmPct = Math.round((posmDone / posmItems.length) * 100);

  function togglePosm(id: string) {
    setPosm((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      flash("Please select both start and end dates!");
      return;
    }
    const newLeave = {
      id: `LV-${Math.floor(1000 + Math.random() * 9000)}`,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      reliefStaff,
      status: "Pending Supervisor Review",
    };
    setMyLeaves([newLeave, ...myLeaves]);
    setShowLeaveModal(false);
    flash(`Leave request submitted for ${leaveStartDate} to ${leaveEndDate}! Sent to Supervisor.`);
  }

  function handleStockoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowStockoutModal(false);
    flash(`Urgent stockout escalation for ${stockoutSku || "product SKU"} at ${selectedStoreName} sent to Supervisor!`);
  }

  function signOut() {
    try {
      localStorage.removeItem("kea_user");
    } catch {}
    document.cookie = "kea_auth=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  const initials = (userName || "Maria Uchechukwu")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MD";

  return (
    <div className={isDark ? "merch-reference dark" : "merch-reference"}>
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}

      <aside className={mobileNav ? "reference-rail open" : "reference-rail"}>
        <div className="reference-brand">
          <div className="reference-logo"><b>k</b><b>e</b><b>a</b></div>
          <strong>KEA GROUP</strong>
          <small>Merchandiser Console</small>
          <button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              className={key !== "settings" && activePage === key ? "active" : ""}
              onClick={() => {
                if (key === "settings") {
                  setShowSettingsModal(true);
                } else {
                  setActivePage(key as PageKey);
                  setSearch("");
                }
                setMobileNav(false);
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        <button className="reference-settings" type="button" onClick={signOut}><LogOut size={15} /> Sign out</button>
      </aside>

      <main className="reference-main">
        <header className="reference-topbar">
          <button className="reference-menu" type="button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <span className="vsr-page-title">{pageTitles[activePage].title}</span>
          <div className="reference-actions">
            <button
              type="button"
              onClick={() => setUrgentModalOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 10px", borderRadius: 20,
                background: "rgba(243, 112, 33, 0.14)", border: "1px solid rgba(243, 112, 33, 0.4)",
                color: "#F37021", fontSize: 10, fontWeight: 800, cursor: "pointer",
                letterSpacing: "0.04em", transition: "all 0.2s ease"
              }}
              title="View Urgent Merchandiser Directives"
            >
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#F37021",
                boxShadow: "0 0 0 3px rgba(243, 112, 33, 0.25)", display: "inline-block"
              }} />
              Urgent Notice
            </button>
            <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" title={`Switch to ${isDark ? "Light" : "Dark"} mode`}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button type="button" aria-label="Notifications" onClick={() => setActivePage("leave")}><Bell size={15} /></button>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--line)",
                background: "linear-gradient(135deg, #94C83D, #F37021)", color: "#0A0E17",
                display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800,
                cursor: "pointer", overflow: "hidden", padding: 0
              }}
              title="Open Profile & Settings"
              aria-label="Profile and settings"
            >
              {userAvatar ? (
                <img src={userAvatar} alt="Merchandiser avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>

        <div className="reference-content">
          <ScrollProgress className="fixed top-0 left-0 right-0 z-[60]" />

          <div className="reference-title">
            <h1>{pageTitles[activePage].title}</h1>
            <span>Sep 10, 2026 · Retail Merchandising Execution</span>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "home" && (
            <div className="page-admin page-merchandiser" style={{ padding: "0 0 30px", display: "grid", gap: 20 }}>
              <FieldHero
                eyebrow="MERCHANDISER SNAPSHOT"
                title="Hello, Maria Uchechukwu"
                subtitle="Retail Merchandiser · Lagos Island · VI Retail Axis — 12 assigned stores."
                badge="Route Active"
                variant="waves"
                colors={["#0d9488", "#07535a", "#14b8a6", "#134e4a"]}
                stat={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Badge variant="accent">
                      <Store size={12} /> 12 Assigned Stores
                    </Badge>
                    <Badge variant="success">
                      97% Execution Rate
                    </Badge>
                  </div>
                }
              />

              {/* QUICK ACTION BANNER */}
              <div style={{
                background: "linear-gradient(135deg, rgba(13, 148, 136, 0.09) 0%, rgba(37, 99, 235, 0.09) 100%)",
                border: "1px solid var(--line)", borderRadius: 14, padding: "14px 18px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={20} color="#0d9488" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                      Upcoming Scheduled Leave
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      Next leave: Sep 20 – Sep 27 · Relief Merchandiser: Arorundade Adewale
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(true)}
                    style={{
                      background: "#0d9488", color: "#fff", border: "none", padding: "8px 16px",
                      borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <Plus size={14} /> Request Leave
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStoreName("Ebeano Supermarket (VI)");
                      setShowStockoutModal(true);
                    }}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)",
                      padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <AlertTriangle size={14} /> Escalate Stockout
                  </button>
                </div>
              </div>

              {/* KPI CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-teal"><Store size={18} /></div>
                  <span className="kx-kpi-label">Assigned Stores</span>
                  <strong className="kx-kpi-value">{myStores.length}</strong>
                  <div className="kx-kpi-trend up"><b>{healthyStores} Healthy</b> <small>coverage</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-blue"><FileSpreadsheet size={18} /></div>
                  <span className="kx-kpi-label">POD Trackers Submitted</span>
                  <strong className="kx-kpi-value">{myPodSubmissions.length}</strong>
                  <div className="kx-kpi-trend up"><b>100%</b> <small>verified by supervisor</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-violet"><Camera size={18} /></div>
                  <span className="kx-kpi-label">Audit Photos</span>
                  <strong className="kx-kpi-value">{photosCount || 18}</strong>
                  <div className="kx-kpi-trend up"><b>Geotagged</b> <small>store evidence</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-emerald"><Calendar size={18} /></div>
                  <span className="kx-kpi-label">Scheduled Leave</span>
                  <strong className="kx-kpi-value">Sep 20</strong>
                  <div className="kx-kpi-trend up"><b>Relief:</b> <small>Arorundade A.</small></div>
                </div>
              </div>

              {/* CHARTS */}
              <FadeIn delay={0.05} className="charts-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                <div className="card">
                  <div className="card-head"><div><h3>Store Visit & Audit Execution Rate</h3><p>Weekly on-time visit completion percentage across assigned outlets</p></div></div>
                  <div style={{ height: 220, marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={shelfTrend}>
                        <defs>
                          <linearGradient id="gShelf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", fontSize: 12 }} />
                        <Area type="monotone" dataKey="share" name="Execution %" stroke="#0d9488" strokeWidth={2.5} fill="url(#gShelf)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head"><div><h3>POD Ingestion Status</h3><p>Supervisor Verification Rate</p></div></div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#0d9488" }}>100%</div>
                    <div style={{ height: 10, background: "var(--bar-muted)", borderRadius: 5, overflow: "hidden", margin: "10px 0" }}>
                      <div style={{ height: "100%", width: "100%", background: "#0d9488", borderRadius: 5 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      All {myPodSubmissions.length} delivery trackers verified & ingested by Supervisor Michael Olayiwola.
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: ASSIGNED STORES & OUTLETS
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "stores" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>My Assigned Stores ({myStores.length} Total)</h2>
                    <p>Audit store execution, product availability, or report critical stockouts to Supervisor</p>
                  </div>
                  <Store size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Store Name</th>
                        <th>Address / Area</th>
                        <th>Category</th>
                        <th>Shelf Share</th>
                        <th>Status</th>
                        <th>Stockout Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myStores.map((store, idx) => (
                        <tr key={store.id}>
                          <td data-label="Store"><b>{store.name}</b><br /><small>{store.id}</small></td>
                          <td data-label="Address">{store.address}</td>
                          <td data-label="Category">{store.territory || "Retail Store"}</td>
                          <td data-label="Share"><b>{78 + (idx * 4) % 15}%</b></td>
                          <td data-label="Status">
                            <span className={`status ${store.status === "Healthy" ? "active" : "needs-review"}`}>
                              <i /> {store.status}
                            </span>
                          </td>
                          <td data-label="Alert">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStoreName(store.name);
                                setShowStockoutModal(true);
                              }}
                              style={{
                                background: "rgba(239, 68, 68, 0.1)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)",
                                padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              <AlertTriangle size={11} style={{ display: "inline", marginRight: 3 }} /> Escalate Stockout
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: LEAVE APPLICATION & ROSTER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "leave" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)" }}>My Leave Requests & Calendar</h3>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>Requests are endorsed and scheduled by your Supervisor</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  style={{
                    background: "#0d9488", color: "#fff", border: "none", padding: "8px 16px",
                    borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                  }}
                >
                  <Plus size={14} /> Request New Leave
                </button>
              </div>

              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Scheduled Leave History</h2>
                    <p>Past and upcoming leave requests with relief merchandiser assignment</p>
                  </div>
                  <Calendar size={16} color="#0d9488" />
                </header>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Leave ID</th>
                        <th>Leave Dates</th>
                        <th>Reason</th>
                        <th>Assigned Relief Staff</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.map((l) => (
                        <tr key={l.id}>
                          <td data-label="ID"><b>{l.id}</b></td>
                          <td data-label="Dates"><b>{l.startDate} to {l.endDate}</b></td>
                          <td data-label="Reason">{l.reason}</td>
                          <td data-label="Relief"><b>{l.reliefStaff}</b></td>
                          <td data-label="Status">
                            <span className={`status ${l.status.includes("Approved") ? "active" : "needs-review"}`}>
                              <i /> {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: POD TRACKER UPLOAD & SUPERVISOR TEMPLATE
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "pod-upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Supervisor Official Template Download Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(14, 116, 144, 0.12) 100%)",
                border: "1px solid rgba(13, 148, 136, 0.3)",
                borderRadius: 14, padding: "20px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center",
                    background: "#0d9488", color: "#fff", flexShrink: 0
                  }}>
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Official Supervisor POD Tracker Template</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#0d9488", color: "#fff" }}>
                        Verified by Michael Olayiwola (Supervisor)
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                      Download the exact standardized Proof of Delivery template required by your Supervisor. Fill in waybill #, SKU counts, and store receiver confirmation.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    background: "#0d9488", color: "#fff", border: "none", padding: "10px 18px",
                    borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                    boxShadow: "0 2px 8px rgba(13, 148, 136, 0.25)"
                  }}
                >
                  <Download size={15} /> Download Official Template (.csv)
                </button>
              </div>

              {/* POD Upload Form */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Upload Completed POD Tracker</h2>
                    <p>Submit your verified proof of delivery for automated supervisor receipt & verification</p>
                  </div>
                  <UploadCloud size={18} color="#0d9488" />
                </header>

                <form onSubmit={handlePodUploadSubmit} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Retail Store</label>
                      <select
                        value={podStoreId}
                        onChange={(e) => setPodStoreId(e.target.value)}
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      >
                        {myStores.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Delivery Waybill / Invoice Ref</label>
                      <input
                        type="text"
                        value={podDeliveryRef}
                        onChange={(e) => setPodDeliveryRef(e.target.value)}
                        placeholder="e.g. WB-2026-09-842"
                        required
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Delivery Date</label>
                      <input
                        type="date"
                        value={podDate}
                        onChange={(e) => setPodDate(e.target.value)}
                        required
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Completed POD File (.xlsx, .csv, .pdf)</label>
                      <input
                        type="file"
                        accept=".xlsx,.csv,.pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setPodFileName(f.name);
                        }}
                        style={{ width: "100%", marginTop: 4, padding: "6px 0", fontSize: 12, color: "var(--text)" }}
                      />
                      <small style={{ fontSize: 10, color: "var(--muted)" }}>
                        {podFileName ? `Selected: ${podFileName}` : "Matches supervisor template schema"}
                      </small>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Store Manager Confirmation / Notes</label>
                      <input
                        type="text"
                        value={podNotes}
                        onChange={(e) => setPodNotes(e.target.value)}
                        placeholder="e.g. 24 cartons received intact, manager stamp attached"
                        style={{ width: "100%", marginTop: 4, height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      type="submit"
                      disabled={isUploadingPod}
                      style={{
                        background: "#0d9488", color: "#fff", border: "none", padding: "10px 22px",
                        borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                        boxShadow: "0 2px 10px rgba(13, 148, 136, 0.3)"
                      }}
                    >
                      <Send size={14} />
                      {isUploadingPod ? "Uploading & Alerting Supervisor..." : "Upload POD & Notify Supervisor Instantly"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Submitted POD History */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Submitted Proof of Delivery (POD) Records</h2>
                    <p>Track supervisor receipt and approval verification of your submitted delivery trackers</p>
                  </div>
                  <FileCheck size={18} color="#0d9488" />
                </header>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>POD Record ID</th>
                        <th>Retail Store</th>
                        <th>Waybill / Ref</th>
                        <th>Attached File</th>
                        <th>Submission Timestamp</th>
                        <th>Notes</th>
                        <th>Supervisor Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPodSubmissions.map((p) => (
                        <tr key={p.id}>
                          <td data-label="ID"><b>{p.id}</b></td>
                          <td data-label="Store"><b>{p.storeName}</b><br /><small>{p.storeId}</small></td>
                          <td data-label="Ref"><code>{p.deliveryRef}</code></td>
                          <td data-label="File">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#0d9488", fontWeight: 700, fontSize: 11 }}>
                              <FileSpreadsheet size={13} /> {p.fileName}
                            </span>
                          </td>
                          <td data-label="Date">{p.date}</td>
                          <td data-label="Notes" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.notes}
                          </td>
                          <td data-label="Status">
                            <span className={`status ${p.status.includes("Verified") ? "active" : "needs-review"}`}>
                              <i /> {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: PHOTOS & FIELD EVIDENCE UPLOADER
             ══════════════════════════════════════════════════════════════ */}
          {activePage === "photos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Photo Upload & Actions Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(14, 116, 144, 0.12) 100%)",
                border: "1px solid rgba(13, 148, 136, 0.3)",
                borderRadius: 14, padding: "18px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center",
                    background: "#0d9488", color: "#fff", flexShrink: 0
                  }}>
                    <Camera size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Field Audit Photo Evidence & Geotagged Captures</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#0d9488", color: "#fff" }}>
                        Live Supervisor Audit Feed
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                      Upload store shelf pictures, gondola displays, and POSM branding with instant GPS tagging and supervisor verification.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  style={{
                    background: "#0d9488", color: "#fff", border: "none", padding: "10px 18px",
                    borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                    boxShadow: "0 2px 8px rgba(13, 148, 136, 0.25)"
                  }}
                >
                  <Plus size={15} /> Upload Field Photo Evidence
                </button>
              </div>

              {/* Photo Audit Statistics Chips */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-teal"><Camera size={16} /></div>
                  <span className="kx-kpi-label">Total Captures</span>
                  <strong className="kx-kpi-value">{myPhotos.length} Photos</strong>
                  <div className="kx-kpi-trend up"><b>100%</b> <small>geotagged</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-blue"><Store size={16} /></div>
                  <span className="kx-kpi-label">Audited Outlets</span>
                  <strong className="kx-kpi-value">{myStores.length} Stores</strong>
                  <div className="kx-kpi-trend up"><b>VI Territory</b> <small>covered</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-emerald"><ShieldCheck size={16} /></div>
                  <span className="kx-kpi-label">Supervisor Ingestion</span>
                  <strong className="kx-kpi-value">Active</strong>
                  <div className="kx-kpi-trend up"><b>Real-time</b> <small>feed linked</small></div>
                </div>

                <div className="kx-kpi">
                  <div className="kx-kpi-iconwrap tone-violet"><MapPin size={16} /></div>
                  <span className="kx-kpi-label">GPS Accuracy</span>
                  <strong className="kx-kpi-value">&lt; 5 meters</strong>
                  <div className="kx-kpi-trend up"><b>Precision Tag</b> <small>active</small></div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", marginRight: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Filter size={12} /> FILTER:
                </span>
                {[
                  { key: "all", label: "All Photos" },
                  { key: "Gondola End Cap", label: "Gondola End Caps" },
                  { key: "Shelf Planogram Frontage", label: "Shelf Planogram" },
                  { key: "POSM & Brand Posters", label: "POSM & Posters" },
                  { key: "Stock Depletion Evidence", label: "Stock Depletion" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setPhotoFilter(f.key)}
                    style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      border: photoFilter === f.key ? "1px solid #0d9488" : "1px solid var(--line)",
                      background: photoFilter === f.key ? "#0d9488" : "var(--card)",
                      color: photoFilter === f.key ? "#fff" : "var(--text)"
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Photo Evidence Grid */}
              <section className="admin-panel">
                <header>
                  <div>
                    <h2>Photo Evidence Gallery ({myPhotos.filter(p => photoFilter === "all" || p.category === photoFilter).length} Records)</h2>
                    <p>High-resolution geotagged photos from retail store visits</p>
                  </div>
                  <ImageIcon size={18} color="#0d9488" />
                </header>

                <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  {myPhotos
                    .filter(p => photoFilter === "all" || p.category === photoFilter)
                    .map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12,
                          overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                        }}
                      >
                        {/* Image with zoom on hover */}
                        <div style={{ position: "relative", height: 160, overflow: "hidden", background: "#000" }}>
                          <img
                            src={p.url}
                            alt={p.storeName}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
                          />
                          <span style={{
                            position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.75)",
                            color: "#fff", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                            backdropFilter: "blur(4px)"
                          }}>
                            {p.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoForPreview(p)}
                            style={{
                              position: "absolute", bottom: 10, right: 10, background: "rgba(13, 148, 136, 0.9)",
                              color: "#fff", border: "none", padding: "5px 9px", borderRadius: 6, fontSize: 10,
                              fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                            }}
                          >
                            <Maximize2 size={11} /> Inspect
                          </button>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <b style={{ fontSize: 13, color: "var(--text)" }}>{p.storeName}</b>
                              <small style={{ fontSize: 10, color: "var(--muted)" }}>{p.date} · {p.time}</small>
                            </div>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={11} color="#0d9488" /> {p.gps}
                            </div>
                          </div>

                          <p style={{
                            margin: 0, fontSize: 11, color: "var(--text)", lineHeight: 1.4,
                            background: "var(--soft)", padding: "8px 10px", borderRadius: 6,
                            border: "1px solid var(--line)", flex: 1
                          }}>
                            {p.notes}
                          </p>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                              background: "#f0fdf4", color: "#16a34a"
                            }}>
                              <CheckCircle2 size={10} style={{ display: "inline", marginRight: 3 }} /> {p.status}
                            </span>
                            <small style={{ color: "var(--muted)", fontSize: 9 }}>ID: {p.id}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: REQUEST LEAVE ─── */}
      {showLeaveModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLeaveModal(false); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Request leave">
            <div className="modal-head">
              <div>
                <small>FIELD ROTATION & LEAVE</small>
                <h2>Request Merchandiser Leave</h2>
              </div>
              <button type="button" onClick={() => setShowLeaveModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleLeaveSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    style={{ width: "100%", marginTop: 4, height: 36, padding: "0 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>End Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    style={{ width: "100%", marginTop: 4, height: 36, padding: "0 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Reason for Leave</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Annual Rest, Family Medical"
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Nominated Relief Merchandiser</label>
                <select
                  value={reliefStaff}
                  onChange={(e) => setReliefStaff(e.target.value)}
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                >
                  <option>Arorundade Adewale</option>
                  <option>Jonathan Okena</option>
                  <option>Abiola Felicia</option>
                  <option>Maria Uchechukwu</option>
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: 6 }}>
                <button type="button" className="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ background: "#0d9488", borderColor: "#0d9488" }}>
                  <Send size={14} /> Submit to Supervisor
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ─── MODAL: ESCALATE STOCKOUT TO SUPERVISOR ─── */}
      {showStockoutModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowStockoutModal(false); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Escalate stockout">
            <div className="modal-head">
              <div>
                <small>STOCKOUT ESCALATION ENGINE</small>
                <h2>Escalate Stockout to Supervisor</h2>
              </div>
              <button type="button" onClick={() => setShowStockoutModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleStockoutSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Store Location</label>
                <input
                  type="text"
                  value={selectedStoreName}
                  readOnly
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--soft)", color: "var(--text)", fontSize: 12, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Affected SKU / Brand</label>
                <input
                  type="text"
                  value={stockoutSku}
                  onChange={(e) => setStockoutSku(e.target.value)}
                  placeholder="e.g. Peak Milk 400g Refill (0 units remaining)"
                  style={{ width: "100%", marginTop: 4, height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 6 }}>
                <button type="button" className="secondary" onClick={() => setShowStockoutModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ background: "#dc2626", borderColor: "#dc2626", color: "#fff" }}>
                  <AlertTriangle size={14} /> Dispatch Urgent Alert to Supervisor
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ─── MODAL: UPLOAD FIELD PHOTO EVIDENCE ─── */}
      {showPhotoModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowPhotoModal(false); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Upload field photo" style={{ maxWidth: 540 }}>
            <div className="modal-head">
              <div>
                <small>FIELD AUDIT & SHELF VISIBILITY</small>
                <h2>Upload Field Photo Evidence</h2>
              </div>
              <button type="button" onClick={() => setShowPhotoModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handlePhotoUploadSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Retail Store Outlet</label>
                  <select
                    value={photoStoreId}
                    onChange={(e) => setPhotoStoreId(e.target.value)}
                    style={{ width: "100%", marginTop: 4, height: 36, padding: "0 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                  >
                    {myStores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Audit Category</label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                    style={{ width: "100%", marginTop: 4, height: 36, padding: "0 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                  >
                    <option value="Gondola End Cap">Gondola End Cap</option>
                    <option value="Shelf Planogram Frontage">Shelf Planogram Frontage</option>
                    <option value="POSM & Brand Posters">POSM & Brand Posters</option>
                    <option value="Stock Depletion Evidence">Stock Depletion Evidence</option>
                    <option value="Competitor Shelf Share">Competitor Shelf Share</option>
                    <option value="Secondary Placement / Island Display">Secondary Placement / Island Display</option>
                  </select>
                </div>
              </div>

              {/* Image Picker with Live Thumbnail Preview */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Select Image from Device / Camera</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  style={{ width: "100%", marginTop: 4, padding: "6px 0", fontSize: 12, color: "var(--text)" }}
                />

                {photoPreviewUrl && (
                  <div style={{ marginTop: 8, position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", maxHeight: 150, background: "#000" }}>
                    <img
                      src={photoPreviewUrl}
                      alt="Upload Preview"
                      style={{ width: "100%", height: 150, objectFit: "cover", opacity: 0.9 }}
                    />
                    <span style={{
                      position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.75)",
                      color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700
                    }}>
                      Live Image Preview
                    </span>
                  </div>
                )}
              </div>

              {/* Geotag & Coordinates */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>GPS Geotag Location</label>
                <div style={{ position: "relative", marginTop: 4 }}>
                  <input
                    type="text"
                    value={photoGpsTag}
                    onChange={(e) => setPhotoGpsTag(e.target.value)}
                    placeholder="e.g. 6.4369° N, 3.4819° E · Victoria Island"
                    style={{ width: "100%", height: 36, padding: "0 10px 0 32px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12 }}
                  />
                  <MapPin size={14} color="#0d9488" style={{ position: "absolute", left: 10, top: 11 }} />
                </div>
              </div>

              {/* Observation / Merchandising Notes */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Field Observations & Merchandising Notes</label>
                <textarea
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  placeholder="Describe shelf arrangement, facing count, price tags, competitor positioning or POSM state..."
                  rows={3}
                  required
                  style={{ width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, resize: "vertical" }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 6 }}>
                <button type="button" className="secondary" onClick={() => setShowPhotoModal(false)}>Cancel</button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="primary"
                  style={{ background: "#0d9488", borderColor: "#0d9488", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Send size={14} />
                  {isUploadingPhoto ? "Uploading & Logging..." : "Upload & Alert Supervisor"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ─── MODAL: LIGHTBOX PHOTO INSPECTOR ─── */}
      {selectedPhotoForPreview && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedPhotoForPreview(null); }}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-label="Photo Inspector" style={{ maxWidth: 640 }}>
            <div className="modal-head">
              <div>
                <small>{selectedPhotoForPreview.id} · {selectedPhotoForPreview.category}</small>
                <h2>{selectedPhotoForPreview.storeName}</h2>
              </div>
              <button type="button" onClick={() => setSelectedPhotoForPreview(null)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Full Image */}
              <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", maxHeight: 340, background: "#000" }}>
                <img
                  src={selectedPhotoForPreview.url}
                  alt={selectedPhotoForPreview.storeName}
                  style={{ width: "100%", maxHeight: 340, objectFit: "contain", background: "#000" }}
                />
              </div>

              {/* Metadata Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "var(--soft)", padding: 12, borderRadius: 8, border: "1px solid var(--line)" }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Capture Timestamp</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>
                    {selectedPhotoForPreview.date} at {selectedPhotoForPreview.time}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>GPS Geotag</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={12} color="#0d9488" /> {selectedPhotoForPreview.gps}
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Merchandiser Field Observations</span>
                  <div style={{ fontSize: 12, color: "var(--text)", marginTop: 2, lineHeight: 1.4 }}>
                    {selectedPhotoForPreview.notes}
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                    background: "#f0fdf4", color: "#16a34a"
                  }}>
                    <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />
                    {selectedPhotoForPreview.status}
                  </span>
                  <a
                    href={selectedPhotoForPreview.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: "#0d9488", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <ExternalLink size={12} /> Open Full Resolution
                  </a>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setSelectedPhotoForPreview(null)}>Close Inspector</button>
              </div>
            </div>
          </section>
        </div>
      )}
      {/* ─── SETTINGS & PROFILE POPUP MODAL ─── */}
      <ProfileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        role="merchandiser"
        defaultName={userName || "Maria Uchechukwu"}
        defaultEmail="maria.uchechukwu@kea.com"
        roleLabel="Merchandiser Specialist · Field Execution"
        onFlash={flash}
      />

      {/* ─── URGENT ATTENTION NOTIFICATION MODAL ─── */}
      <UrgentLoginModal
        role="merchandiser"
        userName={userName || "Maria Uchechukwu"}
        isOpen={urgentModalOpen}
        onClose={() => setUrgentModalOpen(false)}
      />
    </div>
  );
}
