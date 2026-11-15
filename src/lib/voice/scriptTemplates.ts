/**
 * ARK Platform - Multilingual Voice Agent Script Templates
 * 
 * Supports Telugu, English, Hindi, and Tamil with dynamic variable interpolation
 * for all automated calling reasons (Payment Due, Overdue, Dispatch Update, Order Follow-up).
 */

import { CallTaskReason, VoiceLanguage } from "@/lib/mock/types";

export interface ScriptTemplateDefinition {
  title: string;
  description: string;
  variables: string[];
  scripts: Record<VoiceLanguage, string>;
}

export const SCRIPT_TEMPLATES: Record<CallTaskReason, ScriptTemplateDefinition> = {
  payment_due: {
    title: "Upcoming Payment Reminder (2 Days Ahead)",
    description: "Polite courtesy notification reminding store owner of upcoming invoice due date to encourage on-time payments.",
    variables: ["name", "amount", "invoiceNumber", "dueDate"],
    scripts: {
      te: "నమస్కారం {{name}} గారు. ARK టెక్స్‌టైల్స్ డిస్ట్రిబ్యూటర్స్ నుండి కాల్ చేస్తున్నాము. మీ ఇన్వాయిస్ నెంబర్ {{invoiceNumber}} మొత్తం ₹{{amount}} గడువు {{dueDate}} న ముగుస్తుంది. సకాలంలో చెల్లింపు కోసం ముందస్తు సమాచారం అందిస్తున్నాము. ఏదైనా సహాయం కావాలా? ధన్యవాదాలు.",
      en: "Hello {{name}}, this is ARK Textiles Distribution. This is a gentle courtesy reminder that invoice {{invoiceNumber}} for ₹{{amount}} is due on {{dueDate}}. We appreciate your timely clearance. Thank you for your continued partnership.",
      hi: "नमस्ते {{name}} जी, मैं ARK टेक्सटाइल्स डिस्ट्रीब्यूटर्स से बोल रहा हूँ। आपका इनवॉइस नंबर {{invoiceNumber}} जिसकी राशि ₹{{amount}} है, {{dueDate}} को देय है। कृपया समय पर भुगतान सुनिश्चित करें। क्या आपको बिल के संबंध में कोई सहायता चाहिए? धन्यवाद।",
      ta: "வணக்கம் {{name}}, ARK டெக்ஸ்டைல்ஸ் நிறுவனத்திலிருந்து அழைக்கிறோம். உங்கள் விலைப்பட்டியல் {{invoiceNumber}} தொகை ₹{{amount}} வரும் {{dueDate}} அன்று செலுத்தப்பட வேண்டும். குறித்த நேரத்தில் பணம் செலுத்துமாறு கேட்டுக்கொள்கிறோம். நன்றி.",
    },
  },

  overdue: {
    title: "Overdue Payment Notice & Commitment",
    description: "Firm yet respectful escalation regarding overdue invoices, capturing promised payment dates and amounts.",
    variables: ["name", "amount", "invoiceNumber", "daysOverdue"],
    scripts: {
      te: "నమస్కారం {{name}} గారు. ARK టెక్స్‌టైల్స్ అకౌంట్స్ విభాగం నుండి మాట్లాడుతున్నాము. మీ ఇన్వాయిస్ {{invoiceNumber}} మొత్తం ₹{{amount}} చెల్లింపు గడువు ముగిసి {{daysOverdue}} రోజులు అయ్యింది. కొత్త ఆర్డర్లకు అడ్డంకి లేకుండా ఉండేందుకు, దయచేసి చెల్లింపు తేదీని ఎప్పుడు నిర్ధారిస్తారో తెలపగలరా?",
      en: "Hello {{name}}, this is ARK Textiles Accounts Department. Invoice {{invoiceNumber}} for ₹{{amount}} is currently {{daysOverdue}} days overdue. To keep your credit line active and prevent order dispatches from holding, could you kindly confirm what date you will clear this payment?",
      hi: "नमस्ते {{name}} जी, ARK टेक्सटाइल्स अकाउंट्स विभाग से। आपका बिल {{invoiceNumber}} जिसकी राशि ₹{{amount}} है, {{daysOverdue}} दिनों से अतिदेय है। आपके क्रेडिट स्कोर और नए डिस्पैच को चालू रखने हेतु, कृपया बताएं कि आप कब तक भुगतान जमा कर रहे हैं?",
      ta: "வணக்கம் {{name}}, ARK டெக்ஸ்டைல்ஸ் கணக்கு பிரிவிலிருந்து பேசுகிறோம். விலைப்பட்டியல் {{invoiceNumber}} தொகை ₹{{amount}} செலுத்தும் காலக்கெடு முடிந்து {{daysOverdue}} நாட்கள் ஆகின்றன. நிலுவைத் தொகையை எப்போது செலுத்த முடியும் என்பதை உறுதிப்படுத்தவும்.",
    },
  },

  dispatch_update: {
    title: "Consignment Dispatch & Transport LR Notice",
    description: "Proactive customer delight update giving consignment LR number, transport service, and expected store delivery.",
    variables: ["name", "orderNumber", "lrNumber", "transportName"],
    scripts: {
      te: "నమస్కారం {{name}} గారు, శుభవార్త! మీ ఆర్డర్ నెంబర్ {{orderNumber}} మా గోడౌన్ నుండి డిస్పాచ్ చేయబడింది. LR నెంబర్ {{lrNumber}}, ట్రాన్స్‌పోర్ట్ సర్వీస్ {{transportName}}. సరుకు 1 నుండి 2 రోజుల్లో మీ పట్టణానికి చేరుకుంటుంది. LR కాపీ మీ వాట్సాప్‌కు కూడా పంపించాము. ధన్యవాదాలు.",
      en: "Hello {{name}}, wonderful news from ARK Textiles! Your order {{orderNumber}} has been packed and dispatched via {{transportName}} with LR Number {{lrNumber}}. It is expected to arrive at your shop within 1-2 days. The copy has been sent to your WhatsApp. Thank you!",
      hi: "नमस्ते {{name}} जी, ARK टेक्सटाइल्स से सूचना। आपका ऑर्डर नंबर {{orderNumber}} हमारे गोदाम से {{transportName}} द्वारा डिस्पैच कर दिया गया है। आपका LR नंबर {{lrNumber}} है। माल 1-2 दिनों में आपके पास पहुंच जाएगा। LR कॉपी WhatsApp पर भेज दी गई है। धन्यवाद।",
      ta: "வணக்கம் {{name}}, உங்கள் ஆர்டர் {{orderNumber}} எங்கள் குடோனில் இருந்து {{transportName}} மூலம் அனுப்பப்பட்டுள்ளது. LR எண் {{lrNumber}}. 1-2 நாட்களில் உங்கள் கடைக்கு வந்து சேரும். ரசீது உங்கள் வாட்ஸ்அப்பிற்கு அனுப்பப்பட்டுள்ளது. நன்றி.",
    },
  },

  order_followup: {
    title: "Post-Delivery Satisfaction & Repeat Booking",
    description: "Follows up after goods delivery to verify stock satisfaction and explore fast-moving style reorders.",
    variables: ["name", "orderNumber"],
    scripts: {
      te: "నమస్కారం {{name}} గారు. ARK టెక్స్‌టైల్స్ నుండి కాల్ చేస్తున్నాము. మీ ఇటీవలి ఆర్డర్ {{orderNumber}} సరిగ్గా అందిందా? ఫ్యాబ్రిక్ క్వాలిటీ మరియు సైజులు సరిగ్గా ఉన్నాయా? మీ స్టోర్‌లో ఏమైనా ఫాస్ట్ మూవింగ్ బాక్సులు లేదా కొత్త కలెక్షన్లు రీఫిల్ చేయాలా?",
      en: "Hello {{name}}, following up from ARK Textiles. We hope your recent delivery for order {{orderNumber}} was received in great condition. Are the pack sizes and box assortments moving well? Please let us know if you would like to restock any fast-moving lines today.",
      hi: "नमस्ते {{name}} जी, ARK टेक्सटाइल्स से फॉलो-अप कॉल। आपका हालिया ऑर्डर {{orderNumber}} सही सलामत मिल गया? कपड़े की क्वालिटी और पैकिंग कैसी लगी? क्या आपकी दुकान में किसी नए साइज़ या मॉडल का रीऑर्डर करना है?",
      ta: "வணக்கம் {{name}}, ARK டெக்ஸ்டைல்ஸ் நிறுவனத்திலிருந்து தொடர்பு கொள்கிறோம். உங்கள் சமீபத்திய ஆர்டர் {{orderNumber}} பாதுகாப்பாக கிடைத்ததா? புதிய ஸ்டாக் அல்லது மறு ஆர்டர் தேவைப்பட்டால் தெரிவிக்கவும். நன்றி.",
    },
  },
};

/**
 * Renders a script template string by replacing `{{variable}}` with actual values
 */
export function renderScriptTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = variables[key];
    if (val === undefined || val === null) {
      return `[${key}]`;
    }
    if (typeof val === "number" && (key === "amount" || key.toLowerCase().includes("total"))) {
      return val.toLocaleString("en-IN");
    }
    return String(val);
  });
}
