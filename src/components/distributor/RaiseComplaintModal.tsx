"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ComplaintType, Order, Invoice } from "@/lib/mock";

interface RaiseComplaintModalProps {
  retailerId: string;
  retailerName: string;
  orders: Order[];
  invoices: Invoice[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (complaint: {
    retailerId: string;
    type: ComplaintType;
    linkedOrderId?: string;
    linkedInvoiceId?: string;
    assignee: string;
    notes?: string;
    status: "open";
  }) => void;
}

export const RaiseComplaintModal: React.FC<RaiseComplaintModalProps> = ({
  retailerId,
  retailerName,
  orders,
  invoices,
  isOpen,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<ComplaintType>("shortage");
  const [linkedOrderId, setLinkedOrderId] = useState("");
  const [linkedInvoiceId, setLinkedInvoiceId] = useState("");
  const [assignee, setAssignee] = useState("Rajesh Patel");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const retailerOrders = orders.filter((o) => o.retailerId === retailerId && o.status !== "Draft");
  const retailerInvoices = invoices.filter((i) => i.retailerId === retailerId && i.status !== "Draft");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    onSave({
      retailerId,
      type,
      linkedOrderId: linkedOrderId || undefined,
      linkedInvoiceId: linkedInvoiceId || undefined,
      assignee,
      notes: notes.trim(),
      status: "open",
    });
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-surface rounded-2xl shadow-soft-xl border border-border text-ink overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center font-bold border border-danger/20">
              <Icon name="report_problem" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Raise Retailer Issue / Complaint</h3>
              <p className="text-xs text-ink-muted">
                Log a ticket for <span className="font-semibold text-ink">{retailerName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background hover:bg-surface-raised flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer border border-border"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Issue Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ComplaintType)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                <option value="shortage">Shortage / Missing Boxes</option>
                <option value="defect">Defective / Damaged Piece</option>
                <option value="delivery">Transport / Delivery Delay</option>
                <option value="pricing">Billing / Rate Discrepancy</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Assigned Employee
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                <option value="Rajesh Patel">Rajesh Patel (Godown / Logistics)</option>
                <option value="Sunita Rao">Sunita Rao (Accounting / Pricing)</option>
                <option value="Anand Sharma">Anand Sharma (Field Sales)</option>
                <option value="Vikram Ark">Vikram Ark (Director)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Linked Order (Optional)
              </label>
              <select
                value={linkedOrderId}
                onChange={(e) => setLinkedOrderId(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary truncate"
              >
                <option value="">None / Not Order Specific</option>
                {retailerOrders.map((o) => (
                  <option key={o.id} value={o.orderNumber}>
                    {o.orderNumber} ({o.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Linked Invoice (Optional)
              </label>
              <select
                value={linkedInvoiceId}
                onChange={(e) => setLinkedInvoiceId(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary truncate"
              >
                <option value="">None / Not Invoice Specific</option>
                {retailerInvoices.map((inv) => (
                  <option key={inv.id} value={inv.invoiceNumber}>
                    {inv.invoiceNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
              Issue Description &amp; Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the complaint in detail: article number, missing quantities, LR carton number, or customer remark..."
              rows={4}
              required
              className="w-full p-3 bg-background border border-border rounded-xl text-xs text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-primary resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white text-xs font-bold shadow-soft-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Icon name="priority_high" size={16} />
              Open Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
