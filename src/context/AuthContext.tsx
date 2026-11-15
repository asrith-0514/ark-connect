"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, UserType, OtpResult, AuthResult, UserPermissions } from "@/lib/auth/types";
import { AUTH_TRANSLATIONS, AuthLanguage } from "@/lib/auth/translations";
import { hasPermission as checkPermission } from "@/lib/auth/permissions";
import { isDemoModeEnabled } from "@/lib/mock/retailer";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  language: AuthLanguage;
  setLanguage: (lang: AuthLanguage) => void;
  t: (key: keyof typeof AUTH_TRANSLATIONS.en) => string;
  isDemo: boolean;
  sendOtp: (phone: string) => Promise<OtpResult>;
  verifyOtp: (phone: string, otp: string, userType?: UserType) => Promise<AuthResult>;
  loginWithPassword: (identifier: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  hasPermission: (perm: keyof UserPermissions) => boolean;
  rateLimitSeconds: number;
  quickDemoLogin: (type: "retailer" | "owner" | "accountant" | "godown_staff" | "salesman", retailerCode?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [language, setLanguage] = useState<AuthLanguage>("en");
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);
  const [isDemo, setIsDemo] = useState(false);

  // Check demo mode from query param or environment
  useEffect(() => {
    setIsDemo(isDemoModeEnabled());
  }, []);

  // Countdown timer for active rate limits
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  // Fetch session on client mount if initialUser was not passed from server
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data?.user || null);
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const t = useCallback(
    (key: keyof typeof AUTH_TRANSLATIONS.en): string => {
      return AUTH_TRANSLATIONS[language]?.[key] || AUTH_TRANSLATIONS.en[key] || key;
    },
    [language]
  );

  const sendOtp = async (phone: string): Promise<OtpResult> => {
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data: OtpResult = await res.json();
      if (data.rateLimited && data.retryAfterSeconds) {
        setRateLimitSeconds(data.retryAfterSeconds);
      }
      return data;
    } catch (err) {
      return { success: false, error: "Network error sending OTP. Please check your connection." };
    }
  };

  const verifyOtp = async (phone: string, otp: string, userType: UserType = "retailer"): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, userType }),
      });
      const data: AuthResult = await res.json();
      if (data.rateLimited && data.retryAfterSeconds) {
        setRateLimitSeconds(data.retryAfterSeconds);
      }
      if (data.success && data.user) {
        setUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, error: "Network error verifying code." };
    }
  };

  const loginWithPassword = async (identifier: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data: AuthResult = await res.json();
      if (data.rateLimited && data.retryAfterSeconds) {
        setRateLimitSeconds(data.retryAfterSeconds);
      }
      if (data.success && data.user) {
        setUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, error: "Network error during password login." };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      setUser(null);
    }
  };

  const hasPermission = useCallback(
    (perm: keyof UserPermissions): boolean => {
      return checkPermission(user, perm);
    },
    [user]
  );

  const quickDemoLogin = async (
    type: "retailer" | "owner" | "accountant" | "godown_staff" | "salesman",
    retailerCode: string = "RET-0001"
  ): Promise<void> => {
    if (type === "retailer") {
      let targetPhone = "9440123456";
      if (retailerCode === "RET-0002") targetPhone = "9440122890";
      if (retailerCode === "RET-0003") targetPhone = "9885073412";
      await verifyOtp(targetPhone, "123456", "retailer");
    } else {
      const passMap: Record<string, string> = {
        owner: "ark@owner123",
        accountant: "ark@acc123",
        godown_staff: "ark@godown123",
        salesman: "ark@sales123",
      };
      await loginWithPassword(`${type === "godown_staff" ? "godown" : type === "accountant" ? "accounts" : type}@arkdistributors.in`, passMap[type]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        language,
        setLanguage,
        t,
        isDemo,
        sendOtp,
        verifyOtp,
        loginWithPassword,
        logout,
        hasPermission,
        rateLimitSeconds,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
