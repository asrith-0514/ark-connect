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
}
