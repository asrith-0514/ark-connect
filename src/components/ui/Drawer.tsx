"use client";

import React, { useEffect } from "react";
import { Button } from "./Button";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
  className = "",
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-200 ease-out"
      />

      <div className="fixed inset-y-0 right-0 flex pl-10 pointer-events-none">
        {/* Slide-over panel */}
        <div
          className={`pointer-events-auto w-screen ${widthStyles[width]} bg-surface text-ink border-l border-border shadow-soft-xl flex flex-col justify-between transform transition-transform duration-250 ease-out translate-x-0 ${className}`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4 shrink-0">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-ink tracking-tight font-sans">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-ink-muted mt-1">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close drawer"
              className="rounded-full text-ink-muted hover:text-ink shrink-0 -mr-2 -mt-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </Button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 select-text">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-border bg-surface-raised flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
