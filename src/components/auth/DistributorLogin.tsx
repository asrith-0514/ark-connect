"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DistributorRole } from "@/lib/auth/types";
import { DISTRIBUTOR_ROLES_METADATA } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ArkWordmark } from "@/components/ui/ArkLogo";

export function DistributorLogin({ onSwitchToRetailer }: { onSwitchToRetailer: () => void }) {
  const {
    isDemo,
    loginWithPassword,
    sendOtp,
    verifyOtp,
    quickDemoLogin,
    rateLimitSeconds,
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [identifier, setIdentifier] = useState("owner@arkdistributors.in");
  const [password, setPassword] = useState("ark@owner123");
  const [phone, setPhone] = useState("9848000001");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRolePreview, setSelectedRolePreview] = useState<DistributorRole>("owner");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!identifier || !password) {
      setErrorMsg("Please enter email/phone and password.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithPassword(identifier, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Invalid credentials.");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    const res = await sendOtp(clean);
    setIsSubmitting(false);

    if (res.success) {
      setOtpSent(true);
    } else {
      setErrorMsg(res.error || "Failed to send code.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (otpCode.length < 6) {
      setErrorMsg("Please enter 6-digit OTP.");
      return;
    }

    setIsSubmitting(true);
    const res = await verifyOtp(phone, otpCode, "distributor");
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Invalid code.");
    }
  };

  const handleRoleQuickSelect = async (role: DistributorRole) => {
    setSelectedRolePreview(role);
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await quickDemoLogin(role);
    } catch {
      setErrorMsg("Failed to login with demo role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Brand Header with Geometric Monogram & Tagline */}
      <div className="flex items-center justify-between gap-4">
        <ArkWordmark product="Backoffice" size="md" withTagline />

        <Badge variant="neutral" size="sm">
          Staff Portal
        </Badge>
      </div>

      {/* Main Login Card */}
      <Card variant="default" className="p-6 sm:p-8 shadow-soft-md border-border">
        {/* Method Switcher Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              authMethod === "password"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("otp");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              authMethod === "otp"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Mobile & OTP
          </button>
        </div>

        {authMethod === "password" ? (
          /* Password Login Form */
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink">
                Work Email or Mobile Phone
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="owner@arkdistributors.in"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface text-ink text-sm font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Password</span>
                <span className="text-[11px] text-ink-muted font-normal">Confidential</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface text-ink text-sm font-mono"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                <Icon name="error" size={18} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {rateLimitSeconds > 0 && (
              <div className="p-3 rounded-lg bg-warning/15 border border-warning/30 text-ink text-xs flex items-center gap-2">
                <Icon name="timer" size={18} className="text-warning shrink-0" />
                <span>Rate limit active: please wait {rateLimitSeconds}s.</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || rateLimitSeconds > 0}
              className="w-full mt-2 font-bold cursor-pointer"
            >
              {isSubmitting ? "Signing In..." : "Sign In to Backoffice"}
            </Button>
          </form>
        ) : (
          /* OTP Login Form */
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink">
                Registered Staff Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                disabled={otpSent}
                onChange={e => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setErrorMsg(null);
                }}
                placeholder="98480 00001"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface text-ink text-sm font-mono"
              />
            </div>

            {otpSent && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-ink">Enter 6-Digit OTP</label>
                  {isDemo && (
                    <span className="text-primary font-mono text-[11px] font-bold">
                      Demo OTP: 123456
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => {
                    setOtpCode(e.target.value.replace(/\D/g, ""));
                    setErrorMsg(null);
                  }}
                  placeholder="123456"
                  className="w-full text-center tracking-widest px-3.5 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface text-ink text-base font-mono"
                  autoFocus
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                <Icon name="error" size={18} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || rateLimitSeconds > 0}
              className="w-full mt-2 font-bold cursor-pointer"
            >
              {isSubmitting
                ? "Processing..."
                : otpSent
                ? "Verify Code & Enter"
                : "Send Staff OTP"}
            </Button>

            {otpSent && (
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-xs text-ink-muted hover:text-primary text-center cursor-pointer mt-1"
              >
                ← Change Mobile Number
              </button>
            )}
          </form>
        )}

        {/* 1-Click Instant Wholesaler Sign In for Demo */}
        <div className="mt-6 pt-5 border-t border-border flex flex-col gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleRoleQuickSelect("owner")}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-soft-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Icon name="factory" size={18} />
            <span>Instant 1-Click Wholesaler Sign In</span>
          </button>

          <div className="pt-2 flex items-center justify-between text-xs text-ink-muted border-t border-border/60 mt-1">
            <span>Need retailer ordering?</span>
            <a
              href="/"
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Switch to Retailer Portal</span>
              <Icon name="arrow_forward" size={13} />
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
