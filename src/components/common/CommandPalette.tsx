"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-surface rounded-lg shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-raised/50">
          <Icon name="search" size={22} className="text-ink-muted" />
          <input
            autoFocus
            type="text"
            placeholder="Type a product (e.g. FB-104), brand, retailer, or PO #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-sans text-ink placeholder:text-ink-muted"
          />
          <kbd className="px-2 py-0.5 rounded bg-surface-raised border border-border font-mono text-[10px] text-ink-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Quick shortcuts */}
          {!search && (
            <div className="p-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted px-2 font-semibold">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => {
                    setPortalMode("retailer");
                    setRetailerNav("catalogue");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="inventory_2" size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink font-sans">Wholesale Catalogue</div>
                    <div className="text-xs text-ink-muted font-sans">Browse all 9 brands sourced from Tiruppur mills</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("retailer");
                    setRetailerNav("account-profile");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="person" size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink font-sans">My Account & Profile</div>
                    <div className="text-xs text-ink-muted font-sans">Business details, GSTIN, credit standing, contacts</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("distributor");
                    setDistributorNav("orders");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="receipt_long" size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink font-sans">Distributor Orders</div>
                    <div className="text-xs text-ink-muted font-sans">Fulfill and invoice active POs</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("distributor");
                    setDistributorNav("receipts");
                    setIsReceiptModalOpen(true);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-md bg-accent/10 text-accent flex items-center justify-center">
                    <Icon name="payments" size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink font-sans">Record Payment Receipt</div>
                    <div className="text-xs text-ink-muted font-sans">Apply UPI/NEFT to retailer invoices</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPortalMode("distributor");
                    setDistributorNav("retailers");
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="storefront" size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink font-sans">Retailer Applications</div>
                    <div className="text-xs text-ink-muted font-sans">Review pending shop onboarding</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted px-3 font-semibold">
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
                    className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.title} className="w-10 h-10 rounded-md object-cover border border-border" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink">
                            {product.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-raised border border-border text-ink-muted font-mono text-[10px]">
                            Art #{product.artNumber}
                          </span>
                        </div>
                        <span className="text-xs text-ink-muted font-sans">{product.brand} • {product.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono num font-bold text-primary">₹{product.pricePerUnit}</span>
                      <span className="text-xs font-mono text-ink-muted block">/{product.unitLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {filteredBrands.length > 0 && (
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted px-3 font-semibold">
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
                    className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-surface-raised border border-border flex items-center justify-center font-mono font-bold text-primary">
                        {brand.shortCode}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-ink">
                          {brand.name}
                        </span>
                        <span className="text-xs text-ink-muted font-sans block">{brand.tagline}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono text-[11px] font-semibold border border-accent/20">
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
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted px-3 font-semibold">
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
                    className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-surface-raised text-left transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">#{order.orderNumber}</span>
                        <span className="text-sm font-medium text-ink font-sans">{order.retailerName}</span>
                      </div>
                      <span className="text-xs text-ink-muted font-sans">{order.retailerTown} • {order.totalBoxes} boxes</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono num font-bold text-ink">₹{order.grandTotal.toLocaleString("en-IN")}</span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-ink-muted font-mono text-[11px] block mt-0.5">
                        {order.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty search state */}
          {search && filteredProducts.length === 0 && filteredBrands.length === 0 && filteredOrders.length === 0 && (
            <div className="py-6">
              <EmptyState
                icon={<Icon name="search" size={22} />}
                title="No results found"
                description={`No products, brands, or orders match "${search}". Try searching for another term.`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

