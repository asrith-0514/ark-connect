"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS, MOCK_BRANDS } from "@/data/mockData";

export function CommandPalette() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    setPortalMode,
    setRetailerNav,
    setDistributorNav,
    openMatrixModal,
    orders,
    retailers,
    invoices,
    setViewingInvoice,
    setIsReceiptModalOpen
  } = useApp();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isSearchOpen) {
      setSearch("");
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredProducts = MOCK_PRODUCTS.filter(
    p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.artNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBrands = MOCK_BRANDS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRetailers = retailers.filter(
    r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.town.toLowerCase().includes(search.toLowerCase()) ||
      r.gstin.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter(
    o =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.retailerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-container bg-surface-container-low/50">
          <span className="material-symbols-outlined text-outline text-[22px]">search</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a product (e.g. FB-104), brand, retailer, or PO #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline"
          />
          <kbd className="px-2 py-0.5 rounded bg-surface-container font-numeric-table text-label-sm text-on-surface-variant">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Quick shortcuts */}
          {!search && (
            <div className="p-2">
              <span className="font-label-sm uppercase tracking-wider text-outline px-2 font-semibold">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => {
                    setPortalMode("retailer");
                    setRetailerNav("catalogue");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  </span>
                  <div>
                    <div className="font-title-sm text-body-md font-semibold">Wholesale Catalogue</div>
                    <div className="font-body-sm text-outline">Browse all 9 brands sourced from Tiruppur mills</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("retailer");
                    setRetailerNav("account-profile");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </span>
                  <div>
                    <div className="font-title-sm text-body-md font-semibold">My Account & Profile</div>
                    <div className="font-body-sm text-outline">Business details, GSTIN, credit standing, contacts</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("distributor");
                    setDistributorNav("orders");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-tertiary-container/15 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  </span>
                  <div>
                    <div className="font-title-sm text-body-md font-semibold">Distributor Orders</div>
                    <div className="font-body-sm text-outline">Fulfill and invoice active POs</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("distributor");
                    setDistributorNav("receipts");
                    setIsReceiptModalOpen(true);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </span>
                  <div>
                    <div className="font-title-sm text-body-md font-semibold">Record Payment Receipt</div>
                    <div className="font-body-sm text-outline">Apply UPI/NEFT to retailer invoices</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("distributor");
                    setDistributorNav("retailers");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                  </span>
                  <div>
                    <div className="font-title-sm text-body-md font-semibold">Retailer Applications</div>
                    <div className="font-body-sm text-outline">Review pending shop onboarding</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <span className="font-label-sm uppercase tracking-wider text-outline px-3 font-semibold">
                Products ({filteredProducts.length})
              </span>
              <div className="mt-1 space-y-1">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setPortalMode("retailer");
                      setRetailerNav("catalogue");
                      openMatrixModal(product);
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-title-sm text-body-md font-semibold text-on-surface">
                            {product.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container text-outline font-numeric-table text-label-sm">
                            Art #{product.artNumber}
                          </span>
                        </div>
                        <span className="font-body-sm text-outline">{product.brand} • {product.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-numeric-currency-md text-primary font-bold">₹{product.pricePerUnit}</span>
                      <span className="font-body-sm text-outline block">/{product.unitLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {filteredBrands.length > 0 && (
            <div>
              <span className="font-label-sm uppercase tracking-wider text-outline px-3 font-semibold">
                Brands ({filteredBrands.length})
              </span>
              <div className="mt-1 space-y-1">
                {filteredBrands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      setPortalMode("retailer");
                      setRetailerNav("catalogue");
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-md font-bold text-primary">
                        {brand.shortCode}
                      </div>
                      <div>
                        <span className="font-title-sm text-body-md font-semibold text-on-surface">
                          {brand.name}
                        </span>
                        <span className="font-body-sm text-outline block">{brand.tagline}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm font-semibold">
                      {brand.stockPercentage}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {filteredOrders.length > 0 && (
            <div>
              <span className="font-label-sm uppercase tracking-wider text-outline px-3 font-semibold">
                Orders & POs ({filteredOrders.length})
              </span>
              <div className="mt-1 space-y-1">
                {filteredOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setPortalMode("distributor");
                      setDistributorNav("orders");
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container text-left transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-numeric-table font-bold text-primary">#{order.orderNumber}</span>
                        <span className="font-body-md text-on-surface">{order.retailerName}</span>
                      </div>
                      <span className="font-body-sm text-outline">{order.retailerTown} • {order.totalBoxes} boxes</span>
                    </div>
                    <div className="text-right">
                      <span className="font-numeric-currency-md font-bold text-on-surface">₹{order.grandTotal.toLocaleString("en-IN")}</span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm block mt-0.5">
                        {order.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

