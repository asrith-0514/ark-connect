"use client";

import React, { useRef, useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { RETAILER_PROFILE, formatINR } from "@/lib/mock/retailer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getRetailerString } from "@/lib/i18n/retailer";
import { Icon } from "@/components/ui/Icon";
import { ArkMonogram, ArkWordmark } from "@/components/ui/ArkLogo";

export function RetailerHeader() {
  const {
    retailerNav,
    setRetailerNav,
    cartGrandTotal,
    cartTotalBoxes,
    setIsReviewOrderOpen,
    setIsSearchOpen,
    orders,
    payments,
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

  const activeRetailerId = user?.type === "retailer" ? (user.retailerId || "ret-1") : "ret-1";
  const activeRetailerCode = user?.type === "retailer" ? (user.retailerCode || "RET-0001") : "RET-0001";

  const retailerOrders = orders.filter(
    o =>
      (o.retailerId === activeRetailerId || o.retailerId === activeRetailerCode) &&
      !o.orderNumber.startsWith("ARK-H")
  );
  const retailerPayments = payments.filter(
    p => p.retailerId === activeRetailerId || p.retailerId === activeRetailerCode
  );

  const latestDispatched = retailerOrders.find(o => o.status === "Dispatched");
  const latestPayment = retailerPayments[0];

  const notifications = [
    {
      id: "notif-1",
      title: latestDispatched ? `Order Dispatched #${latestDispatched.orderNumber}` : "Order Tracking Active",
      desc: latestDispatched?.transporter ? `${latestDispatched.transporter} • ${latestDispatched.totalBoxes} boxes` : "No pending dispatches in transit",
      time: latestDispatched ? "2h ago" : "Today",
      type: "dispatch",
      read: !latestDispatched,
    },
    {
      id: "notif-2",
      title: latestPayment ? `Payment Received ${formatINR(latestPayment.amount)}` : "Payment Reconciliation",
      desc: latestPayment?.referenceId ? `${latestPayment.referenceId} reconciled • Credit restored` : "All payments up to date",
      time: latestPayment ? "1d ago" : "Current",
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
            {/* 1. Logo (Monogram on mobile, Wordmark on tablet/desktop) */}
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer select-none min-h-[48px] text-left rounded-md shrink-0 focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => setRetailerNav("home")}
              aria-label="Go to Home"
            >
              <div className="flex sm:hidden items-center gap-1.5">
                <ArkMonogram size={28} variant="gradient" />
                <span className="font-mono text-[10px] font-bold text-accent tracking-widest uppercase">CONNECT</span>
              </div>
              <div className="hidden sm:block">
                <ArkWordmark product="Connect" size="sm" />
              </div>
            </button>

            {/* 2. Search Pill with Cyan Focus Glow (Tap opens search modal) */}
            <div className="flex-1 max-w-md mx-1 sm:mx-3">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full h-9.5 px-3 bg-surface-raised hover:bg-background rounded-full border border-border flex items-center justify-between text-xs text-ink-muted hover:text-ink shadow-soft-xs transition-all duration-150 cursor-pointer group hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                title="Search (⌘K)"
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <Icon
                    name="search"
                    size={16}
                    className="text-primary shrink-0 group-hover:scale-105 group-hover:text-accent transition-all"
                  />
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
                  <Icon name="notifications" size={18} />
                  <span className="w-2 h-2 rounded-full bg-accent absolute top-2.5 right-2.5 border border-surface" />
                </button>

                {/* Notifications Popover Drawer */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface text-ink border border-border rounded-lg shadow-soft-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                            <Icon
                              name={n.type === "dispatch" ? "local_shipping" : n.type === "payment" ? "payments" : "info"}
                              size={15}
                            />
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
                  <Icon name="shopping_bag" size={16} />
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
                    <Icon name="person" size={14} />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isAvatarMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface text-ink border border-border rounded-md shadow-soft-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                        <Icon name="person" size={16} className="text-primary" />
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
                        <Icon name="logout" size={16} />
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
