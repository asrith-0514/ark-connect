"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  CallTask,
  CallTaskReason,
  VoiceLanguage,
  formatINR,
  formatDateToIsoDay,
  renderScriptTemplate,
} from "@/lib/mock";
import { Badge } from "@/components/ui/Badge";

export const DistributorVoiceAgent: React.FC = () => {
  const {
    callTasks,
    approveCallTask,
    approveAllProposedTasks,
    cancelCallTask,
    executeSimulatedCall,
    scriptTemplates,
    updateScriptTemplate,
    retailers,
    updateRetailerVoicePreferences,
    generateCallTasksFromRules,
    setSelectedRetailer360Id,
    setDistributorNav,
  } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<"queue" | "transcripts" | "scripts" | "preferences">("queue");

  // Filter States for Queue
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  // Selected Task for Details / Transcript
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Script Editing State
  const [selectedScriptReason, setSelectedScriptReason] = useState<CallTaskReason>("payment_due");
  const [selectedScriptLang, setSelectedScriptLang] = useState<VoiceLanguage>("te");
  const [editedScriptText, setEditedScriptText] = useState<string>("");
  const [scriptSaveMessage, setScriptSaveMessage] = useState<string | null>(null);

  // Telephony Simulation State
  const [simulatingTaskId, setSimulatingTaskId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Stats derivation
  const proposedCount = useMemo(() => callTasks.filter((t) => t.status === "proposed").length, [callTasks]);
  const approvedCount = useMemo(() => callTasks.filter((t) => t.status === "approved").length, [callTasks]);
  const completedCount = useMemo(() => callTasks.filter((t) => t.status === "completed").length, [callTasks]);
  
  const totalPromisedAmount = useMemo(() => {
    return callTasks
      .filter((t) => t.status === "completed" && t.outcome?.promisedAmount)
      .reduce((sum, t) => sum + (t.outcome?.promisedAmount || 0), 0);
  }, [callTasks]);

  // Filtered Queue
  const filteredTasks = useMemo(() => {
    return callTasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (reasonFilter !== "all" && t.reason !== reasonFilter) return false;
      if (languageFilter !== "all" && t.language !== languageFilter) return false;
      return true;
    });
  }, [callTasks, statusFilter, reasonFilter, languageFilter]);

  // Active Task for Transcript View
  const selectedTask = useMemo(() => {
    if (selectedTaskId) {
      return callTasks.find((t) => t.id === selectedTaskId) || null;
    }
    // Default to the first completed task or first task
    return callTasks.find((t) => t.status === "completed") || callTasks[0] || null;
  }, [callTasks, selectedTaskId]);

  // Handle Simulation execution
  const handleRunSimulation = async (taskId: string) => {
    setSimulatingTaskId(taskId);
    await executeSimulatedCall(taskId);
    setSimulatingTaskId(null);
    setSelectedTaskId(taskId);
  };

  // Sync script editor when tab or reason changes
  React.useEffect(() => {
    const currentTpl = scriptTemplates[selectedScriptReason]?.scripts[selectedScriptLang] || "";
    setEditedScriptText(currentTpl);
    setScriptSaveMessage(null);
  }, [selectedScriptReason, selectedScriptLang, scriptTemplates]);

  const handleSaveScript = () => {
    updateScriptTemplate(selectedScriptReason, selectedScriptLang, editedScriptText);
    setScriptSaveMessage("Template updated successfully!");
    setTimeout(() => setScriptSaveMessage(null), 3000);
  };

  const getReasonBadge = (reason: CallTaskReason) => {
    switch (reason) {
      case "overdue":
        return <Badge variant="danger" size="sm">Overdue Call</Badge>;
      case "payment_due":
        return <Badge variant="warning" size="sm">Due in 2 Days</Badge>;
      case "dispatch_update":
        return <Badge variant="primary" size="sm">Dispatch & LR</Badge>;
      case "order_followup":
        return <Badge variant="success" size="sm">Order Follow-up</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{reason}</Badge>;
    }
  };

  const getLanguageLabel = (lang: VoiceLanguage) => {
    switch (lang) {
      case "te":
        return "తెలుగు (Telugu)";
      case "en":
        return "English";
      case "hi":
        return "हिंदी (Hindi)";
      case "ta":
        return "தமிழ் (Tamil)";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif text-ink font-bold">AI Voice Calling Agent</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Telephony Adapter Active
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Pluggable voice agent queue for payment due reminders, overdue notices, and dispatch updates.
            <span className="font-semibold text-ink"> Zero automatic dialing</span> — all proposed calls require owner approval.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const count = generateCallTasksFromRules();
              alert(`Rule evaluation complete: ${count} new proposed call task(s) added.`);
            }}
            className="px-4 py-2 rounded-xl bg-surface-raised border border-border hover:bg-border/40 text-ink text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>⚡</span>
            <span>Evaluate Rules</span>
          </button>

          {proposedCount > 0 && (
            <button
              type="button"
              onClick={() => approveAllProposedTasks()}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>✓</span>
              <span>Approve All Proposed ({proposedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Awaiting Approval</div>
          <div className="text-2xl font-serif font-bold text-warning mt-1">{proposedCount}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Proposed by rules · 0 dialed</div>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Approved Queue</div>
          <div className="text-2xl font-serif font-bold text-primary mt-1">{approvedCount}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Ready for telephony dialing</div>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Completed Calls</div>
          <div className="text-2xl font-serif font-bold text-success mt-1">{completedCount}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Logs & transcripts saved</div>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Captured Commitments</div>
          <div className="text-2xl font-mono font-bold text-ink mt-1">{formatINR(totalPromisedAmount)}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Auto-written to Follow-ups</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "queue"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <span>Call Task Queue</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-raised font-mono">
            {callTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transcripts")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "transcripts"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <span>Transcripts & Audio</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-raised font-mono">
            {completedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scripts")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "scripts"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <span>Script Templates</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-raised font-mono">4</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "preferences"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <span>Retailer Telephony Consent</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-raised font-mono">
            {retailers.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: CALL TASK QUEUE & PROPOSALS */}
      {/* ===================================================================== */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink-muted mr-1">Status:</span>
              {["all", "proposed", "approved", "completed", "cancelled"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface-raised text-ink-muted hover:text-ink"
                  }`}
                >
                  {st === "all" ? "All" : st}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                aria-label="Filter by reason"
                className="px-3 py-1.5 bg-surface-raised border border-border rounded-lg text-ink font-medium"
              >
                <option value="all">All Reasons</option>
                <option value="overdue">Overdue Payment</option>
                <option value="payment_due">Payment Due in 2 Days</option>
                <option value="dispatch_update">Dispatch & LR Update</option>
                <option value="order_followup">Order Follow-up</option>
              </select>

              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                aria-label="Filter by language"
                className="px-3 py-1.5 bg-surface-raised border border-border rounded-lg text-ink font-medium"
              >
                <option value="all">All Languages</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-surface p-12 text-center rounded-xl border border-border text-ink-muted">
                No call tasks found matching the selected filters.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-surface p-4 rounded-xl border border-border shadow-xs hover:border-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-surface-raised border border-border text-lg shrink-0">
                      {task.reason === "overdue" ? "⚠️" : task.reason === "dispatch_update" ? "🚚" : task.reason === "payment_due" ? "⏳" : "📞"}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink text-sm hover:underline cursor-pointer" onClick={() => {
                          setSelectedRetailer360Id(task.retailerId);
                          setDistributorNav("retailer-360");
                        }}>
                          {task.retailerName}
                        </span>
                        {getReasonBadge(task.reason)}
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-raised text-ink-muted uppercase">
                          {task.language}
                        </span>
                      </div>

                      <div className="text-xs text-ink-muted mt-1 flex flex-wrap items-center gap-3 font-mono">
                        <span>Ref: <strong className="text-ink">{task.referenceId}</strong></span>
                        {task.amount && (
                          <span>Amount: <strong className="text-ink">{formatINR(task.amount)}</strong></span>
                        )}
                        <span>Window: <strong>{task.preferredTimeWindow}</strong></span>
                        <span>Phone: <strong>{task.phone}</strong></span>
                      </div>

                      {task.outcome && (
                        <div className="mt-2 text-xs bg-success/10 border border-success/20 text-success p-2 rounded-lg font-medium">
                          <strong>Outcome:</strong> {task.outcome.notes || task.outcome.status}
                          {task.outcome.promisedPaymentDate && (
                            <span className="ml-2 font-mono font-bold bg-success/20 px-1.5 py-0.5 rounded text-ink">
                              Promised: {task.outcome.promisedPaymentDate} ({formatINR(task.outcome.promisedAmount || task.amount || 0)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                    {task.status === "proposed" && (
                      <>
                        <button
                          type="button"
                          onClick={() => approveCallTask(task.id)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelCallTask(task.id)}
                          className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-ink-muted hover:text-danger text-xs font-semibold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {task.status === "approved" && (
                      <>
                        <button
                          type="button"
                          disabled={simulatingTaskId === task.id}
                          onClick={() => handleRunSimulation(task.id)}
                          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {simulatingTaskId === task.id ? (
                            <span>Dialing & Generating...</span>
                          ) : (
                            <>
                              <span>📞</span>
                              <span>Dial Test Call</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelCallTask(task.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-raised border border-border text-ink-muted hover:text-danger text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {task.status === "completed" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setActiveTab("transcripts");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-primary font-bold text-xs hover:bg-border/30 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>📜</span>
                        <span>View Transcript</span>
                      </button>
                    )}

                    {task.status === "cancelled" && (
                      <span className="text-xs text-ink-muted italic">Cancelled</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: TRANSCRIPTS & AUDIO RECORDINGS */}
      {/* ===================================================================== */}
      {activeTab === "transcripts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calls List Sidebar */}
          <div className="bg-surface rounded-xl border border-border p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Completed Call Logs</h3>
            {callTasks
              .filter((t) => t.status === "completed" || t.transcript)
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    (selectedTask?.id === t.id)
                      ? "bg-primary/10 border-primary/40 text-ink shadow-xs"
                      : "bg-surface-raised/40 border-border hover:bg-surface-raised text-ink-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{t.retailerName}</span>
                    <span className="font-mono text-[11px]">{t.language.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span>{t.referenceId}</span>
                    <span>{t.outcome?.promisedPaymentDate ? "Promise Captured" : "Connected"}</span>
                  </div>
                </div>
              ))}
          </div>

          {/* Transcript & Audio Dialog */}
          <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6 shadow-sm space-y-5">
            {selectedTask ? (
              <>
                <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink">{selectedTask.retailerName}</h2>
                    <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-3">
                      <span>Reason: <strong className="text-ink">{selectedTask.reason}</strong></span>
                      <span>Ref: <strong className="text-ink">{selectedTask.referenceId}</strong></span>
                      <span>Language: <strong className="text-ink">{getLanguageLabel(selectedTask.language)}</strong></span>
                    </div>
                  </div>

                  {selectedTask.outcome && (
                    <div className="text-right">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-success/15 text-success border border-success/30 inline-block">
                        Sentiment: {selectedTask.outcome.sentiment || "Positive"}
                      </span>
                      <div className="text-[11px] font-mono text-ink-muted mt-1">
                        Duration: {selectedTask.outcome.durationSeconds || 50}s
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Audio Player */}
                <div className="bg-surface-raised p-3.5 rounded-xl border border-border flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm cursor-pointer"
                  >
                    {isPlayingAudio ? "⏸" : "▶"}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                      <span>{isPlayingAudio ? "00:24" : "00:00"}</span>
                      <span>Synthesized Call Recording (Simulation)</span>
                      <span>01:14</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: isPlayingAudio ? "35%" : "0%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Turn-by-Turn Transcript Dialog */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Turn-by-Turn Audio Transcript</h4>
                  {selectedTask.transcript && selectedTask.transcript.length > 0 ? (
                    selectedTask.transcript.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 max-w-[85%] ${
                          msg.speaker === "agent" ? "mr-auto" : "ml-auto flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                            msg.speaker === "agent"
                              ? "bg-primary text-white"
                              : "bg-surface-raised border border-border text-ink"
                          }`}
                        >
                          {msg.speaker === "agent" ? "AI" : "RT"}
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.speaker === "agent"
                              ? "bg-surface-raised border border-border text-ink"
                              : "bg-primary/10 border border-primary/20 text-ink"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] text-ink-muted mb-1 font-mono">
                            <span>{msg.speaker === "agent" ? "Voice Assistant" : selectedTask.retailerName}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-ink-muted italic p-4 text-center">
                      No transcript recorded yet for this task.
                    </div>
                  )}
                </div>

                {/* Outcome Commitments Box */}
                {selectedTask.outcome && (
                  <div className="mt-4 p-4 rounded-xl bg-success/5 border border-success/20 text-xs text-ink space-y-1.5">
                    <div className="font-bold text-success flex items-center gap-2">
                      <span>✓</span>
                      <span>Extracted Call Outcome & System Write-Backs</span>
                    </div>
                    <p className="text-ink-muted">{selectedTask.outcome.notes}</p>
                    {selectedTask.outcome.promisedPaymentDate && (
                      <div className="pt-1 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                        <span>Promised Date: <strong className="text-ink">{selectedTask.outcome.promisedPaymentDate}</strong></span>
                        <span>Amount: <strong className="text-ink">{formatINR(selectedTask.outcome.promisedAmount || selectedTask.amount || 0)}</strong></span>
                        <span className="text-success font-semibold">✓ Open follow-up auto-created</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-ink-muted text-xs">
                Select a completed call to view its full audio transcript.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SCRIPT TEMPLATES (EDITABLE & MULTILINGUAL) */}
      {/* ===================================================================== */}
      {activeTab === "scripts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reason Selector */}
          <div className="bg-surface rounded-xl border border-border p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Calling Reasons</h3>
            {(Object.keys(scriptTemplates) as CallTaskReason[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedScriptReason(r)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                  selectedScriptReason === r
                    ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-xs"
                    : "bg-surface-raised/40 border-border hover:bg-surface-raised text-ink"
                }`}
              >
                <div className="font-bold">{scriptTemplates[r].title}</div>
                <div className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">{scriptTemplates[r].description}</div>
              </button>
            ))}
          </div>

          {/* Script Editor & Preview */}
          <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-ink">{scriptTemplates[selectedScriptReason].title}</h2>
                <p className="text-xs text-ink-muted mt-0.5">{scriptTemplates[selectedScriptReason].description}</p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border">
                {(["te", "en", "hi", "ta"] as VoiceLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedScriptLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedScriptLang === lang
                        ? "bg-primary text-white shadow-xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Variable Pills */}
            <div>
              <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">Available Variables (Click to Insert):</div>
              <div className="flex flex-wrap gap-2">
                {scriptTemplates[selectedScriptReason].variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEditedScriptText((prev) => `${prev} {{${v}}}`)}
                    className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border hover:border-primary/50 text-ink text-xs font-mono font-semibold transition-all cursor-pointer"
                  >
                    {"{{"}{v}{"}}"}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Script Textarea */}
            <div>
              <label htmlFor="script-template-input" className="text-xs font-bold text-ink block mb-1">
                Prompt Speech Script ({getLanguageLabel(selectedScriptLang)}):
              </label>
              <textarea
                id="script-template-input"
                rows={5}
                value={editedScriptText}
                onChange={(e) => setEditedScriptText(e.target.value)}
                className="w-full p-3.5 bg-surface-raised border border-border rounded-xl text-ink text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
              />
            </div>

            {/* Live Interpolation Preview */}
            <div className="bg-surface-raised/60 p-4 rounded-xl border border-border space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Live Speech Synthesis Preview:</div>
              <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">
                {renderScriptTemplate(editedScriptText, {
                  name: "Sri Laxmi Narasimha Textiles",
                  amount: 31000,
                  invoiceNumber: "INV-0094",
                  dueDate: "28 Oct 2026",
                  daysOverdue: 15,
                  orderNumber: "ARK-8841",
                  lrNumber: "NAV-948102",
                  transportName: "Navata Road Transport",
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-success font-semibold">{scriptSaveMessage}</span>
              <button
                type="button"
                onClick={handleSaveScript}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                Save Script Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: RETAILER TELEPHONY CONSENT & PREFERENCES */}
      {/* ===================================================================== */}
      {activeTab === "preferences" && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-ink">Retailer Telephony Consent & Calling Profiles</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Manage language preferences, DNC (Do-Not-Call) flags, quiet hours, and allowed time windows for all 28 stores.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised text-ink-muted uppercase tracking-wider font-semibold border-b border-border text-[11px]">
                <tr>
                  <th className="p-3">Retailer & Town</th>
                  <th className="p-3">Language</th>
                  <th className="p-3 text-center">Phone Consent</th>
                  <th className="p-3 text-center">Do Not Call (DNC)</th>
                  <th className="p-3">Quiet Hours</th>
                  <th className="p-3">Preferred Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {retailers.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ink hover:underline cursor-pointer" onClick={() => {
                        setSelectedRetailer360Id(r.id);
                        setDistributorNav("retailer-360");
                      }}>
                        {r.name}
                      </div>
                      <div className="text-[11px] text-ink-muted font-mono">{r.town} · {r.phone}</div>
                    </td>

                    <td className="p-3">
                      <select
                        value={r.preferredLanguage || "te"}
                        onChange={(e) => updateRetailerVoicePreferences(r.id, { preferredLanguage: e.target.value as VoiceLanguage })}
                        aria-label={`Preferred language for ${r.name}`}
                        className="p-1.5 rounded-lg bg-surface-raised border border-border text-ink text-xs font-medium cursor-pointer"
                      >
                        <option value="te">తెలుగు (TE)</option>
                        <option value="en">English (EN)</option>
                        <option value="hi">हिंदी (HI)</option>
                        <option value="ta">தமிழ் (TA)</option>
                      </select>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => updateRetailerVoicePreferences(r.id, { phoneConsent: !(r.phoneConsent !== false) })}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          r.phoneConsent !== false
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-danger/15 text-danger border border-danger/30"
                        }`}
                      >
                        {r.phoneConsent !== false ? "✓ Granted" : "✕ Revoked"}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => updateRetailerVoicePreferences(r.id, { doNotCall: !r.doNotCall })}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          r.doNotCall
                            ? "bg-danger text-white shadow-xs"
                            : "bg-surface-raised text-ink-muted border border-border"
                        }`}
                      >
                        {r.doNotCall ? "DNC ACTIVE" : "Off"}
                      </button>
                    </td>

                    <td className="p-3 font-mono text-ink-muted text-[11px]">
                      {r.quietHours ? `${r.quietHours.start} - ${r.quietHours.end}` : "21:00 - 09:00"}
                    </td>

                    <td className="p-3 font-mono text-ink text-[11px]">
                      {r.preferredCallWindow || "11:00 AM - 01:00 PM"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
