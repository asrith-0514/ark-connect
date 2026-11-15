/**
 * ARK Platform - Voice Call Task Proposal & Rule Engine
 * 
 * Evaluates invoices, orders, and retailer preferences against business rules to generate
 * actionable Call Tasks for the distributor owner/manager to review and approve.
 * 
 * GUARDRAIL: All generated tasks default strictly to "proposed".
 * Nothing is ever dialed automatically without explicit owner approval.
 */

import {
  CallTask,
  CallTaskReason,
  Invoice,
  Order,
  Retailer,
} from "@/lib/mock/types";

function parseDateStr(str: string): Date {
  const parts = str.split(" ");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const month = months[parts[1]] ?? 0;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(str);
}

function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generates proposed call tasks based on business rules:
 * - Invoices due in 2 days (payment_due)
 * - Invoices overdue by 1, 7, 15, or 30+ days (overdue)
 * - Orders dispatched with LR numbers (dispatch_update)
 * - Orders recently delivered (order_followup)
 * 
 * Automatically filters out retailers with doNotCall or phoneConsent === false.
 */
export function generateProposedCallTasks(
  invoices: Invoice[],
  orders: Order[],
  retailers: Retailer[],
  existingTasks: CallTask[] = [],
  referenceDate: Date = new Date("2026-11-12")
): CallTask[] {
  const retailerMap = new Map<string, Retailer>();
  retailers.forEach((r) => retailerMap.set(r.id, r));

  const existingRefKeys = new Set(
    existingTasks
      .filter((t) => t.status === "proposed" || t.status === "approved" || t.status === "in_progress")
      .map((t) => `${t.retailerId}_${t.referenceId}_${t.reason}`)
  );

  const proposedTasks: CallTask[] = [];
  const refDateMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  // ---------------------------------------------------------------------------
  // 1. INVOICE RULES (Due in 2 days, Overdue 1, 7, 15, 30+ days)
  // ---------------------------------------------------------------------------
  invoices.forEach((inv) => {
    if (inv.status === "Paid" || inv.status === "Draft" || (inv.balanceDue || 0) <= 0) {
      return;
    }

    const ret = retailerMap.get(inv.retailerId);
    if (!ret) return;

    // Strict compliance guardrails: skip if opted-out or DNC flagged
    if (ret.doNotCall === true || ret.phoneConsent === false) {
      return;
    }

    const dueMidnight = parseDateStr(inv.dueDate);
    const diffDays = Math.round(
      (dueMidnight.getTime() - refDateMidnight.getTime()) / (1000 * 60 * 60 * 24)
    );

    let reason: CallTaskReason | null = null;
    let shouldGenerate = false;

    if (diffDays === 2) {
      // Due in 2 days
      reason = "payment_due";
      shouldGenerate = true;
    } else if (diffDays === -1 || diffDays === -7 || diffDays === -15 || diffDays <= -30) {
      // Overdue milestone: 1 day, 7 days, 15 days, or 30+ days
      reason = "overdue";
      shouldGenerate = true;
    }

    if (shouldGenerate && reason) {
      const taskKey = `${ret.id}_${inv.invoiceNumber}_${reason}`;
      if (!existingRefKeys.has(taskKey)) {
        proposedTasks.push({
          id: `ct-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          retailerId: ret.id,
          retailerName: ret.name,
          phone: ret.phone,
          reason,
          referenceType: "invoice",
          referenceId: inv.invoiceNumber,
          amount: inv.balanceDue,
          dueDate: inv.dueDate,
          language: ret.preferredLanguage || "te",
          preferredTimeWindow: ret.preferredCallWindow || "11:00 AM - 01:00 PM",
          status: "proposed", // strictly proposed
          scheduledDate: formatDateToIso(refDateMidnight),
          createdAt: formatDateToIso(refDateMidnight),
          retryCount: 0,
          maxRetries: 3,
        });
        existingRefKeys.add(taskKey);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 2. ORDER RULES (Dispatched Consignments with LR Number)
  // ---------------------------------------------------------------------------
  orders.forEach((ord) => {
    if (ord.status === "Draft" || ord.status === "Cancelled") {
      return;
    }

    const ret = retailerMap.get(ord.retailerId);
    if (!ret) return;

    if (ret.doNotCall === true || ret.phoneConsent === false) {
      return;
    }

    if (ord.status === "Dispatched" && ord.lrNumber) {
      const taskKey = `${ret.id}_${ord.orderNumber}_dispatch_update`;
      if (!existingRefKeys.has(taskKey)) {
        proposedTasks.push({
          id: `ct-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          retailerId: ret.id,
          retailerName: ret.name,
          phone: ret.phone,
          reason: "dispatch_update",
          referenceType: "order",
          referenceId: ord.orderNumber,
          amount: ord.grandTotal,
          language: ret.preferredLanguage || "te",
          preferredTimeWindow: ret.preferredCallWindow || "11:00 AM - 01:00 PM",
          status: "proposed",
          scheduledDate: formatDateToIso(refDateMidnight),
          createdAt: formatDateToIso(refDateMidnight),
          retryCount: 0,
          maxRetries: 2,
        });
        existingRefKeys.add(taskKey);
      }
    }
  });

  return proposedTasks;
}
