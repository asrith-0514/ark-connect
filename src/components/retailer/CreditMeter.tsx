"use client";

import React from "react";
import { formatINR } from "@/lib/mock/retailer";

export interface CreditMeterProps {
  totalOutstanding: number;
  availableCredit: number;
  creditLimit: number;
  usedCreditPercent: number;
  availableCreditPercent: number;
  className?: string;
  compact?: boolean;
}

export default function CreditMeter({
  totalOutstanding,
  availableCredit,
  creditLimit,
  usedCreditPercent,
  availableCreditPercent,
  className = "",
  compact = false,
}: CreditMeterProps) {
  return (
    <div
      className={`rounded-xl bg-slate-50 border border-slate-200 ${
        compact ? "p-3 space-y-1.5" : "p-4 space-y-2.5"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#0047d3] text-[18px]">
            verified_user
          </span>
          <span className="text-xs font-bold text-slate-900">Credit Line Health</span>
        </div>

        {/* Clear label showing used vs available (Requirement 4) */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-600">
            <strong className="text-[#0047d3] font-mono">{formatINR(totalOutstanding)}</strong> used
          </span>
          <span className="text-slate-400 font-bold">·</span>
          <span className="text-emerald-700">
            <strong className="text-emerald-800 font-mono">{formatINR(availableCredit)}</strong> available
          </span>
        </div>
      </div>

      {/* Segmented bar: fill matches label */}
      <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
        <div
          className="h-full bg-[#0047d3] transition-all duration-500"
          style={{ width: `${usedCreditPercent}%` }}
          title={`Used: ${formatINR(totalOutstanding)} (${usedCreditPercent}%)`}
        />
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${availableCreditPercent}%` }}
          title={`Available: ${formatINR(availableCredit)} (${availableCreditPercent}%)`}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
        <span>
          Authorized Limit:{" "}
          <strong className="text-slate-800 font-mono">{formatINR(creditLimit)}</strong>
        </span>
        <span className="text-emerald-700 font-bold font-mono">
          {availableCreditPercent}% Available
        </span>
      </div>
    </div>
  );
}

