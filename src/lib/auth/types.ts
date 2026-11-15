// ============================================================================
// Authentication & Role-Based Access Control (RBAC) Type Definitions
// ============================================================================

export type UserType = "retailer" | "distributor";

export type DistributorRole = "owner" | "accountant" | "godown_staff" | "salesman";

export interface UserPermissions {
  // Navigation & View Permissions
  canViewDashboard: boolean;
  canViewOrders: boolean;
  canViewRetailers: boolean;
  canViewProducts: boolean;
  canViewReceivables: boolean;
  canViewInvoices: boolean;
  canViewSuppliers: boolean;
  canViewPurchaseBills: boolean;
  canViewReports: boolean;

  // Sensitive Field & Action Permissions
  canViewTierPricing: boolean;
  canEditTierPricing: boolean;
  canViewSupplierPayables: boolean;
  canManageStock: boolean;
  canApproveOrders: boolean;
  canIssueInvoices: boolean;
  canRecordReceipts: boolean;
  canManageRetailers: boolean;
}

export interface AuthUser {
  id: string;
  type: UserType;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  retailerId?: string; // e.g. "ret-1"
  retailerCode?: string; // e.g. "RET-0001"
  distributorRole?: DistributorRole;
  roleTitle: string;
  permissions: UserPermissions;
  sessionExpiry: number; // Unix timestamp in milliseconds
}

export interface SessionPayload {
  user: AuthUser;
  issuedAt: number;
  expiresAt: number;
}

export interface OtpResult {
  success: boolean;
  error?: string;
  mockOtp?: string;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
}

export interface AuthProvider {
  sendOtp(phone: string): Promise<OtpResult>;
  verifyOtp(phone: string, otp: string, userType: UserType): Promise<AuthResult>;
  loginWithPassword(identifier: string, password: string): Promise<AuthResult>;
  logout(): Promise<{ success: boolean }>;
  getSession(): Promise<AuthUser | null>;
}
