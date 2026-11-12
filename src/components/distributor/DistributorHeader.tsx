"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";

export default function DistributorHeader() {
  const { setIsSearchOpen, currentDate } = useApp();

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

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthLabel);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Today, 09:42 AM");
  const [syncToast, setSyncToast] = useState<{ show: boolean; success: boolean; message: string } | null>(null);

  // Keep selectedMonth updated if currentDate changes
  React.useEffect(() => {
    setSelectedMonth(currentMonthLabel);
  }, [currentMonthLabel]);

  const handleSyncTally = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      const timeStr = `Today, ${new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      setLastSyncedTime(timeStr);
      setSyncToast({
        show: true,
        success: true,
        message: "Tally Prime ERP synchronized successfully. 28 retailer ledgers and 64 vouchers updated.",
      });
      setTimeout(() => setSyncDone(false), 2500);
      setTimeout(() => setSyncToast(null), 4000);
    }, 1200);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 shadow-2xs min-w-0">
      {/* Global Search trigger */}
      <div className="flex-1 min-w-[160px] max-w-md">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full h-10 pl-3.5 pr-3 bg-slate-100 hover:bg-slate-200/80 rounded-xl flex items-center justify-between text-xs sm:text-sm text-slate-500 transition-colors border border-slate-200/60 cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">search</span>
            <span className="truncate">Search retailers, SKUs, invoices...</span>
          </div>
          <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-white text-slate-500 font-mono text-[11px] border border-slate-200 shadow-2xs shrink-0 ml-2">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Month Selector & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Requirement 1: Month picker (default current month, month-to-date label) replaces two-pill toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 transition-colors">
          <span className="material-symbols-outlined text-[17px] text-[#0047d3] shrink-0">
            calendar_month
          </span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
          >
            <option value={currentMonthLabel}>{currentMonthLabel} (Month-to-Date)</option>
            <option value={prevMonthLabel}>{prevMonthLabel}</option>
            <option value={twoMonthsAgoLabel}>{twoMonthsAgoLabel}</option>
            <option value={threeMonthsAgoLabel}>{threeMonthsAgoLabel}</option>
          </select>
        </div>

        {/* Requirement 7: Sync Tally with last-synced time and success/failure toast */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncTally}
            disabled={isSyncing}
            className={`h-9 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border shrink-0 cursor-pointer ${
              syncDone
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
            title={`Last synced with Tally Prime: ${lastSyncedTime}`}
          >
            {isSyncing ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin text-[#0047d3]">
                  sync
                </span>
                <span className="hidden md:inline">Syncing...</span>
              </>
            ) : syncDone ? (
              <>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  check_circle
                </span>
                <span className="hidden md:inline text-emerald-700 font-bold">Synced</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px] text-slate-600">
                  cloud_sync
                </span>
                <span className="hidden md:inline">Sync Tally</span>
              </>
            )}
          </button>

          {/* Last-synced timestamp indicator */}
          <span className="hidden xl:inline-block text-[11px] text-slate-400 font-medium whitespace-nowrap">
            Last: <strong className="text-slate-600 font-semibold">{lastSyncedTime}</strong>
          </span>
        </div>

        {/* User initials pill */}
        <div className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 transition-colors border border-slate-200 cursor-pointer">
          T
        </div>
      </div>

      {/* Sync Tally Toast Notification (Requirement 7) */}
      {syncToast && syncToast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Tally Sync Complete</p>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">{syncToast.message}</p>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </header>
  );
}
