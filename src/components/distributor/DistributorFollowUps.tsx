"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import {
  formatINR,
  getFollowUpsGrouped,
  formatDateToIsoDay,
  FollowUp,
  Retailer,
  FollowUpType,
} from "@/lib/mock";
import { AddFollowUpModal } from "./AddFollowUpModal";

export const DistributorFollowUps: React.FC = () => {
  const {
    retailers,
    followUps,
    addFollowUp,
    updateFollowUpStatus,
    rescheduleFollowUp,
    reassignFollowUp,
    retailerRequests,
    updateRetailerRequestStatus,
    setSelectedRetailer360Id,
    setDistributorNav,
    currentDate,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"today" | "missed" | "upcoming" | "byEmployee" | "requests">("today");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Grouped follow-ups via selector
  const grouped = useMemo(() => getFollowUpsGrouped(followUps, currentDate), [followUps, currentDate]);

  // Employee list
  const employeeNames = useMemo(() => {
    const list = Object.keys(grouped.byEmployee);
    if (!list.includes("Sunita Rao")) list.push("Sunita Rao");
    if (!list.includes("Anand Sharma")) list.push("Anand Sharma");
    if (!list.includes("Rajesh Patel")) list.push("Rajesh Patel");
    if (!list.includes("Ramesh Verma")) list.push("Ramesh Verma");
    if (!list.includes("Vikram Ark")) list.push("Vikram Ark");
    return list.sort();
  }, [grouped.byEmployee]);

  // Pending requests count
  const pendingRequests = useMemo(() => retailerRequests.filter((r) => r.status === "pending"), [retailerRequests]);

  // List of active items based on tab
  const tabItems = useMemo(() => {
    let list: FollowUp[] = [];
    if (activeTab === "today") list = grouped.today;
    else if (activeTab === "missed") list = grouped.missed;
    else if (activeTab === "upcoming") list = grouped.upcoming;
    else if (activeTab === "byEmployee") {
      if (selectedEmployee === "All") {
        list = [...grouped.missed, ...grouped.today, ...grouped.upcoming];
      } else {
        list = grouped.byEmployee[selectedEmployee] || [];
      }
    }

    // Filter by type
    if (selectedType !== "all") {
      list = list.filter((f) => f.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) => {
        const ret = retailers.find((r) => r.id === f.retailerId);
        return (
          f.notes.toLowerCase().includes(q) ||
          (ret && (ret.name.toLowerCase().includes(q) || ret.town.toLowerCase().includes(q)))
        );
      });
    }

    return list;
  }, [activeTab, grouped, selectedEmployee, selectedType, searchQuery, retailers]);

  // Jump to retailer 360
  const handleOpenRetailer360 = (retId: string) => {
    setSelectedRetailer360Id(retId);
    setDistributorNav("retailer-360");
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-20 animate-in fade-in duration-150">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Follow-up Management</h1>
            {grouped.counts.missed > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/20 flex items-center gap-1">
                <Icon name="warning" size={14} />
                {grouped.counts.missed} Missed
              </span>
            )}
            {grouped.counts.today > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/15 text-warning border border-warning/20">
                {grouped.counts.today} Due Today
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Track daily collection reminders, payment commitments, replenishment orders, and pending retailer requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-soft-sm transition-all active:scale-[0.98] cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Icon name="add" size={18} />
          Schedule Follow-up
        </button>
      </div>

      {/* Pending Retailer Requests Callout Banner */}
      {pendingRequests.length > 0 && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-ink">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-warning/20 text-warning flex items-center justify-center shrink-0">
              <Icon name="notifications_active" size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">
                {pendingRequests.length} Pending Store Request{pendingRequests.length > 1 ? "s" : ""} Raised from Retailer Portal
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Retail partners have submitted credit limit changes and store updates awaiting approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className="px-3.5 py-1.5 rounded-md bg-surface border border-warning/30 text-xs font-bold text-ink hover:bg-surface-raised cursor-pointer transition-colors shadow-soft-xs self-start sm:self-auto"
          >
            Review Requests ({pendingRequests.length}) →
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "today"
              ? "bg-primary text-primary-foreground shadow-soft-xs"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
        >
          <span>Due Today</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20 dark:bg-white/20">
            {grouped.counts.today}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("missed")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "missed"
              ? "bg-danger text-white shadow-soft-xs"
              : "text-danger hover:bg-danger/10"
          }`}
        >
          <span>Missed (Overdue)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
            {grouped.counts.missed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "upcoming"
              ? "bg-primary text-primary-foreground shadow-soft-xs"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
        >
          <span>Upcoming</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface-raised border border-border text-ink">
            {grouped.counts.upcoming}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("byEmployee")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "byEmployee"
              ? "bg-primary text-primary-foreground shadow-soft-xs"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
        >
          <span>By Employee</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "requests"
              ? "bg-warning text-background font-bold shadow-soft-xs"
              : "text-warning hover:bg-warning/10"
          }`}
        >
          <span>Pending Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
            {pendingRequests.length}
          </span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      {activeTab !== "requests" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border shadow-soft-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-background px-3 py-1.5 rounded-md border border-border">
            <Icon name="search" size={18} className="text-ink-muted" />
            <input
              type="text"
              placeholder="Search by store name, town, or task note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent text-ink placeholder:text-ink-muted/50 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 px-3 bg-background border border-border rounded-md text-xs font-semibold text-ink focus:outline-hidden"
            >
              <option value="all">All Task Types</option>
              <option value="payment">Payment / Collection</option>
              <option value="order">Order Replenishment</option>
              <option value="complaint">Complaint</option>
              <option value="general">General</option>
            </select>

            {/* Filter by Employee (when on By Employee tab) */}
            {activeTab === "byEmployee" && (
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="h-9 px-3 bg-background border border-border rounded-md text-xs font-semibold text-ink focus:outline-hidden"
              >
                <option value="All">All Staff ({employeeNames.length})</option>
                {employeeNames.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp} ({grouped.byEmployee[emp]?.length || 0})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      {activeTab === "requests" ? (
        /* Retailer Requests List */
        <div className="bg-surface rounded-lg border border-border shadow-soft-sm overflow-hidden p-5 space-y-4">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2">
            <Icon name="assignment_turned_in" size={18} className="text-warning" />
            Retailer Portal Requests ({retailerRequests.length})
          </h3>

          <div className="divide-y divide-border">
            {retailerRequests.map((req) => {
              const ret = retailers.find((r) => r.id === req.retailerId);
              return (
                <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "pending"
                          ? "bg-warning/15 text-warning border border-warning/30"
                          : req.status === "approved"
                          ? "bg-success/15 text-success"
                          : "bg-danger/15 text-danger"
                      }`}>
                        {req.status}
                      </span>
                      <span className="font-bold text-xs text-ink uppercase tracking-wider">
                        {req.type === "credit_limit"
                          ? "Credit Limit Increase"
                          : req.type === "address_change"
                          ? "Address Update"
                          : "New Product Request"}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        Submitted: {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-ink">
                      Store:{" "}
                      <button
                        type="button"
                        onClick={() => handleOpenRetailer360(req.retailerId)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {ret?.name || req.retailerId} ({ret?.town})
                      </button>
                    </div>

                    {req.type === "credit_limit" && (
                      <div className="text-xs text-ink space-y-0.5">
                        <div>
                          Requested Credit Limit:{" "}
                          <span className="font-mono font-bold text-primary">
                            {formatINR(req.payload.requestedCreditLimit || 0)}
                          </span>{" "}
                          (Current Limit: {formatINR(ret?.creditLimit || 0)})
                        </div>
                        {req.payload.reason && (
                          <p className="text-[11px] text-ink-muted italic">Reason: &ldquo;{req.payload.reason}&rdquo;</p>
                        )}
                      </div>
                    )}

                    {req.type === "address_change" && (
                      <p className="text-xs text-ink leading-relaxed">
                        New Address: <span className="font-medium">{req.payload.address}, {req.payload.town} - {req.payload.pincode}</span>
                      </p>
                    )}

                    {req.type === "new_product" && (
                      <div className="text-xs text-ink">
                        Requested: <span className="font-bold">{req.payload.productName}</span> ({req.payload.brand || "Within"})
                        {req.payload.notes && (
                          <p className="text-[11px] text-ink-muted italic mt-0.5">&ldquo;{req.payload.notes}&rdquo;</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => updateRetailerRequestStatus(req.id, "approved")}
                        className="px-3.5 py-1.5 rounded-md bg-success hover:bg-success/90 text-white text-xs font-bold transition-all shadow-soft-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRetailerRequestStatus(req.id, "rejected")}
                        className="px-3.5 py-1.5 rounded-md bg-surface border border-border hover:bg-danger/10 text-danger text-xs font-bold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Follow-ups Task Cards / Table */
        <div className="bg-surface rounded-lg border border-border shadow-soft-sm overflow-hidden p-5">
          {tabItems.length === 0 ? (
            <div className="text-center py-12 text-ink-muted text-xs">
              <Icon name="task_alt" size={36} className="text-ink-muted/50 block mb-2" />
              No follow-up tasks found for this view.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tabItems.map((f) => {
                const ret = retailers.find((r) => r.id === f.retailerId);
                return (
                  <div
                    key={f.id}
                    className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-raised/40 p-2 rounded-md transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            f.status === "done"
                              ? "bg-surface-raised text-ink-muted"
                              : activeTab === "missed" || f.dueDate < formatDateToIsoDay(currentDate)
                              ? "bg-danger text-white font-bold"
                              : f.dueDate === formatDateToIsoDay(currentDate)
                              ? "bg-warning/20 text-warning font-bold"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {f.status === "done"
                            ? "Done"
                            : activeTab === "missed" || f.dueDate < formatDateToIsoDay(currentDate)
                            ? "Missed"
                            : f.dueDate === formatDateToIsoDay(currentDate)
                            ? "Due Today"
                            : "Upcoming"}
                        </span>

                        {/* Type Badge */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-raised border border-border text-ink-muted">
                          {f.type}
                        </span>

                        <span className="font-mono text-xs font-bold text-ink">
                          Due: {f.dueDate}
                        </span>

                        {f.promisedAmount && (
                          <span className="font-mono text-xs font-bold text-success">
                            Promised: {formatINR(f.promisedAmount)}
                          </span>
                        )}
                      </div>

                      {/* Store & Contact */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenRetailer360(f.retailerId)}
                          className="font-bold text-ink hover:text-primary transition-colors cursor-pointer text-left"
                        >
                          {ret?.name || f.retailerId}
                        </button>
                        <span className="text-ink-muted">· {ret?.town}</span>
                        {ret?.outstanding ? (
                          <span className="text-[11px] font-mono text-danger font-semibold">
                            (Total Due: {formatINR(ret.outstanding)})
                          </span>
                        ) : null}
                      </div>

                      {/* Notes */}
                      <p className="text-xs text-ink font-medium leading-relaxed max-w-3xl">
                        {f.notes}
                      </p>

                      {/* Assignee & Phone Quick Actions */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-muted pt-1">
                        <span>
                          Assigned: <span className="font-semibold text-ink">{f.assignedTo}</span>
                        </span>
                        {ret?.phone && (
                          <div className="flex items-center gap-3">
                            <a
                              href={`tel:${ret.phone}`}
                              className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <Icon name="call" size={13} />
                              Call {ret.phone}
                            </a>
                            <a
                              href={`https://wa.me/${ret.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-success hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <Icon name="chat" size={13} />
                              WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Reassign, Reschedule, Mark Done */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                      {f.status === "open" && (
                        <>
                          {/* Reassign Dropdown */}
                          <select
                            value={f.assignedTo}
                            onChange={(e) => reassignFollowUp(f.id, e.target.value)}
                            className="h-8 px-2 bg-background border border-border rounded-lg text-[11px] font-semibold text-ink focus:outline-hidden"
                            title="Reassign team member"
                          >
                            {employeeNames.map((emp) => (
                              <option key={emp} value={emp}>
                                {emp}
                              </option>
                            ))}
                          </select>

                          {/* Quick Reschedule (+7d) */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextWeek = new Date();
                              nextWeek.setDate(nextWeek.getDate() + 7);
                              rescheduleFollowUp(f.id, nextWeek.toISOString().split("T")[0]);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-surface border border-border hover:bg-surface-raised text-[11px] font-semibold text-ink transition-colors cursor-pointer"
                            title="Reschedule by +7 days"
                          >
                            +7 Days
                          </button>

                          {/* Mark Done */}
                          <button
                            type="button"
                            onClick={() => updateFollowUpStatus(f.id, "done")}
                            className="h-8 px-3 rounded-lg bg-success hover:bg-success/90 text-white text-xs font-bold transition-all shadow-soft-xs cursor-pointer flex items-center gap-1"
                          >
                            <Icon name="check" size={15} />
                            Done
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Global Add Follow-up Modal */}
      <AddFollowUpModal
        retailers={retailers}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={addFollowUp}
      />
    </div>
  );
};
