/**
 * ARK Platform - Voice Telephony Adapter Architecture
 * 
 * Defines the vendor-agnostic CallProvider interface so external voice agent vendors
 * (such as Retell AI, Bland AI, Vapi, Twilio Voice, Sarvam AI, or Bolna)
 * can be plugged in without changing UI screens, state selectors, or business logic.
 */

import {
  CallTask,
  CallTaskOutcome,
  CallTranscriptMessage,
  VoiceLanguage,
} from "@/lib/mock/types";

export interface CallInitiateParams {
  taskId: string;
  phoneNumber: string;
  retailerName: string;
  language: VoiceLanguage;
  reason: string;
  script: string;
  variables: Record<string, any>;
}

export interface CallStatusResponse {
  callId: string;
  status: "queued" | "ringing" | "in_progress" | "completed" | "failed";
  durationSeconds?: number;
  outcome?: CallTaskOutcome;
  transcript?: CallTranscriptMessage[];
  recordingUrl?: string;
}

/**
 * CallProvider Adapter Interface
 * 
 * Implement this interface to connect any AI voice calling vendor.
 */
export interface CallProvider {
  /** Name of the provider (e.g. 'Mock Simulator', 'Retell AI', 'Bland AI', 'Vapi') */
  readonly name: string;

  /** Checks if telephony credentials (API key, phone number) are present */
  isConfigured(): boolean;

  /** Initiates an outbound telephone call task */
  initiateCall(params: CallInitiateParams): Promise<{ callId: string; status: string }>;

  /** Polls or retrieves call status, transcript, and structured outcome */
  getCallStatus(callId: string): Promise<CallStatusResponse>;

  /** Cancels or hangs up an active/queued call */
  cancelCall(callId: string): Promise<boolean>;
}

/**
 * Mock Telephony & Voice Agent Provider
 * 
 * Simulates a high-accuracy multilingual conversational AI voice agent (Telugu, English, Hindi, Tamil)
 * for testing, demonstration, and offline execution without active SIP trunks or paid telephony.
 */
export class MockCallProvider implements CallProvider {
  readonly name = "ARK Mock Voice Provider (Simulation Engine)";

  isConfigured(): boolean {
    return true;
  }

  async initiateCall(params: CallInitiateParams): Promise<{ callId: string; status: string }> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      callId,
      status: "queued",
    };
  }

  async getCallStatus(callId: string): Promise<CallStatusResponse> {
    return {
      callId,
      status: "completed",
      durationSeconds: 68,
      recordingUrl: "/mock-audio/call-recording-sample.mp3",
    };
  }

  async cancelCall(callId: string): Promise<boolean> {
    return true;
  }

  /**
   * Generates a realistic simulated multi-turn transcript and structured outcome
   * tailored to the task's language, reason, and parameters.
   */
  generateSimulatedResult(task: CallTask): {
    outcome: CallTaskOutcome;
    transcript: CallTranscriptMessage[];
    durationSeconds: number;
  } {
    const lang = task.language || "te";
    const name = task.retailerName;
    const inv = task.referenceId || "INV-0094";
    const amt = task.amount ? `₹${task.amount.toLocaleString("en-IN")}` : "₹31,000";

    if (task.reason === "overdue" || task.reason === "payment_due") {
      if (lang === "te") {
        return {
          durationSeconds: 74,
          outcome: {
            status: "promised_to_pay",
            promisedPaymentDate: "2026-11-20",
            promisedAmount: task.amount || 31000,
            notes: "రిటైలర్ వచ్చే శుక్రవారం (20 నవంబర్) నాడు RTGS/UPI ద్వారా ₹31,000 చెల్లిస్తానని హామీ ఇచ్చారు.",
            sentiment: "positive",
            durationSeconds: 74,
          },
          transcript: [
            {
              speaker: "agent",
              text: `నమస్కారం ${name} గారు. నేను ARK టెక్స్‌టైల్స్ అకౌంట్స్ నుండి ఆటోమేటెడ్ అసిస్టెంట్‌ని మాట్లాడుతున్నాను. మీ ఇన్వాయిస్ ${inv} మొత్తం ${amt} పెండింగ్‌లో ఉంది. దీని గురించి మాట్లాడవచ్చా?`,
              timestamp: "00:04",
            },
            {
              speaker: "retailer",
              text: `అవునండి, గుర్తుంది. నిన్ననే కలెక్షన్ వచ్చింది. రేపు బ్యాంకు సెలవు కదా, శుక్రవారం 20 తారీఖు నాడు మొత్తం RTGS చేస్తాను.`,
              timestamp: "00:22",
            },
            {
              speaker: "agent",
              text: `చాలా ధన్యవాదాలు ${name} గారు! 20 నవంబర్ 2026 నాడు ${amt} చెల్లింపుగా రికార్డ్ చేస్తున్నాము. వివరాలు మీ వాట్సాప్‌కు కూడా పంపించాము. శుభదినం!`,
              timestamp: "00:46",
            },
            {
              speaker: "retailer",
              text: `సరేనండి, వాట్సాప్‌లో పంపండి. శుక్రవారం కన్ఫర్మ్ చేస్తాను. థాంక్యూ.`,
              timestamp: "01:02",
            },
          ],
        };
      } else if (lang === "hi") {
        return {
          durationSeconds: 65,
          outcome: {
            status: "promised_to_pay",
            promisedPaymentDate: "2026-11-20",
            promisedAmount: task.amount || 31000,
            notes: "दुकानदार ने 20 नवंबर को NEFT/UPI द्वारा पूरा भुगतान करने का वचन दिया है।",
            sentiment: "positive",
            durationSeconds: 65,
          },
          transcript: [
            {
              speaker: "agent",
              text: `नमस्ते ${name} जी, ARK टेक्सटाइल्स अकाउंट्स विभाग से। आपका बिल ${inv} जिसकी राशि ${amt} है, भुगतान के लिए शेष है।`,
              timestamp: "00:05",
            },
            {
              speaker: "retailer",
              text: `हाँ जी, बिल ध्यान में है। मार्केट से कलेक्शन आ रहा है, 20 नवंबर शुक्रवार तक हम पूरा ट्रांसफर कर देंगे।`,
              timestamp: "00:25",
            },
            {
              speaker: "agent",
              text: `धन्यवाद ${name} जी! हमने 20 नवंबर के लिए नोट कर लिया है। भुगतान की पुष्टि होने पर रसीद WhatsApp पर मिल जाएगी।`,
              timestamp: "00:48",
            },
          ],
        };
      } else {
        // English / Tamil fallback to English
        return {
          durationSeconds: 58,
          outcome: {
            status: "promised_to_pay",
            promisedPaymentDate: "2026-11-20",
            promisedAmount: task.amount || 31000,
            notes: "Store owner confirmed funds are being arranged and promised full RTGS payment on 20 Nov 2026.",
            sentiment: "positive",
            durationSeconds: 58,
          },
          transcript: [
            {
              speaker: "agent",
              text: `Hello ${name}, this is an automated update from ARK Textiles Accounts. This is regarding pending invoice ${inv} for ${amt}. May I know when we can expect the clearance?`,
              timestamp: "00:06",
            },
            {
              speaker: "retailer",
              text: `Yes, we are clearing all vendor dues by this Friday, 20th November. Our accountant will initiate the RTGS directly.`,
              timestamp: "00:24",
            },
            {
              speaker: "agent",
              text: `Thank you for confirming, ${name}. We have scheduled your payment date as 20 November 2026 for ${amt}. Have a great day!`,
              timestamp: "00:44",
            },
          ],
        };
      }
    }

    if (task.reason === "dispatch_update") {
      return {
        durationSeconds: 45,
        outcome: {
          status: "connected",
          notes: "Retailer acknowledged dispatch details and transport LR number.",
          sentiment: "positive",
          durationSeconds: 45,
        },
        transcript: [
          {
            speaker: "agent",
            text: `నమస్కారం ${name} గారు. ARK టెక్స్‌టైల్స్ నుండి శుభవార్త. మీ ఆర్డర్ ${task.referenceId} డిస్పాచ్ చేయబడింది. LR నెంబర్ మీ వాట్సాప్‌కు పంపాము.`,
            timestamp: "00:04",
          },
          {
            speaker: "retailer",
            text: `చాలా సంతోషం అండీ. రేపటికి గూడ్స్ మా షాపుకి వస్తాయా?`,
            timestamp: "00:18",
          },
          {
            speaker: "agent",
            text: `అవునండి, రేపు మధ్యాహ్నం 2 గంటల లోపు డెలివరీ అవుతుంది. ఏదైనా సమస్య ఉంటే మా హెల్ప్‌లైన్‌కు తెలపండి.`,
            timestamp: "00:32",
          },
        ],
      };
    }

    // Default order follow-up
    return {
      durationSeconds: 52,
      outcome: {
        status: "connected",
        notes: "Retailer satisfied with delivered stock. Inquired about upcoming winter collection leggings.",
        sentiment: "positive",
        durationSeconds: 52,
      },
      transcript: [
        {
          speaker: "agent",
          text: `నమస్కారం ${name} గారు, ARK టెక్స్‌టైల్స్ నుండి. మీ ఇటీవలి డెలివరీ ఎలా ఉంది? అన్ని బాక్సులు సరిగ్గా చేరాయా?`,
          timestamp: "00:05",
        },
        {
          speaker: "retailer",
          text: `అవునండి, స్టాక్ బాగుంది. ఫ్లైబర్డ్స్ యాంకిల్ లెగ్గింగ్స్ సైజులు త్వరగా సేల్ అవుతున్నాయి. మళ్లీ ఆర్డర్ పెట్టాలి.`,
          timestamp: "00:26",
        },
        {
          speaker: "agent",
          text: `చాలా సంతోషం ${name} గారు! మా సేల్స్‌మెన్ మీతో కనెక్ట్ అవుతారు. థాంక్యూ!`,
          timestamp: "00:42",
        },
      ],
    };
  }
}

/**
 * Global singleton / factory for the active CallProvider
 * 
 * SWAPPING GUIDE:
 * To use a real voice AI vendor (e.g. Retell AI / Bland AI / Twilio):
 * 1. Implement class RetellCallProvider implements CallProvider.
 * 2. Return `new RetellCallProvider()` here.
 * Zero UI components or state managers need to be modified.
 */
let activeProvider: CallProvider = new MockCallProvider();

export function getCallProvider(): CallProvider {
  return activeProvider;
}

export function setCallProvider(provider: CallProvider): void {
  activeProvider = provider;
}
