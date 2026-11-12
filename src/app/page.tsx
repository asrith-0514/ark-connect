"use client";

import React from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { HeaderSwitcher } from "@/components/common/HeaderSwitcher";
import { CommandPalette } from "@/components/common/CommandPalette";
import { RETAILER_PROFILE } from "@/lib/mock/retailer";

// Retailer components
import { RetailerHeader } from "@/components/retailer/RetailerHeader";
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
import { DistributorReports } from "@/components/distributor/DistributorReports";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

function MainApp() {
  const {
    portalMode,
    retailerNav,
    distributorNav,
    setDistributorNav,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    invoices,
    setViewingInvoice
  } = useApp();

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-on-primary">
      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />

      {portalMode === "retailer" ? (
        /* ================= RETAILER PORTAL (ARK CONNECT) ================= */
        <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
          <div id="retailer-sticky-header-wrapper" className="sticky top-0 z-40 w-full">
            <HeaderSwitcher />
            <RetailerHeader />
          </div>

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

          {/* Retailer Footer */}
          <footer className="mt-auto border-t border-surface-container bg-surface-container-lowest py-8 px-4 text-center text-sm text-outline">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-white font-bold flex items-center justify-center text-xs">
                  A
                </span>
                <span className="font-semibold text-on-surface">ARK Connect</span>
                <span className="text-outline text-xs">
                  • {RETAILER_PROFILE.footerCredit}
                </span>
              </div>
              <p className="text-xs text-outline">
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
        <div className="flex flex-col min-h-screen bg-surface">
          <HeaderSwitcher />
          <div className="flex flex-1 min-h-0 bg-surface relative">
            {/* Fixed Left Sidebar */}
            <DistributorSidebar />

            {/* Right Main Workspace */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
              <DistributorHeader />

              <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pt-6 pb-16 bg-surface overflow-y-auto">
                {distributorNav === "dashboard" && (
                  <ErrorBoundary name="Distributor Dashboard">
                    <DistributorDashboard />
                  </ErrorBoundary>
                )}
                {distributorNav === "orders" && (
                  <ErrorBoundary name="Orders">
                    <DistributorOrders />
                  </ErrorBoundary>
                )}
                {distributorNav === "retailers" && (
                  <ErrorBoundary name="Retailers">
                    <DistributorRetailers />
                  </ErrorBoundary>
                )}
                {(distributorNav === "products-pricing" || distributorNav === "products") && (
                  <ErrorBoundary name="Products & Pricing">
                    <DistributorProducts />
                  </ErrorBoundary>
                )}
                {distributorNav === "receivables" && (
                  <ErrorBoundary name="Receivables">
                    <DistributorReceivables />
                  </ErrorBoundary>
                )}
                {distributorNav === "receipts" && (
                  <ErrorBoundary name="Receipts">
                    <DistributorReceiptModal onClose={() => setDistributorNav("dashboard")} />
                  </ErrorBoundary>
                )}
                {distributorNav === "invoices" && (
                  <ErrorBoundary name="Tax Invoices">
                    <DistributorInvoices />
                  </ErrorBoundary>
                )}
                {distributorNav === "suppliers" && (
                  <ErrorBoundary name="Suppliers">
                    <DistributorSuppliers />
                  </ErrorBoundary>
                )}
                {(distributorNav === "purchase-bills" || distributorNav === "purchases") && (
                  <ErrorBoundary name="Purchase Bills">
                    <DistributorPurchaseBills />
                  </ErrorBoundary>
                )}
                {(distributorNav === "reports" || distributorNav === "analytics") && (
                  <ErrorBoundary name="Reports & Analytics">
                    <DistributorReports />
                  </ErrorBoundary>
                )}

                {/* Coming Soon empty state for unmapped or future views */}
                {![
                  "dashboard",
                  "orders",
                  "retailers",
                  "products-pricing",
                  "products",
                  "receivables",
                  "receipts",
                  "invoices",
                  "suppliers",
                  "purchase-bills",
                  "purchases",
                  "reports",
                  "analytics"
                ].includes(distributorNav) && (
                  <div className="w-full p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center my-8 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0047d3] flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[26px]">hourglass_empty</span>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-[#0047d3] mb-2">
                      Coming Soon
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Module Under Preparation
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      The module <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">{distributorNav}</code> is being configured for ARK Backoffice.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDistributorNav("dashboard")}
                      className="px-4 py-2 rounded-xl bg-[#0047d3] text-white font-semibold text-xs shadow-xs hover:bg-[#1e5eff] transition-colors cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </main>
            </div>

          {/* Global Receipt Modal Overlay if opened outside receipts screen */}
          {isReceiptModalOpen && distributorNav !== "receipts" && (
            <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-surface rounded-2xl shadow-2xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto border border-outline-variant/30">
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

export default function Home() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#f7f9fb]" />}>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </React.Suspense>
  );
}
