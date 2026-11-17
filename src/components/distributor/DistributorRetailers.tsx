"use client";
import { Icon } from "@/components/ui/Icon";

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
import { Badge, StatusChip } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type SortField =
  | "code"
  | "name"
  | "town"
  | "gstin"
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
    setSelectedRetailer360Id,
    setDistributorNav,
  } = useApp();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "deactivated" | "all">("all");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedGstinStatus, setSelectedGstinStatus] = useState("");
  const [selectedDuplicateOnly, setSelectedDuplicateOnly] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTier, setSelectedTier] = useState("");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sort states
  const [sortField, setSortField] = useState<SortField>("code");
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

  // Master Breakdown Counts
  const apCount = useMemo(() => retailers.filter(r => r.state === "Andhra Pradesh").length, [retailers]);
  const tgCount = useMemo(() => retailers.filter(r => r.state === "Telangana").length, [retailers]);
  const validGstinCount = useMemo(() => retailers.filter(r => r.gstinStatus === "valid_format").length, [retailers]);
  const unregGstinCount = useMemo(() => retailers.filter(r => r.gstinStatus === "unregistered").length, [retailers]);
  const invalidGstinCount = useMemo(() => retailers.filter(r => r.gstinStatus === "invalid_format").length, [retailers]);
  const duplicateGroupCount = useMemo(() => retailers.filter(r => Boolean(r.duplicateGroup)).length, [retailers]);

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

      // State filter
      if (selectedState && r.state !== selectedState) {
        return false;
      }

      // GSTIN Status filter
      if (selectedGstinStatus && r.gstinStatus !== selectedGstinStatus) {
        return false;
      }

      // Duplicate Group filter
      if (selectedDuplicateOnly && !r.duplicateGroup) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.name.toLowerCase().includes(q) ||
          (r.tallyLedgerName && r.tallyLedgerName.toLowerCase().includes(q)) ||
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
  }, [retailers, activeTab, searchQuery, selectedState, selectedGstinStatus, selectedDuplicateOnly, selectedDistrict, selectedTier]);

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

  // Paginated Retailers
  const totalPages = Math.max(1, Math.ceil(sortedRetailers.length / pageSize));
  const paginatedRetailers = useMemo(() => {
    if (pageSize >= sortedRetailers.length) return sortedRetailers;
    const start = (currentPage - 1) * pageSize;
    return sortedRetailers.slice(start, start + pageSize);
  }, [sortedRetailers, currentPage, pageSize]);

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
    return retailers.find(r => r.id === "ret-6" || r.code === "RET-0006" || r.phone === selectedPendingRetailer.phone) || retailers[0] || null;
  }, [selectedPendingRetailer, retailers]);

  return (
    <div className="w-full flex flex-col gap-5 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === "error"
              ? "bg-danger/10 text-danger border-danger/30"
              : toast.type === "info"
              ? "bg-ink text-surface border-border"
              : "bg-success/10 text-success border-success/30"
          }`}
        >
          <Icon name={toast.type === "error" ? "error" : toast.type === "info" ? "info" : "check_circle"} size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Breadcrumb Context */}
      <div className="flex items-center justify-between py-0.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
          <span className="hover:text-ink transition-colors cursor-pointer">Operations</span>
          <Icon name="chevron_right" size={14} />
          <span className="text-ink font-bold">Retailers</span>
        </div>
        <div className="text-xs text-ink-muted font-mono">
          {retailers.length} Registered · {apCount} AP (IGST) · {tgCount} TS (CGST+SGST)
        </div>
      </div>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Retailers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-raised text-ink">
              {retailers.length} Registered
            </span>
          </div>
          <p className="text-sm text-ink-muted">
            Authorized retail partner directory, onboarding verification, and pricing tier control.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl bg-surface border border-border hover:bg-surface-raised text-ink font-semibold text-sm flex items-center gap-2 shadow-soft-sm transition-colors cursor-pointer"
            type="button"
          >
            <Icon name="file_download" size={18} className="text-ink-muted" />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <Icon name="add" size={18} />
            Add retailer
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => {
            setActiveTab("pending");
            setSelectedIds(new Set());
          }}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "pending"
              ? "bg-danger/10 text-danger shadow-soft-sm border border-danger/30"
              : "bg-transparent hover:bg-surface-raised text-ink-muted"
          }`}
        >
          <span>Needs approval</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === "pending"
                ? "bg-danger text-background"
                : "bg-surface-raised text-ink"
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
              ? "bg-primary/10 text-primary shadow-soft-sm border border-primary/20/60"
              : "bg-transparent hover:bg-surface-raised text-ink-muted"
          }`}
        >
          <span>Active</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === "active"
                ? "bg-primary text-white"
                : "bg-surface-raised text-ink"
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
              ? "bg-primary text-primary-foreground shadow-soft-sm"
              : "bg-transparent hover:bg-surface-raised text-ink-muted"
          }`}
        >
          <span>Deactivated</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === "deactivated"
                ? "bg-primary/90 text-primary-foreground"
                : "bg-surface-raised text-ink"
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
              ? "bg-surface-raised text-ink font-bold"
              : "bg-transparent hover:bg-surface-raised text-ink-muted"
          }`}
        >
          <span>All</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-surface-raised text-ink">
            {retailers.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3 rounded-2xl border border-border shadow-soft-sm flex flex-wrap lg:flex-nowrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            className="w-full h-10 pl-9 pr-4 bg-surface-raised border border-border rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Search shop name, owner, phone, GSTIN, town..."
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={e => {
              setSelectedState(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 bg-surface-raised border border-border hover:bg-surface-raised rounded-xl text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="">State: All ({retailers.length})</option>
            <option value="Andhra Pradesh">Andhra Pradesh ({apCount})</option>
            <option value="Telangana">Telangana ({tgCount})</option>
          </select>

          {/* GSTIN Compliance Filter */}
          <select
            value={selectedGstinStatus}
            onChange={e => {
              setSelectedGstinStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 bg-surface-raised border border-border hover:bg-surface-raised rounded-xl text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="">GSTIN: All</option>
            <option value="valid_format">Valid Format ({validGstinCount})</option>
            <option value="unregistered">Unregistered ({unregGstinCount})</option>
            <option value="invalid_format">Review Required ({invalidGstinCount})</option>
          </select>

          {/* Duplicate GSTIN Toggle */}
          {duplicateGroupCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedDuplicateOnly(prev => !prev);
                setCurrentPage(1);
              }}
              className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedDuplicateOnly
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-soft-xs"
                  : "bg-surface-raised border-border text-ink-muted hover:text-ink"
              }`}
              title="Show stores sharing identical GSTINs"
            >
              <Icon name="content_copy" size={14} className={selectedDuplicateOnly ? "text-amber-500" : ""} />
              <span>Shared GSTIN ({duplicateGroupCount})</span>
            </button>
          )}

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={e => {
              setSelectedDistrict(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 bg-surface-raised border border-border hover:bg-surface-raised rounded-xl text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
              onChange={e => {
                setSelectedTier(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 bg-surface-raised border border-border hover:bg-surface-raised rounded-xl text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">Tier: All</option>
              <option value="Tier A++">Tier A++ (High Volume)</option>
              <option value="Tier A+">Tier A+ (Regular)</option>
              <option value="Tier A">Tier A (Standard)</option>
            </select>
          )}

          {(searchQuery || selectedDistrict || selectedTier || selectedState || selectedGstinStatus || selectedDuplicateOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDistrict("");
                setSelectedTier("");
                setSelectedState("");
                setSelectedGstinStatus("");
                setSelectedDuplicateOnly(false);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-md text-xs font-semibold text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* FULL-WIDTH TABLE CONTAINER (Never squished) */}
      <div className="w-full bg-surface rounded-2xl border border-border shadow-soft-sm overflow-hidden">
        {/* Deactivated Tab Empty State per Requirement 6 */}
        {activeTab === "deactivated" && sortedRetailers.length === 0 ? (
          <div className="py-20 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center text-ink-muted mb-4">
              <Icon name="person_off" size={32} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">No deactivated retailers</h3>
            <p className="text-sm text-ink-muted mb-6">
              All registered retail partner accounts are active and in good operational standing.
            </p>
            <button
              onClick={() => setActiveTab("active")}
              className="px-4 py-2 rounded-xl bg-ink text-surface text-xs font-semibold hover:bg-surface transition-colors cursor-pointer"
              type="button"
            >
              View Active Retailers ({activeCount})
            </button>
          </div>
        ) : sortedRetailers.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            No retailers found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-surface-raised border-b border-border text-ink-muted text-xs font-semibold uppercase tracking-wider font-mono select-none">
                <tr>
                  <th className="py-2.5 pl-4 pr-2 w-10">
                    <input
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === sortedRetailers.length}
                      onChange={toggleSelectAll}
                    />
                  </th>

                  <th
                    className="py-3.5 px-3 whitespace-nowrap cursor-pointer hover:text-ink"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Code</span>
                      {sortField === "code" && (
                        <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
                      )}
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:text-ink"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Shop &amp; Proprietor</span>
                      {sortField === "name" && (
                        <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
                      )}
                    </div>
                  </th>

                  {/* Town Column Requirement 4 */}
                  <th
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:text-ink"
                    onClick={() => handleSort("town")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Town / Station</span>
                      {sortField === "town" && (
                        <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
                      )}
                    </div>
                  </th>

                  {/* GSTIN & Compliance */}
                  <th
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:text-ink"
                    onClick={() => handleSort("gstin")}
                  >
                    <div className="flex items-center gap-1">
                      <span>GSTIN &amp; Compliance</span>
                      {sortField === "gstin" && (
                        <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
                      )}
                    </div>
                  </th>

                  {/* Tier Column: Pending rows show "-" per Requirement 3 */}
                  <th
                    className="py-3.5 px-3 whitespace-nowrap cursor-pointer hover:text-ink"
                    onClick={() => handleSort("pricingTier")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Pricing Tier</span>
                      {sortField === "pricingTier" && (
                        <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
                      )}
                    </div>
                  </th>

                  {/* Credit Limit Column: Pending rows show "-" per Requirement 3 */}
                  <th
                    className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-ink"
                    onClick={() => handleSort("creditLimit")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Credit Limit</span>
                      {sortField === "creditLimit" && (
                        <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
                      )}
                    </div>
                  </th>

                  {activeTab !== "pending" && (
                    <th
                      className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-ink"
                      onClick={() => handleSort("outstanding")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Outstanding</span>
                        {sortField === "outstanding" && (
                          <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
                        )}
                      </div>
                    </th>
                  )}

                  {activeTab !== "pending" && (
                    <th
                      className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-ink"
                      onClick={() => handleSort("overdue")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Overdue</span>
                        {sortField === "overdue" && (
                          <Icon name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"} size={14} />
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
              <tbody className="divide-y divide-border text-sm text-ink">
                {paginatedRetailers.map(retailer => {
                  const isPending = retailer.status === "Needs Approval";
                  const isDuplicate = Boolean(retailer.flags?.includes("Possible duplicate") || retailer.duplicateGroup);
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
                          ? "bg-primary/10/70"
                          : isSelected
                          ? "bg-surface-raised"
                          : "hover:bg-surface-raised/80"
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="py-2.5 sm:py-3 pl-4 pr-2" onClick={e => e.stopPropagation()}>
                        <input
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                      <td className="py-2.5 sm:py-3 px-3 font-mono num text-xs font-bold text-primary whitespace-nowrap">
                        {retailer.code}
                      </td>

                      {/* Shop & Proprietor */}
                      <td className="py-2.5 sm:py-3 px-4 min-w-[220px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink group-hover:text-primary transition-colors font-sans">
                            {retailer.name}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {retailer.ownerName} · <span className="font-mono num">{retailer.phone}</span>
                          </span>
                        </div>
                      </td>

                      {/* Town Column Requirement 4:
                          Show town once when town and district are same; show state for non-Telangana */}
                      <td className="py-2.5 sm:py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-ink block">{townInfo.primary}</span>
                        {townInfo.secondary && (
                          <span className="text-xs text-ink-muted block">{townInfo.secondary}</span>
                        )}
                      </td>

                      {/* GSTIN & Compliance */}
                      <td className="py-2.5 sm:py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            {retailer.gstin ? (
                              <span className="font-mono num text-xs font-medium text-ink">
                                {retailer.gstin}
                              </span>
                            ) : (
                              <span className="text-xs text-ink-muted italic">Unregistered</span>
                            )}
                            {retailer.gstinStatus === "valid_format" ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <Icon name="check" size={10} /> Valid
                              </span>
                            ) : retailer.gstinStatus === "invalid_format" ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse" title={retailer.flags}>
                                <Icon name="warning" size={10} /> Check char 14
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                Composite
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                            <span className="font-mono">
                              {retailer.taxType || (retailer.state === "Telangana" ? "CGST+SGST" : "IGST")}
                            </span>
                            {retailer.duplicateGroup && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30" title={`Duplicate group: ${retailer.duplicateGroup}`}>
                                <Icon name="content_copy" size={10} /> Shared
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Pricing Tier */}
                      <td className="py-2.5 sm:py-3 px-3 whitespace-nowrap">
                        {isPending || !retailer.pricingTier ? (
                          <span className="text-ink-muted font-mono text-xs">—</span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                              retailer.pricingTier === "Tier A++"
                                ? "bg-accent/15 text-accent border border-accent/30"
                                : retailer.pricingTier === "Tier A+"
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "bg-surface-raised text-ink border border-border"
                            }`}
                          >
                            {retailer.pricingTier}
                          </span>
                        )}
                      </td>

                      {/* Credit Limit */}
                      <td className="py-2.5 sm:py-3 px-3 text-right font-mono num font-medium text-ink whitespace-nowrap">
                        {isPending || !retailer.creditLimit ? (
                          <span className="text-ink-muted">—</span>
                        ) : (
                          `₹${retailer.creditLimit.toLocaleString("en-IN")}`
                        )}
                      </td>

                      {/* Outstanding */}
                      {activeTab !== "pending" && (
                        <td className="py-2.5 sm:py-3 px-3 text-right font-mono num font-semibold text-ink whitespace-nowrap">
                          {formatINR(retailer.outstanding || 0)}
                        </td>
                      )}

                      {/* Overdue */}
                      {activeTab !== "pending" && (
                        <td className="py-2.5 sm:py-3 px-3 text-right font-mono num whitespace-nowrap">
                          {retailer.overdue > 0 ? (
                            <span className="text-danger font-bold">
                              {formatINR(retailer.overdue)}
                            </span>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                      )}

                      {/* Applied Date (Pending tab) */}
                      {activeTab === "pending" && (
                        <td className="py-2.5 sm:py-3 px-3 text-xs text-ink-muted font-mono num whitespace-nowrap">
                          {retailer.appliedDate || "24 Oct 2026"}
                        </td>
                      )}

                      {/* Flags (Pending tab) */}
                      {activeTab === "pending" && (
                        <td className="py-2.5 sm:py-3 px-3 whitespace-nowrap">
                          {isDuplicate ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 text-xs font-bold">
                              <Icon name="warning" size={14} className="text-warning" />
                              <span>Possible duplicate</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 text-xs font-medium">
                              <Icon name="verified" size={14} className="text-success" />
                              <span>Documents Ready</span>
                            </span>
                          )}
                        </td>
                      )}

                      {/* Action / Standing */}
                      <td className="py-2.5 sm:py-3 pr-4 pl-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {isPending ? (
                          <button
                            onClick={() => handleOpenReview(retailer)}
                            className="h-8 px-3.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                            type="button"
                          >
                            Review
                          </button>
                        ) : retailer.status === "Active" ? (
                          <button
                            onClick={() => handleOpenActiveProfile(retailer)}
                            className="h-8 px-3 rounded-lg text-ink-muted hover:text-primary hover:bg-surface-raised text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                            type="button"
                          >
                            <span>Profile</span>
                            <Icon name="chevron_right" size={16} />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30 text-xs font-semibold">
                            Deactivated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {sortedRetailers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12">
                      <EmptyState
                        icon={<Icon name="store" size={28} />}
                        title="No retailers found"
                        description="Try adjusting your search query, state, district, or compliance status filter."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {sortedRetailers.length > 0 && (
          <div className="p-4 border-t border-border bg-surface-raised/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted select-none">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="text-ink font-mono">{Math.min(sortedRetailers.length, (currentPage - 1) * pageSize + 1)}</strong> to{" "}
                <strong className="text-ink font-mono">{Math.min(sortedRetailers.length, currentPage * pageSize)}</strong> of{" "}
                <strong className="text-ink font-mono">{sortedRetailers.length}</strong> retailers
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-7 px-2 bg-surface border border-border rounded-lg text-xs font-mono text-ink focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>All (200)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-8 px-3 rounded-lg border border-border bg-surface text-ink hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Icon name="chevron_left" size={16} />
                <span>Previous</span>
              </button>

              <span className="px-3 font-mono font-medium text-ink">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 px-3 rounded-lg border border-border bg-surface text-ink hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Next</span>
                <Icon name="chevron_right" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* DRAWER 1: NEEDS APPROVAL REVIEW DRAWER (max-w-lg, Slide-Over)        */}
      {/* ==================================================================== */}
      {selectedPendingRetailer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPendingRetailer(null)}
        >
          <div
            className="w-full max-w-lg h-full bg-surface shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 border-l border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Top Header */}
            <div className="p-5 border-b border-border flex items-start justify-between gap-3 bg-surface-raised/50">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30 text-xs font-bold">
                    Needs Approval
                  </span>
                  <span className="text-xs text-ink-muted font-mono">
                    Applied on {selectedPendingRetailer.appliedDate || "24 Oct 2026"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-ink tracking-tight">
                  {selectedPendingRetailer.name}
                </h2>
                <span className="text-xs text-ink-muted">
                  Proprietor: {selectedPendingRetailer.ownerName} ·{" "}
                  <span className="font-mono">{selectedPendingRetailer.phone}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedPendingRetailer(null)}
                className="w-8 h-8 rounded-lg hover:bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                title="Close drawer"
                type="button"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Duplicate Phone Notice & Side-by-Side Comparison (if flagged) */}
              {selectedPendingRetailer.flags?.includes("Possible duplicate") && !dismissDuplicateNotice && (
                <div className="p-4 rounded-md bg-warning/10 border border-warning/30 text-ink space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Icon name="warning" size={20} className="text-warning mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase tracking-wider text-warning">
                        Possible Duplicate Account Flagged
                      </span>
                      <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                        The phone number <strong>{selectedPendingRetailer.phone}</strong> matches an existing active retailer ledger. Review below to prevent duplicate credit allocation.
                      </p>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-md bg-surface/90 border border-warning/30">
                      <span className="text-[10px] uppercase font-bold text-ink-muted block mb-1">
                        New Applicant
                      </span>
                      <div className="font-bold text-ink">{selectedPendingRetailer.name}</div>
                      <div className="text-ink-muted">{selectedPendingRetailer.ownerName}</div>
                      <div className="text-ink-muted font-mono mt-1">{selectedPendingRetailer.town}</div>
                      <div className="text-warning font-mono font-bold mt-1">
                        {selectedPendingRetailer.phone}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-md bg-surface/90 border border-warning/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-ink-muted block">
                          Existing Partner
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-success/10 text-success">
                          {existingDuplicateRetailer?.code || "RET-0017"}
                        </span>
                      </div>
                      <div className="font-bold text-ink">{existingDuplicateRetailer?.name}</div>
                      <div className="text-ink-muted">{existingDuplicateRetailer?.ownerName}</div>
                      <div className="text-ink-muted font-mono mt-1">{existingDuplicateRetailer?.town}</div>
                      <div className="text-warning font-mono font-bold mt-1">
                        {existingDuplicateRetailer?.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setDismissDuplicateNotice(true)}
                      className="px-3 py-1.5 rounded-md bg-warning/20 hover:bg-warning/30 text-warning text-xs font-semibold transition-colors cursor-pointer"
                      type="button"
                    >
                      Dismiss flag (Verified separate shop)
                    </button>
                  </div>
                </div>
              )}

              {/* Shop & Location Details */}
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
                  Shop Information
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-ink-muted block">Town / Station</span>
                    <span className="font-semibold text-ink">{selectedPendingRetailer.town}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block">District</span>
                    <span className="font-semibold text-ink">{selectedPendingRetailer.district}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block">State</span>
                    <span className="font-semibold text-ink">{selectedPendingRetailer.state}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block">Contact Phone</span>
                    <span className="font-mono font-semibold text-ink">{selectedPendingRetailer.phone}</span>
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
                  <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                        GSTIN Verification
                      </span>
                      <span className="font-mono text-xs font-bold text-ink bg-surface px-2 py-0.5 rounded border border-border">
                        {selectedPendingRetailer.gstin}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Check 1: Format */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                        <div className="flex items-center gap-2">
                          <Icon name={gstinCheck.formatValid ? "check_circle" : "cancel"} size={18} className={`${ gstinCheck.formatValid ? "text-success" : "text-danger" }`} />
                          <span className="text-ink">15-digit Alphanumeric Format</span>
                        </div>
                        <span
                          className={`font-semibold ${
                            gstinCheck.formatValid ? "text-success" : "text-danger"
                          }`}
                        >
                          {gstinCheck.formatValid ? "Valid Format" : "Invalid Pattern"}
                        </span>
                      </div>

                      {/* Check 2: State code matches town */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                        <div className="flex items-center gap-2">
                          <Icon name={gstinCheck.stateCodeValid ? "check_circle" : "warning"} size={18} className={`${ gstinCheck.stateCodeValid ? "text-success" : "text-warning" }`} />
                          <span className="text-ink">
                            State Code vs Town ({gstinCheck.stateCode} · {selectedPendingRetailer.state})
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${
                            gstinCheck.stateCodeValid ? "text-success" : "text-warning"
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
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
                  Documents Verified
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="description" size={18} className="text-primary" />
                      <span className="text-ink font-medium">GST REG-06 Certificate</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/30">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="store" size={18} className="text-primary" />
                      <span className="text-ink font-medium">Shop &amp; Establishment License</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/30">
                      Valid
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="badge" size={18} className="text-primary" />
                      <span className="text-ink font-medium">Proprietor PAN Card</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/30">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="account_balance" size={18} className="text-primary" />
                      <span className="text-ink font-medium">Cancelled Cheque (Bank Account)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/30">
                      Valid
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval Configuration Form (Labelled "Proposed" per Requirement 3) */}
              <div className="p-4 rounded-xl bg-primary/10/60 border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="tune" size={20} className="text-primary" />
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
                    <label className="text-xs font-semibold text-ink flex items-center justify-between mb-1">
                      <span>Proposed Pricing Tier</span>
                      <span className="text-[10px] text-primary font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Proposed
                      </span>
                    </label>
                    <select
                      value={proposedTier}
                      onChange={e => setProposedTier(e.target.value as PricingTier)}
                      className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Tier A++">Tier A++ (High Volume · Net -5% Rebate)</option>
                      <option value="Tier A+">Tier A+ (Regular Wholesale · Net -3% Rebate)</option>
                      <option value="Tier A">Tier A (Standard Retail · Baseline)</option>
                    </select>
                    <p className="text-[11px] text-ink-muted mt-1">
                      * Internal to ARK Backoffice. Retailer only sees final net price on catalogue.
                    </p>
                  </div>

                  {/* Proposed Credit Limit */}
                  <div>
                    <label className="text-xs font-semibold text-ink flex items-center justify-between mb-1">
                      <span>Proposed Credit Limit (₹)</span>
                      <span className="text-[10px] text-primary font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Proposed
                      </span>
                    </label>
                    <input
                      type="number"
                      value={proposedCreditLimit}
                      onChange={e => setProposedCreditLimit(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-xs font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {["50000", "100000", "250000", "500000"].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setProposedCreditLimit(amt)}
                          className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-mono text-ink hover:bg-surface-raised cursor-pointer"
                        >
                          ₹{(Number(amt) / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Proposed Credit Terms */}
                  <div>
                    <label className="text-xs font-semibold text-ink flex items-center justify-between mb-1">
                      <span>Proposed Credit Terms</span>
                      <span className="text-[10px] text-primary font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                        Proposed
                      </span>
                    </label>
                    <select
                      value={proposedCreditTerms}
                      onChange={e => setProposedCreditTerms(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <div className="p-4 border-t border-border bg-surface space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmApproval}
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  type="button"
                >
                  <Icon name="verified" size={18} />
                  <span>Approve &amp; Activate</span>
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="h-11 px-4 rounded-md bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 font-semibold text-sm transition-colors cursor-pointer"
                  type="button"
                >
                  Reject
                </button>
              </div>
              <button
                onClick={() => setIsRequestInfoModalOpen(true)}
                className="w-full h-9 rounded-lg hover:bg-surface-raised text-ink-muted hover:text-ink text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                type="button"
              >
                <Icon name="help_outline" size={16} />
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
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedActiveRetailer(null)}
        >
          <div
            className="w-full max-w-xl h-full bg-surface shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 border-l border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border bg-surface-raised/50 flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary">
                    {selectedActiveRetailer.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success">
                    Active Partner
                  </span>
                  {selectedActiveRetailer.pricingTier && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-accent/10 text-accent border border-accent/20">
                      {selectedActiveRetailer.pricingTier}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-ink tracking-tight">
                  {selectedActiveRetailer.name}
                </h2>
                <span className="text-xs text-ink-muted">
                  {selectedActiveRetailer.ownerName} ·{" "}
                  <span className="font-mono">{selectedActiveRetailer.phone}</span> ·{" "}
                  <span className="font-mono">{selectedActiveRetailer.gstin}</span>
                </span>
                <span className="text-xs text-ink-muted mt-0.5">
                  {formatTownDisplay(selectedActiveRetailer.town, selectedActiveRetailer.district, selectedActiveRetailer.state).primary} · {selectedActiveRetailer.state}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRetailer360Id(selectedActiveRetailer.id);
                    setSelectedActiveRetailer(null);
                    setDistributorNav("retailer-360");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-soft-xs hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <span>Open 360 Profile</span>
                  <Icon name="open_in_new" size={14} />
                </button>
                <button
                  onClick={() => setSelectedActiveRetailer(null)}
                  className="w-8 h-8 rounded-lg hover:bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                  title="Close profile drawer"
                  type="button"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
            </div>

            {/* Profile Sub-tabs */}
            <div className="flex items-center gap-2 px-5 border-b border-border bg-surface pt-2">
              <button
                onClick={() => setActiveProfileTab("overview")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "overview"
                    ? "border-blue-600 text-primary"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                Ledger &amp; Terms
              </button>
              <button
                onClick={() => setActiveProfileTab("invoices")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "invoices"
                    ? "border-blue-600 text-primary"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                Invoices ({invoices.filter(i => i.retailerId === selectedActiveRetailer.id || i.retailerName === selectedActiveRetailer.name).length})
              </button>
              <button
                onClick={() => setActiveProfileTab("receipts")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "receipts"
                    ? "border-blue-600 text-primary"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                Receipts ({payments.filter(p => p.retailerId === selectedActiveRetailer.id || p.retailerName === selectedActiveRetailer.name).length})
              </button>
              <button
                onClick={() => setActiveProfileTab("orders")}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeProfileTab === "orders"
                    ? "border-blue-600 text-primary"
                    : "border-transparent text-ink-muted hover:text-ink"
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
                      <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                            Credit Standing &amp; Meter
                          </span>
                          {overdue > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/30">
                              Overdue Alert: ₹{overdue.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success">
                              Good Standing
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-surface-raised h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              overdue > 0 || usedPct > 90
                                ? "bg-danger"
                                : usedPct > 70
                                ? "bg-warning"
                                : "bg-primary"
                            }`}
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                          <div className="p-2.5 rounded-lg bg-surface border border-border">
                            <span className="text-ink-muted block text-[11px]">Approved Limit</span>
                            <span className="font-mono font-bold text-ink text-sm">
                              ₹{limit.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-surface border border-border">
                            <span className="text-ink-muted block text-[11px]">Current Outstanding</span>
                            <span className="font-mono font-bold text-ink text-sm">
                              ₹{outstanding.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-ink-muted">({usedPct}% utilized)</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-surface border border-border">
                            <span className="text-ink-muted block text-[11px]">Available Credit</span>
                            <span className="font-mono font-bold text-success text-sm">
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
                      <div className="p-4 rounded-md bg-surface-raised border border-border space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
                          Receivables Ageing Breakdown
                        </span>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-surface border border-border text-center">
                            <span className="text-[10px] text-ink-muted block">Current (Not Due)</span>
                            <span className="font-mono font-bold text-ink mt-0.5 block">
                              ₹{Math.max(0, notYetDue).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface border border-border text-center">
                            <span className="text-[10px] text-ink-muted block">1–30 Days Overdue</span>
                            <span className={`font-mono font-bold mt-0.5 block ${d1_30 > 0 ? "text-warning" : "text-ink-muted"}`}>
                              {d1_30 > 0 ? `₹${d1_30.toLocaleString("en-IN")}` : "—"}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface border border-border text-center">
                            <span className="text-[10px] text-ink-muted block">31–60 Days Overdue</span>
                            <span className={`font-mono font-bold mt-0.5 block ${d31_60 > 0 ? "text-danger" : "text-ink-muted"}`}>
                              {d31_60 > 0 ? `₹${d31_60.toLocaleString("en-IN")}` : "—"}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-surface border border-border text-center">
                            <span className="text-[10px] text-ink-muted block">60+ Days Overdue</span>
                            <span className={`font-mono font-bold mt-0.5 block ${d60_plus > 0 ? "text-danger font-black" : "text-ink-muted"}`}>
                              {d60_plus > 0 ? `₹${d60_plus.toLocaleString("en-IN")}` : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Edit Pricing Tier and Limit Form */}
                  <div className="p-4 rounded-md bg-surface border border-border shadow-soft-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="edit_note" size={20} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-ink">
                          Edit Pricing Tier &amp; Credit Terms
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted font-mono">Backoffice Only</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-ink block mb-1">
                          Pricing Tier
                        </label>
                        <select
                          value={editTier}
                          onChange={e => setEditTier(e.target.value as PricingTier)}
                          className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="Tier A++">Tier A++ (Net -5% Rebate)</option>
                          <option value="Tier A+">Tier A+ (Net -3% Rebate)</option>
                          <option value="Tier A">Tier A (Standard Retail)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-ink block mb-1">
                          Credit Terms
                        </label>
                        <select
                          value={editCreditTerms}
                          onChange={e => setEditCreditTerms(Number(e.target.value))}
                          className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value={15}>15 Days Net</option>
                          <option value={30}>30 Days Net</option>
                          <option value={45}>45 Days Net</option>
                          <option value={60}>60 Days Net</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-ink block mb-1">
                          Credit Limit (₹)
                        </label>
                        <input
                          type="number"
                          value={editCreditLimit}
                          onChange={e => setEditCreditLimit(e.target.value)}
                          className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl text-xs font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveActiveProfile}
                        className="h-9 px-4 rounded-xl bg-surface-raised hover:bg-surface text-white font-semibold text-xs transition-colors cursor-pointer"
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
                    <div className="py-12 text-center text-ink-muted text-xs">
                      No invoices issued for this retailer yet.
                    </div>
                  ) : (
                    invoices
                      .filter(i => i.retailerId === selectedActiveRetailer.id || i.retailerName === selectedActiveRetailer.name)
                      .map(inv => (
                        <div
                          key={inv.id}
                          onClick={() => setViewingInvoice(inv)}
                          className="p-3.5 rounded-xl bg-surface-raised hover:bg-primary/10/50 border border-border transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary">
                                {inv.invoiceNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === "Paid"
                                    ? "bg-success/15 text-success border border-success/30"
                                    : inv.status === "Overdue"
                                    ? "bg-danger/15 text-danger border border-danger/30"
                                    : "bg-warning/15 text-warning border border-warning/30"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>
                            <span className="text-xs text-ink-muted mt-0.5">
                              Billed: {inv.billedDate} · Due: {inv.dueDate}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-ink text-xs">
                              ₹{inv.grandTotal.toLocaleString("en-IN")}
                            </div>
                            {inv.balanceDue > 0 && (
                              <div className="text-[11px] text-danger font-mono font-semibold">
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
                    <div className="py-12 text-center text-ink-muted text-xs">
                      No payment receipts on record for this retailer.
                    </div>
                  ) : (
                    payments
                      .filter(p => p.retailerId === selectedActiveRetailer.id || p.retailerName === selectedActiveRetailer.name)
                      .map(rec => (
                        <div
                          key={rec.id}
                          className="p-3.5 rounded-md bg-surface-raised border border-border flex items-center justify-between text-xs"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-ink">{rec.receiptNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised text-ink">
                                {rec.mode}
                              </span>
                            </div>
                            <span className="text-ink-muted mt-0.5 font-mono">
                              {rec.date} · Ref: {rec.referenceId}
                            </span>
                          </div>
                          <div className="font-mono font-bold text-success text-sm">
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
                    <div className="py-12 text-center text-ink-muted text-xs">
                      No purchase orders recorded for this retailer.
                    </div>
                  ) : (
                    orders
                      .filter(o => o.retailerId === selectedActiveRetailer.id || o.retailerName === selectedActiveRetailer.name)
                      .map(order => (
                        <div
                          key={order.id}
                          className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between text-xs"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised text-ink">
                                {order.status}
                              </span>
                            </div>
                            <span className="text-ink-muted mt-0.5">
                              {order.date} · {order.totalBoxes} boxes ({order.totalPieces} pcs)
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-ink text-xs">
                              ₹{order.grandTotal.toLocaleString("en-IN")}
                            </div>
                            <span className="text-[10px] text-ink-muted">incl. GST</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 border-t border-border bg-surface-raised flex items-center justify-end">
              <button
                onClick={() => setSelectedActiveRetailer(null)}
                className="h-10 px-5 rounded-xl bg-surface-raised hover:bg-surface text-white font-semibold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6 space-y-5 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-danger/10 flex items-center justify-center text-danger border border-danger/30 flex-shrink-0">
                <Icon name="block" size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-ink">
                  Reject Application for {selectedPendingRetailer.name}?
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  The applicant will be marked as Deactivated and notified with the selected rationale.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-ink block">
                Rejection Reason (Required)
              </label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-danger/20"
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
                  className="w-full p-3 bg-surface-raised border border-border rounded-md text-xs text-ink focus:outline-none focus:ring-2 focus:ring-danger/20 resize-none"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="h-10 px-4 rounded-md bg-surface-raised hover:bg-surface text-ink font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                className="h-10 px-5 rounded-md bg-danger hover:opacity-90 text-white font-semibold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-primary flex-shrink-0">
                <Icon name="send_to_mobile" size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-ink">
                  Request Information
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Send document request to {selectedPendingRetailer.ownerName} ({selectedPendingRetailer.phone}).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-ink block">
                Required Clarification / Document
              </label>
              <textarea
                value={infoRequestDetails}
                onChange={e => setInfoRequestDetails(e.target.value)}
                rows={3}
                className="w-full p-3 bg-surface-raised border border-border rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsRequestInfoModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-surface-raised hover:bg-surface-raised text-ink font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInfoRequest}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                type="button"
              >
                <Icon name="send" size={16} />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Add New Retail Partner</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center cursor-pointer"
                type="button"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-ink">Shop Name *</label>
                <input
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl"
                  placeholder="e.g. Mahadev Garments"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-ink">Proprietor Name *</label>
                <input
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl"
                  placeholder="e.g. M. Suresh"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-ink">Phone Number *</label>
                <input
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl font-mono"
                  placeholder="+91 9XXXX XXXXX"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-ink">Town / Village *</label>
                <input
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl"
                  placeholder="e.g. Sircilla"
                  type="text"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-ink">District *</label>
                <input
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl"
                  placeholder="e.g. Rajanna Sircilla"
                  type="text"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-ink">GSTIN *</label>
                <input
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-xl font-mono uppercase"
                  placeholder="e.g. 15-digit GST identification number"
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-surface-raised hover:bg-surface-raised text-ink font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast("New retailer application submitted for onboarding.");
                  setIsAddModalOpen(false);
                }}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-colors cursor-pointer"
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
