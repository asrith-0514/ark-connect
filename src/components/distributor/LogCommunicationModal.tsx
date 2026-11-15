"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CommunicationChannel, CommunicationDirection } from "@/lib/mock";

interface LogCommunicationModalProps {
  retailerId: string;
  retailerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: {
    retailerId: string;
    channel: CommunicationChannel;
    direction: CommunicationDirection;
    summary: string;
    createdBy: string;
  }) => void;
}

export const LogCommunicationModal: React.FC<LogCommunicationModalProps> = ({
  retailerId,
  retailerName,
  isOpen,
  onClose,
  onSave,
}) => {
  const [channel, setChannel] = useState<CommunicationChannel>("call");
  const [direction, setDirection] = useState<CommunicationDirection>("outbound");
  const [createdBy, setCreatedBy] = useState("Anand Sharma");
  const [summary, setSummary] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    onSave({
      retailerId,
      channel,
      direction,
      summary: summary.trim(),
      createdBy,
    });
    setSummary("");
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
              <Icon name="record_voice_over" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Log Communication</h3>
              <p className="text-xs text-ink-muted">
                Record an interaction with <span className="font-semibold text-ink">{retailerName}</span>
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
          {/* Channel & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as CommunicationChannel)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                <option value="call">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">Store Visit</option>
                <option value="note">Internal Note</option>
                <option value="ai-call">AI Automated Call</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-1.5 h-10 p-1 bg-background border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setDirection("outbound")}
                  className={`rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    direction === "outbound"
                      ? "bg-primary text-primary-foreground shadow-soft-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon name="call_made" size={14} />
                  Out
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("inbound")}
                  className={`rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    direction === "inbound"
                      ? "bg-primary text-primary-foreground shadow-soft-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon name="call_received" size={14} />
                  In
                </button>
              </div>
            </div>
          </div>

          {/* Logged By */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
              Recorded By
            </label>
            <select
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
            >
              <option value="Anand Sharma">Anand Sharma (Sales Executive)</option>
              <option value="Sunita Rao">Sunita Rao (Accountant)</option>
              <option value="Rajesh Patel">Rajesh Patel (Operations Manager)</option>
              <option value="Ramesh Verma">Ramesh Verma (Territory Salesman)</option>
              <option value="Vikram Ark">Vikram Ark (Director)</option>
            </select>
          </div>

          {/* Interaction Summary */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
              Discussion Summary / Notes
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Record details of the discussion, payment commitment, stock feedback, or next steps..."
              rows={4}
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
              <Icon name="save" size={16} />
              Save Log Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
