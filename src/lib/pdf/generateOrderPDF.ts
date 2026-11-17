// Real client-side Order PDF generator and Print utility for ARK Distributors
// Generates valid, standards-compliant PDF 1.4 documents natively without third-party dependencies,
// and provides instant browser print formatting for wholesale purchase orders.

import { Order, DISTRIBUTOR_GSTIN, formatINR } from "@/lib/mock";
import { RetailerPublicProfile } from "@/lib/mock/types";

// Helper for Indian numbering in words
function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
  }

  function convertThreeDigits(n: number): string {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      str += convertTwoDigits(n);
    }
    return str.trim();
  }

  const rounded = Math.round(num);
  let crore = Math.floor(rounded / 10000000);
  let rem = rounded % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem %= 100000;
  let thousand = Math.floor(rem / 1000);
  rem %= 1000;
  let hundred = rem;

  let words = "";
  if (crore > 0) words += convertThreeDigits(crore) + " Crore ";
  if (lakh > 0) words += convertThreeDigits(lakh) + " Lakh ";
  if (thousand > 0) words += convertThreeDigits(thousand) + " Thousand ";
  if (hundred > 0) words += convertThreeDigits(hundred);

  return words.trim() + " Rupees Only";
}

// Clean ASCII string for PDF stream (escape parentheses and backslashes)
function escapePdfText(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/₹/g, "INR ");
}

/**
 * Generates a standard PDF 1.4 binary blob for a Wholesale Order
 */
export function generateOrderPDFBlob(
  order: Order,
  retailerProfile?: RetailerPublicProfile
): Blob {
  const buyerGstin = retailerProfile?.gstin || "";
  const isIntraState = !order.retailerTown.includes("AP") && (!buyerGstin || buyerGstin.startsWith("36"));

  const subtotal = order.subtotal || order.items.reduce((sum, it) => sum + (it.units * it.rate), 0);
  const gstAmount = order.gstAmount || Math.round(subtotal * 0.05);
  const grandTotal = order.grandTotal || (subtotal + gstAmount);

  const cgst = isIntraState ? Math.round(gstAmount / 2) : 0;
  const sgst = isIntraState ? Math.round(gstAmount / 2) : 0;
  const igst = !isIntraState ? gstAmount : 0;

  const retailerName = order.retailerName || retailerProfile?.name || "Retail Partner";
  const retailerTown = order.retailerTown || retailerProfile?.town || "Telangana";
  const stateLabel = isIntraState ? "Telangana (36)" : "Andhra Pradesh (37)";

  // Build PDF Content stream
  const lines: string[] = [];

  // A4 page = 595.28 x 841.89 points
  // Top Header Banner
  lines.push("0.0 0.28 0.83 rg"); // Brand Blue #0047d3
  lines.push("0 820 595.28 22 re f");

  // Top Distributor Header
  lines.push("BT");
  lines.push("/F2 16 Tf");
  lines.push("0.0 0.28 0.83 rg");
  lines.push("40 780 Td");
  lines.push(`(${escapePdfText("ARK DISTRIBUTORS")}) Tj`);
  lines.push("ET");

  lines.push("BT");
  lines.push("/F1 9 Tf");
  lines.push("0.3 0.3 0.3 rg");
  lines.push("40 765 Td");
  lines.push(`(${escapePdfText("Wholesale Garments & Hosiery Distribution Hub")}) Tj`);
  lines.push("40 752 Td");
  lines.push(`(${escapePdfText("Secunderabad Central Complex, Telangana - 500003")}) Tj`);
  lines.push("40 739 Td");
  lines.push(`(${escapePdfText(`GSTIN: ${DISTRIBUTOR_GSTIN}  |  State: Telangana (36)`)}) Tj`);
  lines.push("ET");

  // Document Badge (PURCHASE ORDER VOUCHER)
  lines.push("0.95 0.96 0.98 rg");
  lines.push("370 725 185 65 re f");
  lines.push("0.8 0.85 0.9 RG 1 w");
  lines.push("370 725 185 65 re s");

  lines.push("BT");
  lines.push("/F2 11 Tf");
  lines.push("0.0 0.28 0.83 rg");
  lines.push("380 772 Td");
  lines.push(`(${escapePdfText("WHOLESALE PURCHASE ORDER")}) Tj`);
  lines.push("/F2 10 Tf");
  lines.push("0.1 0.1 0.2 rg");
  lines.push("380 757 Td");
  lines.push(`(${escapePdfText(`PO #: ${order.orderNumber}`)}) Tj`);
  lines.push("/F1 8 Tf");
  lines.push("0.3 0.3 0.3 rg");
  lines.push("380 745 Td");
  lines.push(`(${escapePdfText(`Date: ${order.date}`)}) Tj`);
  lines.push("380 734 Td");
  lines.push(`(${escapePdfText(`Status: ${order.status.toUpperCase()}`)}) Tj`);
  lines.push("ET");

  // Divider Line
  lines.push("0.85 0.85 0.88 RG 0.75 w");
  lines.push("40 715 m 555 715 l S");

  // Retailer / Consignee Box
  lines.push("0.97 0.98 0.99 rg");
  lines.push("40 635 250 70 re f");
  lines.push("0.88 0.9 0.93 RG 0.5 w");
  lines.push("40 635 250 70 re s");

  lines.push("BT");
  lines.push("/F2 8 Tf 0.5 0.5 0.5 rg");
  lines.push("48 693 Td (RETAILER / CONSIGNEE DETAILS) Tj");
  lines.push("/F2 10 Tf 0.1 0.1 0.1 rg");
  lines.push("48 679 Td");
  lines.push(`(${escapePdfText(retailerName)}) Tj`);
  lines.push("/F1 8 Tf 0.3 0.3 0.3 rg");
  lines.push("48 667 Td");
  lines.push(`(${escapePdfText(`Location: ${retailerTown}, ${stateLabel}`)}) Tj`);
  lines.push("48 655 Td");
  lines.push(`(${escapePdfText(`Retailer ID: ${order.retailerId || "RET-0001"}  |  GSTIN: ${buyerGstin || "Registered"}`)}) Tj`);
  lines.push("48 643 Td");
  lines.push(`(${escapePdfText(`Payment Terms: ${order.paymentStatus || "Credit Terms (30 Days)"}`)}) Tj`);
  lines.push("ET");

  // Dispatch & Logistics Box
  lines.push("0.97 0.98 0.99 rg");
  lines.push("305 635 250 70 re f");
  lines.push("0.88 0.9 0.93 RG 0.5 w");
  lines.push("305 635 250 70 re s");

  lines.push("BT");
  lines.push("/F2 8 Tf 0.5 0.5 0.5 rg");
  lines.push("313 693 Td (DISPATCH & LOGISTICS CONSIGNMENT) Tj");
  lines.push("/F1 8 Tf 0.3 0.3 0.3 rg");
  lines.push("313 679 Td");
  lines.push(`(${escapePdfText(`Transporter: ${order.transporter || "Navata Road Transport"}`)}) Tj`);
  lines.push("313 667 Td");
  lines.push(`(${escapePdfText(`LR #: ${order.lrNumber || "Pending Lorry Allocation"}`)}) Tj`);
  lines.push("313 655 Td");
  lines.push(`(${escapePdfText(`e-Way Bill: ${order.ewayBill || "Auto on dispatch"}`)}) Tj`);
  lines.push("313 643 Td");
  lines.push(`(${escapePdfText(`Dispatch Date: ${order.dispatchDate || order.date}`)}) Tj`);
  lines.push("ET");

  // Table Header
  const tableTop = 615;
  lines.push("0.0 0.28 0.83 rg");
  lines.push(`40 ${tableTop - 20} 515 20 re f`);

  lines.push("BT");
  lines.push("/F2 8 Tf 1 1 1 rg");
  lines.push(`48 ${tableTop - 14} Td (S.No) Tj`);
  lines.push(`75 ${tableTop - 14} Td (Item Description & Brand) Tj`);
  lines.push(`270 ${tableTop - 14} Td (Shade / Color) Tj`);
  lines.push(`350 ${tableTop - 14} Td (Size) Tj`);
  lines.push(`390 ${tableTop - 14} Td (Boxes) Tj`);
  lines.push(`435 ${tableTop - 14} Td (Rate/Bx) Tj`);
  lines.push(`495 ${tableTop - 14} Td (Amount) Tj`);
  lines.push("ET");

  // Line items
  let curY = tableTop - 20;
  const items = order.items && order.items.length > 0 ? order.items : [];

  items.forEach((item, index) => {
    curY -= 22;
    if (index % 2 === 1) {
      lines.push("0.97 0.98 0.99 rg");
      lines.push(`40 ${curY} 515 22 re f`);
    }

    lines.push("0.9 0.9 0.9 RG 0.5 w");
    lines.push(`40 ${curY} m 555 ${curY} l S`);

    const title = `${item.brand} #${item.artNumber} - ${(item.productTitle || item.productName || "Leggings").slice(0, 24)}`;
    const lineAmount = item.units * item.rate;

    lines.push("BT");
    lines.push("/F1 8 Tf 0.2 0.2 0.2 rg");
    lines.push(`48 ${curY + 6} Td (${index + 1}) Tj`);
    lines.push("/F2 8 Tf 0.1 0.1 0.1 rg");
    lines.push(`75 ${curY + 6} Td (${escapePdfText(title)}) Tj`);
    lines.push("/F1 8 Tf 0.3 0.3 0.3 rg");
    lines.push(`270 ${curY + 6} Td (${escapePdfText((item.color || "Assorted").slice(0, 14))}) Tj`);
    lines.push(`350 ${curY + 6} Td (${escapePdfText((item.size || "Free Size").slice(0, 8))}) Tj`);
    lines.push("/F2 8 Tf 0.1 0.1 0.1 rg");
    lines.push(`395 ${curY + 6} Td (${item.units}) Tj`);
    lines.push("/F1 8 Tf 0.2 0.2 0.2 rg");
    lines.push(`435 ${curY + 6} Td (${escapePdfText(formatINR(item.rate))}) Tj`);
    lines.push("/F2 8 Tf 0.1 0.1 0.1 rg");
    lines.push(`495 ${curY + 6} Td (${escapePdfText(formatINR(lineAmount))}) Tj`);
    lines.push("ET");
  });

  // Table Outer Border
  lines.push("0.8 0.82 0.85 RG 0.75 w");
  lines.push(`40 ${curY} 515 ${tableTop - curY} re s`);

  // Summary Totals Section
  const totalsTop = curY - 15;
  const totalBoxWidth = 200;
  const totalBoxLeft = 355;

  // Amount in words box on left
  lines.push("0.97 0.98 0.99 rg");
  lines.push(`40 ${totalsTop - 85} 295 85 re f`);
  lines.push("0.85 0.88 0.9 RG 0.5 w");
  lines.push(`40 ${totalsTop - 85} 295 85 re s`);

  lines.push("BT");
  lines.push("/F2 8 Tf 0.5 0.5 0.5 rg");
  lines.push(`48 ${totalsTop - 14} Td (ORDER TOTAL IN WORDS) Tj`);
  lines.push("/F2 8 Tf 0.1 0.1 0.2 rg");
  lines.push(`48 ${totalsTop - 28} Td (${escapePdfText(numberToWordsINR(grandTotal))}) Tj`);
  lines.push("/F1 7.5 Tf 0.4 0.4 0.4 rg");
  lines.push(`48 ${totalsTop - 44} Td (Total Box Units: ${order.totalBoxes} Boxes  |  Total Pieces: ${order.totalPieces} Pcs) Tj`);
  lines.push(`48 ${totalsTop - 56} Td (Dispatch Point: ARK Secunderabad Central Textile Warehouse) Tj`);
  lines.push(`48 ${totalsTop - 68} Td (Settlement: Standard Wholesale Credit Ledger Terms) Tj`);
  lines.push(`48 ${totalsTop - 80} Td (Goods inspection verified before lorry loading.) Tj`);
  lines.push("ET");

  // Totals Breakdown Table on Right
  lines.push("0.98 0.99 1.0 rg");
  lines.push(`${totalBoxLeft} ${totalsTop - 85} ${totalBoxWidth} 85 re f`);
  lines.push("0.8 0.85 0.9 RG 0.75 w");
  lines.push(`${totalBoxLeft} ${totalsTop - 85} ${totalBoxWidth} 85 re s`);

  lines.push("BT");
  lines.push("/F1 8 Tf 0.3 0.3 0.3 rg");
  lines.push(`${totalBoxLeft + 10} ${totalsTop - 14} Td (Subtotal (excl. GST):) Tj`);
  lines.push(`${totalBoxLeft + 130} ${totalsTop - 14} Td (${escapePdfText(formatINR(subtotal))}) Tj`);

  if (isIntraState) {
    lines.push(`${totalBoxLeft + 10} ${totalsTop - 32} Td (CGST (2.5%):) Tj`);
    lines.push(`${totalBoxLeft + 130} ${totalsTop - 32} Td (${escapePdfText(formatINR(cgst))}) Tj`);

    lines.push(`${totalBoxLeft + 10} ${totalsTop - 46} Td (SGST (2.5%):) Tj`);
    lines.push(`${totalBoxLeft + 130} ${totalsTop - 46} Td (${escapePdfText(formatINR(sgst))}) Tj`);
  } else {
    lines.push(`${totalBoxLeft + 10} ${totalsTop - 38} Td (IGST (5.0%):) Tj`);
    lines.push(`${totalBoxLeft + 130} ${totalsTop - 38} Td (${escapePdfText(formatINR(igst))}) Tj`);
  }
  lines.push("ET");

  // Grand Total Solid Row
  lines.push("0.0 0.28 0.83 rg");
  lines.push(`${totalBoxLeft} ${totalsTop - 85} ${totalBoxWidth} 20 re f`);

  lines.push("BT");
  lines.push("/F2 9 Tf 1 1 1 rg");
  lines.push(`${totalBoxLeft + 10} ${totalsTop - 77} Td (Grand Total:) Tj`);
  lines.push(`${totalBoxLeft + 125} ${totalsTop - 77} Td (${escapePdfText(formatINR(grandTotal))}) Tj`);
  lines.push("ET");

  // Footer Disclaimer
  lines.push("BT");
  lines.push("/F1 7.5 Tf 0.5 0.5 0.5 rg");
  lines.push("40 45 Td");
  lines.push(`(${escapePdfText("This is an official wholesale purchase order voucher generated by ARK Connect.")}) Tj`);
  lines.push("40 33 Td");
  lines.push(`(${escapePdfText("ARK Distributors Wholesale Operations  *  Secunderabad Central Textile Depot")}) Tj`);
  lines.push("/F2 7.5 Tf 0.2 0.2 0.2 rg");
  lines.push("450 33 Td");
  lines.push(`(${escapePdfText("Warehouse Staging / Manager Seal")}) Tj`);
  lines.push("ET");

  const streamContent = lines.join("\n");
  const streamLength = new TextEncoder().encode(streamContent).length;

  let pdfString = "%PDF-1.4\n";
  const offsets: number[] = [];

  function addObj(objContent: string) {
    offsets.push(new TextEncoder().encode(pdfString).length);
    pdfString += objContent + "\n";
  }

  // 1. Catalog
  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  // 2. Pages
  addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  // 3. Page
  addObj(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj"
  );
  // 4. Contents Stream
  addObj(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);
  // 5. Regular Font (Helvetica)
  addObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
  // 6. Bold Font (Helvetica-Bold)
  addObj("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");

  const xrefOffset = new TextEncoder().encode(pdfString).length;
  pdfString += "xref\n0 7\n0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    pdfString += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdfString += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdfString], { type: "application/pdf" });
}

/**
 * Downloads a standard PDF 1.4 document of the order
 */
export function downloadOrderPDF(
  order: Order,
  retailerProfile?: RetailerPublicProfile
): void {
  const blob = generateOrderPDFBlob(order, retailerProfile);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `ARK_Order_${order.orderNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Triggers clean, print-optimized document printing for wholesale orders
 */
export function printOrder(
  order: Order,
  retailerProfile?: RetailerPublicProfile
): void {
  const subtotal = order.subtotal || order.items.reduce((sum, it) => sum + (it.units * it.rate), 0);
  const gstAmount = order.gstAmount || Math.round(subtotal * 0.05);
  const grandTotal = order.grandTotal || (subtotal + gstAmount);
  const words = numberToWordsINR(grandTotal);

  const isIntraState = !order.retailerTown.includes("AP");
  const cgst = isIntraState ? Math.round(gstAmount / 2) : 0;
  const sgst = isIntraState ? Math.round(gstAmount / 2) : 0;
  const igst = !isIntraState ? gstAmount : 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Wholesale Order #${order.orderNumber} - ARK Distributors</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-bar {
      height: 6px;
      background: #0047d3;
      border-radius: 3px;
      margin-bottom: 12px;
    }
    .top-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0047d3;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #475569;
      margin: 0 0 2px 0;
      font-weight: 500;
    }
    .po-badge {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      text-align: right;
      min-width: 220px;
    }
    .po-badge h2 {
      margin: 0 0 4px 0;
      font-size: 15px;
      color: #0047d3;
      font-weight: 800;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 8px;
      background: #e0e7ff;
      color: #1e40af;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .info-box-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .info-label {
      color: #64748b;
    }
    .info-val {
      font-weight: 600;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background: #0047d3;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
    }
    th.text-right, td.text-right {
      text-align: right;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .totals-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .words-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .totals-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .grand-total-row {
      background: #0047d3;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
    }
    .footer-section {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #64748b;
      font-size: 10px;
    }
    .sign-box {
      text-align: right;
      padding-top: 36px;
      border-top: 1px dashed #94a3b8;
      min-width: 160px;
      font-weight: 600;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="header-bar"></div>
  
  <div class="top-section">
    <div>
      <h1 class="brand-title">ARK DISTRIBUTORS</h1>
      <div class="brand-subtitle">Wholesale Garments &amp; Hosiery Distribution Hub</div>
      <div class="brand-subtitle">Secunderabad Central Complex, Telangana - 500003</div>
      <div class="brand-subtitle"><strong>GSTIN:</strong> ${DISTRIBUTOR_GSTIN} &nbsp;|&nbsp; <strong>State:</strong> Telangana (36)</div>
    </div>
    <div class="po-badge">
      <h2>PURCHASE ORDER</h2>
      <div class="badge-status">${order.status}</div>
      <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 4px;">#${order.orderNumber}</div>
      <div style="font-size: 10px; color: #64748b;">Date: ${order.date}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Retailer / Consignee Details</div>
      <div class="info-row"><span class="info-label">Store:</span><span class="info-val">${order.retailerName}</span></div>
      <div class="info-row"><span class="info-label">Location:</span><span class="info-val">${order.retailerTown}, ${order.retailerTown.includes("AP") ? "Andhra Pradesh (37)" : "Telangana (36)"}</span></div>
      <div class="info-row"><span class="info-label">Retailer Code:</span><span class="info-val">${order.retailerId || "RET-0001"}</span></div>
      <div class="info-row"><span class="info-label">Payment Terms:</span><span class="info-val">${order.paymentStatus || "Credit Terms (30 Days Net)"}</span></div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Logistics &amp; Lorry Consignment</div>
      <div class="info-row"><span class="info-label">Transporter:</span><span class="info-val">${order.transporter || "Navata Road Transport"}</span></div>
      <div class="info-row"><span class="info-label">LR Number:</span><span class="info-val" style="color: #0047d3;">${order.lrNumber || "Pending Dispatch Allocation"}</span></div>
      <div class="info-row"><span class="info-label">e-Way Bill:</span><span class="info-val">${order.ewayBill || "Auto on dispatch"}</span></div>
      <div class="info-row"><span class="info-label">Dispatch Point:</span><span class="info-val">Secunderabad Central Warehouse</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px;">#</th>
        <th>Article &amp; Description</th>
        <th>Brand</th>
        <th>Shade / Color</th>
        <th>Size</th>
        <th class="text-right">Boxes</th>
        <th class="text-right">Total Pcs</th>
        <th class="text-right">Rate/Bx</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>#${item.artNumber}</strong> - ${item.productTitle || item.productName || "Leggings"}</td>
          <td>${item.brand}</td>
          <td>${item.color || "Assorted"}</td>
          <td>${item.size || "Free Size"}</td>
          <td class="text-right" style="font-weight: 700;">${item.units} bx</td>
          <td class="text-right">${item.totalPieces} pcs</td>
          <td class="text-right">₹${item.rate}</td>
          <td class="text-right" style="font-weight: 700;">₹${(item.units * item.rate).toLocaleString("en-IN")}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="totals-grid">
    <div class="words-box">
      <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
        Amount in Words:
      </div>
      <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">
        ${words}
      </div>
      <div style="font-size: 10px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 6px;">
        <strong>Total Order Quantities:</strong> ${order.totalBoxes} Boxes (${order.totalPieces} Pieces)<br/>
        <strong>Dispatch Staging:</strong> Bales bundled and inspected at Secunderabad Hub.
      </div>
    </div>

    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal (excl. GST):</span>
        <span style="font-weight: 600;">₹${subtotal.toLocaleString("en-IN")}</span>
      </div>
      ${isIntraState ? `
        <div class="totals-row">
          <span>CGST (2.5%):</span>
          <span>₹${cgst.toLocaleString("en-IN")}</span>
        </div>
        <div class="totals-row">
          <span>SGST (2.5%):</span>
          <span>₹${sgst.toLocaleString("en-IN")}</span>
        </div>
      ` : `
        <div class="totals-row">
          <span>IGST (5.0%):</span>
          <span>₹${igst.toLocaleString("en-IN")}</span>
        </div>
      `}
      <div class="grand-total-row">
        <span>Grand Total:</span>
        <span>₹${grandTotal.toLocaleString("en-IN")}</span>
      </div>
    </div>
  </div>

  <div class="footer-section">
    <div>
      Certified that the particulars given above are true and correct.<br/>
      ARK Distributors Wholesale Garments Hub &bull; Secunderabad, Telangana.
    </div>
    <div class="sign-box">
      Authorized Signatory / Warehouse Seal
    </div>
  </div>
</body>
</html>
  `;

  // Create an iframe to print cleanly without leaving the current screen
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: new window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 400);
}
