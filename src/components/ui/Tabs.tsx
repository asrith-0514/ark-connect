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
        className={`flex items-center gap-6 border-b border-border overflow-x-auto ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`min-h-[44px] pb-3 pt-2 text-sm font-semibold inline-flex items-center gap-2 border-b-2 transition-all duration-200 ease-out cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-border"
              }`}
            >
              {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold num ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-surface border border-border text-ink-muted"
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

  // "pills" variant
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-surface border border-border rounded-lg shadow-soft-sm overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`min-h-[44px] px-4 py-2 text-sm font-semibold rounded-md inline-flex items-center gap-2 transition-all duration-200 ease-out cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-soft-sm"
                : "text-ink-muted hover:text-ink hover:bg-background/80"
            }`}
          >
            {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold num transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-background border border-border text-ink-muted"
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

// Alias for Pills
export const Pills = Tabs;
