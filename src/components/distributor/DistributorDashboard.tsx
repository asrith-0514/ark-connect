"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  formatINR,
  getFollowUpsGrouped,
  getRetailerAgeingLedgers,
  Order,
  Retailer,
} from "@/lib/mock";
import { AddFollowUpModal } from "@/components/distributor/AddFollowUpModal";
import { StatusChip } from "@/components/ui/Badge";

export default function DistributorDashboard() {
  const {
    setDistributorNav,
    setIsReceiptModalOpen,
    setIsCreateInvoiceOpen,
    setOrderTabFilter,
    invoices,
    orders,
    retailers,
    currentDate,
    followUps,
    addFollowUp,
    updateFollowUpStatus,
    setSelectedRetailer360Id,
  } = useApp();

  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);

  // 1. Orders to approve: Submitted / In Review orders
  const ordersToApprove = useMemo(() => {
    return orders.filter((o: Order) => o.status === "Submitted" && !o.orderNumber.startsWith("ARK-H"));
  }, [orders]);

  // 2. Overdue payments (Top 5)
  const topOverdueRetailers = useMemo(() => {
    const ledgers = getRetailerAgeingLedgers(retailers, invoices, currentDate);
    return ledgers
      .map(l => {
        const overdueSum = l.d1_30 + l.d31_60 + l.d60_plus;
        return {
          id: l.retailer.id,
          code: l.retailer.code,
          name: l.retailer.name,
          town: l.retailer.town || "Telangana",
          phone: l.retailer.phone || "+91 94401 23456",
          overdue: overdueSum,
          outstanding: l.totalOwed,
          oldestBucket: l.d60_plus > 0 ? "60+ days" : l.d31_60 > 0 ? "31-60 days" : "1-30 days",
        };
      })
      .filter(item => item.overdue > 0)
      .sort((a, b) => b.overdue - a.overdue)
      .slice(0, 5);
  }, [retailers, invoices, currentDate]);

  // 3. Follow-ups due today (and past due / missed)
  const followUpGrouped = useMemo(
    () => getFollowUpsGrouped(followUps, currentDate),
    [followUps, currentDate]
  );
  const todaysFollowUps = useMemo(() => {
    return [...followUpGrouped.missed, ...followUpGrouped.today];
  }, [followUpGrouped]);

  const handleOpenRetailer360 = (retailerId: string) => {
    setSelectedRetailer360Id(retailerId);
    setDistributorNav("retailer-360");
  };

  const handleReviewOrder = (orderId: string) => {
    setOrderTabFilter("review");
    setDistributorNav("orders");
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-20 text-ink animate-in fade-in duration-150">
      {/* =========================================================================
          TOP HEADER & THREE QUICK ACTIONS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">
              Today
            </h1>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Daily operational to-do list for Secunderabad wholesale distribution hub
          </p>
        </div>

        {/* Three Quick Actions: Create invoice, Record receipt, Add follow-up */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="min-h-[44px] h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-soft-xs flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Icon name="add" size={16} />
            <span>Create invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="min-h-[44px] h-11 px-4 rounded-xl bg-surface border border-border hover:bg-surface-raised text-ink text-xs font-bold transition-all shadow-soft-xs flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Icon name="payments" size={16} className="text-success" />
            <span>Record receipt</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddFollowUpOpen(true)}
            className="min-h-[44px] h-11 px-4 rounded-xl bg-surface border border-border hover:bg-surface-raised text-ink text-xs font-bold transition-all shadow-soft-xs flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Icon name="event_repeat" size={16} className="text-primary" />
            <span>Add follow-up</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: ORDERS TO APPROVE
          ========================================================================= */}
      <div className="rounded-2xl bg-surface border border-border p-5 shadow-soft-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
              <Icon name="inventory_2" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Orders to approve
              </h2>
              <span className="text-xs text-ink-muted">
                Wholesale purchase orders awaiting hub stock allocation confirmation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-warning/15 text-warning border border-warning/25">
              {ordersToApprove.length} pending
            </span>
            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("review");
                setDistributorNav("orders");
              }}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              View all orders
            </button>
          </div>
        </div>

        {ordersToApprove.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-ink-muted">
            <Icon name="check_circle" size={32} className="text-success mb-2" />
            <p className="text-sm font-semibold text-ink">All orders approved</p>
            <p className="text-xs text-ink-muted mt-0.5">No purchase orders pending wholesaler allocation review</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ordersToApprove.map((order: Order) => (
              <div
                key={order.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-xs font-mono font-bold text-primary shrink-0 mt-0.5">
                    PO
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-ink num">
                        {order.orderNumber}
                      </span>
                      <StatusChip variant="warning" dot label="Needs review" />
                      <span className="text-xs text-ink-muted font-mono num">
                        {order.date}
                      </span>
                    </div>
                    <div className="text-xs text-ink mt-0.5 font-medium truncate">
                      {order.retailerName} • <span className="text-ink-muted">{order.retailerTown}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-ink num block">
                      {formatINR(order.grandTotal)}
                    </span>
                    <span className="text-xs text-ink-muted font-mono num">
                      {order.totalBoxes} boxes
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReviewOrder(order.id)}
                    className="min-h-[44px] h-11 px-4 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-bold transition-all shadow-soft-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Review order</span>
                    <Icon name="arrow_forward" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: OVERDUE PAYMENTS (TOP 5)
          ========================================================================= */}
      <div className="rounded-2xl bg-surface border border-border p-5 shadow-soft-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
              <Icon name="warning" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Overdue payments (top 5)
              </h2>
              <span className="text-xs text-ink-muted">
                Retailer accounts exceeding 30-day payment credit terms
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDistributorNav("receivables")}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            View receivables
          </button>
        </div>

        {topOverdueRetailers.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-ink-muted">
            <Icon name="verified" size={32} className="text-success mb-2" />
            <p className="text-sm font-semibold text-ink">No overdue invoices</p>
            <p className="text-xs text-ink-muted mt-0.5">All retailer ledgers are within credit terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-ink-muted font-medium">
                  <th className="py-2.5 px-3">Store</th>
                  <th className="py-2.5 px-3">Town</th>
                  <th className="py-2.5 px-3 font-mono">Code</th>
                  <th className="py-2.5 px-3 text-right">Overdue</th>
                  <th className="py-2.5 px-3">Oldest ageing</th>
                  <th className="py-2.5 px-3 text-right">Quick action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topOverdueRetailers.map(item => (
                  <tr key={item.id} className="h-11 hover:bg-surface-raised transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      <button
                        type="button"
                        onClick={() => handleOpenRetailer360(item.id)}
                        className="hover:text-primary transition-colors cursor-pointer text-left font-bold"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">{item.town}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-ink">{item.code}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-danger num">
                      {formatINR(item.overdue)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/25">
                        {item.oldestBucket}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsReceiptModalOpen(true)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-surface border border-border hover:border-success/50 text-success text-xs font-semibold cursor-pointer shadow-soft-xs"
                        >
                          Record receipt
                        </button>
                        <a
                          href={`https://wa.me/${item.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Namaste ${item.name}, this is a reminder from ARK Distributors regarding payment of ${formatINR(item.overdue)} which is overdue. Please arrange payment to avoid dispatch holds.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[36px] w-9 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] flex items-center justify-center transition-colors cursor-pointer border border-[#25D366]/30"
                          title="WhatsApp Follow-up"
                        >
                          <Icon name="chat" size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: FOLLOW-UPS DUE TODAY
          ========================================================================= */}
      <div className="rounded-2xl bg-surface border border-border p-5 shadow-soft-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="event_repeat" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Follow-ups due today
              </h2>
              <span className="text-xs text-ink-muted">
                Scheduled payment collections, order checks, and store check-ins
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              {todaysFollowUps.length} tasks
            </span>
            <button
              type="button"
              onClick={() => setDistributorNav("follow-ups")}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>
        </div>

        {todaysFollowUps.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-ink-muted">
            <Icon name="task_alt" size={32} className="text-success mb-2" />
            <p className="text-sm font-semibold text-ink">All follow-ups completed</p>
            <p className="text-xs text-ink-muted mt-0.5">No tasks pending for today</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todaysFollowUps.map(fu => {
              const ret = retailers.find(r => r.id === fu.retailerId);
              return (
                <div
                  key={fu.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => updateFollowUpStatus(fu.id, "done")}
                      className="w-5 h-5 rounded-md border border-border hover:border-success hover:bg-success/10 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                      title="Mark task completed"
                    >
                      <Icon name="check" size={14} className="text-ink-muted hover:text-success" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-ink">
                          {ret?.name || "Retailer Store"}
                        </span>
                        <StatusChip
                          variant={fu.type === "payment" ? "danger" : "primary"}
                          label={fu.type}
                        />
                        <span className="font-mono text-ink-muted text-[11px] num">
                          {fu.dueDate}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                        {fu.notes || "Follow up on order and invoice payment"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-ink-muted bg-surface-raised px-2.5 py-1 rounded-md border border-border font-medium">
                      {fu.assignedTo}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateFollowUpStatus(fu.id, "done")}
                      className="min-h-[36px] px-3 rounded-lg bg-surface hover:bg-success/15 hover:text-success border border-border text-xs font-semibold transition-colors cursor-pointer shadow-soft-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Follow-up Modal */}
      {isAddFollowUpOpen && (
        <AddFollowUpModal
          retailers={retailers}
          isOpen={isAddFollowUpOpen}
          onClose={() => setIsAddFollowUpOpen(false)}
          onSave={addFollowUp}
        />
      )}
    </div>
  );
}
