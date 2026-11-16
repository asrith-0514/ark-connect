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
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
  const [notificationPrefs, setNotificationPrefs] = useState({
    whatsappDispatch: true,
    smsDueReminders: true,
    emailStatements: true,
  });

  // Preferences
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "te" | "ta">("en");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("profile");
  const toggleSection = (id: string) => setExpandedSection(prev => prev === id ? null : id);

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
        <div className="space-y-4">
          {/* Grouped List of 8 Rows */}
          <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden shadow-soft-xs">
            {/* ROW 1: Profile */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("profile")}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="storefront" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink block">Profile</span>
                    <span className="text-xs text-ink-muted truncate block max-w-[220px] sm:max-w-none">{profile.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-ink-muted bg-surface-raised px-2 py-0.5 rounded">
                    {profile.gstin}
                  </span>
                  <Icon
                    name={expandedSection === "profile" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                    className="text-ink-muted"
                  />
                </div>
              </button>

              {expandedSection === "profile" && (
                <div className="p-4 bg-surface-raised/40 border-t border-border space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-ink-muted block text-[11px]">Trade name</span>
                      <strong className="text-ink font-semibold">{profile.name}</strong>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[11px]">Proprietor</span>
                      <strong className="text-ink font-semibold">{profile.proprietor}</strong>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[11px]">GSTIN</span>
                      <strong className="text-ink font-mono font-semibold">{profile.gstin}</strong>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[11px]">Registered phone</span>
                      <strong className="text-ink font-mono font-semibold">{profile.phone}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-ink-muted block text-[11px]">Trade address</span>
                      <span className="text-ink">{profile.address}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
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
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-soft-xs"
                    >
                      <Icon name="edit" size={15} />
                      <span>Edit profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 2: Credit and terms */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("credit")}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                    <Icon name="verified_user" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink block">Credit and terms</span>
                    <span className="text-xs text-ink-muted block">Revolving limit &amp; payment days</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-success">
                    {formatINR(financials.availableCredit)} available
                  </span>
                  <Icon
                    name={expandedSection === "credit" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                    className="text-ink-muted"
                  />
                </div>
              </button>

              {expandedSection === "credit" && (
                <div className="p-4 bg-surface-raised/40 border-t border-border space-y-4 animate-in fade-in duration-150">
                  <CreditMeter
                    totalOutstanding={financials.totalOutstanding}
                    availableCredit={financials.availableCredit}
                    creditLimit={financials.creditLimit}
                    usedCreditPercent={financials.usedCreditPercent}
                    availableCreditPercent={financials.availableCreditPercent}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-surface border border-border">
                      <span className="text-[10px] text-ink-muted block">Credit limit</span>
                      <strong className="text-xs font-mono font-bold text-ink">{formatINR(financials.creditLimit)}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-border">
                      <span className="text-[10px] text-ink-muted block">Payment terms</span>
                      <strong className="text-xs font-semibold text-ink">{RETAILER_PROFILE.creditTermsDays} days</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-border">
                      <span className="text-[10px] text-ink-muted block">Outstanding</span>
                      <strong className="text-xs font-mono font-bold text-ink">{formatINR(financials.totalOutstanding)}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-border">
                      <span className="text-[10px] text-ink-muted block">Overdue</span>
                      <strong className="text-xs font-mono font-bold text-danger">{formatINR(financials.overdueAmount)}</strong>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestType("credit_limit");
                        setReqLimit("200000");
                        setReqReason("");
                        setIsRaiseRequestOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-border text-ink font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-soft-xs"
                    >
                      <Icon name="trending_up" size={15} className="text-primary" />
                      <span>Request limit increase</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 3: Delivery */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("delivery")}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="local_shipping" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink block">Delivery</span>
                    <span className="text-xs text-ink-muted block">Preferred transport &amp; hub</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink font-medium hidden sm:inline">{profile.preferredTransporter}</span>
                  <Icon
                    name={expandedSection === "delivery" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                    className="text-ink-muted"
                  />
                </div>
              </button>

              {expandedSection === "delivery" && (
                <div className="p-4 bg-surface-raised/40 border-t border-border space-y-3 animate-in fade-in duration-150 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-ink-muted block text-[11px]">Primary transporter</span>
                      <strong className="text-ink font-semibold">{profile.preferredTransporter}</strong>
                      <span className="text-[11px] text-ink-muted block mt-0.5">Direct daily parcel service to Siddipet town</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[11px]">Fulfillment hub</span>
                      <strong className="text-ink font-semibold">{RETAILER_PROFILE.dispatchHub}</strong>
                      <span className="text-[11px] text-ink-muted block mt-0.5">Secunderabad wholesale dispatch desk</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestType("address_change");
                        setReqAddress(profile.address);
                        setReqTown(RETAILER_PROFILE.town);
                        setReqPincode("502103");
                        setIsRaiseRequestOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-border text-ink font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-soft-xs"
                    >
                      <Icon name="pin_drop" size={15} className="text-primary" />
                      <span>Change delivery address</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 4: Contacts */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("contacts")}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="group" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink block">Contacts</span>
                    <span className="text-xs text-ink-muted block">Authorized staff &amp; purchasers</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted font-medium">{contacts.length} registered</span>
                  <Icon
                    name={expandedSection === "contacts" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                    className="text-ink-muted"
                  />
                </div>
              </button>

              {expandedSection === "contacts" && (
                <div className="p-4 bg-surface-raised/40 border-t border-border space-y-3 animate-in fade-in duration-150">
                  <div className="divide-y divide-border">
                    {contacts.map(c => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-ink font-semibold">{c.name}</strong>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-ink-muted font-medium">
                              {c.role}
                            </span>
                            {c.isPrimary && (
                              <span className="text-[10px] text-success font-semibold">Primary</span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-ink-muted mt-0.5 block">{c.phone}</span>
                        </div>
                        {!c.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContact(c.id)}
                            className="p-1.5 rounded text-ink-muted hover:text-danger hover:bg-danger/10 cursor-pointer transition-colors"
                            title="Remove contact"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddContactOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-border text-ink font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-soft-xs"
                    >
                      <Icon name="person_add" size={15} className="text-primary" />
                      <span>Add contact</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 5: Notifications */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("notifications")}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="notifications" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink block">Notifications</span>
                    <span className="text-xs text-ink-muted block">Order alerts &amp; billing updates</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted font-medium">Active</span>
                  <Icon
                    name={expandedSection === "notifications" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                    className="text-ink-muted"
                  />
                </div>
              </button>

              {expandedSection === "notifications" && (
                <div className="p-4 bg-surface-raised/40 border-t border-border space-y-3 animate-in fade-in duration-150 text-xs">
                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-ink font-semibold block">WhatsApp dispatch updates</span>
                        <span className="text-[11px] text-ink-muted">Receive LR receipts and lorry dispatch notices on WhatsApp</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.whatsappDispatch}
                        onChange={e => setNotificationPrefs(p => ({ ...p, whatsappDispatch: e.target.checked }))}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border">
                      <div>
                        <span className="text-ink font-semibold block">SMS payment reminders</span>
                        <span className="text-[11px] text-ink-muted">Due date reminders 3 days before credit term expiration</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.smsDueReminders}
                        onChange={e => setNotificationPrefs(p => ({ ...p, smsDueReminders: e.target.checked }))}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-border">
                      <div>
                        <span className="text-ink font-semibold block">Weekly statement emails</span>
                        <span className="text-[11px] text-ink-muted">PDF ledger statement delivered every Sunday morning</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailStatements}
                        onChange={e => setNotificationPrefs(p => ({ ...p, emailStatements: e.target.checked }))}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 6: Documents */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("documents")}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="description" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink block">Documents</span>
                    <span className="text-xs text-ink-muted block">GST certificate &amp; ledger statements</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted font-medium">3 verified</span>
                  <Icon
                    name={expandedSection === "documents" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                    className="text-ink-muted"
                  />
                </div>
              </button>

              {expandedSection === "documents" && (
                <div className="p-4 bg-surface-raised/40 border-t border-border space-y-2.5 animate-in fade-in duration-150 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="picture_as_pdf" size={18} className="text-danger" />
                      <div>
                        <strong className="text-ink font-semibold block">GST registration certificate (REG-06)</strong>
                        <span className="text-[11px] font-mono text-ink-muted">{profile.gstin} • Verified</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc("GST_Certificate_RET0001.pdf")}
                      className="px-2.5 py-1 rounded bg-surface hover:bg-surface-raised border border-border text-xs font-medium cursor-pointer"
                    >
                      Download
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="picture_as_pdf" size={18} className="text-danger" />
                      <div>
                        <strong className="text-ink font-semibold block">Annual account confirmation (FY 2025-26)</strong>
                        <span className="text-[11px] text-ink-muted">Signed ledger balance confirmation</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc("Ledger_Confirmation_FY25.pdf")}
                      className="px-2.5 py-1 rounded bg-surface hover:bg-surface-raised border border-border text-xs font-medium cursor-pointer"
                    >
                      Download
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Icon name="article" size={18} className="text-primary" />
                      <div>
                        <strong className="text-ink font-semibold block">Credit facility terms agreement</strong>
                        <span className="text-[11px] text-ink-muted">Authorized revolving terms letter</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc("Credit_Facility_Agreement.pdf")}
                      className="px-2.5 py-1 rounded bg-surface hover:bg-surface-raised border border-border text-xs font-medium cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 7: Language and theme */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("preferences")}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="palette" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink block">Language and theme</span>
                    <span className="text-xs text-ink-muted block">Display appearance &amp; dialect</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink">
                    {selectedLanguage === "en" ? "English" : selectedLanguage === "te" ? "తెలుగు" : "தமிழ்"}
                  </span>
                  <Icon
                    name={expandedSection === "preferences" ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                    className="text-ink-muted"
                  />
                </div>
              </button>

              {expandedSection === "preferences" && (
                <div className="p-4 bg-surface-raised/40 border-t border-border space-y-4 animate-in fade-in duration-150 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-ink font-semibold block">Application theme</span>
                      <span className="text-[11px] text-ink-muted">Toggle light or dark interface</span>
                    </div>
                    <ThemeToggle />
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-ink font-semibold block">App language</span>
                      <span className="text-[11px] text-ink-muted">Preferred regional dialect</span>
                    </div>
                    <div className="flex gap-1.5 bg-surface border border-border p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSelectedLanguage("en")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          selectedLanguage === "en" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLanguage("te")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          selectedLanguage === "te" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        తెలుగు
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLanguage("ta")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          selectedLanguage === "ta" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        தமிழ்
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 8: Sign out */}
            <div>
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(true)}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-danger/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0 group-hover:bg-danger/20">
                    <Icon name="logout" size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-danger block">Sign out</span>
                    <span className="text-xs text-ink-muted block">End current store owner session</span>
                  </div>
                </div>
                <Icon name="arrow_forward" size={18} className="text-danger/60 group-hover:text-danger" />
              </button>
            </div>
          </div>
        </div>
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
