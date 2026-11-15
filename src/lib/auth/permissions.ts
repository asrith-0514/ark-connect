// ============================================================================
// Role-Based Access Control (RBAC) Permissions Map & Helpers
// ============================================================================

import { DistributorRole, UserPermissions, AuthUser } from "./types";

export const PERMISSIONS_MAP: Record<DistributorRole | "retailer", UserPermissions> = {
  // 1. Retailer Portal (ARK Connect)
  // Retailers are isolated to their store: zero access to distributor views or internal tier margins
  retailer: {
    canViewDashboard: false,
    canViewOrders: true, // Only own orders
    canViewRetailers: false,
    canViewProducts: true, // Retailer catalogue only
    canViewReceivables: false,
    canViewInvoices: false, // Only own invoices via retailer ledger
    canViewSuppliers: false,
    canViewPurchaseBills: false,
    canViewReports: false,

    canViewTierPricing: false,
    canEditTierPricing: false,
    canViewSupplierPayables: false,
    canManageStock: false,
    canApproveOrders: false,
    canIssueInvoices: false,
    canRecordReceipts: false,
    canManageRetailers: false,
  },

  // 2. Distributor Owner / Super Admin
  // Complete access across operations, pricing, ledgers, and mill supply chain
  owner: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewRetailers: true,
    canViewProducts: true,
    canViewReceivables: true,
    canViewInvoices: true,
    canViewSuppliers: true,
    canViewPurchaseBills: true,
    canViewReports: true,

    canViewTierPricing: true,
    canEditTierPricing: true,
    canViewSupplierPayables: true,
    canManageStock: true,
    canApproveOrders: true,
    canIssueInvoices: true,
    canRecordReceipts: true,
    canManageRetailers: true,
  },

  // 3. Distributor Senior Accountant
  // Invoicing, payments, ageing receivables, mill bills, and financial reporting
  accountant: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewRetailers: true, // Read-only directory
    canViewProducts: true,
    canViewReceivables: true,
    canViewInvoices: true,
    canViewSuppliers: true,
    canViewPurchaseBills: true,
    canViewReports: true,

    canViewTierPricing: true, // Read-only for invoice verification
    canEditTierPricing: false, // Cannot alter pricing rate cards
    canViewSupplierPayables: true,
    canManageStock: false, // Cannot alter physical stock
    canApproveOrders: false, // Orders approved by sales/owner
    canIssueInvoices: true,
    canRecordReceipts: true,
    canManageRetailers: false,
  },

  // 4. Godown Staff (Warehouse / Logistics)
  // Strictly restricted to physical stock inventory and packing/shipping orders
  godown_staff: {
    canViewDashboard: false,
    canViewOrders: true, // Packing & LR assignment
    canViewRetailers: false,
    canViewProducts: true, // Stock levels only
    canViewReceivables: false, // FORBIDDEN
    canViewInvoices: false, // FORBIDDEN
    canViewSuppliers: false, // FORBIDDEN
    canViewPurchaseBills: false, // FORBIDDEN
    canViewReports: false, // FORBIDDEN

    canViewTierPricing: false, // FORBIDDEN: cannot see commercial rates
    canEditTierPricing: false,
    canViewSupplierPayables: false, // FORBIDDEN
    canManageStock: true, // Can update inventory levels
    canApproveOrders: false,
    canIssueInvoices: false,
    canRecordReceipts: false,
    canManageRetailers: false,
  },

  // 5. Salesman (Field Sales Executive)
  // Territory store orders, retailer onboarding, and catalogue browsing
  salesman: {
    canViewDashboard: true,
    canViewOrders: true,
    canViewRetailers: true,
    canViewProducts: true, // Standard catalogue view
    canViewReceivables: false, // FORBIDDEN: cannot see global distributor financials
    canViewInvoices: false, // FORBIDDEN
    canViewSuppliers: false, // FORBIDDEN: cannot see mills
    canViewPurchaseBills: false, // FORBIDDEN: cannot see purchase bills
    canViewReports: false, // FORBIDDEN

    canViewTierPricing: false, // FORBIDDEN: cannot see Tier A++, A+, A margins
    canEditTierPricing: false,
    canViewSupplierPayables: false, // FORBIDDEN: cannot see mill payables
    canManageStock: false,
    canApproveOrders: false,
    canIssueInvoices: false,
    canRecordReceipts: false,
    canManageRetailers: false,
  },
};

export interface RoleMetadata {
  role: DistributorRole;
  title: string;
  badge: string;
  description: string;
  defaultEmail: string;
  defaultPhone: string;
}

export const DISTRIBUTOR_ROLES_METADATA: Record<DistributorRole, RoleMetadata> = {
  owner: {
    role: "owner",
    title: "Owner / Super Admin",
    badge: "Super Admin",
    description: "Complete control over sales, receivables, pricing rate cards, and mill payables.",
    defaultEmail: "owner@arkdistributors.in",
    defaultPhone: "+91 98480 00001",
  },
  accountant: {
    role: "accountant",
    title: "Senior Accountant",
    badge: "Finance & Accounts",
    description: "Tax invoicing, payment receipts, ageing receivables, and mill purchase bills.",
    defaultEmail: "accounts@arkdistributors.in",
    defaultPhone: "+91 98480 00002",
  },
  godown_staff: {
    role: "godown_staff",
    title: "Godown Staff",
    badge: "Warehouse & Logistics",
    description: "Dispatch fulfillment, master carton counts, and central hub stock levels only.",
    defaultEmail: "godown@arkdistributors.in",
    defaultPhone: "+91 98480 00003",
  },
  salesman: {
    role: "salesman",
    title: "Territory Salesman",
    badge: "Field Sales",
    description: "Store purchase orders, active retailer visits, and stock availability checks.",
    defaultEmail: "sales@arkdistributors.in",
    defaultPhone: "+91 98480 00004",
  },
};

export function getRolePermissions(role: DistributorRole | "retailer"): UserPermissions {
  return PERMISSIONS_MAP[role] || PERMISSIONS_MAP.retailer;
}

export function hasPermission(user: AuthUser | null, permission: keyof UserPermissions): boolean {
  if (!user) return false;
  return !!user.permissions?.[permission];
}
