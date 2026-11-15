"use client";
import { Icon } from "@/components/ui/Icon";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  RETAILER_PROFILE,
  RetailerContact,
  getRetailerFinancials,
  formatINR,
  isDemoModeEnabled,
} from "@/lib/mock/retailer";
import { useAuth } from "@/context/AuthContext";
import { RetailerRequestType, ComplaintType } from "@/lib/mock";
import CreditMeter from "@/components/retailer/CreditMeter";

export default function MyAccountView() {
  const {
    setRetailerNav,
    currentDate,
    retailerRequests,
    addRetailerRequest,
    complaints,
    addComplaint,
  } = useApp();
  const { user } = useAuth();
  const effectiveRetailerId = user?.retailerId || "ret-1";

  // Filter requests and complaints for this logged-in retailer only
  const myRequests = retailerRequests.filter((r) => r.retailerId === effectiveRetailerId);
  const myComplaints = complaints.filter((c) => c.retailerId === effectiveRetailerId);

  // Modals for Retailer Portal
  const [isRaiseRequestOpen, setIsRaiseRequestOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);

  // Raise Request Form
  const [requestType, setRequestType] = useState<RetailerRequestType>("credit_limit");
  const [reqLimit, setReqLimit] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [reqAddress, setReqAddress] = useState("");
  const [reqTown, setReqTown] = useState("");
  const [reqPincode, setReqPincode] = useState("");
  const [reqProductName, setReqProductName] = useState("");
  const [reqBrand, setReqBrand] = useState("Within");
  const [reqNotes, setReqNotes] = useState("");

  // Report Issue Form
  const [complaintType, setComplaintType] = useState<ComplaintType>("shortage");
  const [complaintOrder, setComplaintOrder] = useState("");
  const [complaintNotes, setComplaintNotes] = useState("");

  // Profile editable state
  const [profile, setProfile] = useState({
    name: RETAILER_PROFILE.name,
    proprietor: RETAILER_PROFILE.proprietor,
    gstin: RETAILER_PROFILE.gstin,
    address: RETAILER_PROFILE.address,
    phone: RETAILER_PROFILE.phone,
    email: RETAILER_PROFILE.email || "narasimha.textiles.sdp@gmail.com",
    deliveryAddress: RETAILER_PROFILE.deliveryAddress || RETAILER_PROFILE.address,
    preferredTransporter: RETAILER_PROFILE.preferredTransporter,
    destinationBookingPoint: RETAILER_PROFILE.destinationBookingPoint || "Siddipet Central Booking Office",
  });

  // Contacts list state
  const [contacts, setContacts] = useState<RetailerContact[]>(
    RETAILER_PROFILE.authorizedContacts || [
      {
        id: "c-1",
        name: "T. Narasimha Rao",
        role: "Proprietor & Primary Buyer",
        phone: "+91 94401 23456",
        isPrimary: true,
      },
      {
        id: "c-2",
        name: "T. Venkat Rao",
        role: "Store Manager & Inventory In-charge",
        phone: "+91 98480 11223",
        isPrimary: false,
      },
    ]
  );

  // Notification preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    dispatchAlerts: true,
    paymentReminders: true,
    channel: "whatsapp" as "whatsapp" | "sms" | "both",
  });

  // Preferences
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "te" | "ta">("en");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Modals & form state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Edit form state with validation
  const [editForm, setEditForm] = useState({
    name: profile.name,
    proprietor: profile.proprietor,
    gstin: profile.gstin,
    address: profile.address,
    phone: profile.phone.replace(/[^0-9]/g, "").slice(-10),
    email: profile.email,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // New Contact form state
  const [newContact, setNewContact] = useState({ name: "", role: "Store Staff", phone: "" });
  const [contactError, setContactError] = useState("");

  // Simulated states: loading / empty / error
  const [viewState, setViewState] = useState<"ready" | "loading" | "error" | "empty">("ready");
  const [isDemo, setIsDemo] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  const financials = getRetailerFinancials(undefined, undefined, currentDate);

  useEffect(() => {
    setIsDemo(isDemoModeEnabled());
    if (typeof window !== "undefined") {
      const stateParam = new URLSearchParams(window.location.search).get("account_state");
      if (stateParam === "loading") setViewState("loading");
      if (stateParam === "empty") setViewState("empty");
      if (stateParam === "error") setViewState("error");
    }
  }, []);

  // Validation handler for profile
  const validateProfileForm = () => {
    const errors: { [key: string]: string } = {};
    const cleanGst = editForm.gstin.trim().toUpperCase();
    const cleanPhone = editForm.phone.replace(/[^0-9]/g, "");

    if (!editForm.name.trim()) errors.name = "Shop / Trade name is required";
    if (!editForm.proprietor.trim()) errors.proprietor = "Proprietor name is required";

    if (!cleanGst) {
      errors.gstin = "GSTIN is required";
    } else if (cleanGst.length !== 15) {
      errors.gstin = `GSTIN must be exactly 15 characters (e.g. ${profile.gstin})`;
    }

    if (!cleanPhone) {
      errors.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      errors.phone = "Phone must be exactly 10 digits";
    }

    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setProfile(prev => ({
      ...prev,
      name: editForm.name.trim(),
      proprietor: editForm.proprietor.trim(),
      gstin: editForm.gstin.trim().toUpperCase(),
      address: editForm.address.trim(),
      phone: `+91 ${editForm.phone.slice(-10)}`,
      email: editForm.email.trim(),
    }));

    setIsEditProfileOpen(false);
    setSaveSuccessMsg("Business profile updated successfully!");
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newContact.phone.replace(/[^0-9]/g, "");
    if (!newContact.name.trim()) {
      setContactError("Contact name is required");
      return;
    }
    if (cleanPhone.length !== 10) {
      setContactError("Enter a valid 10-digit mobile number");
      return;
    }

    const contactToAdd: RetailerContact = {
      id: `c-${Date.now()}`,
      name: newContact.name.trim(),
      role: newContact.role.trim() || "Purchaser",
      phone: `+91 ${cleanPhone}`,
      isPrimary: false,
    };

    setContacts(prev => [...prev, contactToAdd]);
    setNewContact({ name: "", role: "Store Staff", phone: "" });
    setContactError("");
    setIsAddContactOpen(false);
    setSaveSuccessMsg("Authorized contact added!");
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleRemoveContact = (id: string) => {
    const target = contacts.find(c => c.id === id);
    if (target?.isPrimary) {
      alert("Cannot remove the primary proprietor contact.");
      return;
    }
    setContacts(prev => prev.filter(c => c.id !== id));
    setSaveSuccessMsg("Contact removed.");
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestType === "credit_limit") {
      addRetailerRequest({
        retailerId: effectiveRetailerId,
        type: "credit_limit",
        payload: {
          requestedCreditLimit: Number(reqLimit.replace(/,/g, "")) || 200000,
          reason: reqReason.trim() || "Seasonal festival booking expansion.",
        },
      });
    } else if (requestType === "address_change") {
      addRetailerRequest({
        retailerId: effectiveRetailerId,
        type: "address_change",
        payload: {
          address: reqAddress.trim(),
          town: reqTown.trim() || "Siddipet",
          pincode: reqPincode.trim() || "502103",
          reason: reqReason.trim(),
        },
      });
    } else {
      addRetailerRequest({
        retailerId: effectiveRetailerId,
        type: "new_product",
        payload: {
          productName: reqProductName.trim(),
          brand: reqBrand,
          notes: reqNotes.trim(),
        },
      });
    }
    setSaveSuccessMsg("Your request was submitted to ARK Distributors operations team.");
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setIsRaiseRequestOpen(false);
  };

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintNotes.trim()) return;

    addComplaint({
      retailerId: effectiveRetailerId,
      type: complaintType,
      linkedOrderId: complaintOrder.trim() || undefined,
      notes: complaintNotes.trim(),
      assignee: "Operations Desk",
      status: "open",
    });
    setSaveSuccessMsg("Issue ticket reported. Our logistics desk has received your ticket.");
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setComplaintNotes("");
    setIsReportIssueOpen(false);
  };

  const handleDownloadDoc = (docName: string) => {
    setDownloadingDoc(docName);
    setTimeout(() => {
      setDownloadingDoc(null);
      alert(`Downloaded: ${docName}`);
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-20 right-4 z-50 bg-success text-white text-xs font-bold px-4 py-3 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Icon name="check_circle" size={18} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Demo Controls Bar (only visible when demo mode is active) */}
      {isDemo && (
        <div className="bg-surface-raised p-2 rounded-md flex items-center justify-between text-xs text-ink-muted border border-border">
          <span className="font-semibold text-ink">Account Demo State Simulator:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setViewState("ready")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "ready" ? "bg-surface font-bold shadow-soft-sm text-primary" : "hover:bg-surface-raised"}`}
            >
              Ready
            </button>
            <button
              onClick={() => setViewState("loading")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "loading" ? "bg-surface font-bold shadow-soft-sm text-primary" : "hover:bg-surface-raised"}`}
            >
              Loading
            </button>
            <button
              onClick={() => setViewState("error")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "error" ? "bg-surface font-bold shadow-soft-sm text-primary" : "hover:bg-surface-raised"}`}
            >
              Error
            </button>
            <button
              onClick={() => setViewState("empty")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "empty" ? "bg-surface font-bold shadow-soft-sm text-primary" : "hover:bg-surface-raised"}`}
            >
              Empty
            </button>
          </div>
        </div>
      )}

      {/* State: Loading View */}
      {viewState === "loading" && (
        <div className="bg-surface rounded-lg p-8 border border-border h-48 flex items-center justify-center animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <Icon name="progress_activity" size={36} className="animate-spin text-primary" />
            <span className="text-sm font-semibold text-ink-muted">
              Loading {profile.name} Account details...
            </span>
          </div>
        </div>
      )}

      {/* State: Error View */}
      {viewState === "error" && (
        <div className="bg-surface rounded-lg p-8 sm:p-12 border border-danger/30 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-danger/10 text-danger border border-danger/30 flex items-center justify-center">
            <Icon name="error_outline" size={36} />
          </div>
          <h2 className="text-lg font-bold text-ink">Failed to load account profile</h2>
          <p className="text-sm text-ink-muted max-w-md">
            Unable to connect to the Secunderabad account registry. Please verify your connection or try again.
          </p>
          <button
            onClick={() => setViewState("ready")}
            className="px-5 py-2.5 rounded-md bg-primary text-white text-xs font-bold shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* State: Empty View */}
      {viewState === "empty" && (
        <div className="bg-surface rounded-lg p-8 sm:p-12 border border-border text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-surface-raised text-ink-muted flex items-center justify-center">
            <Icon name="account_box" size={36} />
          </div>
          <h2 className="text-lg font-bold text-ink">No Retailer Profile Registered</h2>
          <p className="text-sm text-ink-muted max-w-md">
            This wholesale account has not completed business onboarding with ARK Distributors.
          </p>
          <button
            onClick={() => setViewState("ready")}
            className="px-5 py-2.5 rounded-md bg-primary text-white text-xs font-bold shadow-sm"
          >
            Load Active Profile
          </button>
        </div>
      )}

      {viewState === "ready" && (
        <>

      {/* 1. Business Profile Header Card */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
              <Icon name="storefront" size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-ink">
                  {profile.name}
                </h1>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {RETAILER_PROFILE.code}
                </span>
                <span className="bg-success/10 text-success text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-success/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Verified Wholesaler Client
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Proprietor: <strong className="text-ink font-semibold">{profile.proprietor}</strong> • Main Bazaar, Siddipet, Telangana
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setEditForm({
                  name: profile.name,
                  proprietor: profile.proprietor,
                  gstin: profile.gstin,
                  address: profile.address,
                  phone: profile.phone.replace(/[^0-9]/g, "").slice(-10),
                  email: profile.email,
                });
                setFormErrors({});
                setIsEditProfileOpen(true);
              }}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-98"
            >
              <Icon name="edit" size={18} />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Business details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-border">
          <div className="p-3 bg-surface-raised rounded-md border border-border/60">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              GSTIN
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-ink font-mono">
                {profile.gstin}
              </span>
              <span className="px-1.5 py-0.2 bg-success/10 text-success font-mono font-bold text-[9px] rounded uppercase">
                Verified
              </span>
            </div>
          </div>

          <div className="p-3 bg-surface-raised rounded-md border border-border/60">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Registered Phone
            </span>
            <span className="text-xs font-bold text-ink font-mono mt-0.5 block">
              {profile.phone}
            </span>
          </div>

          <div className="p-3 bg-surface-raised rounded-md border border-border/60">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Billing Email
            </span>
            <span className="text-xs font-bold text-ink truncate mt-0.5 block" title={profile.email}>
              {profile.email}
            </span>
          </div>

          <div className="sm:col-span-2 md:col-span-3 p-3 bg-surface-raised rounded-md border border-border/60">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Registered Trade Address
            </span>
            <span className="text-xs font-medium text-ink mt-0.5 block">
              {profile.address}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Credit & Terms & Credit Meter Card */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="verified_user" size={20} className="text-success" />
            <h2 className="text-base font-bold text-ink">Credit & Terms</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30 text-xs font-bold">
            {financials.availableCreditPercent}% Available
          </span>
        </div>

        {/* Financial Highlights (Stacked on mobile to 1 col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-md bg-surface-raised border border-border/60">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Credit Limit
            </span>
            <span className="text-sm font-bold text-ink font-mono mt-0.5 block">
              {formatINR(financials.creditLimit)}
            </span>
            <span className="text-[10px] text-ink-muted font-semibold">
              Authorized Revolving
            </span>
          </div>

          <div className="p-3 rounded-md bg-surface-raised border border-border/60">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Credit Terms
            </span>
            <span className="text-sm font-bold text-ink mt-0.5 block">
              {RETAILER_PROFILE.creditTermsDays} Days
            </span>
            <span className="text-[10px] text-ink-muted">
              Net 30 from dispatch
            </span>
          </div>

          <div className="p-3 rounded-md bg-surface-raised border border-border/60">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Used Credit
            </span>
            <span className="text-sm font-bold text-ink font-mono mt-0.5 block">
              {formatINR(financials.totalOutstanding)}
            </span>
            <span className="text-[10px] text-ink-muted font-semibold">
              {financials.usedCreditPercent}% utilized
            </span>
          </div>

          <div className="p-3 rounded-md bg-primary/10/50 border border-primary/20">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
              Available Credit
            </span>
            <span className="text-sm font-bold text-primary font-mono mt-0.5 block">
              {formatINR(financials.availableCredit)}
            </span>
            <span className="text-[10px] text-primary font-semibold">
              Ready for new orders
            </span>
          </div>
        </div>

        {/* Dual-color Credit Meter (matches Invoices & Balance exactly) */}
        <div className="p-4 rounded-md bg-surface-raised border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-ink-muted font-medium">Used Credit:</span>
              <strong className="text-ink font-mono">{formatINR(financials.totalOutstanding)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-ink-muted font-medium">Available:</span>
              <strong className="text-success font-mono">{formatINR(financials.availableCredit)}</strong>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-surface-raised overflow-hidden flex">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${financials.usedCreditPercent}%` }}
              title={`Used: ${financials.usedCreditPercent}%`}
            />
            <div
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${financials.availableCreditPercent}%` }}
              title={`Available: ${financials.availableCreditPercent}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
            <span>Overdue balance: <strong className="text-danger">{formatINR(financials.overdueAmount)}</strong></span>
            <button
              onClick={() => setRetailerNav("account")}
              className="text-primary hover:underline font-semibold"
            >
              View Invoices & Ledgers →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Delivery and Transport Card */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="local_shipping" size={20} className="text-primary" />
            <h2 className="text-base font-bold text-ink">Delivery &amp; Transport Routing</h2>
          </div>
          <span className="text-xs text-ink-muted">Secunderabad Hub Route</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-md bg-surface-raised border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Default Delivery Destination
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  Primary
                </span>
              </div>
              <p className="text-xs text-ink font-medium leading-relaxed mt-1">
                {profile.deliveryAddress}
              </p>
            </div>
            <p className="text-[11px] text-ink-muted mt-3 pt-2 border-t border-border/60">
              Pin code: <strong className="font-mono text-ink">502103</strong> (Telangana Region)
            </p>
          </div>

          <div className="p-4 rounded-md bg-surface-raised border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Preferred Transport Carrier
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success font-mono font-bold">
                  Active
                </span>
              </div>
              <p className="text-sm font-bold text-ink mt-1">
                {profile.preferredTransporter}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Booking Station: <strong className="text-ink">{profile.destinationBookingPoint}</strong>
              </p>
            </div>
            <p className="text-[11px] text-ink-muted mt-3 pt-2 border-t border-border/60">
              Daily parcel service from Secunderabad Garment Hub to Siddipet depot
            </p>
          </div>
        </div>
      </div>

      {/* 3.5. Store Requests & Support Desk */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Icon name="contact_support" size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Store Requests &amp; Support</h2>
              <p className="text-xs text-ink-muted">Raise credit limit requests, address updates, or report delivery &amp; packing issues</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsRaiseRequestOpen(true)}
              className="h-9 px-3.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-soft-xs transition-all cursor-pointer"
            >
              <Icon name="add_circle" size={16} />
              Raise a Request
            </button>
            <button
              type="button"
              onClick={() => setIsReportIssueOpen(true)}
              className="h-9 px-3.5 rounded-md bg-surface border border-danger/30 hover:bg-danger/10 text-danger text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Icon name="report_problem" size={16} />
              Report an Issue
            </button>
          </div>
        </div>

        {/* List of Submitted Requests */}
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Submitted Store Requests ({myRequests.length})</span>
            </h3>
            {myRequests.length === 0 ? (
              <p className="text-xs text-ink-muted p-3 rounded-md bg-surface-raised border border-border">
                No active store requests submitted.
              </p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-md overflow-hidden bg-background">
                {myRequests.map((req) => (
                  <div key={req.id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.status === "approved"
                            ? "bg-success/15 text-success"
                            : req.status === "rejected"
                            ? "bg-danger/15 text-danger"
                            : "bg-warning/15 text-warning"
                        }`}>
                          {req.status === "pending" ? "Under Review" : req.status === "approved" ? "Approved" : "Declined"}
                        </span>
                        <span className="font-bold text-ink">
                          {req.type === "credit_limit"
                            ? "Credit Limit Increase"
                            : req.type === "address_change"
                            ? "Delivery Address Update"
                            : "New Product Request"}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-muted mt-1">
                        {req.type === "credit_limit" && (
                          <span>Requested limit: <strong className="text-ink font-mono">{formatINR(req.payload.requestedCreditLimit || 0)}</strong> · Reason: {req.payload.reason}</span>
                        )}
                        {req.type === "address_change" && (
                          <span>New address: {req.payload.address}, {req.payload.town}</span>
                        )}
                        {req.type === "new_product" && (
                          <span>Product enquiry: {req.payload.productName} ({req.payload.brand})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-muted font-mono self-start sm:self-auto shrink-0">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List of Reported Issues */}
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Reported Issues &amp; Tickets ({myComplaints.length})</span>
            </h3>
            {myComplaints.length === 0 ? (
              <p className="text-xs text-ink-muted p-3 rounded-md bg-surface-raised border border-border">
                Zero issues reported. All shipments and bills are in good standing.
              </p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-md overflow-hidden bg-background">
                {myComplaints.map((c) => (
                  <div key={c.id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.status === "resolved"
                            ? "bg-success/15 text-success"
                            : c.status === "in-progress"
                            ? "bg-warning/15 text-warning"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {c.status === "open" ? "Submitted" : c.status === "in-progress" ? "In Progress" : "Resolved"}
                        </span>
                        <span className="font-bold text-ink uppercase text-[11px]">
                          {c.type === "shortage" ? "Missing Boxes" : c.type === "defect" ? "Defective Piece" : c.type}
                        </span>
                        {c.linkedOrderId && (
                          <span className="text-[10px] text-ink-muted font-mono">PO: {c.linkedOrderId}</span>
                        )}
                      </div>
                      <p className="text-xs text-ink mt-1 font-medium">{c.notes}</p>
                    </div>
                    <span className="text-[10px] text-ink-muted font-mono self-start sm:self-auto shrink-0">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Contacts & Authorized Users */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="group" size={20} className="text-ink" />
            <div>
              <h2 className="text-base font-bold text-ink">Authorized Purchasing Contacts</h2>
              <p className="text-xs text-ink-muted">Personnel approved to build, review, and confirm purchase orders</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewContact({ name: "", role: "Store Staff", phone: "" });
              setContactError("");
              setIsAddContactOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-md bg-surface-raised hover:bg-surface-raised text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
          >
            <Icon name="person_add" size={16} />
            <span>Add User</span>
          </button>
        </div>

        <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
          {contacts.map(contact => (
            <div key={contact.id} className="p-3.5 bg-surface flex items-center justify-between gap-3 hover:bg-surface-raised/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${contact.isPrimary ? "bg-primary/10 text-primary" : "bg-surface-raised text-ink"}`}>
                  {contact.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-ink">{contact.name}</span>
                    {contact.isPrimary && (
                      <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        Primary Proprietor
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
                    <span>{contact.role}</span>
                    <span>•</span>
                    <span className="font-mono">{contact.phone}</span>
                  </div>
                </div>
              </div>

              {!contact.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleRemoveContact(contact.id)}
                  className="p-1.5 rounded-sm text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Remove user"
                >
                  <Icon name="delete" size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Notification Preferences */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="notifications_active" size={20} className="text-warning" />
          <h2 className="text-base font-bold text-ink">Wholesale Notifications & Alerts</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-md bg-surface-raised border border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink block">Order Status Updates</span>
              <span className="text-[11px] text-ink-muted">Submission, approval & packaging</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.orderUpdates}
              onChange={e => setNotifications(prev => ({ ...prev, orderUpdates: e.target.checked }))}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-md bg-surface-raised border border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink block">Dispatch & LR Alerts</span>
              <span className="text-[11px] text-ink-muted">Navata LR # and arrival alerts</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.dispatchAlerts}
              onChange={e => setNotifications(prev => ({ ...prev, dispatchAlerts: e.target.checked }))}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-md bg-surface-raised border border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink block">Payment Reminders</span>
              <span className="text-[11px] text-ink-muted">Due date & overdue notices</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.paymentReminders}
              onChange={e => setNotifications(prev => ({ ...prev, paymentReminders: e.target.checked }))}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Channel selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
          <div>
            <span className="text-xs font-bold text-ink">Alert Delivery Channels</span>
            <p className="text-[11px] text-ink-muted">Receive dispatch PDFs and ledger updates instantly</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "whatsapp", label: "WhatsApp Only" },
              { id: "sms", label: "SMS Only" },
              { id: "both", label: "WhatsApp & SMS" },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setNotifications(prev => ({ ...prev, channel: opt.id as any }))}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${notifications.channel === opt.id ? "bg-primary text-white shadow-soft-sm" : "bg-surface-raised text-ink hover:bg-surface-raised"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Documents & Certificates */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="description" size={20} className="text-ink" />
            <h2 className="text-base font-bold text-ink">Verified Legal Documents</h2>
          </div>
          <span className="text-xs text-ink-muted">KYC Compliant</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RETAILER_PROFILE.documents.map(doc => (
            <div key={doc.id} className="p-4 rounded-md bg-surface-raised border border-border flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-surface text-ink flex items-center justify-center border border-border shrink-0">
                  <Icon name="verified" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-ink">{doc.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-success/10 text-success font-mono text-[9px] font-bold uppercase">
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">{doc.type}</p>
                  <p className="text-[11px] font-mono text-ink mt-1">Reg: {doc.number}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(doc.name)}
                  disabled={downloadingDoc === doc.name}
                  className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-raised text-ink text-[11px] font-semibold border border-border transition-colors flex items-center gap-1"
                >
                  <Icon name={downloadingDoc === doc.name ? "sync" : "download"} size={14} />
                  <span>{downloadingDoc === doc.name ? "Fetching..." : "Download"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Preferences & Session */}
      <div className="bg-surface rounded-lg p-5 sm:p-6 shadow-soft-sm border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-ink block">Portal Language / భాష / மொழி</span>
          <p className="text-[11px] text-ink-muted mt-0.5">Select preferred regional language for invoices and catalogues</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-raised p-1 rounded-md border border-border">
            <button
              type="button"
              onClick={() => setSelectedLanguage("en")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedLanguage === "en" ? "bg-surface text-primary shadow-soft-sm" : "text-ink-muted hover:text-ink"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("te")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedLanguage === "te" ? "bg-surface text-primary shadow-soft-sm" : "text-ink-muted hover:text-ink"}`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("ta")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedLanguage === "ta" ? "bg-surface text-primary shadow-soft-sm" : "text-ink-muted hover:text-ink"}`}
            >
              தமிழ்
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSignOutModalOpen(true)}
            className="px-4 py-2 rounded-md bg-danger/10 hover:bg-danger/20 text-danger font-bold text-xs transition-colors flex items-center gap-1.5 border border-danger/30"
          >
            <Icon name="logout" size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* MODAL: Edit Business Profile */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-ink">Edit Business Details</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-raised text-ink-muted hover:bg-surface-raised flex items-center justify-center"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Shop / Trade Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm focus:outline-none focus:border-primary"
                  placeholder={`e.g. ${profile.name}`}
                />
                {formErrors.name && <p className="text-[11px] text-danger mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Proprietor Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.proprietor}
                  onChange={e => setEditForm(prev => ({ ...prev, proprietor: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. T. Narasimha Rao"
                />
                {formErrors.proprietor && <p className="text-[11px] text-danger mt-1">{formErrors.proprietor}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    GSTIN (15 chars) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={editForm.gstin}
                    onChange={e => setEditForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm font-mono uppercase focus:outline-none focus:border-primary"
                    placeholder={profile.gstin}
                  />
                  {formErrors.gstin && <p className="text-[11px] text-danger mt-1">{formErrors.gstin}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-ink block mb-1">
                    Phone (10 digits) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, "") }))}
                    className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm font-mono focus:outline-none focus:border-primary"
                    placeholder="9440123456"
                  />
                  {formErrors.phone && <p className="text-[11px] text-danger mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Billing Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm focus:outline-none focus:border-primary"
                  placeholder="name@store.com"
                />
                {formErrors.email && <p className="text-[11px] text-danger mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Trade Address</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm focus:outline-none focus:border-primary"
                  placeholder="Door No, Street, Town, District, State Pincode"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-md bg-surface-raised text-ink text-xs font-semibold hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add User / Authorized Contact */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-md w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-ink">Add Authorized User</h3>
              <button
                type="button"
                onClick={() => setIsAddContactOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-raised text-ink-muted hover:bg-surface-raised flex items-center justify-center"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. S. Srinivas"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={newContact.role}
                  onChange={e => setNewContact(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Purchase Assistant / Accountant"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">Mobile Phone (10 digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newContact.phone}
                  onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, "") }))}
                  className="w-full px-3 py-2 rounded-md border border-border text-xs sm:text-sm font-mono focus:outline-none focus:border-primary"
                  placeholder="9876543210"
                />
              </div>

              {contactError && <p className="text-[11px] text-danger font-semibold">{contactError}</p>}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 rounded-md bg-surface-raised text-ink text-xs font-semibold hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Sign Out Confirmation */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-sm w-full p-6 shadow-2xl border border-border text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger border border-danger/30 flex items-center justify-center mx-auto">
              <Icon name="logout" size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Sign Out of ARK Connect?</h3>
              <p className="text-xs text-ink-muted mt-1">
                You will be signed out of {profile.name} wholesale session.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(false)}
                className="px-4 py-2 rounded-md bg-surface-raised hover:bg-surface-raised text-ink text-xs font-semibold"
              >
                Stay Logged In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignOutModalOpen(false);
                  setRetailerNav("home");
                  alert("Signed out. Session returned to Home.");
                }}
                className="px-4 py-2 rounded-md bg-danger hover:opacity-90 text-white text-xs font-bold shadow-sm"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Raise Store Request */}
      {isRaiseRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-surface rounded-lg shadow-soft-xl border border-border text-ink overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 bg-surface border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Icon name="contact_support" size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">Raise a Store Request</h3>
                  <p className="text-xs text-ink-muted">Submit an operational request to ARK Distributors team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRaiseRequestOpen(false)}
                className="w-8 h-8 rounded-full bg-background hover:bg-surface-raised flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer border border-border"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                  Request Type
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RetailerRequestType)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
                >
                  <option value="credit_limit">Credit Limit Increase Request</option>
                  <option value="address_change">Store Delivery Address Update</option>
                  <option value="new_product">Request New Brand or Product Line</option>
                </select>
              </div>

              {requestType === "credit_limit" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                      Desired Credit Limit (₹)
                    </label>
                    <input
                      type="number"
                      step="25000"
                      value={reqLimit}
                      onChange={(e) => setReqLimit(e.target.value)}
                      placeholder="e.g. 250000"
                      required
                      className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs font-mono font-semibold text-ink focus:outline-hidden focus:border-primary"
                    />
                    <span className="text-[11px] text-ink-muted mt-1 block">
                      Current Credit Limit: {formatINR(financials.creditLimit)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                      Business Reason
                    </label>
                    <textarea
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      placeholder="Explain your seasonal expansion, festival orders, or counter capacity..."
                      rows={3}
                      required
                      className="w-full p-3 bg-background border border-border rounded-md text-xs text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-primary resize-none"
                    />
                  </div>
                </>
              )}

              {requestType === "address_change" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                      New Street / Shop Address
                    </label>
                    <input
                      type="text"
                      value={reqAddress}
                      onChange={(e) => setReqAddress(e.target.value)}
                      placeholder="Shop No, Complex, Street Name"
                      required
                      className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-ink focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                        Town / City
                      </label>
                      <input
                        type="text"
                        value={reqTown}
                        onChange={(e) => setReqTown(e.target.value)}
                        placeholder="e.g. Siddipet"
                        required
                        className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-ink focus:outline-hidden focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                        Pincode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={reqPincode}
                        onChange={(e) => setReqPincode(e.target.value)}
                        placeholder="502103"
                        required
                        className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs font-mono text-ink focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              {requestType === "new_product" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                        Brand
                      </label>
                      <select
                        value={reqBrand}
                        onChange={(e) => setReqBrand(e.target.value)}
                        className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
                      >
                        <option value="Within">Within</option>
                        <option value="Flybirds">Flybirds</option>
                        <option value="Flycute">Flycute</option>
                        <option value="Loveit">Loveit</option>
                        <option value="Aswati">Aswati</option>
                        <option value="Ira">Ira</option>
                        <option value="Jyothika">Jyothika</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                        Product / Style Name
                      </label>
                      <input
                        type="text"
                        value={reqProductName}
                        onChange={(e) => setReqProductName(e.target.value)}
                        placeholder="e.g. Sports Bra / Shimmer Leggings"
                        required
                        className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-ink focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                      Customer Demand / Remarks
                    </label>
                    <textarea
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                      placeholder="Retail customer feedback, desired sizes, or colors..."
                      rows={3}
                      className="w-full p-3 bg-background border border-border rounded-md text-xs text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-primary resize-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRaiseRequestOpen(false)}
                  className="px-4 py-2.5 rounded-md border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-soft-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Report an Issue */}
      {isReportIssueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-surface rounded-lg shadow-soft-xl border border-border text-ink overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 bg-surface border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-danger/10 text-danger flex items-center justify-center font-bold">
                  <Icon name="report_problem" size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">Report Shipment or Billing Issue</h3>
                  <p className="text-xs text-ink-muted">Our warehouse desk will investigate and respond</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportIssueOpen(false)}
                className="w-8 h-8 rounded-full bg-background hover:bg-surface-raised flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer border border-border"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                    Issue Category
                  </label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value as ComplaintType)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
                  >
                    <option value="shortage">Missing Boxes / Shortage</option>
                    <option value="defect">Damaged / Defective Pieces</option>
                    <option value="delivery">Transport / Delivery Delay</option>
                    <option value="pricing">Invoice Rate Discrepancy</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                    Linked PO # (Optional)
                  </label>
                  <input
                    type="text"
                    value={complaintOrder}
                    onChange={(e) => setComplaintOrder(e.target.value)}
                    placeholder="e.g. PO Number (optional)"
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs font-mono text-ink focus:outline-hidden focus:border-primary uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                  Detailed Description
                </label>
                <textarea
                  value={complaintNotes}
                  onChange={(e) => setComplaintNotes(e.target.value)}
                  placeholder="Provide article number, missing quantities, carton numbers, or transporter remarks..."
                  rows={4}
                  required
                  className="w-full p-3 bg-background border border-border rounded-md text-xs text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-primary resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReportIssueOpen(false)}
                  className="px-4 py-2.5 rounded-md border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-bold shadow-soft-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  Report Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
