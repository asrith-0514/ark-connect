// Shared mock data module for ARK Connect Retailer Portal
// Retailer: Sri Laxmi Narasimha Textiles (RET-0001)

import { useState, useEffect } from "react";
import {
  RetailerContact,
  RetailerDocument,
  RetailerPublicProfile,
  InternalRetailerProfile,
  OrderItem,
  Order,
} from "./types";
import { SHARED_PRODUCT_CATEGORIES, SharedProductCategory } from "./data";

export type {
  RetailerContact,
  RetailerDocument,
  RetailerPublicProfile,
  InternalRetailerProfile,
};

export { SHARED_PRODUCT_CATEGORIES };
export type { SharedProductCategory };

// Public alias for retailer component imports
export type RetailerProfile = RetailerPublicProfile;

export interface RetailerInvoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  billedDate: string;
  total: number;
  paid: number;
  balanceDue: number;
  dueDate: string;
  status: "Partly Paid" | "Paid" | "Overdue" | "Draft" | "Issued";
  statusBadge: string;
  receiptRef?: string;
  creditDays: number;
  taxRatePercent: number;
  itemsCount: number;
}

export interface RetailerPayment {
  id: string;
  receiptNumber: string;
  date: string;
  invoiceNumber: string;
  orderNumber: string;
  amount: number;
  mode: "UPI" | "NEFT" | "Cheque" | "Cash";
  referenceId: string;
  reconciled: boolean;
}

export interface RetailerOrderItem {
  productId: string;
  productTitle: string;
  artNumber: string;
  brand: string;
  color: string;
  colorHex: string;
  size: string;
  units: number;
  rate: number;
  totalPieces: number;
  image: string;
}

export interface RetailerOrder {
  id: string;
  orderNumber: string;
  retailerId: string;
  retailerName: string;
  retailerTown: string;
  date: string;
  status: "Draft" | "Submitted" | "Approved" | "Confirmed" | "Processing" | "Dispatched" | "Delivered" | "Cancelled";
  items: RetailerOrderItem[];
  totalBoxes: number;
  totalPieces: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  transporter?: string;
  lrNumber?: string;
  dispatchDate?: string;
  invoiceNumber?: string;
  paymentStatus: "Unpaid" | "Partly Paid" | "Paid" | "Credit Terms";
}

// ---------------------------------------------------------------------------
// 1. Retailer Public Profile (Retailer components import ONLY this)
// ---------------------------------------------------------------------------
export const RETAILER_PROFILE: RetailerPublicProfile = {
  id: "ret-1",
  code: "RET-0001",
  name: "Sri Laxmi Narasimha Textiles",
  proprietor: "T. Narasimha Rao",
  greeting: "Namaste, Narasimha Rao!",
  address: "Main Bazaar, Siddipet, Telangana 502103",
  town: "Siddipet",
  district: "Siddipet",
  state: "Telangana",
  pincode: "502103",
  gstin: "36AAACF1234F1Z5",
  phone: "+91 94401 23456",
  email: "narasimha.textiles.sdp@gmail.com",
  deliveryAddress: "Sri Laxmi Narasimha Textiles, D.No. 4-2-88, Main Bazaar, Siddipet, Telangana 502103",
  destinationBookingPoint: "Siddipet Central Booking Office (Navata Road Transport)",
  creditLimit: 150000,
  creditTermsDays: 30,
  dispatchHub: "ARK Distributors, Secunderabad Hub",
  hubNotice: "DISPATCH HUB ACTIVE • ARK DISTRIBUTORS, SECUNDERABAD HUB",
  sourceOrigin: "sourced from Tiruppur mills",
  footerCredit: "Official Wholesale Gateway by ARK Distributors",
  preferredTransporter: "Navata Road Transport",
  authorizedContacts: [
    {
      id: "c-1",
      name: "T. Narasimha Rao",
      role: "Proprietor & Primary Buyer",
      phone: "+91 94401 23456",
      isPrimary: true,
    },
    {
      id: "c-2",
      name: "T. Venkat Rao",
      role: "Store Manager & Inventory In-charge",
      phone: "+91 98480 11223",
      isPrimary: false,
    },
  ],
  documents: [
    {
      id: "doc-gst",
      name: "GST Registration Certificate",
      type: "Form GST REG-06",
      number: "36AAACF1234F1Z5",
      issuedOn: "01 Jul 2017",
      status: "Verified",
    },
    {
      id: "doc-trade",
      name: "Municipality Trade Licence",
      type: "Commercial Retailer Trade Licence",
      number: "SDP/TRD/2024/0981",
      issuedOn: "12 Apr 2024",
      status: "Valid",
    },
  ],
};

// ---------------------------------------------------------------------------
// 1B. Internal Retailer Profile (Distributor Hub / Backoffice only)
// ---------------------------------------------------------------------------
export const INTERNAL_RETAILER_PROFILE: InternalRetailerProfile = {
  ...RETAILER_PROFILE,
  tier: "Tier A++",
  tierBadge: "Tier A++",
  rebatePercent: 5,
  marginPercent: 28.5,
};

// ---------------------------------------------------------------------------
// 2. Invoices (Accurate per specification)
// ---------------------------------------------------------------------------
// - INV-0094 (#ARK-8812), billed 14 Oct 2026, total ₹33,200, paid ₹10,000, due 13 Nov 2026
// - INV-0087 (#ARK-8790), billed 28 Sep 2026, total ₹25,830, paid ₹25,830, receipt UPI-849204
// - INV-0079 (#ARK-8761), billed 30 Sep 2026, total ₹31,000, paid 0, due 30 Oct 2026 (overdue)
export const RETAILER_INVOICES: RetailerInvoice[] = [
  {
    id: "inv-0094",
    invoiceNumber: "INV-0094",
    orderNumber: "#ARK-8812",
    billedDate: "14 Oct 2026",
    total: 33200,
    paid: 10000,
    balanceDue: 23200,
    dueDate: "13 Nov 2026",
    status: "Partly Paid",
    statusBadge: "Partly paid",
    creditDays: 30,
    taxRatePercent: 5,
    itemsCount: 4,
  },
  {
    id: "inv-0087",
    invoiceNumber: "INV-0087",
    orderNumber: "#ARK-8790",
    billedDate: "28 Sep 2026",
    total: 25830,
    paid: 25830,
    balanceDue: 0,
    dueDate: "28 Oct 2026",
    status: "Paid",
    statusBadge: "Settled in full",
    receiptRef: "UPI-849204",
    creditDays: 30,
    taxRatePercent: 5,
    itemsCount: 3,
  },
  {
    id: "inv-0079",
    invoiceNumber: "INV-0079",
    orderNumber: "#ARK-8761",
    billedDate: "30 Sep 2026",
    total: 31000,
    paid: 0,
    balanceDue: 31000,
    dueDate: "30 Oct 2026",
    status: "Overdue",
    statusBadge: "Overdue",
    creditDays: 30,
    taxRatePercent: 5,
    itemsCount: 4,
  },
];

// ---------------------------------------------------------------------------
// 3. Payments
// ---------------------------------------------------------------------------
export const RETAILER_PAYMENTS: RetailerPayment[] = [
  {
    id: "pay-1",
    receiptNumber: "REC-0842",
    date: "20 Oct 2026",
    invoiceNumber: "INV-0094",
    orderNumber: "#ARK-8812",
    amount: 10000,
    mode: "NEFT",
    referenceId: "NEFT-7821903",
    reconciled: true,
  },
  {
    id: "pay-2",
    receiptNumber: "UPI-849204",
    date: "05 Oct 2026",
    invoiceNumber: "INV-0087",
    orderNumber: "#ARK-8790",
    amount: 25830,
    mode: "UPI",
    referenceId: "UPI-849204",
    reconciled: true,
  },
];

// ---------------------------------------------------------------------------
// 4. Orders (4 existing orders per specification)
// - ARK-8841 Dispatched (uses Navata Road Transport, LR NRT-77492-SDP everywhere)
// - ARK-8902 Draft
// - ARK-8903 In Review / Submitted
// - ARK-8839 Delivered
// ---------------------------------------------------------------------------
export const RETAILER_ORDERS: RetailerOrder[] = [
  {
    id: "ord-8841",
    orderNumber: "ARK-8841",
    retailerId: "RET-0001",
    retailerName: "Sri Laxmi Narasimha Textiles",
    retailerTown: "Siddipet",
    date: "24 Oct 2026",
    status: "Dispatched",
    totalBoxes: 120,
    totalPieces: 1040,
    subtotal: 46200,
    gstAmount: 2310,
    grandTotal: 48510,
    transporter: "Navata Road Transport",
    lrNumber: "NRT-77492-SDP",
    dispatchDate: "24 Oct 2026",
    invoiceNumber: "INV-0095",
    paymentStatus: "Credit Terms",
    items: [
      {
        productId: "prod-2",
        productTitle: "Combed Cotton Rib Vest RN75",
        artNumber: "FB-104",
        brand: "Flybirds",
        color: "Classic White",
        colorHex: "#ffffff",
        size: "Size L",
        units: 40,
        rate: 400,
        totalPieces: 240,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEHHdIE1pHGl-Q9KYNUbi4SpTBWu_MBvQXNKQSwSDNs5LvshtzB4FKUhcAkzs2HfhhtWIUGgeqswPW-cp64SGsDItoYVzgsa9f4z5OxU5Yx1r1xVLbuHrf0QOBFRfHh-D9a3YSfGS9r25kqv-MZblfK2EnEyKViwc75dMvksdD2tOH0gmVLsepEz3KB1ztzbr2Ip4BTQayLXGEaJ_Gtmj4vhAVVBCQLqgNbctzRxyX",
      },
      {
        productId: "prod-1",
        productTitle: "Cotton Boxer Briefs",
        artNumber: "FB-301",
        brand: "Flybirds",
        color: "Ink Navy",
        colorHex: "#1e3a8a",
        size: "Size M",
        units: 30,
        rate: 400,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGNX3N4bECmULI--eixseQDph7ULZiPTbB0GFbULm-xspMssEUzEs5QfjFYzFGokpBz82dReM0WPlIxAw4eFYkaFxIVjyvG4VrWQiACe0vqr9l0-elREOhFT0s1bdZMNgHsl0F2dC0nZhQW4j8uxl4-Ta_VX-zBnGcoQOLWaWR_QIJIKIc720D3JESIItBSaygiwLUoXlWR5V1_TP8cAWvT1oTVrDiq1c6W0zvd29",
      },
      {
        productId: "prod-aswathi",
        productTitle: "Gold Border Pure Cotton Dhoti",
        artNumber: "AS-501",
        brand: "Aswathi",
        color: "Bleached White",
        colorHex: "#ffffff",
        size: "Free Size",
        units: 30,
        rate: 364,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
      },
      {
        productId: "prod-aswathi-2",
        productTitle: "Woven Cotton Banian Vest",
        artNumber: "AS-102",
        brand: "Aswathi",
        color: "Off White",
        colorHex: "#f8fafc",
        size: "Size XL",
        units: 20,
        rate: 364,
        totalPieces: 200,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkHF7QBgfUImLnIA-TLyT2prQjwR8lKSXZKCTP9Kz11JyU7m6dB7kLxucrQvIssfykUkz9kVeCDf6n-0XExnlYThTyCi1148pDJ7zTHLj5EEBhpPiu_2D9VloYxji4-jyqsxjF00HywHOUmjXdiiSRWDQTpMeYpKykcwsAaqgBiuAizg_bc9uusm4v_aGoPM6k1CzUyBqCkmBEvilMGkR91JvMBMrajC82Ks1WioW5",
      },
    ],
  },
  {
    id: "ord-8902",
    orderNumber: "ARK-8902",
    retailerId: "RET-0001",
    retailerName: "Sri Laxmi Narasimha Textiles",
    retailerTown: "Siddipet",
    date: "26 Oct 2026",
    status: "Draft",
    totalBoxes: 100,
    totalPieces: 980,
    subtotal: 40317.9,
    gstAmount: 2015.9,
    grandTotal: 42333.8,
    transporter: "Navata Road Transport",
    paymentStatus: "Credit Terms",
    items: [
      {
        productId: "prod-2",
        productTitle: "Combed Cotton Rib Vest RN75",
        artNumber: "FB-104",
        brand: "Flybirds",
        color: "Classic White",
        colorHex: "#ffffff",
        size: "Size L (85 cm)",
        units: 12,
        rate: 325,
        totalPieces: 120,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEHHdIE1pHGl-Q9KYNUbi4SpTBWu_MBvQXNKQSwSDNs5LvshtzB4FKUhcAkzs2HfhhtWIUGgeqswPW-cp64SGsDItoYVzgsa9f4z5OxU5Yx1r1xVLbuHrf0QOBFRfHh-D9a3YSfGS9r25kqv-MZblfK2EnEyKViwc75dMvksdD2tOH0gmVLsepEz3KB1ztzbr2Ip4BTQayLXGEaJ_Gtmj4vhAVVBCQLqgNbctzRxyX",
      },
      {
        productId: "prod-2",
        productTitle: "Combed Cotton Rib Vest RN75",
        artNumber: "FB-104",
        brand: "Flybirds",
        color: "Jet Black",
        colorHex: "#0f172a",
        size: "Size XL (90 cm)",
        units: 18,
        rate: 325,
        totalPieces: 180,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDy0Ns6Kj1Z8Dg_k17JRDxQ-A1DQR6PMVWli1AftKmKumT4IT_z1UXTry2LzH-Jc3SfjAM6sJOHy113S0HGUUkWrZIhDhlXNondfgjT-lMLMD3Acl_O5Fc3a4eUbqpi_xBv_sSFUu7oSHomx0BE8KErBViZsXSb3BxzzUujU4APFolHL5TzvyMeBayabTRyMpRrQxWbgEfYkf7_XTiWY8-27yP2gzkl4TrNpKk4e0Ug",
      },
      {
        productId: "prod-1",
        productTitle: "Cotton Boxer Briefs",
        artNumber: "FB-301",
        brand: "Flybirds",
        color: "Ink Navy",
        colorHex: "#1e3a8a",
        size: "Size M (80 cm)",
        units: 40,
        rate: 348.97,
        totalPieces: 400,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGNX3N4bECmULI--eixseQDph7ULZiPTbB0GFbULm-xspMssEUzEs5QfjFYzFGokpBz82dReM0WPlIxAw4eFYkaFxIVjyvG4VrWQiACe0vqr9l0-elREOhFT0s1bdZMNgHsl0F2dC0nZhQW4j8uxl4-Ta_VX-zBnGcoQOLWaWR_QIJIKIc720D3JESIItBSaygiwLUoXlWR5V1_TP8cAWvT1oTVrDiq1c6W0zvd29",
      },
      {
        productId: "prod-sleepy-1",
        productTitle: "Modal Checked Lounge Pants",
        artNumber: "SP-550",
        brand: "Sleepy Panda",
        color: "Heather / Navy Grid",
        colorHex: "#565e74",
        size: "Size L (85 cm)",
        units: 16,
        rate: 505.5,
        totalPieces: 160,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnMbdcYNS5zFHOUvxIJMPH7rbsy7dDLo_MYJ5ATMKbNJQDgRQ-a_t-XVmmlg36EkD19kcWMtbaPfEnkQohiu0-K7jpQDhaTRp6DUaCe-VaRZgIOGIkyqq4VjIiRsq02UDMszRIlZas1beI4LGwWSDR0_y-mMtDB9u__V9p0LyoajnWGcvOvu7ovY3v3L1Yfk2_9h3eubQGL6T7Dqn0nRZcfhFyLcoP6T42bk_L-6KG",
      },
      {
        productId: "prod-sleepy-2",
        productTitle: "Kids Bio-Wash Pyjama Set (2-10Y)",
        artNumber: "SP-810",
        brand: "Sleepy Panda",
        color: "Pastel Assorted",
        colorHex: "#6ffbbe",
        size: "Size M (4-6Y)",
        units: 14,
        rate: 608.65,
        totalPieces: 120,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDfGNsdy_BnL79sV-awB5b_G_sjiXgACVKk6fcbPbTFUS65T-iR9XUFNHRYoRyONL3Sk9gG8w0Ov4g6e9J9FtKBbWYrMhMOurAMQMQz8DrnhYf4zRdMWBOxeQCuLBvOHfBDIrQOdLge-XTPErm1Uv6Ilr-yw4r3hEU69L-hSSZF4e9Gdqu5UlvZeSLNi3RR2gYeo4OXd2_a1uGxgloFaHbvtvlne-5BDNKvhbucuQNT",
      },
    ],
  },
  {
    id: "ord-8903",
    orderNumber: "ARK-8903",
    retailerId: "RET-0001",
    retailerName: "Sri Laxmi Narasimha Textiles",
    retailerTown: "Siddipet",
    date: "27 Oct 2026",
    status: "Submitted",
    totalBoxes: 60,
    totalPieces: 600,
    subtotal: 24500,
    gstAmount: 1225,
    grandTotal: 25725,
    transporter: "Navata Road Transport",
    paymentStatus: "Credit Terms",
    items: [
      {
        productId: "prod-1",
        productTitle: "Cotton Boxer Briefs",
        artNumber: "FB-301",
        brand: "Flybirds",
        color: "Classic White",
        colorHex: "#ffffff",
        size: "Size L",
        units: 30,
        rate: 400,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGNX3N4bECmULI--eixseQDph7ULZiPTbB0GFbULm-xspMssEUzEs5QfjFYzFGokpBz82dReM0WPlIxAw4eFYkaFxIVjyvG4VrWQiACe0vqr9l0-elREOhFT0s1bdZMNgHsl0F2dC0nZhQW4j8uxl4-Ta_VX-zBnGcoQOLWaWR_QIJIKIc720D3JESIItBSaygiwLUoXlWR5V1_TP8cAWvT1oTVrDiq1c6W0zvd29",
      },
      {
        productId: "prod-2",
        productTitle: "Combed Cotton Rib Vest RN75",
        artNumber: "FB-104",
        brand: "Flybirds",
        color: "Jet Black",
        colorHex: "#0f172a",
        size: "Size M",
        units: 30,
        rate: 416.66,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDy0Ns6Kj1Z8Dg_k17JRDxQ-A1DQR6PMVWli1AftKmKumT4IT_z1UXTry2LzH-Jc3SfjAM6sJOHy113S0HGUUkWrZIhDhlXNondfgjT-lMLMD3Acl_O5Fc3a4eUbqpi_xBv_sSFUu7oSHomx0BE8KErBViZsXSb3BxzzUujU4APFolHL5TzvyMeBayabTRyMpRrQxWbgEfYkf7_XTiWY8-27yP2gzkl4TrNpKk4e0Ug",
      },
    ],
  },
  {
    id: "ord-8839",
    orderNumber: "ARK-8839",
    retailerId: "RET-0001",
    retailerName: "Sri Laxmi Narasimha Textiles",
    retailerTown: "Siddipet",
    date: "18 Oct 2026",
    status: "Delivered",
    totalBoxes: 50,
    totalPieces: 500,
    subtotal: 19500,
    gstAmount: 975,
    grandTotal: 20475,
    transporter: "Navata Road Transport",
    lrNumber: "NRT-65120-SDP",
    dispatchDate: "19 Oct 2026",
    paymentStatus: "Paid",
    items: [
      {
        productId: "prod-3",
        productTitle: "Within Seamless Comfort Hipster",
        artNumber: "WN-220",
        brand: "Within",
        color: "Nude Skin",
        colorHex: "#e7cba9",
        size: "Size L",
        units: 50,
        rate: 390,
        totalPieces: 500,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 5. Currency & Indian Formatting Utilities (Requirement 3)
// - Whole rupees show no decimals (₹54,200)
// - Paise show 2 digits (₹40,317.90)
// ---------------------------------------------------------------------------
export function formatINR(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  // Round to nearest paisa to prevent floating point imprecision
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Math.abs(rounded % 1) < 0.005;

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(rounded);

  return `₹${formatted}`;
}

// ---------------------------------------------------------------------------
// 6. Date & Cycle Utilities (Requirement 2 & 6)
// ---------------------------------------------------------------------------
// Stable fallback date (12 Nov 2026) to prevent Next.js 16 prerender deopt on unstable `new Date()`
export const DEFAULT_APP_DATE = new Date("2026-11-12T00:00:00+05:30");

export function getCurrentDate(): Date {
  if (typeof window !== "undefined") {
    return new Date();
  }
  return DEFAULT_APP_DATE;
}

/**
 * Hydration-safe React hook:
 * Returns DEFAULT_APP_DATE on SSR and initial client render to match server markup,
 * then updates to the real browser date on mount. Prevents React hydration mismatch
 * while keeping dynamic calculations (e.g. "Due in 1 day") strictly up to date.
 */
export function useCurrentDate(): Date {
  const [date, setDate] = useState<Date>(DEFAULT_APP_DATE);
  useEffect(() => {
    setDate(new Date());
  }, []);
  return date;
}

export function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? DEFAULT_APP_DATE : d;
}

export function getDaysUntil(dateInput: string | Date, baseDate = getCurrentDate()): number {
  const target = typeof dateInput === "string" ? parseDate(dateInput) : dateInput;
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const baseMidnight = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime();
  return Math.round((targetMidnight - baseMidnight) / (1000 * 60 * 60 * 24));
}

export function formatDueInDays(days: number): string {
  if (days < 0) return `${Math.abs(days)}d past due`;
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

// Requirement 6: Derive Ordering Cycle from current month
export function getOrderingCycle(date = getCurrentDate()): { cycleName: string; cycleLabel: string } {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = date.getMonth(); // 0 to 11
  const cycleIndex = Math.floor(month / 2); // 0 to 5
  const startMonth = monthNames[cycleIndex * 2];
  const endMonth = monthNames[cycleIndex * 2 + 1];
  const cycleNum = cycleIndex + 1;
  const cycleLabel = `Cycle ${cycleNum} (${startMonth}-${endMonth})`;
  return {
    cycleName: `Ordering Cycle • ${cycleLabel}`,
    cycleLabel,
  };
}

// ---------------------------------------------------------------------------
// 8. Demo Mode Utility
// ---------------------------------------------------------------------------
export function isDemoModeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1") {
    return true;
  }
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") === "true" || params.get("demo") === "1";
  }
  return false;
}

// ---------------------------------------------------------------------------
// 7. Derived Computations (Requirement 2)
// ---------------------------------------------------------------------------
export function getRetailerFinancials(
  invoices: RetailerInvoice[] = RETAILER_INVOICES,
  profile: RetailerProfile = RETAILER_PROFILE,
  today = getCurrentDate()
) {
  // Total Invoiced: sum of total bill amounts
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // Total Paid: sum of paid amounts
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid, 0);

  // Total Outstanding: sum of all unpaid balances (limit - available) = ₹54,200
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Overdue Amount: sum of balanceDue for invoices past due date = ₹31,000 (INV-0079)
  const overdueInvoices = invoices.filter(inv => {
    if (inv.balanceDue <= 0) return false;
    const days = getDaysUntil(inv.dueDate, today);
    return days < 0 || inv.status === "Overdue";
  });
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Next Due Invoice: earliest upcoming invoice with balanceDue > 0
  const pendingInvoices = invoices.filter(inv => inv.balanceDue > 0);
  // Sort pending by due date ascending
  const sortedPending = [...pendingInvoices].sort((a, b) => {
    return parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime();
  });

  // Next due invoice (non-overdue if possible, or earliest upcoming)
  const upcomingInvoices = sortedPending.filter(inv => getDaysUntil(inv.dueDate, today) >= 0);
  const nextDueInvoice = upcomingInvoices[0] || sortedPending[0] || null;
  const nextDueAmount = nextDueInvoice ? nextDueInvoice.balanceDue : 0;
  const nextDueDate = nextDueInvoice ? nextDueInvoice.dueDate : "—";
  const nextDueInvoiceNumber = nextDueInvoice ? nextDueInvoice.invoiceNumber : "";
  const nextDueDays = nextDueInvoice ? getDaysUntil(nextDueInvoice.dueDate, today) : 0;

  // Available Credit: limit - outstanding = 1,50,000 - 54,200 = 95,800
  const availableCredit = Math.max(0, profile.creditLimit - totalOutstanding);

  // Credit %
  const availableCreditPercent = Math.round((availableCredit / profile.creditLimit) * 100);
  const usedCreditPercent = 100 - availableCreditPercent;

  return {
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    overdueAmount,
    overdueInvoices,
    nextDueInvoice,
    nextDueAmount,
    nextDueDate,
    nextDueInvoiceNumber,
    nextDueDays,
    nextDueBadge: formatDueInDays(nextDueDays),
    availableCredit,
    availableCreditPercent,
    usedCreditPercent,
    creditLimit: profile.creditLimit,
  };
}

export function getRetailerOrderMetrics(orders: RetailerOrder[] = RETAILER_ORDERS) {
  const draftOrders = orders.filter(o => o.status === "Draft");
  const inReviewOrders = orders.filter(
    o => o.status === "Submitted" || o.status === "Approved" || o.status === "Processing" || o.status === "Confirmed"
  );
  const dispatchedOrders = orders.filter(o => o.status === "Dispatched");
  const deliveredOrders = orders.filter(o => o.status === "Delivered");

  // The primary dispatched order for LR tracking
  const activeDispatchedOrder = dispatchedOrders[0] || null;

  return {
    draftCount: draftOrders.length,
    inReviewCount: inReviewOrders.length,
    dispatchedCount: dispatchedOrders.length,
    deliveredCount: deliveredOrders.length,
    totalOrdersCount: orders.length,
    activeDispatchedOrder,
    dispatchedTransporter: activeDispatchedOrder?.transporter || "Navata Road Transport",
    dispatchedLR: activeDispatchedOrder?.lrNumber || "NRT-77492-SDP",
  };
}
