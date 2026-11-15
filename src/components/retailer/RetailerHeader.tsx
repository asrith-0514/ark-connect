"use client";

import React, { useRef, useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { RETAILER_PROFILE, formatINR } from "@/lib/mock/retailer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getRetailerString } from "@/lib/i18n/retailer";

export function RetailerHeader() {
  const {
    retailerNav,
    setRetailerNav,
    cartGrandTotal,
    cartTotalBoxes,
    setIsReviewOrderOpen,
    setIsSearchOpen,
  } = useApp();
  const { user, logout, language, setLanguage, t } = useAuth();

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    {
      id: "notif-1",
      title: "Order Dispatched #ARK-8841",
      desc: "Navata Transport (LR #NRT-77492-SDP) • 120 boxes",
      time: "2h ago",
      type: "dispatch",
      read: false,
    },
    {
      id: "notif-2",
      title: "Payment Received ₹10,000",
      desc: "REC-0842 applied to INV-0094 • Credit restored",
      time: "1d ago",
      type: "payment",
      read: true,
    },
    {
      id: "notif-3",
      title: "Cut-off Reminder",
      desc: "Same-day dispatch cut-off at 17:30 IST for tomorrow delivery.",
      time: "Daily",
      type: "hub",
      read: true,
    },
  ];

  return (
    <>
      <header
        ref={headerRef}
        className="w-full bg-surface border-b border-border shadow-soft-sm text-ink transition-colors duration-200"
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6">
          {/* Main Top Row: Mobile Optimized (Logo + Search Pill + Bell + Lang/Avatar) */}
          <div className="flex items-center justify-between gap-2 h-14 min-w-0">
            {/* 1. Logo */}
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer select-none min-h-[48px] text-left rounded-md shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => setRetailerNav("home")}
              aria-label="Go to Home"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm tracking-tight shadow-soft-sm shrink-0">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-ink leading-tight tracking-tight whitespace-nowrap">
                  ARK Connect
                </span>
                <span className="text-[10px] text-ink-muted font-medium hidden sm:inline whitespace-nowrap">
                  Wholesale Portal
                </span>
              </div>
            </button>

            {/* 2. Search Pill (Tap opens search modal) */}
            <div className="flex-1 max-w-md mx-1 sm:mx-3">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full h-10 px-3 bg-surface-raised hover:bg-background rounded-full border border-border flex items-center justify-between text-xs text-ink-muted hover:text-ink shadow-soft-xs transition-colors cursor-pointer group"
                title="Search (⌘K)"
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 group-hover:scale-105 transition-transform">
                    search
                  </span>
                  <span className="truncate text-[11px] sm:text-xs">
                    {getRetailerString(language, "searchPlaceholder")}
                  </span>
                </div>
                <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px] text-ink-muted num">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* 3. Action Cluster: Telugu/English Toggle + Bell + PO (desktop) + User */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Telugu / English Quick Toggle */}
              <div className="flex items-center bg-surface-raised border border-border rounded-full p-0.5 text-xs shadow-soft-xs">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-primary text-primary-foreground shadow-soft-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("te")}
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    language === "te"
                      ? "bg-primary text-primary-foreground shadow-soft-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  title="తెలుగు భాషకు మార్చండి"
                >
                  తె
                </button>
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(prev => !prev)}
                  className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-surface-raised flex items-center justify-center text-ink transition-colors relative cursor-pointer"
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  <span className="w-2 h-2 rounded-full bg-accent absolute top-2 right-2 border-2 border-surface" />
                </button>

                {/* Notifications Popover Drawer */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface text-ink border border-border rounded-2xl shadow-soft-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-ink font-mono">
                          {getRetailerString(language, "notificationsTitle")}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      </div>
                      <span className="text-[11px] text-primary font-medium cursor-pointer hover:underline">
                        Mark read
                      </span>
                    </div>

                    <div className="divide-y divide-border/60 max-h-72 overflow-y-auto no-scrollbar py-1">
                      {notifications.map((n) => (
                        <div key={n.id} className="py-2.5 flex items-start gap-3 hover:bg-background/60 p-1.5 rounded-lg transition-colors">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === "dispatch"
                                ? "bg-success/15 text-success"
                                : n.type === "payment"
                                ? "bg-primary/15 text-primary"
                                : "bg-warning/15 text-warning"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {n.type === "dispatch" ? "local_shipping" : n.type === "payment" ? "payments" : "info"}
                            </span>
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-ink truncate">{n.title}</p>
                            <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">{n.desc}</p>
                            <span className="text-[10px] text-ink-muted font-mono">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop PO Pill */}
              {cartTotalBoxes > 0 && (
                <button
                  type="button"
                  onClick={() => setIsReviewOrderOpen(true)}
                  className="hidden md:flex min-h-[40px] items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-all text-xs font-semibold cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  <span className="font-mono num font-bold">{cartTotalBoxes} bx</span>
                  <span className="font-mono num">({formatINR(cartGrandTotal)})</span>
                </button>
              )}

              {/* Avatar Menu with Embedded Theme Toggle */}
              <div className="relative" ref={avatarMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAvatarMenuOpen(prev => !prev)}
                  className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-surface-raised hover:bg-background border border-border transition-all cursor-pointer shrink-0"
                  title="Account Menu"
                  aria-label="Account Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isAvatarMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface text-ink border border-border rounded-xl shadow-soft-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="pb-3 border-b border-border">
                      <p className="text-xs font-bold text-ink truncate">
                        {user?.name || RETAILER_PROFILE.name}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate num">
                        {user?.retailerCode || RETAILER_PROFILE.code} • Authorized Store
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-sm bg-success/10 text-success text-[10px] font-bold">
                        Verified Retailer
                      </span>
                    </div>

                    {/* Theme Toggle in Avatar Menu */}
                    <div className="py-3 border-b border-border">
                      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
                        Appearance
                      </p>
                      <ThemeToggle showLabels className="w-full justify-between" />
                    </div>

                    <div className="pt-2 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRetailerNav("account-profile");
                          setIsAvatarMenuOpen(false);
                        }}
                        className="w-full min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-semibold text-ink hover:bg-background flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          account_circle
                        </span>
                        <span>Manage Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAvatarMenuOpen(false);
                          logout();
                        }}
                        className="w-full min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-semibold text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        <span>{t("logoutBtn")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Sub Navigation Bar (Hidden on Mobile) */}
          <div className="hidden md:flex items-center justify-between border-t border-border pt-2 pb-1.5 mt-0.5">
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar" aria-label="Desktop Navigation">
              {[
                { id: "home", label: getRetailerString(language, "navHome") },
                { id: "catalogue", label: getRetailerString(language, "navShop") },
                { id: "orders", label: getRetailerString(language, "navOrders") },
                { id: "account", label: getRetailerString(language, "navDues") },
                { id: "account-profile", label: getRetailerString(language, "navAccount") },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRetailerNav(tab.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    retailerNav === tab.id
                      ? "bg-primary text-primary-foreground shadow-soft-sm"
                      : "text-ink-muted hover:text-ink hover:bg-background"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 text-ink-muted text-xs">
              <span>{getRetailerString(language, "creditLine")}:</span>
              <span className="font-mono text-success font-bold num">
                {formatINR(RETAILER_PROFILE.creditLimit)}
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
