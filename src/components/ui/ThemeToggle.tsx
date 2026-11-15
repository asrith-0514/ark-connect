"use client";

import React, { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeToggle({
  className = "",
  showLabels = false,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as ThemeMode | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setTheme(stored);
      }
    } catch {
      // localStorage may fail in restricted/private modes
    }
    setMounted(true);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode);
    try {
      localStorage.setItem("theme", mode);
    } catch {
      // ignore
    }

    if (mode === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", systemDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", mode);
    }
  };

  // If not mounted yet, render placeholder with same dimensions to prevent layout shift
  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center p-1 bg-surface border border-border rounded-lg shadow-soft-sm ${className}`}
      >
        <div className="min-h-[44px] min-w-[44px] px-3 py-2" />
      </div>
    );
  }

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: "light", label: "Light", icon: "light_mode" },
    { mode: "system", label: "Auto", icon: "desktop_windows" },
    { mode: "dark", label: "Dark", icon: "dark_mode" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className={`inline-flex items-center p-1 bg-surface border border-border rounded-lg shadow-soft-sm select-none ${className}`}
    >
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            role="radio"
            aria-checked={isActive}
            onClick={() => applyTheme(opt.mode)}
            className={`min-h-[44px] px-3.5 py-2 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-soft-sm"
                : "text-ink-muted hover:text-ink hover:bg-background/80"
            }`}
            title={`Switch to ${opt.label} theme`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {opt.icon}
            </span>
            {showLabels && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
