/**
 * ARK Platform - Voice Telephony Seed Tasks & Outcome Processors
 */

import {
  CallTask,
  CallTaskOutcome,
  CommunicationLogEntry,
  FollowUp,
} from "@/lib/mock/types";

export const MOCK_CALL_TASKS: CallTask[] = [
  // 1. Proposed Tasks (Awaiting Owner Review & Approval)
  {
    id: "ct-101",
    retailerId: "ret-1",
    retailerName: "Sri Laxmi Narasimha Textiles",
    phone: "+91 94401 23456",
    reason: "overdue",
    referenceType: "invoice",
    referenceId: "INV-0094",
    amount: 31000,
    dueDate: "28 Oct 2026",
    language: "te",
    preferredTimeWindow: "11:00 AM - 01:00 PM",
    status: "proposed",
    scheduledDate: "2026-11-12",
    createdAt: "2026-11-12",
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: "ct-102",
    retailerId: "ret-1",
    retailerName: "Sri Laxmi Narasimha Textiles",
    phone: "+91 94401 23456",
    reason: "dispatch_update",
    referenceType: "order",
    referenceId: "ARK-8841",
    amount: 40318,
    language: "te",
    preferredTimeWindow: "11:00 AM - 01:00 PM",
    status: "proposed",
    scheduledDate: "2026-11-12",
    createdAt: "2026-11-12",
    retryCount: 0,
    maxRetries: 2,
  },
  {
    id: "ct-103",
    retailerId: "ret-6",
    retailerName: "Surya Teja Silks",
    phone: "+91 94401 44556",
    reason: "overdue",
    referenceType: "invoice",
    referenceId: "INV-0081",
    amount: 45000,
    dueDate: "26 Oct 2026",
    language: "te",
    preferredTimeWindow: "03:00 PM - 05:00 PM",
    status: "proposed",
    scheduledDate: "2026-11-12",
    createdAt: "2026-11-12",
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: "ct-104",
    retailerId: "ret-10",
    retailerName: "Padmavathi Textiles",
    phone: "+91 98480 33445",
    reason: "overdue",
    referenceType: "invoice",
    referenceId: "INV-0078",
    amount: 35000,
    dueDate: "20 Oct 2026",
    language: "te",
    preferredTimeWindow: "11:00 AM - 01:00 PM",
    status: "proposed",
    scheduledDate: "2026-11-12",
    createdAt: "2026-11-12",
    retryCount: 0,
    maxRetries: 3,
  },

  // 2. Approved Task (Queued for Dialing)
  {
    id: "ct-105",
    retailerId: "ret-2",
    retailerName: "Sri Venkata Ramana Garments",
    phone: "+91 94401 22890",
    reason: "order_followup",
    referenceType: "order",
    referenceId: "ARK-8802",
    amount: 28400,
    language: "te",
    preferredTimeWindow: "02:00 PM - 04:00 PM",
    status: "approved",
    scheduledDate: "2026-11-12",
    createdAt: "2026-11-11",
    approvedAt: "2026-11-12 10:15",
    retryCount: 0,
    maxRetries: 2,
  },

  // 3. Completed Task (With Telugu Transcript & Captured Payment Promise)
  {
    id: "ct-106",
    retailerId: "ret-5",
    retailerName: "Mahalaxmi Cloth Stores",
    phone: "+91 94401 99887",
    reason: "overdue",
    referenceType: "invoice",
    referenceId: "INV-0089",
    amount: 32000,
    dueDate: "25 Oct 2026",
    language: "te",
    preferredTimeWindow: "11:00 AM - 01:00 PM",
    status: "completed",
    scheduledDate: "2026-11-10",
    createdAt: "2026-11-09",
    approvedAt: "2026-11-10 09:30",
    completedAt: "2026-11-10 11:42",
    retryCount: 1,
    maxRetries: 3,
    promisedPaymentDate: "2026-11-20",
    outcome: {
      status: "promised_to_pay",
      promisedPaymentDate: "2026-11-20",
      promisedAmount: 32000,
      notes: "రిటైలర్ వచ్చే శుక్రవారం 20 నవంబర్ నాడు ₹32,000 RTGS ద్వారా చెల్లిస్తానని హామీ ఇచ్చారు.",
      sentiment: "positive",
      durationSeconds: 74,
    },
    transcript: [
      {
        speaker: "agent",
        text: "నమస్కారం మహాలక్ష్మి క్లాత్ స్టోర్స్ గారు. ARK టెక్స్‌టైల్స్ అకౌంట్స్ నుండి ఆటోమేటెడ్ అసిస్టెంట్‌ని మాట్లాడుతున్నాను. మీ ఇన్వాయిస్ INV-0089 మొత్తం ₹32,000 పెండింగ్‌లో ఉంది. దీని గురించి మాట్లాడవచ్చా?",
        timestamp: "00:04",
      },
      {
        speaker: "retailer",
        text: "అవునండి, నిన్ననే కలెక్షన్ వచ్చింది. శుక్రవారం 20 తారీఖు నాడు మొత్తం RTGS చేస్తాను.",
        timestamp: "00:24",
      },
      {
        speaker: "agent",
        text: "చాలా ధన్యవాదాలు! 20 నవంబర్ 2026 నాడు ₹32,000 చెల్లింపుగా రికార్డ్ చేస్తున్నాము. వివరాలు మీ వాట్సాప్‌కు కూడా పంపించాము. శుభదినం!",
        timestamp: "00:48",
      },
      {
        speaker: "retailer",
        text: "సరేనండి, వాట్సాప్‌లో పంపండి. ధన్యవాదాలు.",
        timestamp: "01:02",
      },
    ],
  },

  // 4. Completed Task (English Dispatch Update)
  {
    id: "ct-107",
    retailerId: "ret-7",
    retailerName: "Balaji Textiles",
    phone: "+91 94401 55667",
    reason: "dispatch_update",
    referenceType: "order",
    referenceId: "ARK-8790",
    amount: 18500,
    language: "en",
    preferredTimeWindow: "11:00 AM - 01:00 PM",
    status: "completed",
    scheduledDate: "2026-11-08",
    createdAt: "2026-11-08",
    approvedAt: "2026-11-08 10:00",
    completedAt: "2026-11-08 11:20",
    retryCount: 0,
    maxRetries: 2,
    outcome: {
      status: "connected",
      notes: "Retailer confirmed LR number and transport tracking details.",
      sentiment: "positive",
      durationSeconds: 42,
    },
    transcript: [
      {
        speaker: "agent",
        text: "Hello Balaji Textiles, calling from ARK Textiles. Your order ARK-8790 has been dispatched via Navata Road Transport with LR Number 992817. Expected delivery tomorrow.",
        timestamp: "00:04",
      },
      {
        speaker: "retailer",
        text: "Thank you for the update! Please send the LR slip copy on WhatsApp as well.",
        timestamp: "00:20",
      },
      {
        speaker: "agent",
        text: "It has already been sent to your registered WhatsApp number. Have a wonderful day!",
        timestamp: "00:34",
      },
    ],
  },
];

/**
 * Applies a completed call task outcome:
 * 1. Writes an outbound communication log entry (channel: "ai-call")
 * 2. If a promised payment date is present, generates an open Follow-up task
 */
export function handleCallOutcomeWriteBack(
  task: CallTask,
  outcome: CallTaskOutcome,
  actions: {
    addCommunication: (entry: Omit<CommunicationLogEntry, "id" | "createdAt">) => void;
    addFollowUp: (followUp: Omit<FollowUp, "id" | "createdAt">) => void;
  }
): void {
  const reasonLabel = task.reason.replace(/_/g, " ").toUpperCase();
  const langLabel = (task.language || "te").toUpperCase();
  const promisedText = outcome.promisedPaymentDate
    ? ` · Promised Payment: ₹${(outcome.promisedAmount || task.amount || 0).toLocaleString("en-IN")} on ${outcome.promisedPaymentDate}`
    : "";

  // 1. Write back to Communications Log
  actions.addCommunication({
    retailerId: task.retailerId,
    channel: "ai-call",
    direction: "outbound",
    summary: `AI Voice Call [${langLabel}] (${reasonLabel} for ${task.referenceId}): ${outcome.notes || outcome.status}${promisedText}. Duration: ${outcome.durationSeconds || 45}s.`,
    createdBy: "AI Voice Agent",
  });

  // 2. Write back to Follow-up Queue if payment promised
  if (outcome.promisedPaymentDate) {
    actions.addFollowUp({
      retailerId: task.retailerId,
      type: "payment",
      dueDate: outcome.promisedPaymentDate,
      promisedAmount: outcome.promisedAmount || task.amount,
      status: "open",
      assignedTo: "Collections Team",
      notes: `AI Voice Call Outcome: Retailer promised payment of ₹${(outcome.promisedAmount || task.amount || 0).toLocaleString("en-IN")} on ${outcome.promisedPaymentDate}. Reference: ${task.referenceId}.`,
    });
  }
}
