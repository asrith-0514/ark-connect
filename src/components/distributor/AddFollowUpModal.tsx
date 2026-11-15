"use client";

import React, { useState } from "react";
import { Retailer, FollowUpType, formatINR } from "@/lib/mock";

interface AddFollowUpModalProps {
  retailers: Retailer[];
  preselectedRetailerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (followUp: {
    retailerId: string;
    type: FollowUpType;
    dueDate: string;
    assignedTo: string;
    status: "open";
    notes: string;
    promisedAmount?: number;
  }) => void;
}

export const AddFollowUpModal: React.FC<AddFollowUpModalProps> = ({
  retailers,
  preselectedRetailerId,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedRetailerId, setSelectedRetailerId] = useState(
    preselectedRetailerId || (retailers.length > 0 ? retailers[0].id : "")
  );
  const [type, setType] = useState<FollowUpType>("payment");
  const [promisedAmount, setPromisedAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [assignedTo, setAssignedTo] = useState<string>("Sunita Rao");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const currentRetailer =
    retailers.find((r) => r.id === (preselectedRetailerId || selectedRetailerId)) ||
    retailers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRetailer) return;

    onSave({
      retailerId: currentRetailer.id,
      type,
      dueDate,
      assignedTo,
      status: "open",
      notes:
        notes.trim() ||
        `${type === "payment" ? "Payment collection reminder" : "Follow-up"} for ${currentRetailer.name}`,
      promisedAmount: promisedAmount ? Number(promisedAmount.replace(/,/g, "")) : undefined,
    });
    setNotes("");
    setPromisedAmount("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-surface rounded-2xl shadow-soft-xl border border-border text-ink overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
              <span className="material-symbols-outlined text-[22px]">event_repeat</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Schedule Follow-up Task</h3>
              <p className="text-xs text-ink-muted">
                Create a collection, order review, or complaint follow-up
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background hover:bg-surface-raised flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer border border-border"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Retailer */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
              Retailer Store
            </label>
            {preselectedRetailerId && currentRetailer ? (
              <div className="p-3 bg-background border border-border rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-ink">{currentRetailer.name}</div>
                  <div className="text-[11px] text-ink-muted">{currentRetailer.town} · {currentRetailer.code}</div>
                </div>
                {currentRetailer.outstanding > 0 && (
                  <span className="text-xs font-mono font-bold text-danger">
                    Due {formatINR(currentRetailer.outstanding)}
                  </span>
                )}
              </div>
            ) : (
              <select
                value={selectedRetailerId}
                onChange={(e) => setSelectedRetailerId(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                {retailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.town}) — Due: {formatINR(r.outstanding || 0)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Type & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Task Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FollowUpType)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                <option value="payment">Payment / Collection</option>
                <option value="order">Order Replenishment</option>
                <option value="complaint">Complaint Resolution</option>
                <option value="general">General Relationship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Assigned Employee
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                <option value="Sunita Rao">Sunita Rao (Accountant)</option>
                <option value="Anand Sharma">Anand Sharma (Sales Executive)</option>
                <option value="Ramesh Verma">Ramesh Verma (Territory Sales)</option>
                <option value="Rajesh Patel">Rajesh Patel (Operations)</option>
                <option value="Vikram Ark">Vikram Ark (Director)</option>
              </select>
            </div>
          </div>

          {/* Due Date & Promised Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Promised Amount (₹)
              </label>
              <input
                type="number"
                placeholder="Optional (e.g. 50000)"
                value={promisedAmount}
                onChange={(e) => setPromisedAmount(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-ink focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Action Notes */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
              Notes &amp; Reminder Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Call owner regarding cheque pickup, confirm RTGS transfer of pending invoice, or check inventory..."
              rows={3}
              required
              className="w-full p-3 bg-background border border-border rounded-xl text-xs text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-primary resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-soft-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              Schedule Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
