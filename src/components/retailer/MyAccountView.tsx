"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  RETAILER_PROFILE,
  RetailerContact,
  getRetailerFinancials,
  formatINR,
  isDemoModeEnabled,
} from "@/lib/mock/retailer";

export default function MyAccountView() {
  const { setRetailerNav, currentDate } = useApp();

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
      errors.gstin = "GSTIN must be exactly 15 characters (e.g. 36AAACF1234F1Z5)";
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
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Demo Controls Bar (only visible when demo mode is active) */}
      {isDemo && (
        <div className="bg-slate-100 p-2 rounded-xl flex items-center justify-between text-xs text-slate-600 border border-slate-200">
          <span className="font-semibold text-slate-700">Account Demo State Simulator:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setViewState("ready")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "ready" ? "bg-white font-bold shadow-xs text-[#0047d3]" : "hover:bg-slate-200"}`}
            >
              Ready
            </button>
            <button
              onClick={() => setViewState("loading")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "loading" ? "bg-white font-bold shadow-xs text-[#0047d3]" : "hover:bg-slate-200"}`}
            >
              Loading
            </button>
            <button
              onClick={() => setViewState("error")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "error" ? "bg-white font-bold shadow-xs text-[#0047d3]" : "hover:bg-slate-200"}`}
            >
              Error
            </button>
            <button
              onClick={() => setViewState("empty")}
              className={`px-2.5 py-1 rounded-lg ${viewState === "empty" ? "bg-white font-bold shadow-xs text-[#0047d3]" : "hover:bg-slate-200"}`}
            >
              Empty
            </button>
          </div>
        </div>
      )}

      {/* State: Loading View */}
      {viewState === "loading" && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 h-48 flex items-center justify-center animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[36px] animate-spin text-[#0047d3]">
              progress_activity
            </span>
            <span className="text-sm font-semibold text-slate-500">
              Loading Sri Laxmi Narasimha Textiles Account details...
            </span>
          </div>
        </div>
      )}

      {/* State: Error View */}
      {viewState === "error" && (
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-rose-200 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">error_outline</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Failed to load account profile</h2>
          <p className="text-sm text-slate-500 max-w-md">
            Unable to connect to the Secunderabad account registry. Please verify your connection or try again.
          </p>
          <button
            onClick={() => setViewState("ready")}
            className="px-5 py-2.5 rounded-xl bg-[#0047d3] text-white text-xs font-bold shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* State: Empty View */}
      {viewState === "empty" && (
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">account_box</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Retailer Profile Registered</h2>
          <p className="text-sm text-slate-500 max-w-md">
            This wholesale account has not completed business onboarding with ARK Distributors.
          </p>
          <button
            onClick={() => setViewState("ready")}
            className="px-5 py-2.5 rounded-xl bg-[#0047d3] text-white text-xs font-bold shadow-sm"
          >
            Load Active Profile
          </button>
        </div>
      )}

      {viewState === "ready" && (
        <>

      {/* 1. Business Profile Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0047d3] flex items-center justify-center font-bold text-lg border border-blue-100 shrink-0">
              <span className="material-symbols-outlined text-[26px]">storefront</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {profile.name}
                </h1>
                <span className="bg-blue-100 text-[#0047d3] text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {RETAILER_PROFILE.code}
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Verified Wholesaler Client
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Proprietor: <strong className="text-slate-800 font-semibold">{profile.proprietor}</strong> • Main Bazaar, Siddipet, Telangana
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
              className="px-4 py-2 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Business details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              GSTIN
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-slate-900 font-mono">
                {profile.gstin}
              </span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded uppercase">
                Verified
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Phone
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
              {profile.phone}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Billing Email
            </span>
            <span className="text-xs font-bold text-slate-900 truncate mt-0.5 block" title={profile.email}>
              {profile.email}
            </span>
          </div>

          <div className="sm:col-span-2 md:col-span-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Trade Address
            </span>
            <span className="text-xs font-medium text-slate-800 mt-0.5 block">
              {profile.address}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Credit & Terms & Credit Meter Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">verified_user</span>
            <h2 className="text-base font-bold text-slate-900">Credit & Terms</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            {financials.availableCreditPercent}% Available
          </span>
        </div>

        {/* Financial Highlights (Stacked on mobile to 1 col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Credit Limit
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
              {formatINR(financials.creditLimit)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              Authorized Revolving
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Credit Terms
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {RETAILER_PROFILE.creditTermsDays} Days
            </span>
            <span className="text-[10px] text-slate-500">
              Net 30 from dispatch
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Used Credit
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
              {formatINR(financials.totalOutstanding)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {financials.usedCreditPercent}% utilized
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Available Credit
            </span>
            <span className="text-sm font-bold text-[#0047d3] font-mono mt-0.5 block">
              {formatINR(financials.availableCredit)}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold">
              Ready for new orders
            </span>
          </div>
        </div>

        {/* Dual-color Credit Meter (matches Invoices & Balance exactly) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0047d3]" />
              <span className="text-slate-600 font-medium">Used Credit:</span>
              <strong className="text-slate-900 font-mono">{formatINR(financials.totalOutstanding)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Available:</span>
              <strong className="text-emerald-700 font-mono">{formatINR(financials.availableCredit)}</strong>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
            <div
              className="h-full bg-[#0047d3] transition-all duration-500"
              style={{ width: `${financials.usedCreditPercent}%` }}
              title={`Used: ${financials.usedCreditPercent}%`}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${financials.availableCreditPercent}%` }}
              title={`Available: ${financials.availableCreditPercent}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Overdue balance: <strong className="text-rose-600">{formatINR(financials.overdueAmount)}</strong></span>
            <button
              onClick={() => setRetailerNav("account")}
              className="text-[#0047d3] hover:underline font-semibold"
            >
              View Invoices & Ledgers →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Delivery and Transport Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-blue-600">local_shipping</span>
            <h2 className="text-base font-bold text-slate-900">Delivery & Transport Routing</h2>
          </div>
          <span className="text-xs text-slate-500">Secunderabad Hub Route</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Default Delivery Destination
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-[#0047d3] font-bold">
                  Primary
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed mt-1">
                {profile.deliveryAddress}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
              Pin code: <strong className="font-mono text-slate-700">502103</strong> (Telangana Region)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Preferred Transport Carrier
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Active
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile.preferredTransporter}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Booking Station: <strong className="text-slate-800">{profile.destinationBookingPoint}</strong>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
              Daily parcel service from Secunderabad Garment Hub to Siddipet depot
            </p>
          </div>
        </div>
      </div>

      {/* 4. Contacts & Authorized Users */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-slate-700">group</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Authorized Purchasing Contacts</h2>
              <p className="text-xs text-slate-500">Personnel approved to build, review, and confirm purchase orders</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewContact({ name: "", role: "Store Staff", phone: "" });
              setContactError("");
              setIsAddContactOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Add User</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {contacts.map(contact => (
            <div key={contact.id} className="p-3.5 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${contact.isPrimary ? "bg-blue-100 text-[#0047d3]" : "bg-slate-100 text-slate-700"}`}>
                  {contact.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{contact.name}</span>
                    {contact.isPrimary && (
                      <span className="px-2 py-0.2 rounded-full bg-blue-100 text-[#0047d3] text-[10px] font-bold">
                        Primary Proprietor
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove user"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Notification Preferences */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-amber-600">notifications_active</span>
          <h2 className="text-base font-bold text-slate-900">Wholesale Notifications & Alerts</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Order Status Updates</span>
              <span className="text-[11px] text-slate-500">Submission, approval & packaging</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.orderUpdates}
              onChange={e => setNotifications(prev => ({ ...prev, orderUpdates: e.target.checked }))}
              className="w-4 h-4 accent-[#0047d3] cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Dispatch & LR Alerts</span>
              <span className="text-[11px] text-slate-500">Navata LR # and arrival alerts</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.dispatchAlerts}
              onChange={e => setNotifications(prev => ({ ...prev, dispatchAlerts: e.target.checked }))}
              className="w-4 h-4 accent-[#0047d3] cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Payment Reminders</span>
              <span className="text-[11px] text-slate-500">Due date & overdue notices</span>
            </div>
            <input
              type="checkbox"
              checked={notifications.paymentReminders}
              onChange={e => setNotifications(prev => ({ ...prev, paymentReminders: e.target.checked }))}
              className="w-4 h-4 accent-[#0047d3] cursor-pointer"
            />
          </div>
        </div>

        {/* Channel selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900">Alert Delivery Channels</span>
            <p className="text-[11px] text-slate-500">Receive dispatch PDFs and ledger updates instantly</p>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${notifications.channel === opt.id ? "bg-[#0047d3] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Documents & Certificates */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-slate-700">description</span>
            <h2 className="text-base font-bold text-slate-900">Verified Legal Documents</h2>
          </div>
          <span className="text-xs text-slate-500">KYC Compliant</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RETAILER_PROFILE.documents.map(doc => (
            <div key={doc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{doc.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase">
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{doc.type}</p>
                  <p className="text-[11px] font-mono text-slate-700 mt-1">Reg: {doc.number}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(doc.name)}
                  disabled={downloadingDoc === doc.name}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {downloadingDoc === doc.name ? "sync" : "download"}
                  </span>
                  <span>{downloadingDoc === doc.name ? "Fetching..." : "Download"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Preferences & Session */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 block">Portal Language / భాష / மொழி</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Select preferred regional language for invoices and catalogues</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedLanguage("en")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedLanguage === "en" ? "bg-white text-[#0047d3] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("te")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedLanguage === "te" ? "bg-white text-[#0047d3] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("ta")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedLanguage === "ta" ? "bg-white text-[#0047d3] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              தமிழ்
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSignOutModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5 border border-rose-200"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* MODAL: Edit Business Profile */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Business Details</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Shop / Trade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#0047d3]"
                  placeholder="e.g. Sri Laxmi Narasimha Textiles"
                />
                {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Proprietor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.proprietor}
                  onChange={e => setEditForm(prev => ({ ...prev, proprietor: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#0047d3]"
                  placeholder="e.g. T. Narasimha Rao"
                />
                {formErrors.proprietor && <p className="text-[11px] text-rose-600 mt-1">{formErrors.proprietor}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    GSTIN (15 chars) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={editForm.gstin}
                    onChange={e => setEditForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono uppercase focus:outline-none focus:border-[#0047d3]"
                    placeholder="36AAACF1234F1Z5"
                  />
                  {formErrors.gstin && <p className="text-[11px] text-rose-600 mt-1">{formErrors.gstin}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone (10 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, "") }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#0047d3]"
                    placeholder="9440123456"
                  />
                  {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Billing Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#0047d3]"
                  placeholder="name@store.com"
                />
                {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trade Address</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#0047d3]"
                  placeholder="Door No, Street, Town, District, State Pincode"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white text-xs font-bold shadow-sm"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Authorized User</h3>
              <button
                type="button"
                onClick={() => setIsAddContactOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#0047d3]"
                  placeholder="e.g. S. Srinivas"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={newContact.role}
                  onChange={e => setNewContact(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#0047d3]"
                  placeholder="e.g. Purchase Assistant / Accountant"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone (10 digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newContact.phone}
                  onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, "") }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#0047d3]"
                  placeholder="9876543210"
                />
              </div>

              {contactError && <p className="text-[11px] text-rose-600 font-semibold">{contactError}</p>}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white text-xs font-bold shadow-sm"
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sign Out of ARK Connect?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You will be signed out of Sri Laxmi Narasimha Textiles wholesale session.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
