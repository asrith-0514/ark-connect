"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
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
      className={`rounded-lg bg-surface border border-border shadow-soft-sm text-ink transition-colors duration-200 ${
        compact ? "p-3 space-y-2" : "p-4 space-y-3"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon name="verified_user" size={18} className="text-primary" />
          <span className="text-xs font-bold text-ink">Credit Line Health</span>
        </div>

        {/* Clear label showing used vs available */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-ink-muted">
            <strong className="text-primary font-mono num">{formatINR(totalOutstanding)}</strong> used
          </span>
          <span className="text-border font-bold">·</span>
          <span className="text-success">
            <strong className="font-mono num font-bold">{formatINR(availableCredit)}</strong> available
          </span>
        </div>
      </div>

      {/* Thick rounded gauge */}
      <div className="w-full h-4 rounded-full bg-border/60 overflow-hidden flex shadow-inner p-0.5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(usedCreditPercent > 0 ? 3 : 0, usedCreditPercent)}%` }}
          title={`Used: ${formatINR(totalOutstanding)} (${usedCreditPercent}%)`}
        />
        <div
          className="h-full bg-success rounded-full transition-all duration-500 ease-out ml-0.5"
          style={{ width: `${availableCreditPercent}%` }}
          title={`Available: ${formatINR(availableCredit)} (${availableCreditPercent}%)`}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-muted pt-0.5">
        <span>
          Authorized Limit:{" "}
          <strong className="text-ink font-mono num font-semibold">{formatINR(creditLimit)}</strong>
        </span>
        <span className="text-success font-bold font-mono num">
          {availableCreditPercent}% Available
        </span>
      </div>
    </div>
  );
}
