"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  Retailer,
  PricingTier,
  formatINR,
  getRetailerAgeingLedgers,
  Invoice,
  Order,
  Payment,
} from "@/lib/mock";

type SortField =
  | "code"
  | "name"
  | "town"
  | "pricingTier"
  | "creditLimit"
  | "outstanding"
  | "overdue"
  | "lastOrderDate";
type SortOrder = "asc" | "desc";

// Format helper for town column
// "show 'Siddipet' once when town and district are the same; show state for non-Telangana"
function formatTownDisplay(town: string, district: string, state: string) {
  const isSame = town.trim().toLowerCase() === district.trim().toLowerCase();
  const isNonTelangana = state && state !== "Telangana";
  const stateCode = isNonTelangana ? (state === "Andhra Pradesh" ? "AP" : state) : null;

  const primary = stateCode ? `${town}, ${stateCode}` : town;
  const secondary = isSame ? null : district;

  return { primary, secondary };
}

// Format GSTIN validation helper
function validateGSTIN(gstin: string, state: string): {
  formatValid: boolean;
  stateCodeValid: boolean;
  stateCode: string;
  expectedPrefix: string;
} {
  const clean = (gstin || "").trim();
  // 15-character alphanumeric standard regex
  const formatRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const formatValid = formatRegex.test(clean);
  const stateCode = clean.substring(0, 2);
  const expectedPrefix = state === "Andhra Pradesh" ? "37" : "36";
  const stateCodeValid = stateCode === expectedPrefix;

  return { formatValid, stateCodeValid, stateCode, expectedPrefix };
}

export const DistributorRetailers: React.FC = () => {
  const {
    retailers,
    invoices,
    payments,
    orders,
    approveRetailer,
    rejectRetailer,
    updateRetailer,
    setViewingInvoice,
    currentDate,
  } = useApp();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "deactivated" | "all">("pending");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTier, setSelectedTier] = useState("");

  // Sort states
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Selection states (for bulk operations)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawers
  const [selectedPendingRetailer, setSelectedPendingRetailer] = useState<Retailer | null>(null);
  const [selectedActiveRetailer, setSelectedActiveRetailer] = useState<Retailer | null>(null);

  // Proposed setup form values (inside Needs Approval drawer)
  const [proposedTier, setProposedTier] = useState<PricingTier>("Tier A+");
  const [proposedCreditLimit, setProposedCreditLimit] = useState<string>("50000");
  const [proposedCreditTerms, setProposedCreditTerms] = useState<number>(30);
  const [dismissDuplicateNotice, setDismissDuplicateNotice] = useState<boolean>(false);

  // Edit active retailer form values (inside Active Retailer Profile drawer)
  const [editTier, setEditTier] = useState<PricingTier>("Tier A+");
  const [editCreditLimit, setEditCreditLimit] = useState<string>("50000");
  const [editCreditTerms, setEditCreditTerms] = useState<number>(30);
  const [activeProfileTab, setActiveProfileTab] = useState<"overview" | "invoices" | "receipts" | "orders">("overview");

  // Modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("Unverifiable business address");
  const [customRejectReason, setCustomRejectReason] = useState("");
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  const [infoRequestDetails, setInfoRequestDetails] = useState("Shop front photograph with signboard & latest electricity bill");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Pre-calculate ledgers from selectors for all active retailers
  const ageingLedgers = useMemo(() => {
    return getRetailerAgeingLedgers(retailers, invoices, currentDate);
  }, [retailers, invoices, currentDate]);

  // Tab Counts
  const pendingCount = useMemo(() => retailers.filter(r => r.status === "Needs Approval").length, [retailers]);
  const activeCount = useMemo(() => retailers.filter(r => r.status === "Active").length, [retailers]);
  const deactivatedCount = useMemo(() => retailers.filter(r => r.status === "Deactivated").length, [retailers]);

  // Unique list of districts for filter dropdown
  const districtList = useMemo(() => {
    const set = new Set<string>();
    retailers.forEach(r => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set).sort();
  }, [retailers]);

  // Filtered Retailers
  const filteredRetailers = useMemo(() => {
    return retailers.filter(r => {
      // Tab filter
      if (activeTab === "pending" && r.status !== "Needs Approval") return false;
      if (activeTab === "active" && r.status !== "Active") return false;
      if (activeTab === "deactivated" && r.status !== "Deactivated") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.name.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.town.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.gstin.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // District filter
      if (selectedDistrict && r.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }

      // Tier filter
      if (selectedTier && r.pricingTier !== selectedTier) {
        return false;
      }

      return true;
    });
  }, [retailers, activeTab, searchQuery, selectedDistrict, selectedTier]);

  // Sorted Retailers
  const sortedRetailers = useMemo(() => {
    const list = [...filteredRetailers];
    list.sort((a, b) => {
      let valA: any = a[sortField] ?? "";
      let valB: any = b[sortField] ?? "";

      if (sortField === "creditLimit" || sortField === "outstanding" || sortField === "overdue") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRetailers, sortField, sortOrder]);

  // Sort click handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Open review drawer for a pending retailer
  const handleOpenReview = (retailer: Retailer) => {
    setSelectedPendingRetailer(retailer);
    setSelectedActiveRetailer(null);
    setProposedTier("Tier A+");
    setProposedCreditLimit("50000");
    setProposedCreditTerms(30);
    setDismissDuplicateNotice(false);
  };

  // Open active retailer profile drawer
  const handleOpenActiveProfile = (retailer: Retailer) => {
    setSelectedActiveRetailer(retailer);
    setSelectedPendingRetailer(null);
    setEditTier(retailer.pricingTier || "Tier A+");
    setEditCreditLimit(String(retailer.creditLimit || 50000));
    setEditCreditTerms(retailer.creditTermsDays || 30);
    setActiveProfileTab("overview");
  };

  // Handle Approve retailer
  const handleConfirmApproval = () => {
    if (!selectedPendingRetailer) return;
    const limit = parseFloat(proposedCreditLimit.replace(/,/g, "")) || 50000;
    const retailerName = selectedPendingRetailer.name;

    approveRetailer(selectedPendingRetailer.id, proposedTier, limit, proposedCreditTerms);
    showToast(`Approved ${retailerName} as ${proposedTier} with ₹${limit.toLocaleString("en-IN")} credit limit.`);

    // Find next pending retailer
    const nextPending = retailers.find(
      r => r.id !== selectedPendingRetailer.id && r.status === "Needs Approval"
    );
    if (nextPending) {
      handleOpenReview(nextPending);
    } else {
      setSelectedPendingRetailer(null);
    }
  };

  // Handle Reject retailer
  const handleConfirmRejection = () => {
    if (!selectedPendingRetailer) return;
    const reasonText = rejectReason === "Other" ? customRejectReason : rejectReason;
    const retailerName = selectedPendingRetailer.name;

    rejectRetailer(selectedPendingRetailer.id, reasonText);
    setIsRejectModalOpen(false);
    showToast(`Rejected ${retailerName} (${reasonText}).`, "info");

    const nextPending = retailers.find(
      r => r.id !== selectedPendingRetailer.id && r.status === "Needs Approval"
    );
    if (nextPending) {
      handleOpenReview(nextPending);
    } else {
      setSelectedPendingRetailer(null);
    }
  };

  // Handle Request More Info
  const handleSendInfoRequest = () => {
    if (!selectedPendingRetailer) return;
    setIsRequestInfoModalOpen(false);
    showToast(`Requested clarification from ${selectedPendingRetailer.ownerName} via SMS & WhatsApp.`, "info");
  };

  // Save changes to active retailer profile
  const handleSaveActiveProfile = () => {
    if (!selectedActiveRetailer) return;
    const limit = parseFloat(editCreditLimit.replace(/,/g, "")) || selectedActiveRetailer.creditLimit;
    updateRetailer(selectedActiveRetailer.id, {
      pricingTier: editTier,
      creditLimit: limit,
      creditTermsDays: editCreditTerms,
    });
    showToast(`Updated account settings for ${selectedActiveRetailer.name}.`);
    // Update local state in view
    setSelectedActiveRetailer(prev => prev ? {
      ...prev,
      pricingTier: editTier,
      creditLimit: limit,
      creditTermsDays: editCreditTerms,
    } : null);
  };

  // Export CSV (Distributor-only includes Internal Pricing Tier)
  const handleExportCSV = () => {
    const headers = [
      "Retailer Code",
      "Shop Name",
      "Owner Name",
      "Phone",
      "GSTIN",
      "Town",
      "District",
      "State",
      "Pricing Tier (Internal)",
      "Credit Limit (INR)",
      "Credit Terms (Days)",
      "Outstanding (INR)",
      "Overdue (INR)",
      "Status",
    ];

    const rows = sortedRetailers.map(r => [
      `"${r.code}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.ownerName.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${r.gstin}"`,
      `"${r.town}"`,
      `"${r.district}"`,
      `"${r.state}"`,
      `"${r.pricingTier || "-"}"`,
      r.creditLimit || 0,
      r.creditTermsDays || 0,
      r.outstanding || 0,
      r.overdue || 0,
      `"${r.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ark_retailers_${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${sortedRetailers.length} retailers to CSV.`);
  };

  // Multi-select toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === sortedRetailers.length) {
      setSelectedIds(new Set());
    } else {
      // In pending tab, omit possible duplicate rows from bulk select per requirement
      const valid = sortedRetailers
        .filter(r => activeTab !== "pending" || !r.flags?.includes("Possible duplicate"))
        .map(r => r.id);
      setSelectedIds(new Set(valid));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Look up existing retailer for duplicate comparison
  const existingDuplicateRetailer = useMemo(() => {
    if (!selectedPendingRetailer || !selectedPendingRetailer.flags) return null;
    return retailers.find(r => r.id === "ret-6" || r.code === "RET-0006" || r.phone === selectedPendingRetailer.phone) || {
      id: "ret-17",
      code: "RET-0017",
      name: "Karimnagar Innerwear House",
      ownerName: "M. Rajeshwar",
      phone: "+91 98480 77120",
      gstin: "36AABCY1028F1Z4",
      town: "Karimnagar",
      district: "Karimnagar",
      state: "Telangana" as const,
      pricingTier: "Tier A+" as const,
      creditLimit: 450000,
      creditTermsDays: 30,
      status: "Active" as const,
      outstanding: 140000,
      overdue: 0,
    };
  }, [selectedPendingRetailer, retailers]);

  return (
    <div className="w-full flex flex-col gap-5 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === "error"
              ? "bg-rose-50 text-rose-900 border-rose-200"
              : toast.type === "info"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-emerald-50 text-emerald-900 border-emerald-200"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "error" ? "error" : toast.type === "info" ? "info" : "check_circle"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Breadcrumb Context */}
      <div className="flex items-center justify-between py-0.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Operations</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-900 font-bold">Retailers</span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Seed: 28 Active · 3 Awaiting Approval
        </div>
      </div>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Retailers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {retailers.length} Registered
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Authorized retail partner directory, onboarding verification, and pricing tier control.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">file_download</span>
            Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add retailer
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveTab("pending");
            setSelectedIds(new Set());
          }}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "pending"
              ? "bg-rose-50 text-rose-700 shadow-xs border border-rose-200/60"
              : "bg-transparent hover:bg-slate-100 text-slate-600"
          }`}
        >
          <span>Needs approval</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === "pending"
                ? "bg-rose-600 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("active");
            setSelectedIds(new Set());
          }}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "active"
              ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60"
              : "bg-transparent hover:bg-slate-100 text-slate-600"
          }`}
        >
          <span>Active</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === "active"
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("deactivated");
            setSelectedIds(new Set());
          }}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "deactivated"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-transparent hover:bg-slate-100 text-slate-600"
          }`}
        >
          <span>Deactivated</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === "deactivated"
                ? "bg-slate-700 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {deactivatedCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("all");
            setSelectedIds(new Set());
          }}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-slate-100 text-slate-900 font-bold"
              : "bg-transparent hover:bg-slate-100 text-slate-600"
          }`}
        >
          <span>All</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-200 text-slate-700">
            {retailers.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap lg:flex-nowrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Search shop name, owner, phone, GSTIN, town..."
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="">District: All ({districtList.length})</option>
            {districtList.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Pricing Tier Filter (Only relevant for Active/All) */}
          {activeTab !== "pending" && (
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">Tier: All</option>
              <option value="Tier A++">Tier A++ (High Volume)</option>
              <option value="Tier A+">Tier A+ (Regular)</option>
              <option value="Tier A">Tier A (Standard)</option>
            </select>
          )}

          {(searchQuery || selectedDistrict || selectedTier) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDistrict("");
                setSelectedTier("");
              }}
              className="h-10 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* FULL-WIDTH TABLE CONTAINER (Never squished) */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Deactivated Tab Empty State per Requirement 6 */}
        {activeTab === "deactivated" && sortedRetailers.length === 0 ? (
          <div className="py-20 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No deactivated retailers</h3>
            <p className="text-sm text-slate-500 mb-6">
              All registered retail partner accounts are active and in good operational standing.
            </p>
            <button
              onClick={() => setActiveTab("active")}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              type="button"
            >
              View Active Retailers ({activeCount})
            </button>
          </div>
        ) : sortedRetailers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No retailers found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider select-none">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === sortedRetailers.length}
                      onChange={toggleSelectAll}
                    />
                  </th>

                  {activeTab !== "pending" && (
                    <th
                      className="py-3.5 px-3 whitespace-nowrap cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Code</span>
                        {sortField === "code" && (
                          <span className="material-symbols-outlined text-[14px]">
                            {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                          </span>
                        )}
                      </div>
                    </th>
                  )}

                  <th
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Shop &amp; Proprietor</span>
                      {sortField === "name" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* Town Column Requirement 4 */}
                  <th
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("town")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Town / Station</span>
                      {sortField === "town" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* Tier Column: Pending rows show "-" per Requirement 3 */}
                  <th
                    className="py-3.5 px-3 whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("pricingTier")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Pricing Tier</span>
                      {sortField === "pricingTier" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* Credit Limit Column: Pending rows show "-" per Requirement 3 */}
                  <th
                    className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("creditLimit")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Credit Limit</span>
                      {sortField === "creditLimit" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>

                  {activeTab !== "pending" && (
                    <th
                      className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("outstanding")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Outstanding</span>
                        {sortField === "outstanding" && (
                          <span className="material-symbols-outlined text-[14px]">
                            {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                          </span>
                        )}
                      </div>
                    </th>
                  )}

                  {activeTab !== "pending" && (
                    <th
                      className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort("overdue")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Overdue</span>
                        {sortField === "overdue" && (
                          <span className="material-symbols-outlined text-[14px]">
                            {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                          </span>
                        )}
                      </div>
                    </th>
                  )}

                  {activeTab === "pending" && (
                    <th className="py-3.5 px-3 whitespace-nowrap">Applied On</th>
                  )}

                  {activeTab === "pending" && (
                    <th className="py-3.5 px-3 whitespace-nowrap">Risk / Flags</th>
                  )}

                  <th className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                    {activeTab === "pending" ? "Action" : "Standing"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {sortedRetailers.map(retailer => {
                  const isPending = retailer.status === "Needs Approval";
                  const isDuplicate = Boolean(retailer.flags?.includes("Possible duplicate"));
                  const isSelected = selectedIds.has(retailer.id);
                  const isReviewOpen = selectedPendingRetailer?.id === retailer.id;
                  const isProfileOpen = selectedActiveRetailer?.id === retailer.id;

                  const townInfo = formatTownDisplay(retailer.town, retailer.district, retailer.state);

                  return (
                    <tr
                      key={retailer.id}
                      onClick={() => {
                        if (isPending) {
                          handleOpenReview(retailer);
                        } else if (retailer.status === "Active") {
                          handleOpenActiveProfile(retailer);
                        }
                      }}
                      className={`transition-colors cursor-pointer group ${
                        isReviewOpen || isProfileOpen
                          ? "bg-blue-50/70"
                          : isSelected
                          ? "bg-slate-50"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="py-3.5 pl-4 pr-2" onClick={e => e.stopPropagation()}>
                        <input
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          type="checkbox"
                          checked={isSelected}
                          disabled={isPending && isDuplicate}
                          title={
                            isPending && isDuplicate
                              ? "Bulk approval disabled: duplicate conflict requires individual review."
                              : ""
                          }
                          onChange={() => toggleSelectRow(retailer.id)}
                        />
                      </td>

                      {/* Code */}
                      {activeTab !== "pending" && (
                        <td className="py-3.5 px-3 font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                          {retailer.code}
                        </td>
                      )}

                      {/* Shop & Proprietor */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {retailer.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {retailer.ownerName} · <span className="font-mono">{retailer.phone}</span>
                          </span>
                        </div>
                      </td>

                      {/* Town Column Requirement 4:
                          Show town once when town and district are same; show state for non-Telangana */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-900 block">{townInfo.primary}</span>
                        {townInfo.secondary && (
                          <span className="text-xs text-slate-400 block">{townInfo.secondary}</span>
                        )}
                      </td>

                      {/* Pricing Tier: Pending rows show "-" per Requirement 3 */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isPending || !retailer.pricingTier ? (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                              retailer.pricingTier === "Tier A++"
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : retailer.pricingTier === "Tier A+"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {retailer.pricingTier}
                          </span>
                        )}
                      </td>

                      {/* Credit Limit: Pending rows show "-" per Requirement 3 */}
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {isPending || !retailer.creditLimit ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          `₹${retailer.creditLimit.toLocaleString("en-IN")}`
                        )}
                      </td>

                      {/* Outstanding */}
                      {activeTab !== "pending" && (
                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {formatINR(retailer.outstanding || 0)}
                        </td>
                      )}

                      {/* Overdue */}
                      {activeTab !== "pending" && (
                        <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                          {retailer.overdue > 0 ? (
                            <span className="text-rose-600 font-bold">
                              {formatINR(retailer.overdue)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* Applied Date (Pending tab) */}
                      {activeTab === "pending" && (
                        <td className="py-3.5 px-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                          {retailer.appliedDate || "24 Oct 2026"}
                        </td>
                      )}

                      {/* Flags (Pending tab) */}
                      {activeTab === "pending" && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {isDuplicate ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                              <span className="material-symbols-outlined text-[15px] text-amber-700">warning</span>
                              <span>Possible duplicate</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium">
                              <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                              <span>Documents Ready</span>
                            </span>
                          )}
                        </td>
                      )}

                      {/* Action / Standing */}
                      <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {isPending ? (
                          <button
                            onClick={() => handleOpenReview(retailer)}
                            className="h-8 px-3.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                            type="button"
                          >
                            Review
                          </button>
                        ) : retailer.status === "Active" ? (
                          <button
                            onClick={() => handleOpenActiveProfile(retailer)}
                            className="h-8 px-3 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                            type="button"
                          >
                            <span>Profile</span>
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                            Deactivated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* DRAWER 1: NEEDS APPROVAL REVIEW DRAWER (max-w-lg, Slide-Over)        */}
      {/* ==================================================================== */}
      {selectedPendingRetailer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedPendingRetailer(null)}
        >
          <div
            className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 border-l border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Top Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/50">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold">
                    Needs Approval
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Applied on {selectedPendingRetailer.appliedDate || "24 Oct 2026"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {selectedPendingRetailer.name}
                </h2>
                <span className="text-xs text-slate-500">
                  Proprietor: {selectedPendingRetailer.ownerName} ·{" "}
                  <span className="font-mono">{selectedPendingRetailer.phone}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedPendingRetailer(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close drawer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Duplicate Phone Notice & Side-by-Side Comparison (if flagged) */}
              {selectedPendingRetailer.flags?.includes("Possible duplicate") && !dismissDuplicateNotice && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-amber-700 text-[20px] mt-0.5">warning</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                        Possible Duplicate Account Flagged
                      </span>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        The phone number <strong>{selectedPendingRetailer.phone}</strong> matches an existing active retailer ledger. Review below to prevent duplicate credit allocation.
                      </p>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        New Applicant
                      </span>
                      <div className="font-bold text-slate-900">{selectedPendingRetailer.name}</div>
                      <div className="text-slate-600">{selectedPendingRetailer.ownerName}</div>
                      <div className="text-slate-500 font-mono mt-1">{selectedPendingRetailer.town}</div>
                      <div className="text-amber-700 font-mono font-bold mt-1">
                        {selectedPendingRetailer.phone}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Existing Partner
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {existingDuplicateRetailer?.code || "RET-0017"}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{existingDuplicateRetailer?.name}</div>
                      <div className="text-slate-600">{existingDuplicateRetailer?.ownerName}</div>
                      <div className="text-slate-500 font-mono mt-1">{existingDuplicateRetailer?.town}</div>
                      <div className="text-amber-700 font-mono font-bold mt-1">
                        {existingDuplicateRetailer?.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setDismissDuplicateNotice(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                      type="button"
                    >
                      Dismiss flag (Verified separate shop)
                    </button>
                  </div>
                </div>
              )}

              {/* Shop & Location Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Shop Information
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Town / Station</span>
                    <span className="font-semibold text-slate-900">{selectedPendingRetailer.town}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">District</span>
                    <span className="font-semibold text-slate-900">{selectedPendingRetailer.district}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">State</span>
                    <span className="font-semibold text-slate-900">{selectedPendingRetailer.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Contact Phone</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedPendingRetailer.phone}</span>
                  </div>
                </div>
              </div>

              {/* GSTIN Check (Format & State Code vs Town) */}
              {(() => {
                const gstinCheck = validateGSTIN(
                  selectedPendingRetailer.gstin,
                  selectedPendingRetailer.state
                );

                return (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        GSTIN Verification
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {selectedPendingRetailer.gstin}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Check 1: Format */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-[18px] ${
                              gstinCheck.formatValid ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {gstinCheck.formatValid ? "check_circle" : "cancel"}
                          </span>
                          <span className="text-slate-700">15-digit Alphanumeric Format</span>
                        </div>
                        <span
                          className={`font-semibold ${
                            gstinCheck.formatValid ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {gstinCheck.formatValid ? "Valid Format" : "Invalid Pattern"}
                        </span>
                      </div>

                      {/* Check 2: State code matches town */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-[18px] ${
                              gstinCheck.stateCodeValid ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {gstinCheck.stateCodeValid ? "check_circle" : "warning"}
                          </span>
                          <span className="text-slate-700">
                            State Code vs Town ({gstinCheck.stateCode} · {selectedPendingRetailer.state})
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${
                            gstinCheck.stateCodeValid ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {gstinCheck.stateCodeValid ? "State Matches" : "State Code Mismatch"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Submitted Documents Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Documents Verified
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">description</span>
                      <span className="text-slate-800 font-medium">GST REG-06 Certificate</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">store</span>
                      <span className="text-slate-800 font-medium">Shop &amp; Establishment License</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Valid
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">badge</span>
                      <span className="text-slate-800 font-medium">Proprietor PAN Card</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">account_balance</span>
                      <span className="text-slate-800 font-medium">Cancelled Cheque (Bank Account)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Valid
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval Configuration Form (Labelled "Proposed" per Requirement 3) */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">tune</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Account Configuration
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-950 text-[10px] font-bold">
                    Proposed Defaults
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Proposed Pricing Tier */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                      <span>Proposed Pricing Tier</span>
                      <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Proposed
                      </span>
                    </label>
                    <select
                      value={proposedTier}
                      onChange={e => setProposedTier(e.target.value as PricingTier)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Tier A++">Tier A++ (High Volume · Net -5% Rebate)</option>
                      <option value="Tier A+">Tier A+ (Regular Wholesale · Net -3% Rebate)</option>
                      <option value="Tier A">Tier A (Standard Retail · Baseline)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      * Internal to ARK Backoffice. Retailer only sees final net price on catalogue.
                    </p>
                  </div>

                  {/* Proposed Credit Limit */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                      <span>Proposed Credit Limit (₹)</span>
                      <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Proposed
                      </span>
                    </label>
                    <input
                      type="number"
                      value={proposedCreditLimit}
                      onChange={e => setProposedCreditLimit(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {["50000", "100000", "250000", "500000"].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setProposedCreditLimit(amt)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          ₹{(Number(amt) / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Proposed Credit Terms */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                      <span>Proposed Credit Terms</span>
                      <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Proposed
                      </span>
                    </label>
                    <select
                      value={proposedCreditTerms}
                      onChange={e => setProposedCreditTerms(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value={15}>15 Days Net</option>
                      <option value={30}>30 Days Net (Standard)</option>
                      <option value={45}>45 Days Net</option>
                      <option value={60}>60 Days Net</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions per Requirement 2 */}
            <div className="p-4 border-t border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmApproval}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Approve &amp; Activate</span>
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="h-11 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-sm transition-colors cursor-pointer"
                  type="button"
                >
                  Reject
                </button>
              </div>
              <button
                onClick={() => setIsRequestInfoModalOpen(true)}
                className="w-full h-9 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">help_outline</span>
                <span>Request more info (SMS / WhatsApp)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DRAWER 2: ACTIVE RETAILER PROFILE DRAWER (max-w-xl, Slide-Over)      */}
      {/* ==================================================================== */}
      {selectedActiveRetailer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedActiveRetailer(null)}
        >
          <div
            className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 border-l border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                    {selectedActiveRetailer.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Active Partner
                  </span>
                  {selectedActiveRetailer.pricingTier && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-100 text-purple-900 border border-purple-200">
                      {selectedActiveRetailer.pricingTier}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {selectedActiveRetailer.name}
                </h2>
                <span className="text-xs text-slate-500">
                  {selectedActiveRetailer.ownerName} ·{" "}
                  <span className="font-mono">{selectedActiveRetailer.phone}</span> ·{" "}
                  <span className="font-mono">{selectedActiveRetailer.gstin}</span>
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  {formatTownDisplay(selectedActiveRetailer.town, selectedActiveRetailer.district, selectedActiveRetailer.state).primary} · {selectedActiveRetailer.state}
                </span>
              </div>
              <button
                onClick={() => setSelectedActiveRetailer(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close profile drawer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Profile Sub-tabs */}
            <div className="flex items-center gap-2 px-5 border-b border-slate-200 bg-white pt-2">
              <button
                onClick={() => setActiveProfileTab("overview")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Ledger &amp; Terms
              </button>
              <button
                onClick={() => setActiveProfileTab("invoices")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "invoices"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Invoices ({invoices.filter(i => i.retailerId === selectedActiveRetailer.id || i.retailerName === selectedActiveRetailer.name).length})
              </button>
              <button
                onClick={() => setActiveProfileTab("receipts")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "receipts"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Receipts ({payments.filter(p => p.retailerId === selectedActiveRetailer.id || p.retailerName === selectedActiveRetailer.name).length})
              </button>
              <button
                onClick={() => setActiveProfileTab("orders")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "orders"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Orders ({orders.filter(o => o.retailerId === selectedActiveRetailer.id || o.retailerName === selectedActiveRetailer.name).length})
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeProfileTab === "overview" && (
                <>
                  {/* Credit Meter Component */}
                  {(() => {
                    const limit = selectedActiveRetailer.creditLimit || 1;
                    const outstanding = selectedActiveRetailer.outstanding || 0;
                    const overdue = selectedActiveRetailer.overdue || 0;
                    const available = Math.max(0, limit - outstanding);
                    const usedPct = Math.min(100, Math.round((outstanding / limit) * 100));

                    return (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Credit Standing &amp; Meter
                          </span>
                          {overdue > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Overdue Alert: ₹{overdue.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              Good Standing
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              overdue > 0 || usedPct > 90
                                ? "bg-rose-500"
                                : usedPct > 70
                                ? "bg-amber-500"
                                : "bg-blue-600"
                            }`}
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-400 block text-[11px]">Approved Limit</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              ₹{limit.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-400 block text-[11px]">Current Outstanding</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              ₹{outstanding.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-slate-500">({usedPct}% utilized)</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-400 block text-[11px]">Available Credit</span>
                            <span className="font-mono font-bold text-emerald-700 text-sm">
                              ₹{available.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Ageing Breakdown Buckets */}
                  {(() => {
                    const targetLedger = ageingLedgers.find(
                      l => l.retailer.id === selectedActiveRetailer.id || l.retailer.code === selectedActiveRetailer.code
                    );

                    const notYetDue = targetLedger?.notYetDue ?? (selectedActiveRetailer.outstanding - selectedActiveRetailer.overdue);
                    const d1_30 = targetLedger?.d1_30 ?? selectedActiveRetailer.overdue;
                    const d31_60 = targetLedger?.d31_60 ?? 0;
                    const d60_plus = targetLedger?.d60_plus ?? 0;

                    return (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                          Receivables Ageing Breakdown
                        </span>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block">Current (Not Due)</span>
                            <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                              ₹{Math.max(0, notYetDue).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block">1–30 Days Overdue</span>
                            <span className={`font-mono font-bold mt-0.5 block ${d1_30 > 0 ? "text-amber-700" : "text-slate-400"}`}>
                              {d1_30 > 0 ? `₹${d1_30.toLocaleString("en-IN")}` : "—"}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block">31–60 Days Overdue</span>
                            <span className={`font-mono font-bold mt-0.5 block ${d31_60 > 0 ? "text-rose-600" : "text-slate-400"}`}>
                              {d31_60 > 0 ? `₹${d31_60.toLocaleString("en-IN")}` : "—"}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block">60+ Days Overdue</span>
                            <span className={`font-mono font-bold mt-0.5 block ${d60_plus > 0 ? "text-rose-700 font-black" : "text-slate-400"}`}>
                              {d60_plus > 0 ? `₹${d60_plus.toLocaleString("en-IN")}` : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Edit Pricing Tier and Limit Form */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">edit_note</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Edit Pricing Tier &amp; Credit Terms
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Backoffice Only</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Pricing Tier
                        </label>
                        <select
                          value={editTier}
                          onChange={e => setEditTier(e.target.value as PricingTier)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="Tier A++">Tier A++ (Net -5% Rebate)</option>
                          <option value="Tier A+">Tier A+ (Net -3% Rebate)</option>
                          <option value="Tier A">Tier A (Standard Retail)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Credit Terms
                        </label>
                        <select
                          value={editCreditTerms}
                          onChange={e => setEditCreditTerms(Number(e.target.value))}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value={15}>15 Days Net</option>
                          <option value={30}>30 Days Net</option>
                          <option value={45}>45 Days Net</option>
                          <option value={60}>60 Days Net</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Credit Limit (₹)
                        </label>
                        <input
                          type="number"
                          value={editCreditLimit}
                          onChange={e => setEditCreditLimit(e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveActiveProfile}
                        className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                        type="button"
                      >
                        Save Account Settings
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Invoices Sub-tab */}
              {activeProfileTab === "invoices" && (
                <div className="space-y-3">
                  {invoices.filter(i => i.retailerId === selectedActiveRetailer.id || i.retailerName === selectedActiveRetailer.name).length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No invoices issued for this retailer yet.
                    </div>
                  ) : (
                    invoices
                      .filter(i => i.retailerId === selectedActiveRetailer.id || i.retailerName === selectedActiveRetailer.name)
                      .map(inv => (
                        <div
                          key={inv.id}
                          onClick={() => setViewingInvoice(inv)}
                          className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-700">
                                {inv.invoiceNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === "Paid"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : inv.status === "Overdue"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 mt-0.5">
                              Billed: {inv.billedDate} · Due: {inv.dueDate}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              ₹{inv.grandTotal.toLocaleString("en-IN")}
                            </div>
                            {inv.balanceDue > 0 && (
                              <div className="text-[11px] text-rose-600 font-mono font-semibold">
                                Bal: ₹{inv.balanceDue.toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Receipts Sub-tab */}
              {activeProfileTab === "receipts" && (
                <div className="space-y-3">
                  {payments.filter(p => p.retailerId === selectedActiveRetailer.id || p.retailerName === selectedActiveRetailer.name).length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No payment receipts on record for this retailer.
                    </div>
                  ) : (
                    payments
                      .filter(p => p.retailerId === selectedActiveRetailer.id || p.retailerName === selectedActiveRetailer.name)
                      .map(rec => (
                        <div
                          key={rec.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{rec.receiptNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                {rec.mode}
                              </span>
                            </div>
                            <span className="text-slate-500 mt-0.5 font-mono">
                              {rec.date} · Ref: {rec.referenceId}
                            </span>
                          </div>
                          <div className="font-mono font-bold text-emerald-700 text-sm">
                            ₹{rec.amount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Orders Sub-tab */}
              {activeProfileTab === "orders" && (
                <div className="space-y-3">
                  {orders.filter(o => o.retailerId === selectedActiveRetailer.id || o.retailerName === selectedActiveRetailer.name).length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No purchase orders recorded for this retailer.
                    </div>
                  ) : (
                    orders
                      .filter(o => o.retailerId === selectedActiveRetailer.id || o.retailerName === selectedActiveRetailer.name)
                      .map(order => (
                        <div
                          key={order.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-700">{order.orderNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                                {order.status}
                              </span>
                            </div>
                            <span className="text-slate-500 mt-0.5">
                              {order.date} · {order.totalBoxes} boxes ({order.totalPieces} pcs)
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              ₹{order.grandTotal.toLocaleString("en-IN")}
                            </div>
                            <span className="text-[10px] text-slate-400">incl. GST</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedActiveRetailer(null)}
                className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REJECT RETAILER APPLICATION WITH REASON                       */}
      {/* ==================================================================== */}
      {isRejectModalOpen && selectedPendingRetailer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">block</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">
                  Reject Application for {selectedPendingRetailer.name}?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The applicant will be marked as Deactivated and notified with the selected rationale.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Rejection Reason (Required)
              </label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="Unverifiable business address">Unverifiable business address</option>
                <option value="Duplicate phone or applicant record">Duplicate phone or applicant record</option>
                <option value="Invalid or cancelled GSTIN">Invalid or cancelled GSTIN</option>
                <option value="Incomplete trade documentation">Incomplete trade documentation</option>
                <option value="Outside serviceable delivery zone">Outside serviceable delivery zone</option>
                <option value="Other">Other reason (specify below)</option>
              </select>

              {rejectReason === "Other" && (
                <textarea
                  value={customRejectReason}
                  onChange={e => setCustomRejectReason(e.target.value)}
                  placeholder="State the reason for rejecting this retailer registration..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REQUEST MORE INFO                                             */}
      {/* ==================================================================== */}
      {isRequestInfoModalOpen && selectedPendingRetailer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">send_to_mobile</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">
                  Request Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send document request to {selectedPendingRetailer.ownerName} ({selectedPendingRetailer.phone}).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Required Clarification / Document
              </label>
              <textarea
                value={infoRequestDetails}
                onChange={e => setInfoRequestDetails(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsRequestInfoModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInfoRequest}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Send WhatsApp / SMS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MANUAL ADD RETAILER                                           */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Add New Retail Partner</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Shop Name *</label>
                <input
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. Mahadev Garments"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Proprietor Name *</label>
                <input
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. M. Suresh"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Phone Number *</label>
                <input
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  placeholder="+91 9XXXX XXXXX"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Town / Village *</label>
                <input
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. Sircilla"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">District *</label>
                <input
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. Rajanna Sircilla"
                  type="text"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">GSTIN *</label>
                <input
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  placeholder="36XXXXX0000X1ZX"
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast("New retailer application submitted for onboarding.");
                  setIsAddModalOpen(false);
                }}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DistributorRetailers;
