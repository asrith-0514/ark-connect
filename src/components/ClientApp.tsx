"use client";

import React, { useEffect } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthUser } from "@/lib/auth/types";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { HeaderSwitcher } from "@/components/common/HeaderSwitcher";
import { CommandPalette } from "@/components/common/CommandPalette";
import { RETAILER_PROFILE } from "@/lib/mock/retailer";

// Retailer components
import { RetailerHeader } from "@/components/retailer/RetailerHeader";
import { RetailerBottomNav } from "@/components/retailer/RetailerBottomNav";
import { RetailerHome } from "@/components/retailer/RetailerHome";
import CatalogueView from "@/components/retailer/CatalogueView";
import MyOrdersView from "@/components/retailer/MyOrdersView";
import AccountLedgerView from "@/components/retailer/AccountLedgerView";
import MyAccountView from "@/components/retailer/MyAccountView";
import VariantMatrixModal from "@/components/retailer/VariantMatrixModal";
import ReviewOrderModal from "@/components/retailer/ReviewOrderModal";
import OrderSubmittedModal from "@/components/retailer/OrderSubmittedModal";

// Distributor components
import DistributorSidebar from "@/components/distributor/DistributorSidebar";
import DistributorHeader from "@/components/distributor/DistributorHeader";
import DistributorDashboard from "@/components/distributor/DistributorDashboard";
import DistributorOrders from "@/components/distributor/DistributorOrders";
import { DistributorRetailers } from "@/components/distributor/DistributorRetailers";
import { DistributorProducts } from "@/components/distributor/DistributorProducts";
import { DistributorReceivables } from "@/components/distributor/DistributorReceivables";
import { DistributorReceiptModal } from "@/components/distributor/DistributorReceiptModal";
import { DistributorInvoices } from "@/components/distributor/DistributorInvoices";
import DistributorInvoiceModal from "@/components/distributor/DistributorInvoiceModal";
import { DistributorSuppliers } from "@/components/distributor/DistributorSuppliers";
import { DistributorPurchaseBills } from "@/components/distributor/DistributorPurchaseBills";
import { DistributorSuppliersAndBills } from "@/components/distributor/DistributorSuppliersAndBills";
import { DistributorReports } from "@/components/distributor/DistributorReports";
import { DistributorFollowUps } from "@/components/distributor/DistributorFollowUps";
import { DistributorSegments } from "@/components/distributor/DistributorSegments";
import { DistributorInsights } from "@/components/distributor/DistributorInsights";
import { DistributorVoiceAgent } from "@/components/distributor/DistributorVoiceAgent";
import { Retailer360Profile } from "@/components/distributor/Retailer360Profile";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ArkMonogram } from "@/components/ui/ArkLogo";
import { Icon } from "@/components/ui/Icon";

function MainApp({ defaultAuthTab }: { defaultAuthTab?: "retailer" | "distributor" }) {
  const {
    portalMode,
    setPortalMode,
    retailerNav,
    distributorNav,
    setDistributorNav,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    selectedRetailer360Id,
  } = useApp();

  const { user, isLoading, isDemo, hasPermission, logout, quickDemoLogin } = useAuth();

  // Align portal mode with authenticated user type
  useEffect(() => {
    if (!user) return;
    if (user.type === "distributor" && portalMode !== "distributor") {
      setPortalMode("distributor");
    } else if (user.type === "retailer" && portalMode !== "retailer") {
      setPortalMode("retailer");
    }
  }, [user?.type]);

  // 1. Initial authentication loading state (Splash Screen with Tagline)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none">
        <ArkMonogram size={56} variant="gradient" className="animate-pulse" />
        <div className="flex flex-col items-center mt-4">
          <span className="font-sans font-bold text-base tracking-tight text-ink">
            ARK
          </span>
          <span className="font-mono text-xs text-ink-muted mt-1">
            Wholesale, Connected.
          </span>
        </div>
        <p className="text-[11px] text-ink-muted mt-4 font-mono">
          Verifying security session...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated state: render Login screen
  if (!user) {
    return (
      <AuthScreen
        defaultTab={defaultAuthTab || (portalMode === "distributor" ? "distributor" : "retailer")}
      />
    );
  }

  // 3. Route Guard: Retailer session can NEVER open distributor screens outside ?demo=true
  if (user.type === "retailer" && portalMode === "distributor" && !isDemo) {
    return (
      <div className="min-h-screen bg-background text-ink flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-md bg-danger/10 text-danger border border-danger/30 flex items-center justify-center mb-4">
          <Icon name="block" size={28} />
        </div>
        <h2 className="text-xl font-bold text-ink font-sans tracking-tight">Access Denied: Retailer Session</h2>
        <p className="text-xs text-ink-muted max-w-md mt-1 mb-6 leading-relaxed">
          Your active session ({user.name}) is registered as a Retail Store Owner.
          Retailer accounts are strictly isolated from ARK Distributor Backoffice.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await quickDemoLogin("owner");
              setPortalMode("distributor");
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-xs shadow-soft-xs cursor-pointer hover:bg-primary/90 transition-colors"
          >
            Switch to Wholesaler Staff (Owner)
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              window.location.href = "/staff";
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface border border-border text-ink font-semibold text-xs shadow-soft-xs cursor-pointer hover:bg-surface-raised transition-colors"
          >
            Sign Out
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode("retailer");
              window.location.href = isDemo ? "/?demo=true" : "/";
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-ink-muted hover:text-ink font-semibold text-xs cursor-pointer transition-colors"
          >
            Return to Retailer Portal
          </button>
        </div>
      </div>
    );
  }

  // 4. Route Guard: Distributor staff session can NEVER open retailer screens outside ?demo=true
  if (user.type === "distributor" && portalMode === "retailer" && !isDemo) {
    return (
      <div className="min-h-screen bg-background text-ink flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-md bg-danger/10 text-danger border border-danger/30 flex items-center justify-center mb-4">
          <Icon name="block" size={28} />
        </div>
        <h2 className="text-xl font-bold text-ink font-sans tracking-tight">Access Denied: Distributor Staff Session</h2>
        <p className="text-xs text-ink-muted max-w-md mt-1 mb-6 leading-relaxed">
          Your active session ({user.name} • {user.roleTitle}) is a Distributor Staff account.
          Distributor staff cannot open the Retailer Ordering Portal.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await quickDemoLogin("retailer", "RET-0001");
              setPortalMode("retailer");
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-xs shadow-soft-xs cursor-pointer hover:bg-primary/90 transition-colors"
          >
            Switch to Retailer Store (RET-0001)
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              window.location.href = "/";
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface border border-border text-ink font-semibold text-xs shadow-soft-xs cursor-pointer hover:bg-surface-raised transition-colors"
          >
            Sign Out
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode("distributor");
              window.location.href = isDemo ? "/staff?demo=true" : "/staff";
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-ink-muted hover:text-ink font-semibold text-xs cursor-pointer transition-colors"
          >
            Return to Distributor Backoffice
          </button>
        </div>
      </div>
    );
  }

  // 5. Distributor Role Route Guards:
  // - Godown staff: only orders and stock (products-pricing)
  const isGodownStaff = user.type === "distributor" && user.distributorRole === "godown_staff";
  const godownAllowedTabs = ["orders", "products-pricing", "products"];

  // - Salesman: cannot see receivables, invoices, suppliers, purchase bills, reports
  const isSalesman = user.type === "distributor" && user.distributorRole === "salesman";
  const salesmanForbiddenTabs = ["receivables", "invoices", "suppliers", "purchase-bills", "reports", "receipts"];

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col font-body-md antialiased selection:bg-primary/20 selection:text-ink">
      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />

      {portalMode === "retailer" ? (
        /* ================= RETAILER PORTAL (ARK CONNECT) ================= */
        <div className="flex flex-col min-h-screen bg-background">
          <div id="retailer-sticky-header-wrapper" className="sticky top-0 z-40 w-full">
            {isDemo && <HeaderSwitcher />}
            <RetailerHeader />
          </div>

          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-12">
            {retailerNav === "home" && (
              <ErrorBoundary name="Retailer Home">
                <RetailerHome />
              </ErrorBoundary>
            )}
            {retailerNav === "catalogue" && (
              <ErrorBoundary name="Catalogue">
                <CatalogueView />
              </ErrorBoundary>
            )}
            {retailerNav === "orders" && (
              <ErrorBoundary name="My Orders">
                <MyOrdersView />
              </ErrorBoundary>
            )}
            {retailerNav === "account" && (
              <ErrorBoundary name="Account Ledger">
                <AccountLedgerView />
              </ErrorBoundary>
            )}
            {retailerNav === "account-profile" && (
              <ErrorBoundary name="My Account Profile">
                <MyAccountView />
              </ErrorBoundary>
            )}
          </main>

          {/* Floating Bottom Navigation (Mobile Only: 5 Tabs + Docked PO Bar) */}
          <RetailerBottomNav />

          {/* Retailer Footer (Desktop Only) */}
          <footer className="hidden sm:block mt-auto border-t border-border bg-surface py-8 px-4 text-center text-sm text-ink-muted">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ArkMonogram size={24} />
                <span className="font-semibold text-ink">ARK Connect</span>
                <span className="text-ink-muted text-xs">
                  • {RETAILER_PROFILE.footerCredit}
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                {RETAILER_PROFILE.dispatchHub} • Goods {RETAILER_PROFILE.sourceOrigin} • Dispatched via {RETAILER_PROFILE.preferredTransporter}
              </p>
            </div>
          </footer>

          {/* Interactive Modals */}
          <VariantMatrixModal />
          <ReviewOrderModal />
          <OrderSubmittedModal />
        </div>
      ) : (
        /* ================= DISTRIBUTOR BACKOFFICE (ARK DISTRIBUTORS) ================= */
        <div className="flex flex-col min-h-screen bg-background">
          {isDemo && <HeaderSwitcher />}
          <div className="flex flex-1 min-h-0 bg-background relative items-start">
            {/* Fixed Left Sidebar (240px expanded / 72px collapsed) */}
            <DistributorSidebar />

            {/* Right Main Workspace */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
              <DistributorHeader />

              <main className="flex-1 w-full max-w-[1600px] mx-auto px-7 lg:px-8 py-7 lg:py-8 pb-28 lg:pb-12 bg-background overflow-y-auto">
                {/* Godown Staff Route Enforcement */}
                {isGodownStaff && !godownAllowedTabs.includes(distributorNav) ? (
                  <div className="w-full p-12 bg-surface rounded-xl border border-border text-center flex flex-col items-center justify-center my-8 shadow-soft-sm">
                    <div className="w-12 h-12 rounded-xl bg-warning/15 text-warning flex items-center justify-center mb-3">
                      <Icon name="lock" size={26} />
                    </div>
                    <h3 className="text-lg font-bold text-ink mb-1">
                      Access Restricted: Godown Staff Role
                    </h3>
                    <p className="text-xs text-ink-muted max-w-md mb-4">
                      Warehouse staff accounts are restricted to <strong>Orders &amp; LR Packing</strong> and <strong>Hub Stock Inventory</strong>. Financial and supplier ledgers are restricted to Owner and Accounts.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDistributorNav("orders")}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs cursor-pointer"
                    >
                      Go to Orders &amp; Packing
                    </button>
                  </div>
                ) : isSalesman && salesmanForbiddenTabs.includes(distributorNav) ? (
                  /* Salesman Route Enforcement */
                  <div className="w-full p-12 bg-surface rounded-xl border border-border text-center flex flex-col items-center justify-center my-8 shadow-soft-sm">
                    <div className="w-12 h-12 rounded-xl bg-warning/15 text-warning flex items-center justify-center mb-3">
                      <Icon name="lock" size={26} />
                    </div>
                    <h3 className="text-lg font-bold text-ink mb-1">
                      Access Restricted: Territory Salesman Role
                    </h3>
                    <p className="text-xs text-ink-muted max-w-md mb-4">
                      Sales accounts cannot view distributor receivables, invoices, mill payables, or profit reports.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDistributorNav("orders")}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs cursor-pointer"
                    >
                      Go to Store Orders
                    </button>
                  </div>
                ) : (
                  <>
                    {distributorNav === "dashboard" && hasPermission("canViewDashboard") && (
                      <ErrorBoundary name="Distributor Dashboard">
                        <DistributorDashboard />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "orders" && hasPermission("canViewOrders") && (
                      <ErrorBoundary name="Orders">
                        <DistributorOrders />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "retailers" && hasPermission("canViewRetailers") && (
                      <ErrorBoundary name="Retailers">
                        <DistributorRetailers />
                      </ErrorBoundary>
                    )}
                    {(distributorNav === "products-pricing" || distributorNav === "products") && hasPermission("canViewProducts") && (
                      <ErrorBoundary name="Products & Pricing">
                        <DistributorProducts />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "receivables" && hasPermission("canViewReceivables") && (
                      <ErrorBoundary name="Receivables">
                        <DistributorReceivables />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "receipts" && hasPermission("canRecordReceipts") && (
                      <ErrorBoundary name="Receipts">
                        <DistributorReceiptModal />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "invoices" && hasPermission("canViewInvoices") && (
                      <ErrorBoundary name="Tax Invoices">
                        <DistributorInvoices />
                      </ErrorBoundary>
                    )}
                    {(distributorNav === "suppliers" || distributorNav === "purchase-bills" || distributorNav === "suppliers-bills") && hasPermission("canViewSuppliers") && (
                      <ErrorBoundary name="Suppliers & Bills">
                        <DistributorSuppliersAndBills />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "reports" && hasPermission("canViewReports") && (
                      <ErrorBoundary name="Reports & Analytics">
                        <DistributorReports />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "follow-ups" && hasPermission("canViewRetailers") && (
                      <ErrorBoundary name="Follow-up Management">
                        <DistributorFollowUps />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "segments" && hasPermission("canViewRetailers") && (
                      <ErrorBoundary name="Retailer Segmentation">
                        <DistributorSegments />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "insights" && hasPermission("canViewRetailers") && (
                      <ErrorBoundary name="Actionable Insights">
                        <DistributorInsights />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "voice-agent" && hasPermission("canViewRetailers") && (
                      <ErrorBoundary name="AI Voice Calling Agent">
                        <DistributorVoiceAgent />
                      </ErrorBoundary>
                    )}
                    {distributorNav === "retailer-360" && hasPermission("canViewRetailers") && (
                      <ErrorBoundary name="Retailer 360 Profile">
                        <Retailer360Profile
                          retailerId={selectedRetailer360Id || "ret-1"}
                          onBack={() => setDistributorNav("retailers")}
                        />
                      </ErrorBoundary>
                    )}
                  </>
                )}
              </main>
            </div>

            {/* Global Receipt Modal Overlay if opened outside receipts screen */}
            {isReceiptModalOpen && distributorNav !== "receipts" && hasPermission("canRecordReceipts") && (
              <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-surface rounded-xl shadow-soft-xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto border border-border">
                  <DistributorReceiptModal onClose={() => setIsReceiptModalOpen(false)} />
                </div>
              </div>
            )}

            {/* Global Tax Invoice Paper Preview Modal */}
            <DistributorInvoiceModal />
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientApp({
  initialMode,
  defaultAuthTab,
  initialDistributorNav,
  initialRetailerNav,
  initialUser = null,
  isDemo = false,
}: {
  initialMode?: "retailer" | "distributor" | "auth";
  defaultAuthTab?: "retailer" | "distributor";
  initialDistributorNav?: string;
  initialRetailerNav?: string;
  initialUser?: AuthUser | null;
  isDemo?: boolean;
}) {
  const effectiveMode =
    initialMode === "auth"
      ? (defaultAuthTab === "distributor" ? "distributor" : "retailer")
      : (initialMode || "retailer");

  return (
    <AuthProvider initialUser={initialUser} isDemo={isDemo}>
      <AppProvider
        initialMode={effectiveMode}
        initialDistributorNav={initialDistributorNav}
        initialRetailerNav={initialRetailerNav}
      >
        <MainApp defaultAuthTab={defaultAuthTab} />
      </AppProvider>
    </AuthProvider>
  );
}
