"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
  className = "",
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-4 sm:gap-6 border-b border-border overflow-x-auto ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`h-9 pb-2 pt-1 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border-b-2 transition-all duration-150 ease-out cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-border"
              }`}
            >
              {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-xs font-mono font-bold num ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-raised border border-border text-ink-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pills variant
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-0.5 bg-surface border border-border rounded-md overflow-x-auto shadow-soft-xs ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`h-7 px-3 text-xs font-medium rounded-sm inline-flex items-center justify-center gap-1.5 transition-all duration-150 ease-out cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
              isActive
                ? "bg-surface-raised text-primary border border-border-strong shadow-soft-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised/50"
            }`}
          >
            {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1 rounded-xs font-mono font-bold num ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-ink-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
