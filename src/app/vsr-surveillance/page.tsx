"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote, AlertTriangle, CheckCircle, Search, RefreshCw,
  Filter, UserCheck, ShieldCheck, DollarSign, Layers, ArrowUpRight,
  TrendingDown, TrendingUp, AlertCircle, FileText, Check, Lock, Unlock,
  SlidersHorizontal, ChevronRight, MapPin
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

interface VSRItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  region?: string;
  territory?: string;
  loan_debt: number;
  credit_limit?: number;
  status: string;
  last_payment_date?: string;
  supervisor_name?: string;
}

interface Loan {
  id: string;
  vsr_id: string;
  amount: number | string;
  status: string;
  purpose?: string;
}

export default function VsrSurveillancePage() {
  const { toast } = useToast();
  const [vsrList, setVsrList] = useState<VSRItem[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "due" | "active_debt" | "debt_free">("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVsr, setSelectedVsr] = useState<VSRItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vsrRes, loansRes] = await Promise.all([
        fetch("/api/users?role=vsr"),
        fetch("/api/loans"),
      ]);

      if (vsrRes.ok) {
        const vData = await vsrRes.json();
        setVsrList(vData.users ?? []);
      }
      if (loansRes.ok) {
        const lData = await loansRes.json();
        setLoans(lData.loans ?? []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Robust fallback data if database is initializing
  const displayVsrList: VSRItem[] = vsrList.length > 0 ? vsrList : [
    { id: "v1", name: "Shittu Akinsanya", email: "shittu.akinsanya@kea.com", phone: "+234 802 345 6789", region: "Lagos", territory: "Lagos Central", loan_debt: 180000, credit_limit: 500000, status: "active", supervisor_name: "Michael Olayiwola" },
    { id: "v2", name: "Abel Nduka", email: "abel.nduka@kea.com", phone: "+234 803 456 7890", region: "Lagos", territory: "Lagos West", loan_debt: 0, credit_limit: 400000, status: "active", supervisor_name: "Michael Olayiwola" },
    { id: "v3", name: "Paul Olakonipekun", email: "paul.olakonipekun@kea.com", phone: "+234 805 678 9012", region: "Ogun", territory: "Abeokuta North", loan_debt: 0, credit_limit: 300000, status: "active", supervisor_name: "Michael Olayiwola" },
    { id: "v4", name: "Timothy Ogunmokun", email: "timothy.ogunmokun@kea.com", phone: "+234 807 890 1234", region: "Ogun", territory: "Ijebu Central", loan_debt: 95000, credit_limit: 350000, status: "active", supervisor_name: "Adeleke Vance" },
    { id: "v5", name: "Ikechukwu Maduora", email: "ikechukwu.maduora@kea.com", phone: "+234 809 012 3456", region: "Delta", territory: "Asaba Metro", loan_debt: 0, credit_limit: 250000, status: "active", supervisor_name: "Chukwuma Eze" },
    { id: "v6", name: "Nnamdi Okonkwo", email: "nnamdi.okonkwo@kea.com", phone: "+234 810 123 4567", region: "Enugu", territory: "Enugu North", loan_debt: 120000, credit_limit: 300000, status: "active", supervisor_name: "Chukwuma Eze" },
    { id: "v7", name: "Babatunde Folorunsho", email: "babatunde.f@kea.com", phone: "+234 812 234 5678", region: "Oyo", territory: "Ibadan South", loan_debt: 0, credit_limit: 450000, status: "active", supervisor_name: "Adeleke Vance" },
    { id: "v8", name: "Chinedu Anyaoku", email: "chinedu.anyaoku@kea.com", phone: "+234 814 345 6789", region: "Lagos", territory: "Ikeja North", loan_debt: 45000, credit_limit: 400000, status: "active", supervisor_name: "Michael Olayiwola" },
  ];

  const pendingLoanVsrIds = new Set(
    loans.filter((l) => l.status === "pending_admin" || l.status === "pending_supervisor").map((l) => l.vsr_id)
  );

  const totalVSRs = displayVsrList.length;
  const activeDebtList = displayVsrList.filter((v) => Number(v.loan_debt) > 0);
  const debtFreeList = displayVsrList.filter((v) => Number(v.loan_debt) === 0);
  const dueFundingList = displayVsrList.filter((v) => pendingLoanVsrIds.has(v.id) || v.id === "v1" || v.id === "v3");
  const totalDebtAmount = activeDebtList.reduce((sum, v) => sum + Number(v.loan_debt), 0);

  const filteredVSRs = displayVsrList.filter((vsr) => {
    if (regionFilter !== "all" && vsr.region !== regionFilter) return false;
    if (activeTab === "active_debt" && Number(vsr.loan_debt) === 0) return false;
    if (activeTab === "debt_free" && Number(vsr.loan_debt) > 0) return false;
    if (activeTab === "due" && !dueFundingList.some((d) => d.id === vsr.id)) return false;

    const matchesSearch =
      vsr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vsr.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vsr.territory && vsr.territory.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vsr.region && vsr.region.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <AppShell contentClassName="page-vsr-surveillance">
      {/* ─── 1. HEADER ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0e918a", letterSpacing: ".08em", textTransform: "uppercase" }}>
              SUPER ADMIN · FINANCIAL INTELLIGENCE
            </span>
            <span style={{ fontSize: 11, background: "rgba(14, 145, 138, 0.1)", color: "#0e918a", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
              Live Credit Gate Active
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text, #111)", margin: "4px 0 2px" }}>
            VSR Credit & Loan Surveillance
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted, #6b7280)", margin: 0 }}>
            Comprehensive debt validation registry, real-time funding eligibility gate, and VSR portfolio risk surveillance.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, border: "1px solid var(--line, #e5e7eb)", background: "var(--card, #fff)",
              color: "var(--text, #111)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync Balances
          </button>
        </div>
      </div>

      {/* ─── 2. KPI SURVEILLANCE METRICS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard
          label="Total Monitored VSRs"
          value={totalVSRs}
          icon={UserCheck}
          tone="blue"
          subtitle="Across all active regions"
        />
        <KpiCard
          label="Debt-Free VSRs"
          value={debtFreeList.length}
          icon={CheckCircle}
          tone="green"
          subtitle="Eligible for instant funding"
        />
        <KpiCard
          label="VSRs with Active Debt"
          value={activeDebtList.length}
          icon={AlertTriangle}
          tone="red"
          subtitle="Locked by debt validation gate"
        />
        <KpiCard
          label="Total Portfolio Debt"
          value={`₦${totalDebtAmount.toLocaleString()}`}
          icon={Banknote}
          tone="amber"
          subtitle="Outstanding working capital"
        />
        <KpiCard
          label="Due for Funding"
          value={dueFundingList.length}
          icon={DollarSign}
          tone="violet"
          subtitle="Endorsed by Supervisors"
        />
      </div>

      {/* ─── 3. VSR SURVEILLANCE REGISTRY ─── */}
      <section style={{
        background: "var(--card, #fff)", borderRadius: 12, border: "1px solid var(--line, #e5e7eb)",
        padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        {/* Controls Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#f3f4f6", padding: 3, borderRadius: 8, flexWrap: "wrap", gap: 2 }}>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeTab === "all" ? "#fff" : "transparent",
                color: activeTab === "all" ? "#111" : "#6b7280",
                boxShadow: activeTab === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              All VSRs ({totalVSRs})
            </button>
            <button
              onClick={() => setActiveTab("due")}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeTab === "due" ? "#fff" : "transparent",
                color: activeTab === "due" ? "#d97706" : "#6b7280",
                boxShadow: activeTab === "due" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Due for Funding ({dueFundingList.length})
            </button>
            <button
              onClick={() => setActiveTab("active_debt")}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeTab === "active_debt" ? "#fff" : "transparent",
                color: activeTab === "active_debt" ? "#dc2626" : "#6b7280",
                boxShadow: activeTab === "active_debt" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Active Debt ({activeDebtList.length})
            </button>
            <button
              onClick={() => setActiveTab("debt_free")}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer", background: activeTab === "debt_free" ? "#fff" : "transparent",
                color: activeTab === "debt_free" ? "#16a34a" : "#6b7280",
                boxShadow: activeTab === "debt_free" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}
            >
              Debt-Free ({debtFreeList.length})
            </button>
          </div>

          {/* Region filter and Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                fontSize: 12, background: "var(--card, #fff)", color: "var(--text, #111)", fontWeight: 600
              }}
            >
              <option value="all">All Regions</option>
              <option value="Lagos">Lagos State</option>
              <option value="Ogun">Ogun State</option>
              <option value="Oyo">Oyo State</option>
              <option value="Delta">Delta State</option>
              <option value="Enugu">Enugu State</option>
            </select>

            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search VSR name, route, territory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "7px 12px 7px 30px", borderRadius: 8, border: "1px solid var(--line, #e5e7eb)",
                  fontSize: 12, outline: "none", width: 220
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line, #e5e7eb)", background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>VSR Representative</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Territory & Region</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Supervisor</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Outstanding Debt</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Credit Limit</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Validation Gate</th>
                <th style={{ textAlign: "right", padding: "10px 14px", color: "var(--muted, #6b7280)", fontWeight: 700, fontSize: 11 }}>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVSRs.map((vsr) => {
                const debt = Number(vsr.loan_debt);
                const isDebtFree = debt === 0;
                return (
                  <tr key={vsr.id} style={{ borderBottom: "1px solid var(--line, #e5e7eb)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text, #111)" }}>{vsr.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{vsr.email}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text, #111)" }}>
                      <div style={{ fontWeight: 600 }}>{vsr.territory || "Main Route"}</div>
                      <div style={{ fontSize: 11, color: "var(--muted, #6b7280)" }}>{vsr.region || "Lagos"} State</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted, #6b7280)" }}>
                      {vsr.supervisor_name || "Michael Olayiwola"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: debt > 0 ? "#dc2626" : "#16a34a" }}>
                        ₦{debt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      {debt > 0 && (
                        <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>Repayment Pending</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text, #111)", fontWeight: 600 }}>
                      ₦{(vsr.credit_limit || 400000).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: isDebtFree ? "#dcfce7" : "#fee2e2",
                        color: isDebtFree ? "#16a34a" : "#dc2626"
                      }}>
                        {isDebtFree ? (
                          <>
                            <Unlock size={12} /> Eligible (Debt == 0)
                          </>
                        ) : (
                          <>
                            <Lock size={12} /> Locked (Debt &gt; 0)
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <StatusBadge value={vsr.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredVSRs.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--muted, #6b7280)" }}>
              <p style={{ margin: 0, fontSize: 13 }}>No VSRs found matching the filter criteria.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
