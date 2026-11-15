"use client";

import React, { useEffect, useState, useRef } from "react";
import { Badge } from "./Badge";

export interface StatDelta {
  value: string | number;
  isPositive?: boolean;
  label?: string;
}

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  delta?: StatDelta;
  caption?: string;
  formatAsIndianNumber?: boolean;
}

export function Stat({
  label,
  value,
  prefix = "",
  suffix = "",
  delta,
  caption,
  formatAsIndianNumber = true,
  className = "",
  ...props
}: StatProps) {
  const isNumeric = typeof value === "number";
  const [displayValue, setDisplayValue] = useState<number>(isNumeric ? 0 : 0);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNumeric) return;

    // Check prefers-reduced-motion
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        setDisplayValue(value as number);
        return;
      }
    }

    const startVal = 0;
    const endVal = value as number;
    // Brand spec: Motion duration strictly 120-250ms
    const duration = 200;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, isNumeric]);

  const formattedValue = isNumeric
    ? formatAsIndianNumber
      ? displayValue.toLocaleString("en-IN")
      : displayValue.toLocaleString()
    : value;

  return (
    <div
      className={`bg-surface border border-border rounded-md p-4 shadow-soft-xs text-ink transition-all duration-150 ease-out flex flex-col justify-between ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider font-mono">
          {label}
        </span>
        {delta && (
          <Badge
            variant={delta.isPositive ? "success" : "danger"}
            size="sm"
            className="num"
          >
            <span className="mr-0.5">{delta.isPositive ? "↑" : "↓"}</span>
            {delta.value}
            {delta.label && <span className="ml-1 text-[10px] opacity-80">{delta.label}</span>}
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-1 my-0.5">
        {prefix && (
          <span className="text-lg sm:text-xl font-bold text-ink-muted select-none font-mono">
            {prefix}
          </span>
        )}
        <span className="text-xl sm:text-2xl font-bold text-ink num tracking-tight">
          {formattedValue}
        </span>
        {suffix && (
          <span className="text-xs font-medium text-ink-muted select-none ml-1">
            {suffix}
          </span>
        )}
      </div>

      {caption && (
        <p className="text-[11px] text-ink-muted mt-2 border-t border-border pt-1.5 leading-snug">
          {caption}
        </p>
      )}
    </div>
  );
}

export default Stat;
