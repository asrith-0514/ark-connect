"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ArkWordmark } from "@/components/ui/ArkLogo";
import { MOCK_RETAILERS } from "@/lib/mock";

export function RetailerLogin({ onSwitchToStaff }: { onSwitchToStaff: () => void }) {
  const {
    language,
    setLanguage,
    t,
    isDemo,
    sendOtp,
    verifyOtp,
    quickDemoLogin,
    rateLimitSeconds,
  } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("9440123456");
  const [otpCode, setOtpCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    const clean = phoneNumber.replace(/\D/g, "");
    if (clean.length < 10) {
      setErrorMsg(language === "te" ? "దయచేసి 10 అంకెల సరైన మొబైల్ నంబర్ నమోదు చేయండి." : "Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    const res = await sendOtp(clean);
    setIsSubmitting(false);

    if (res.success) {
      setStep("otp");
      setResendCooldown(30);
      if (res.mockOtp) {
        setMockOtpHint(res.mockOtp);
      }
    } else {
      setErrorMsg(res.error || t("wrongCodeError"));
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    if (otpCode.length < 6) {
      setErrorMsg(language === "te" ? "దయచేసి 6 అంకెల OTP నమోదు చేయండి." : "Please enter the 6-digit OTP code.");
      return;
    }

    setIsSubmitting(true);
    const res = await verifyOtp(phoneNumber, otpCode, "retailer");
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || t("wrongCodeError"));
    }
  };

  const handleDemoStoreLogin = async (code: string, phone: string) => {
    setPhoneNumber(phone);
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await quickDemoLogin("retailer", code);
    } catch {
      setErrorMsg("Demo login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Language Toggle & Brand Header with Geometric ARK Logo & Tagline */}
      <div className="flex items-center justify-between gap-4">
        <ArkWordmark product="Connect" size="md" withTagline />

        {/* Telugu / English Pill Toggle */}
        <div className="flex items-center bg-surface border border-border rounded-full p-0.5 shadow-soft-xs text-xs">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              language === "en"
                ? "bg-primary text-primary-foreground font-semibold shadow-soft-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("te")}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              language === "te"
                ? "bg-primary text-primary-foreground font-semibold shadow-soft-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            తెలుగు
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <Card variant="default" className="p-6 sm:p-8 shadow-soft-md border-border">
        {step === "phone" ? (
          /* STEP 1: Phone Number Entry */
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                {t("retailerRoleLabel")}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
                {t("loginHeading")}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                {t("loginSubheading")}
              </p>
            </div>

            {/* Big Friendly Mobile Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-ink">
                {t("phoneLabel")}
              </label>
              <div className="flex items-center rounded-xl border-2 border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 bg-surface transition-all overflow-hidden shadow-soft-xs">
                <span className="px-3.5 py-3.5 bg-background border-r border-border font-mono font-bold text-ink text-sm sm:text-base select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={e => {
                    setPhoneNumber(e.target.value.replace(/\D/g, ""));
                    setErrorMsg(null);
                  }}
                  placeholder={t("phonePlaceholder")}
                  className="flex-1 min-w-0 px-4 py-3.5 text-lg sm:text-xl font-mono tracking-wider text-ink bg-transparent focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Error / Rate Limit Alert */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                <Icon name="error" size={18} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {rateLimitSeconds > 0 && (
              <div className="p-3 rounded-lg bg-warning/15 border border-warning/30 text-ink text-xs flex items-center gap-2">
                <Icon name="timer" size={18} className="text-warning shrink-0" />
                <span>
                  {t("rateLimitError")} ({rateLimitSeconds}s remaining)
                </span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || rateLimitSeconds > 0}
              className="w-full mt-2 cursor-pointer font-bold"
              leftIcon={<Icon name="sms" size={18} />}
            >
              {isSubmitting ? t("sendingOtp") : t("sendOtpBtn")}
            </Button>

            {/* Quick Demo Store Buttons (Only when ?demo=true) */}
            {isDemo && (
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    {t("quickDemoStores")}
                  </span>
                  <Badge variant="primary" size="sm">
                    1-Click Demo Login
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {MOCK_RETAILERS.slice(0, 3).map(store => (
                    <button
                      key={store.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDemoStoreLogin(store.code, store.phone.replace(/[^0-9]/g, "").slice(-10))}
                      className="min-h-[48px] p-3 rounded-xl border border-border bg-background hover:bg-surface-raised hover:border-primary text-left transition-colors flex items-center justify-between text-xs cursor-pointer group disabled:opacity-50"
                    >
                      <div>
                        <p className="font-bold text-ink text-sm group-hover:text-primary">
                          {store.name}
                        </p>
                        <p className="text-[11px] text-ink-muted font-mono mt-0.5">
                          {store.code} • {store.town} • {store.phone}
                        </p>
                      </div>
                      <span className="min-h-[36px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1">
                        <span>{isSubmitting ? "Logging in..." : "Login"}</span>
                        <Icon name="arrow_forward" size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between text-xs text-ink-muted border-t border-border/60 mt-2">
              <span>Distributor staff?</span>
              <button
                type="button"
                onClick={onSwitchToStaff}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              >
                <span>Wholesaler Staff Login</span>
                <Icon name="arrow_forward" size={13} />
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-success font-mono">
                SMS / WhatsApp OTP
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
                {t("otpHeading")}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                {t("otpSubheading")}{" "}
                <span className="font-mono font-bold text-ink">+91 {phoneNumber}</span>
              </p>
            </div>

            {/* Mock OTP Badge (Shown ONLY when ?demo=true) */}
            {isDemo && mockOtpHint && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-primary font-medium">
                <div className="flex items-center gap-2">
                  <Icon name="verified" size={18} />
                  <span>{t("demoOtpBadge")}:</span>
                  <span className="font-mono font-bold text-sm bg-primary/20 px-2 py-0.5 rounded text-primary">
                    {mockOtpHint}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(mockOtpHint)}
                  className="underline hover:text-primary font-bold cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Big 6-Digit Code Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-ink">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => {
                  setOtpCode(e.target.value.replace(/\D/g, ""));
                  setErrorMsg(null);
                }}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-2xl sm:text-3xl font-mono py-3.5 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface text-ink transition-all shadow-soft-xs"
                autoFocus
              />
            </div>

            {/* Error Alert */}
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
              disabled={isSubmitting || otpCode.length < 6 || rateLimitSeconds > 0}
              className="w-full font-bold cursor-pointer"
              leftIcon={<Icon name="check_circle" size={18} />}
            >
              {isSubmitting ? t("verifying") : t("verifyBtn")}
            </Button>

            {/* Resend and Back Actions */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setErrorMsg(null);
                }}
                className="text-ink-muted hover:text-primary font-medium flex items-center gap-1 cursor-pointer"
              >
                <Icon name="arrow_back" size={14} />
                <span>{t("changePhone")}</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || rateLimitSeconds > 0}
                onClick={handleSendOtp}
                className={`font-semibold cursor-pointer ${
                  resendCooldown > 0
                    ? "text-ink-muted cursor-not-allowed"
                    : "text-primary hover:underline"
                }`}
              >
                {resendCooldown > 0
                  ? `${t("resendIn")} ${resendCooldown}s`
                  : t("resendOtp")}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
