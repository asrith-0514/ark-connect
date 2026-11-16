// Retailer Relationship Management (CRM) Seed Data
// Deterministic 12-month purchase history, communications, complaints, follow-ups, and retailer requests

import {
  Order,
  OrderItem,
  Employee,
  CommunicationLogEntry,
  Complaint,
  FollowUp,
  RetailerRequest,
} from "./types";

// ============================================================================
// 1. EMPLOYEES DIRECTORY
// ============================================================================
export const MOCK_EMPLOYEES: Employee[] = [
  { id: "emp-1", name: "Anand Sharma", role: "sales", phone: "+91 98480 12345", email: "anand.s@arkdist.in" },
  { id: "emp-2", name: "Sunita Rao", role: "accountant", phone: "+91 94401 67890", email: "sunita.r@arkdist.in" },
  { id: "emp-3", name: "Rajesh Patel", role: "manager", phone: "+91 98660 34567", email: "rajesh.p@arkdist.in" },
  { id: "emp-4", name: "Ramesh Verma", role: "sales", phone: "+91 94902 89012", email: "ramesh.v@arkdist.in" },
  { id: "emp-5", name: "Vikram Ark", role: "owner", phone: "+91 98491 56789", email: "vikram@arkdist.in" },
];

// Product Templates
const PRODUCTS = {
  fbAnkle: {
    productId: "prod-flybirds-leg-ankle",
    productTitle: "Flybirds Ankle leggings",
    artNumber: "FB-LEG-ANKLE",
    brand: "Flybirds",
    color: "Classic White",
    colorHex: "#ffffff",
    size: "Free Size",
    rate: 325,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6"
  },
  fbFull: {
    productId: "prod-flybirds-leg-full",
    productTitle: "Flybirds Full length leggings",
    artNumber: "FB-LEG-FULL",
    brand: "Flybirds",
    color: "Jet Black",
    colorHex: "#0f172a",
    size: "XL",
    rate: 350,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6"
  },
  fbKurti: {
    productId: "prod-flybirds-leg-kurti",
    productTitle: "Flybirds Kurti pant",
    artNumber: "FB-LEG-KURTI",
    brand: "Flybirds",
    color: "Ink Navy",
    colorHex: "#1e3a8a",
    size: "Free Size",
    rate: 348.97,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6"
  },
  fbSaree: {
    productId: "prod-flybirds-leg-saree",
    productTitle: "Flybirds Saree shaper",
    artNumber: "FB-LEG-SAREE",
    brand: "Flybirds",
    color: "Maroon",
    colorHex: "#881337",
    size: "Free Size",
    rate: 400,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6"
  },
  wnClara: {
    productId: "prod-within-bra-clara",
    productTitle: "Within Clara",
    artNumber: "WN-BRA-CLARA",
    brand: "Within",
    color: "Basic Colour Mix (BCM)",
    colorHex: "#3b82f6",
    size: "34",
    rate: 505.5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5"
  },
  wnFemina: {
    productId: "prod-within-bra-femina",
    productTitle: "Within Femina premium",
    artNumber: "WN-BRA-FEMINA",
    brand: "Within",
    color: "Light Colour Mix (LCM)",
    colorHex: "#93c5fd",
    size: "36",
    rate: 520,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5"
  },
  wnBlooms: {
    productId: "prod-within-pan-blooms",
    productTitle: "Within Aaina blooms",
    artNumber: "WN-PAN-BLOOMS",
    brand: "Within",
    color: "Assorted Pastels",
    colorHex: "#f472b6",
    size: "M",
    rate: 608.65,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5"
  },
  wnAura: {
    productId: "prod-within-pan-aura",
    productTitle: "Within Aura print",
    artNumber: "WN-PAN-AURA",
    brand: "Within",
    color: "Assorted Prints",
    colorHex: "#ec4899",
    size: "L",
    rate: 590,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5"
  },
  as888: {
    productId: "prod-aswati-bra-888",
    productTitle: "Aswati Bra 888",
    artNumber: "AS-BRA-888",
    brand: "Aswati",
    color: "Black",
    colorHex: "#000000",
    size: "75-100",
    rate: 340,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU"
  },
  asKarishma: {
    productId: "prod-aswati-bra-karishma",
    productTitle: "Aswati Karishma",
    artNumber: "AS-BRA-KARISHMA",
    brand: "Aswati",
    color: "White",
    colorHex: "#ffffff",
    size: "75-90",
    rate: 364,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU"
  },
  asSweety: {
    productId: "prod-aswati-bra-sweety",
    productTitle: "Aswati Sweety adj",
    artNumber: "AS-BRA-SWEETY",
    brand: "Aswati",
    color: "Skin",
    colorHex: "#e7cba9",
    size: "75-90",
    rate: 364,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU"
  },
  iraPlain: {
    productId: "prod-ira-pet-plain",
    productTitle: "Ira Plain Petticoat",
    artNumber: "IRA-PET-PLAIN",
    brand: "Ira",
    color: "Assorted Shades",
    colorHex: "#94a3b8",
    size: "Free Size",
    rate: 280,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6"
  },
  jyoPlain: {
    productId: "prod-jyothika-pet-plain",
    productTitle: "Jyothika Plain Petticoat",
    artNumber: "JYO-PET-PLAIN",
    brand: "Jyothika",
    color: "Assorted Shades",
    colorHex: "#cbd5e1",
    size: "Free Size",
    rate: 275,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6"
  },
};

function item(template: any, units: number): OrderItem {
  return {
    ...template,
    units,
    totalPieces: units * 10,
  };
}

const APP_DATE = new Date("2026-11-12T00:00:00+05:30");

function subDays(d: Date, days: number): Date {
  const res = new Date(d.getTime());
  res.setDate(res.getDate() - days);
  return res;
}

function formatDateStr(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function createHistOrder(
  id: string,
  orderNumber: string,
  retId: string,
  retName: string,
  retTown: string,
  dateObj: Date,
  itemsList: OrderItem[]
): Order {
  const dateStr = formatDateStr(dateObj);
  const delivDateStr = formatDateStr(subDays(dateObj, -2));
  const totalBoxes = itemsList.reduce((s, it) => s + it.units, 0);
  const totalPieces = itemsList.reduce((s, it) => s + it.totalPieces, 0);
  const subtotal = Math.round(itemsList.reduce((s, it) => s + it.units * it.rate, 0) * 100) / 100;
  const gstAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const numSeed = 10000 + (Math.abs(id.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)) % 80000);

  return {
    id,
    orderNumber,
    retailerId: retId,
    retailerName: retName,
    retailerTown: retTown,
    date: dateStr,
    status: "Delivered",
    paymentStatus: "Paid",
    deliveryDate: delivDateStr,
    dispatchDate: dateStr,
    transporter: "Navata Road Transport",
    lrNumber: `NRT-${numSeed}-${retTown.slice(0, 3).toUpperCase()}`,
    totalBoxes,
    totalPieces,
    subtotal,
    gstAmount,
    grandTotal,
    items: itemsList,
  };
}

// ============================================================================
// 2. DETERMINISTIC 12-MONTH PURCHASE HISTORY GENERATOR
// ============================================================================
export function generateDeterministicHistoricalOrders(activeRetailersList: Array<{ id: string; name: string; town: string }>): Order[] {
  const orders: Order[] = [];
  let counter = 100;

  const champions = ["ret-1", "ret-2", "ret-5", "ret-26", "ret-27"];
  const newOnboarded = ["ret-3", "ret-15"];
  const atRisk = ["ret-6", "ret-10", "ret-12"];
  const dormant = ["ret-9", "ret-11", "ret-17", "ret-18", "ret-19", "ret-20"];

  activeRetailersList.forEach((ret) => {
    if (champions.includes(ret.id)) {
      // 10 orders across 12 months, 4 in last 90 days, high order value (>₹40k)
      const daysAgoList = [5, 20, 45, 70, 110, 145, 180, 220, 260, 310];
      daysAgoList.forEach((daysAgo) => {
        if (ret.id === "ret-1" && daysAgo === 20) return; // ret-1 already has ARK-8839 at 18 Oct
        counter++;
        const d = subDays(APP_DATE, daysAgo);
        const items = [
          item(PRODUCTS.wnClara, 35),
          item(PRODUCTS.fbAnkle, 40),
          item(PRODUCTS.asKarishma, 25),
        ];
        orders.push(createHistOrder(`ord-hist-${counter}`, `ARK-H${counter}`, ret.id, ret.name, ret.town, d, items));
      });
    } else if (newOnboarded.includes(ret.id)) {
      // 1-2 orders in last 45 days
      const daysAgoList = [15, 38];
      daysAgoList.forEach((daysAgo) => {
        counter++;
        const d = subDays(APP_DATE, daysAgo);
        const items = [
          item(PRODUCTS.fbAnkle, 20),
          item(PRODUCTS.iraPlain, 15),
        ];
        orders.push(createHistOrder(`ord-hist-${counter}`, `ARK-H${counter}`, ret.id, ret.name, ret.town, d, items));
      });
    } else if (atRisk.includes(ret.id)) {
      // Orders in months 3-12, but last order was 48-55 days ago. Last 90d spend is sharply down.
      const daysAgoList = [50, 75, 110, 135, 160, 200, 250];
      daysAgoList.forEach((daysAgo) => {
        counter++;
        const d = subDays(APP_DATE, daysAgo);
        const units = daysAgo < 90 ? 10 : 35;
        const items = [
          item(PRODUCTS.wnFemina, units),
          item(PRODUCTS.fbFull, units),
        ];
        orders.push(createHistOrder(`ord-hist-${counter}`, `ARK-H${counter}`, ret.id, ret.name, ret.town, d, items));
      });
    } else if (dormant.includes(ret.id)) {
      // 3 orders earlier in the year, last order > 60 days ago
      const daysAgoList = [75, 130, 210];
      daysAgoList.forEach((daysAgo) => {
        counter++;
        const d = subDays(APP_DATE, daysAgo);
        const items = [
          item(PRODUCTS.as888, 15),
          item(PRODUCTS.jyoPlain, 20),
        ];
        orders.push(createHistOrder(`ord-hist-${counter}`, `ARK-H${counter}`, ret.id, ret.name, ret.town, d, items));
      });
    } else {
      // Regular: 6 orders across 12 months, 2-3 in last 90 days
      const daysAgoList = [18, 55, 80, 120, 175, 240];
      daysAgoList.forEach((daysAgo) => {
        counter++;
        const d = subDays(APP_DATE, daysAgo);
        let items: OrderItem[] = [];
        if (ret.id === "ret-7") {
          // Buys Within bras only (cross-selling opportunity)
          items = [item(PRODUCTS.wnClara, 20), item(PRODUCTS.wnFemina, 15)];
        } else if (ret.id === "ret-14") {
          // Buys Flybirds leggings only (cross-selling opportunity)
          items = [item(PRODUCTS.fbAnkle, 25), item(PRODUCTS.fbKurti, 20)];
        } else {
          items = [item(PRODUCTS.fbAnkle, 15), item(PRODUCTS.asKarishma, 15)];
        }
        orders.push(createHistOrder(`ord-hist-${counter}`, `ARK-H${counter}`, ret.id, ret.name, ret.town, d, items));
      });
    }
  });

  return orders;
}

// ============================================================================
// 3. COMMUNICATION LOG ENTRIES (Distributor CRM)
// ============================================================================
export const MOCK_COMMUNICATION_LOGS: CommunicationLogEntry[] = [
  {
    id: "comm-1",
    retailerId: "ret-1",
    channel: "call",
    direction: "inbound",
    summary: "Narasimha Rao called regarding Diwali festive replenishment stock delivery date and cheque handover schedule.",
    createdBy: "Anand Sharma",
    createdAt: "2026-10-24T10:30:00Z",
  },
  {
    id: "comm-2",
    retailerId: "ret-1",
    channel: "whatsapp",
    direction: "outbound",
    summary: "Shared digital catalogue PDF and size card for Within Clara new BCM/DCM shade range with booking scheme.",
    createdBy: "Anand Sharma",
    createdAt: "2026-10-22T14:15:00Z",
  },
  {
    id: "comm-3",
    retailerId: "ret-1",
    channel: "visit",
    direction: "outbound",
    summary: "Store visit in Siddipet Main Bazaar. Verified front rack stocking of Flybirds leggings. Retailer requested 1.5L -> 2.5L credit limit.",
    createdBy: "Anand Sharma",
    createdAt: "2026-10-18T16:00:00Z",
  },
  {
    id: "comm-4",
    retailerId: "ret-1",
    channel: "note",
    direction: "inbound",
    summary: "Internal credit review: Excellent track record (92% on-time). Recommended approval of credit limit increase to ₹2,50,000.",
    createdBy: "Sunita Rao",
    createdAt: "2026-10-26T11:45:00Z",
  },
  {
    id: "comm-5",
    retailerId: "ret-1",
    channel: "ai-call",
    direction: "outbound",
    summary: "Automated delivery verification: Confirmed receipt of 120 boxes under Navata LR #NRT-77492 without transit shortage.",
    createdBy: "ARK AI Dispatch Assistant",
    createdAt: "2026-10-25T09:00:00Z",
  },
  {
    id: "comm-6",
    retailerId: "ret-2",
    channel: "call",
    direction: "outbound",
    summary: "Discussed introducing Within Aaina blooms panties range to pair with their regular Within Clara bra orders.",
    createdBy: "Anand Sharma",
    createdAt: "2026-10-21T11:20:00Z",
  },
  {
    id: "comm-7",
    retailerId: "ret-5",
    channel: "visit",
    direction: "outbound",
    summary: "Executive business review with Prabhakar garu in Hanamkonda. Discussed ₹1,90,000 overdue and agreed on two-installment clearance.",
    createdBy: "Vikram Ark",
    createdAt: "2026-10-20T17:30:00Z",
  },
  {
    id: "comm-8",
    retailerId: "ret-6",
    channel: "call",
    direction: "inbound",
    summary: "Rajeshwar reported 6-day delay by Navata transport in delivery of festive stock. Rajesh contacting hub manager.",
    createdBy: "Rajesh Patel",
    createdAt: "2026-11-04T12:00:00Z",
  },
  {
    id: "comm-9",
    retailerId: "ret-8",
    channel: "whatsapp",
    direction: "inbound",
    summary: "Inquired about rate difference on invoice INV-0078 for Aswati Karishma. Accountant verifying promo discount.",
    createdBy: "Sunita Rao",
    createdAt: "2026-11-06T15:20:00Z",
  },
  {
    id: "comm-10",
    retailerId: "ret-9",
    channel: "call",
    direction: "outbound",
    summary: "Re-engagement call (Dormant > 60d). Retailer mentioned road construction impacted footfall, promised new order next week.",
    createdBy: "Ramesh Verma",
    createdAt: "2026-11-02T10:15:00Z",
  },
];

// ============================================================================
// 4. COMPLAINTS TRACKER
// ============================================================================
export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: "comp-1",
    retailerId: "ret-1",
    type: "shortage",
    linkedOrderId: "ord-8839",
    status: "in-progress",
    assignee: "Rajesh Patel",
    notes: "Shortage of 2 boxes of Within Clara 34 in carton #2. Warehouse inspecting CCTV dispatch footage.",
    createdAt: "2026-10-20T10:00:00Z",
  },
  {
    id: "comp-2",
    retailerId: "ret-5",
    type: "defect",
    linkedOrderId: "ord-hist-115",
    status: "resolved",
    assignee: "Anand Sharma",
    notes: "4 pieces of Flybirds Saree shaper had waist stitch fraying. Credit note CN-0012 issued for ₹1,600.",
    createdAt: "2026-10-15T14:00:00Z",
    resolvedAt: "2026-10-18T16:30:00Z",
  },
  {
    id: "comp-3",
    retailerId: "ret-6",
    type: "delivery",
    linkedOrderId: "ord-hist-122",
    status: "open",
    assignee: "Rajesh Patel",
    notes: "Navata transport shipment delayed at Karimnagar local branch for 6 days. Transporter branch contacted.",
    createdAt: "2026-11-04T11:30:00Z",
  },
  {
    id: "comp-4",
    retailerId: "ret-8",
    type: "pricing",
    linkedInvoiceId: "INV-0078",
    status: "open",
    assignee: "Sunita Rao",
    notes: "Rate billed for Aswati Karishma was ₹364 instead of negotiated ₹350 festival price. Verifying approval slip.",
    createdAt: "2026-11-06T13:00:00Z",
  },
  {
    id: "comp-5",
    retailerId: "ret-12",
    type: "other",
    linkedOrderId: "ord-hist-135",
    status: "resolved",
    assignee: "Rajesh Patel",
    notes: "Carton outer strap loose on arrival. Internal innerwear boxes completely intact.",
    createdAt: "2026-10-02T09:00:00Z",
    resolvedAt: "2026-10-05T11:00:00Z",
  },
];

// ============================================================================
// 5. FOLLOW-UP TASKS
// ============================================================================
export const MOCK_FOLLOW_UPS: FollowUp[] = [
  // Today (2026-11-12)
  {
    id: "fu-1",
    retailerId: "ret-1",
    type: "payment",
    dueDate: "2026-11-12",
    assignedTo: "Sunita Rao",
    status: "open",
    promisedAmount: 23200,
    notes: "Call Narasimha Rao garu to confirm RTGS transfer of ₹23,200 for invoice INV-0091.",
    createdAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "fu-2",
    retailerId: "ret-5",
    type: "order",
    dueDate: "2026-11-12",
    assignedTo: "Anand Sharma",
    status: "open",
    notes: "Finalize replenishment order for Within Clara and Flybirds Ankle leggings.",
    createdAt: "2026-11-09T14:00:00Z",
  },
  // Missed (dueDate < 2026-11-12 && status: "open")
  {
    id: "fu-3",
    retailerId: "ret-6",
    type: "payment",
    dueDate: "2026-11-05",
    assignedTo: "Sunita Rao",
    status: "open",
    promisedAmount: 160000,
    notes: "Promised payment of ₹1,60,000 for overdue invoice INV-0070 was not received. Escalate to owner.",
    createdAt: "2026-10-28T11:00:00Z",
  },
  {
    id: "fu-4",
    retailerId: "ret-10",
    type: "complaint",
    dueDate: "2026-11-08",
    assignedTo: "Rajesh Patel",
    status: "open",
    notes: "Visit store or call to inspect transit carton damage claim.",
    createdAt: "2026-11-02T16:00:00Z",
  },
  {
    id: "fu-5",
    retailerId: "ret-8",
    type: "payment",
    dueDate: "2026-11-09",
    assignedTo: "Ramesh Verma",
    status: "open",
    promisedAmount: 100000,
    notes: "Cheque collection reminder for ₹1,00,000 overdue balance.",
    createdAt: "2026-11-03T10:00:00Z",
  },
  // Upcoming (dueDate > 2026-11-12)
  {
    id: "fu-6",
    retailerId: "ret-2",
    type: "order",
    dueDate: "2026-11-18",
    assignedTo: "Anand Sharma",
    status: "open",
    notes: "Pitch new Within Panties range (Aaina blooms, Aura print) during store visit.",
    createdAt: "2026-11-10T11:00:00Z",
  },
  {
    id: "fu-7",
    retailerId: "ret-4",
    type: "general",
    dueDate: "2026-11-20",
    assignedTo: "Sunita Rao",
    status: "open",
    notes: "Send monthly ledger reconciliation statement via WhatsApp.",
    createdAt: "2026-11-10T12:00:00Z",
  },
  {
    id: "fu-8",
    retailerId: "ret-26",
    type: "order",
    dueDate: "2026-11-25",
    assignedTo: "Vikram Ark",
    status: "open",
    notes: "Review wholesale seasonal booking and credit terms upgrade.",
    createdAt: "2026-11-11T15:00:00Z",
  },
  // Done
  {
    id: "fu-9",
    retailerId: "ret-1",
    type: "payment",
    dueDate: "2026-10-25",
    assignedTo: "Sunita Rao",
    status: "done",
    promisedAmount: 31000,
    notes: "Cheque received for ₹31,000. Reconciled.",
    createdAt: "2026-10-22T09:00:00Z",
  },
  {
    id: "fu-10",
    retailerId: "ret-5",
    type: "complaint",
    dueDate: "2026-10-18",
    assignedTo: "Anand Sharma",
    status: "done",
    notes: "Defective pieces replaced and credit note handed over in person.",
    createdAt: "2026-10-15T10:00:00Z",
  },
];

// ============================================================================
// 6. RETAILER REQUESTS (Raised from My Account)
// ============================================================================
export const MOCK_RETAILER_REQUESTS: RetailerRequest[] = [
  {
    id: "req-1",
    retailerId: "ret-1",
    type: "credit_limit",
    status: "pending",
    payload: {
      requestedCreditLimit: 250000,
      reason: "Expanding store display and pre-booking for wedding & festival season.",
    },
    createdAt: "2026-10-26T11:00:00Z",
  },
  {
    id: "req-2",
    retailerId: "ret-3",
    type: "address_change",
    status: "pending",
    payload: {
      address: "Shop 12-14, Ground Floor, Sri Venkateswara Complex, Main Road",
      town: "Rajahmundry",
      pincode: "533101",
      reason: "Relocated to larger premises next door.",
    },
    createdAt: "2026-10-24T09:30:00Z",
  },
  {
    id: "req-3",
    retailerId: "ret-7",
    type: "new_product",
    status: "pending",
    payload: {
      productName: "Within Sports Bra / Cotton Lycra Stretch",
      brand: "Within",
      category: "Bras",
      notes: "Heavy retail customer demand for activewear bra styles.",
    },
    createdAt: "2026-10-22T16:45:00Z",
  },
  {
    id: "req-4",
    retailerId: "ret-4",
    type: "credit_limit",
    status: "approved",
    payload: {
      requestedCreditLimit: 100000,
      reason: "Consistent monthly growth and zero payment defaults.",
    },
    createdAt: "2026-09-15T10:00:00Z",
    reviewedAt: "2026-09-18T14:00:00Z",
    reviewedBy: "Vikram Ark",
  },
];
