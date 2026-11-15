// Shared mock data types for ARK Connect (Retailer) and ARK Distributors (Distributor Hub)

export type OrderStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Confirmed"
  | "Processing"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

export function getOrderStatusLabel(status: OrderStatus, role: "retailer" | "distributor"): string {
  switch (status) {
    case "Draft":
      return role === "retailer" ? "Draft" : "Draft (Hidden)";
    case "Submitted":
      return role === "retailer" ? "In Review" : "Needs Review";
    case "Approved":
      return role === "retailer" ? "Approved" : "Ready to Invoice";
    case "Confirmed":
      return role === "retailer" ? "Confirmed" : "Invoiced";
    case "Processing":
      return role === "retailer" ? "Being Packed" : "Processing";
    case "Dispatched":
      return "Dispatched";
    case "Delivered":
      return "Delivered";
    case "Cancelled":
      return "Cancelled";
  }
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  artNumber: string;
  brand: string;
  color: string;
  colorHex: string;
  size: string;
  units: number; // e.g. boxes
  rate: number;
  totalPieces: number;
  image: string;

  // Compatibility aliases
  productName?: string;
  imageUrl?: string;
  name?: string;
  sku?: string;
  unitType?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  retailerId: string;
  retailerName: string;
  retailerTown: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  totalBoxes: number;
  totalPieces: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  transporter?: string;
  lrNumber?: string;
  ewayBill?: string;
  dispatchDate?: string;
  deliveryDate?: string;
  invoiceNumber?: string;
  paymentStatus: "Unpaid" | "Partly Paid" | "Paid" | "Credit Terms";
  overrideReason?: string;
  rejectionReason?: string;
}

export interface RetailerContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  isPrimary?: boolean;
}

export interface RetailerDocument {
  id: string;
  name: string;
  type: string;
  number: string;
  issuedOn: string;
  status: "Verified" | "Valid" | "Pending";
}

export interface RetailerPublicProfile {
  id: string;
  code: string;
  name: string;
  proprietor: string;
  greeting: string;
  address: string;
  town: string;
  district: string;
  state: string;
  pincode: string;
  gstin: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  destinationBookingPoint: string;
  creditLimit: number;
  creditTermsDays: number;
  creditHold?: boolean;
  dispatchHub: string;
  hubNotice: string;
  sourceOrigin: string;
  footerCredit: string;
  preferredTransporter: string;
  authorizedContacts: RetailerContact[];
  documents: RetailerDocument[];
}

export interface InternalRetailerProfile extends RetailerPublicProfile {
  tier: string;
  tierBadge: string;
  rebatePercent: number;
  marginPercent?: number;
}

export type PricingTier = "Tier A++" | "Tier A+" | "Tier A";

export type VoiceLanguage = "te" | "en" | "hi" | "ta";

export interface Retailer {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  phone: string;
  gstin: string;
  town: string;
  district: string;
  state: "Telangana" | "Andhra Pradesh";
  pricingTier?: PricingTier; // Undefined for pending retailers
  creditLimit: number; // 0 for pending retailers
  creditTermsDays: number;
  creditHold?: boolean;
  status: "Active" | "Needs Approval" | "Deactivated" | "Pending";
  appliedDate?: string;
  lastOrderDate?: string;
  flags?: string;

  // Voice Calling & Notification Preferences
  preferredLanguage?: VoiceLanguage;
  phoneConsent?: boolean;
  whatsappConsent?: boolean;
  doNotCall?: boolean;
  quietHours?: { start: string; end: string };
  preferredContactPerson?: string;
  preferredCallWindow?: string;

  // Derived / computed properties (default 0)
  outstanding: number;
  overdue: number;
}

export interface InvoiceItem {
  description: string;
  variant: string;
  brand: string;
  hsn: string;
  boxes: number;
  rate: number;
  amount: number;
  name?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  retailerId: string;
  retailerName: string;
  retailerTown: string;
  retailerGstin: string;
  billedDate: string;
  date: string; // Compatibility alias for billedDate
  dueDate: string;
  creditDays: number;
  status: "Draft" | "Issued" | "Paid" | "Partly Paid" | "Overdue";
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableValue: number;
  taxRatePercent: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  grandTotal: number;
  total: number; // Compatibility alias for grandTotal
  paid: number;
  balanceDue: number;
  receiptRef?: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  date: string;
  retailerId: string;
  retailerName: string;
  invoiceNumber: string;
  orderNumber: string;
  amount: number;
  mode: "UPI" | "NEFT" | "Cheque" | "Cash";
  referenceId: string;
  reconciled: boolean;
}

export interface Brand {
  id: string;
  name: string;
  shortCode: string;
  tagline: string;
  description: string;
  stockPercentage: string;
  minOrder: string;
  accentColor: string;
  image: string;
  badge: string;
  colorHex?: string;
  logo?: string;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  gstin: string;
  payable: number;
  lastPurchaseDate: string;
  phone: string;
  email: string;
  contactPerson: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;

  // Compatibility aliases
  address?: string;
  brandsSupplied?: string[];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    ifsc?: string;
    bankName: string;
    branch?: string;
  };
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  amount: number;
  balanceDue: number;
  status: "Paid" | "Pending" | "Overdue" | "Unpaid";
  category: string;
  lrNumber?: string;
  paidAmount?: number;
  notes?: string;
}

export interface CatalogueShade {
  name: string;
  code?: string;
  hex?: string;
}

export interface CatalogueVariant {
  id: string;
  fit?: string;
  shade: CatalogueShade;
  size: string;
  stockBoxes: number;
}

export interface TierPricingArticle {
  id: string;
  artNumber: string;
  title: string;
  brand: string;
  category: string;
  packSize: string;
  piecesPerPack: number;
  tierAppPrice: number;
  tierApPrice: number;
  tierAPrice: number;
  hubStock: number;
  hubStockBoxes: number;
  isActive: boolean;
  hsnCode: string;

  // Real product structure fields
  pcsPerBox?: number;
  boxesPerCase?: number;
  pricePending?: boolean;
  styleName?: string;
  brandId?: string;
  availableFits?: string[];
  availableShades?: CatalogueShade[];
  shades?: { name: string; hex?: string; code?: string }[];
  availableSizes?: string[];
  variants?: CatalogueVariant[];
}

// ============================================================================
// Retailer Relationship Management (CRM) Types (Distributor-only)
// ============================================================================

export type CommunicationChannel = "call" | "whatsapp" | "visit" | "note" | "ai-call";
export type CommunicationDirection = "inbound" | "outbound";

export interface CommunicationLogEntry {
  id: string;
  retailerId: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  summary: string;
  createdBy: string;
  createdAt: string; // ISO date string e.g. "2026-11-10T14:30:00Z"
}

export type ComplaintType = "shortage" | "defect" | "pricing" | "delivery" | "other";
export type ComplaintStatus = "open" | "in-progress" | "resolved";

export interface Complaint {
  id: string;
  retailerId: string;
  type: ComplaintType;
  linkedOrderId?: string;
  linkedInvoiceId?: string;
  status: ComplaintStatus;
  assignee: string;
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type FollowUpType = "payment" | "order" | "complaint" | "general";
export type FollowUpStatus = "open" | "done";

export interface FollowUp {
  id: string;
  retailerId: string;
  type: FollowUpType;
  dueDate: string; // YYYY-MM-DD
  assignedTo: string; // Employee name
  status: FollowUpStatus;
  notes: string;
  createdAt: string;
  promisedAmount?: number;
}

export type RetailerRequestType = "credit_limit" | "address_change" | "new_product";
export type RetailerRequestStatus = "pending" | "approved" | "rejected";

export interface RetailerRequestPayload {
  requestedCreditLimit?: number;
  reason?: string;
  address?: string;
  town?: string;
  district?: string;
  state?: string;
  pincode?: string;
  productName?: string;
  brand?: string;
  category?: string;
  notes?: string;
  [key: string]: any;
}

export interface RetailerRequest {
  id: string;
  retailerId: string;
  type: RetailerRequestType;
  status: RetailerRequestStatus;
  payload: RetailerRequestPayload;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: "owner" | "accountant" | "sales" | "manager" | "godown";
  phone?: string;
  email?: string;
}

export type RetailerSegment = "Champions" | "Regular" | "New" | "At risk" | "Dormant";

export interface SegmentationConfig {
  frequencyDays: number; // e.g. 90
  frequencyThreshold: number; // e.g. 4 orders in frequencyDays
  valueThreshold: number; // e.g. ₹3,00,000 in 12 months
  dormantDays: number; // e.g. 60 days without order
  onTimePaymentThresholdPct: number; // e.g. 75%
  newRetailerDays: number; // e.g. 60 days
}

export interface RetailerSegmentMetrics {
  retailerId: string;
  segment: RetailerSegment;
  ordersLast90d: number;
  totalSpend12m: number;
  boxes12m: number;
  lastOrderDate?: string;
  daysSinceLastOrder: number;
  preferredBrand: string;
  preferredBrandSharePct: number;
  onTimePaymentPct: number;
  avgDaysToPay: number;
  isOverdue: boolean;
  overdueAmount: number;
}

// ============================================================================
// VOICE CALLING AGENT (TELEPHONY ARCHITECTURE)
// ============================================================================

export type CallTaskReason =
  | "payment_due"
  | "overdue"
  | "order_followup"
  | "dispatch_update";

export type CallTaskStatus =
  | "proposed"
  | "approved"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export type CallOutcomeStatus =
  | "connected"
  | "busy"
  | "unreachable"
  | "promised_to_pay"
  | "dispute_raised"
  | "callback_requested"
  | "wrong_number";

export interface CallTranscriptMessage {
  speaker: "agent" | "retailer";
  text: string;
  timestamp: string;
}

export interface CallTaskOutcome {
  status: CallOutcomeStatus;
  notes?: string;
  promisedPaymentDate?: string; // YYYY-MM-DD
  promisedAmount?: number;
  sentiment?: "positive" | "neutral" | "negative";
  durationSeconds?: number;
}

export interface CallTask {
  id: string;
  retailerId: string;
  retailerName: string;
  phone: string;
  reason: CallTaskReason;
  referenceType: "invoice" | "order";
  referenceId: string; // e.g. "INV-0094" or "ARK-8841"
  amount?: number;
  dueDate?: string;
  language: VoiceLanguage;
  preferredTimeWindow: string; // e.g. "11:00 AM - 01:00 PM"
  status: CallTaskStatus;
  scheduledDate: string; // ISO date YYYY-MM-DD
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  outcome?: CallTaskOutcome;
  transcript?: CallTranscriptMessage[];
  retryCount: number;
  maxRetries: number;
  promisedPaymentDate?: string;
}

