"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, UserType, OtpResult, AuthResult, UserPermissions } from "@/lib/auth/types";
import { AUTH_TRANSLATIONS, AuthLanguage } from "@/lib/auth/translations";
import { hasPermission as checkPermission, getRolePermissions } from "@/lib/auth/permissions";

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
  isDemo = false,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
  isDemo?: boolean;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [language, setLanguage] = useState<AuthLanguage>("en");
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);

  // isDemo is computed on the server and passed down as a prop; never re-derived on the client
  const isDemoActive = Boolean(isDemo);

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
            if (data?.user) {
              const search = typeof window !== "undefined" ? window.location.search : "";
              if (!search.includes("auth=true")) {
                setUser(data.user);
              } else {
                setUser(null);
              }
            } else if (isDemoActive) {
              const search = typeof window !== "undefined" ? window.location.search : "";
              const isDistributor = search.includes("mode=distributor") || search.includes("role=distributor") || search.includes("portal=distributor") || search.includes("view=dashboard");
              if (isDistributor) {
                setUser({
                  id: "staff-1",
                  type: "distributor",
                  name: "A. Ramakrishna",
                  email: "owner@arkconnect.in",
                  phone: "+91 98480 12345",
                  distributorRole: "owner",
                  roleTitle: "Proprietor / Managing Director",
                  permissions: getRolePermissions("owner"),
                  sessionExpiry: 9999999999999,
                });
              } else {
                setUser({
                  id: "ret-1",
                  type: "retailer",
                  name: "Sri Laxmi Narasimha Textiles",
                  phone: "+91 94401 23456",
                  retailerId: "ret-1",
                  retailerCode: "RET-0001",
                  roleTitle: "Retail Store Owner",
                  permissions: getRolePermissions("retailer"),
                  sessionExpiry: 9999999999999,
                });
              }
            } else {
              setUser(null);
            }
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
  }, [initialUser, isDemoActive]);

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
