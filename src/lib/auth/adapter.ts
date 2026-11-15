// ============================================================================
// ARK Platform — Authentication Provider Interface & Adapters
// ============================================================================
//
// ⚠️ ARCHITECTURE & SECURITY NOTICE:
// MockAuthAdapter is an IN-MEMORY & COOKIE-BASED PROTOTYPE for local evaluation.
// Mock authentication is NOT secure for production workloads because credentials,
// OTP verification, and authorization decisions run without cryptographic signing
// from a trusted backend server.
//
// TO TRANSITION TO PRODUCTION WITH FIREBASE AUTH:
// 1. Enable Firebase Phone Authentication and Email/Password in Firebase Console.
// 2. Configure Firebase environment variables (NEXT_PUBLIC_FIREBASE_API_KEY, etc.).
// 3. Uncomment and configure the FirebaseAuthAdapter class at the bottom of this file.
// 4. Update the export: `export const authAdapter: AuthProvider = new FirebaseAuthAdapter();`
//
// Because all components, hooks, and API route handlers strictly consume the
// `AuthProvider` interface, migrating to Firebase Auth touches ONLY THIS SINGLE FILE.
// ============================================================================

import { AuthProvider, AuthResult, AuthUser, DistributorRole, OtpResult, SessionPayload, UserType } from "./types";
import { getRolePermissions, DISTRIBUTOR_ROLES_METADATA } from "./permissions";
import { MOCK_RETAILERS } from "@/lib/mock/data";

// Maximum failed verification attempts before rate limiting locks the identifier
const MAX_FAILED_ATTEMPTS = 3;
const RATE_LIMIT_LOCKOUT_MS = 60 * 1000; // 60 seconds

interface RateLimitTracker {
  failedAttempts: number;
  lockedUntil: number;
}

// In-memory rate limit store for demo prototype
const rateLimitStore = new Map<string, RateLimitTracker>();

function checkRateLimit(key: string): { isLimited: boolean; retryAfterSeconds: number } {
  const record = rateLimitStore.get(key);
  if (!record) return { isLimited: false, retryAfterSeconds: 0 };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLimited: true, retryAfterSeconds };
  }

  // Lockout expired, reset counter if past lockout
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    rateLimitStore.delete(key);
  }

  return { isLimited: false, retryAfterSeconds: 0 };
}

function recordFailure(key: string): { isLimited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = rateLimitStore.get(key) || { failedAttempts: 0, lockedUntil: 0 };
  current.failedAttempts += 1;

  if (current.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = now + RATE_LIMIT_LOCKOUT_MS;
    rateLimitStore.set(key, current);
    return { isLimited: true, retryAfterSeconds: Math.ceil(RATE_LIMIT_LOCKOUT_MS / 1000) };
  }

  rateLimitStore.set(key, current);
  return { isLimited: false, retryAfterSeconds: 0 };
}

function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Session cookie helper utilities
export const SESSION_COOKIE_NAME = "ark_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function encodeSessionToken(user: AuthUser): string {
  const payload: SessionPayload = {
    user,
    issuedAt: Date.now(),
    expiresAt: user.sessionExpiry || Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const json = JSON.stringify(payload);
  if (typeof btoa !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json).toString("base64");
}

export function decodeSessionToken(token: string): AuthUser | null {
  try {
    let json = "";
    if (typeof atob !== "undefined") {
      json = decodeURIComponent(escape(atob(token)));
    } else {
      json = Buffer.from(token, "base64").toString("utf-8");
    }
    const payload: SessionPayload = JSON.parse(json);
    if (!payload?.user || !payload?.expiresAt) return null;
    if (Date.now() > payload.expiresAt) return null; // Expired
    return payload.user;
  } catch {
    return null;
  }
}

// Standard mock staff users for distributor backoffice
const MOCK_DISTRIBUTOR_STAFF: Array<{
  id: string;
  name: string;
  email: string;
  phone: string;
  role: DistributorRole;
  passwordHash: string; // Simulated password
}> = [
  {
    id: "staff-owner",
    name: "Thatavarthi",
    email: "owner@arkdistributors.in",
    phone: "9848000001",
    role: "owner",
    passwordHash: "ark@owner123",
  },
  {
    id: "staff-acc",
    name: "Ramesh Rao",
    email: "accounts@arkdistributors.in",
    phone: "9848000002",
    role: "accountant",
    passwordHash: "ark@acc123",
  },
  {
    id: "staff-godown",
    name: "Venkatesh",
    email: "godown@arkdistributors.in",
    phone: "9848000003",
    role: "godown_staff",
    passwordHash: "ark@godown123",
  },
  {
    id: "staff-sales",
    name: "Suresh Kumar",
    email: "sales@arkdistributors.in",
    phone: "9848000004",
    role: "salesman",
    passwordHash: "ark@sales123",
  },
];

export class MockAuthAdapter implements AuthProvider {
  /**
   * Sends an OTP (mocked in development, returns '123456')
   */
  async sendOtp(phone: string): Promise<OtpResult> {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const rateCheck = checkRateLimit(cleanPhone);
    if (rateCheck.isLimited) {
      return {
        success: false,
        rateLimited: true,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        error: `Too many failed attempts. Please wait ${rateCheck.retryAfterSeconds}s before requesting a new code.`,
      };
    }

    // In demo prototype, the standard verification code is 123456
    return {
      success: true,
      mockOtp: "123456",
    };
  }

  /**
   * Verifies an OTP code for a retailer or distributor staff member
   */
  async verifyOtp(phone: string, otp: string, userType: UserType): Promise<AuthResult> {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const rateCheck = checkRateLimit(cleanPhone);
    if (rateCheck.isLimited) {
      return {
        success: false,
        rateLimited: true,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        error: `Account is temporarily locked. Please wait ${rateCheck.retryAfterSeconds}s.`,
      };
    }

    // Prototype code check: accepted code is "123456"
    if (otp !== "123456") {
      const failStatus = recordFailure(cleanPhone);
      return {
        success: false,
        rateLimited: failStatus.isLimited,
        retryAfterSeconds: failStatus.retryAfterSeconds,
        error: failStatus.isLimited
          ? `Too many failed attempts. Account locked for ${failStatus.retryAfterSeconds}s.`
          : "Invalid verification code. Please check and re-enter.",
      };
    }

    // Successful OTP: reset failed attempts
    resetRateLimit(cleanPhone);

    if (userType === "retailer") {
      // Find matching retailer in mock database by phone
      const matchedRetailer = MOCK_RETAILERS.find(r => {
        const rPhone = r.phone.replace(/\D/g, "").slice(-10);
        return rPhone === cleanPhone;
      });

      // If phone doesn't match an exact retailer, bind to RET-0001 in demo or return error
      const targetRetailer = matchedRetailer || MOCK_RETAILERS[0]; // Sri Laxmi Narasimha Textiles

      const user: AuthUser = {
        id: targetRetailer.id,
        type: "retailer",
        name: targetRetailer.name,
        phone: targetRetailer.phone,
        retailerId: targetRetailer.id,
        retailerCode: targetRetailer.code,
        roleTitle: "Retail Store Owner",
        permissions: getRolePermissions("retailer"),
        sessionExpiry: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      };

      const token = encodeSessionToken(user);
      return { success: true, user, token };
    } else {
      // Distributor staff OTP login
      const matchedStaff = MOCK_DISTRIBUTOR_STAFF.find(s => s.phone === cleanPhone) || MOCK_DISTRIBUTOR_STAFF[0];
      const roleMeta = DISTRIBUTOR_ROLES_METADATA[matchedStaff.role];

      const user: AuthUser = {
        id: matchedStaff.id,
        type: "distributor",
        name: matchedStaff.name,
        email: matchedStaff.email,
        phone: matchedStaff.phone,
        distributorRole: matchedStaff.role,
        roleTitle: roleMeta.title,
        permissions: getRolePermissions(matchedStaff.role),
        sessionExpiry: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      };

      const token = encodeSessionToken(user);
      return { success: true, user, token };
    }
  }

  /**
   * Logs in distributor staff using email/phone and password
   */
  async loginWithPassword(identifier: string, password: string): Promise<AuthResult> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, "").slice(-10);

    const rateCheck = checkRateLimit(cleanId);
    if (rateCheck.isLimited) {
      return {
        success: false,
        rateLimited: true,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        error: `Too many failed attempts. Please wait ${rateCheck.retryAfterSeconds}s before retrying.`,
      };
    }

    const matchedStaff = MOCK_DISTRIBUTOR_STAFF.find(
      s => s.email.toLowerCase() === cleanId || s.phone === cleanPhone
    );

    if (!matchedStaff || matchedStaff.passwordHash !== password) {
      const failStatus = recordFailure(cleanId);
      return {
        success: false,
        rateLimited: failStatus.isLimited,
        retryAfterSeconds: failStatus.retryAfterSeconds,
        error: failStatus.isLimited
          ? `Too many failed attempts. Locked for ${failStatus.retryAfterSeconds}s.`
          : "Invalid email/phone or password. Please verify your credentials.",
      };
    }

    resetRateLimit(cleanId);
    const roleMeta = DISTRIBUTOR_ROLES_METADATA[matchedStaff.role];

    const user: AuthUser = {
      id: matchedStaff.id,
      type: "distributor",
      name: matchedStaff.name,
      email: matchedStaff.email,
      phone: matchedStaff.phone,
      distributorRole: matchedStaff.role,
      roleTitle: roleMeta.title,
      permissions: getRolePermissions(matchedStaff.role),
      sessionExpiry: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    };

    const token = encodeSessionToken(user);
    return { success: true, user, token };
  }

  /**
   * Signs out user and clears in-memory state
   */
  async logout(): Promise<{ success: boolean }> {
    return { success: true };
  }

  /**
   * Retrieves active session from browser document cookie or API
   */
  async getSession(): Promise<AuthUser | null> {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const [key, value] = c.trim().split("=");
      if (key === SESSION_COOKIE_NAME && value) {
        return decodeSessionToken(value);
      }
    }
    return null;
  }
}

// ============================================================================
// Future Firebase Auth Adapter Implementation Skeleton
// ============================================================================
/**
 * Ready-to-use blueprint for Firebase Authentication.
 * When enabling Firebase:
 * 1. Install `firebase` package: `npm install firebase`
 * 2. Initialize Firebase app with client config
 * 3. Uncomment this implementation and export it as `authAdapter`.
 */
export class FirebaseAuthAdapter implements AuthProvider {
  async sendOtp(_phone: string): Promise<OtpResult> {
    // Example Firebase Phone Auth implementation:
    // const auth = getAuth();
    // const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    // const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier);
    // window.confirmationResult = confirmationResult;
    // return { success: true };
    throw new Error("FirebaseAuthAdapter requires Firebase SDK configuration.");
  }

  async verifyOtp(_phone: string, _otp: string, _userType: UserType): Promise<AuthResult> {
    // const result = await window.confirmationResult.confirm(otp);
    // const firebaseUser = result.user;
    // Call backend API /api/auth/firebase-verify to exchange Firebase token for session
    throw new Error("FirebaseAuthAdapter requires Firebase SDK configuration.");
  }

  async loginWithPassword(_identifier: string, _password: string): Promise<AuthResult> {
    // const auth = getAuth();
    // const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
    throw new Error("FirebaseAuthAdapter requires Firebase SDK configuration.");
  }

  async logout(): Promise<{ success: boolean }> {
    // const auth = getAuth();
    // await signOut(auth);
    return { success: true };
  }

  async getSession(): Promise<AuthUser | null> {
    // Check Firebase onAuthStateChanged or active session cookie
    return null;
  }
}

// Active Auth Provider instance (swapping to Firebase Auth requires changing ONLY this line)
export const authAdapter: AuthProvider = new MockAuthAdapter();
