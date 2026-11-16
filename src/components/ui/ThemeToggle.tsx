"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "./Icon";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeToggle({
  className = "",
  showLabels = false,
}: ThemeToggleProps) {
  // Brand spec: Light theme is DEFAULT unless explicitly chosen otherwise
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get("theme");
      const stored = (urlTheme || localStorage.getItem("ark-theme-v2")) as ThemeMode | null;
      if (stored === "dark") {
        setTheme("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.classList.add("dark");
      } else {
        setTheme("light");
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // localStorage may fail in restricted/private modes
    }
    setMounted(true);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode);
    try {
      localStorage.setItem("ark-theme-v2", mode);
    } catch {
      // ignore
    }

    if (mode === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
    }
  };

  // If not mounted yet, render placeholder with same dimensions to prevent layout shift
  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center p-0.5 bg-surface border border-border rounded-md shadow-soft-xs ${className}`}
      >
        <div className="h-8 min-w-[36px] px-2" />
      </div>
    );
  }

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: "dark", label: "Dark", icon: "dark_mode" },
    { mode: "light", label: "Light", icon: "light_mode" },
    { mode: "system", label: "System", icon: "desktop_windows" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className={`inline-flex items-center p-0.5 bg-surface border border-border rounded-md shadow-soft-xs select-none ${className}`}
    >
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => applyTheme(opt.mode)}
            className={`h-7 px-2.5 rounded-sm text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-150 ease-out cursor-pointer ${
              isActive
                ? "bg-surface-raised text-primary border border-border-strong shadow-soft-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised/50"
            }`}
            title={`Switch to ${opt.label} theme`}
          >
            <Icon name={opt.icon} size={14} />
            {showLabels && <span className="text-[11px] font-sans">{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
