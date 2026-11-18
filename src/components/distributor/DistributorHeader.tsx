"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";

export default function DistributorHeader() {
  const { setIsSearchOpen, currentDate, selectedMonth, setSelectedMonth } = useApp();
  const { user, logout } = useAuth();

  const currentMonthLabel = useMemo(() => {
    return currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  const prevMonthLabel = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  const twoMonthsAgoLabel = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  const threeMonthsAgoLabel = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  return (
    <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 shadow-soft-sm min-w-0">
      {/* Global Search command bar trigger with Ctrl+K in glass style */}
      <div className="flex-1 min-w-[160px] max-w-md">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full h-10 pl-3.5 pr-3 bg-surface-raised/80 hover:bg-surface-raised rounded-xl flex items-center justify-between text-xs sm:text-sm text-ink-muted hover:text-ink transition-all border border-border hover:border-accent/40 focus:border-accent/50 focus:shadow-[0_0_12px_rgba(34,229,255,0.2)] shadow-soft-sm cursor-pointer group"
        >
          <div className="flex items-center gap-2 truncate">
            <Icon
              name="sparkles"
              size={16}
              className="text-accent shrink-0 group-hover:scale-110 transition-transform"
            />
            <span className="truncate">Search retailers, SKUs, invoices...</span>
          </div>
          <kbd className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-surface text-ink-muted font-mono text-[10px] font-bold border border-border shadow-soft-sm shrink-0 ml-2 group-hover:text-ink">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Month Selector, Tally Badge, and Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Single month picker dropdown */}
        <div className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface px-3 py-1.5 rounded-md border border-border text-xs font-semibold shrink-0 transition-colors shadow-soft-sm">
          <Icon name="calendar" size={15} className="text-primary shrink-0" />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer pr-1 font-sans"
          >
            <option value={currentMonthLabel} className="bg-surface text-ink">
              {currentMonthLabel} (Month-to-Date)
            </option>
            <option value={prevMonthLabel} className="bg-surface text-ink">
              {prevMonthLabel}
            </option>
            <option value={twoMonthsAgoLabel} className="bg-surface text-ink">
              {twoMonthsAgoLabel}
            </option>
            <option value={threeMonthsAgoLabel} className="bg-surface text-ink">
              {threeMonthsAgoLabel}
            </option>
          </select>
        </div>

        {/* Tally sync: not connected badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-raised border border-border text-xs text-ink-muted opacity-60 cursor-not-allowed select-none shrink-0"
          title="Tally synchronization is not connected"
        >
          <Icon name="cloud_off" size={14} className="text-ink-muted" />
          <span className="hidden sm:inline">Tally sync: not connected</span>
          <span className="sm:hidden">Not connected</span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User initials pill & Sign out */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-border">
          <div
            className="w-9 h-9 rounded-md bg-surface-raised hover:bg-surface flex items-center justify-center text-xs font-bold text-ink transition-colors border border-border shadow-soft-sm"
            title={`${user?.name || "Staff"} (${user?.roleTitle || "Distributor"})`}
          >
            {user?.name?.[0] || "T"}
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="h-9 px-2.5 rounded-md text-xs font-semibold text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors flex items-center gap-1 cursor-pointer"
            title="Sign Out of Backoffice"
          >
            <Icon name="logout" size={15} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
