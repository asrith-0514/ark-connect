// Real client-side PDF generator for ARK Distributors & ARK Connect
// Generates valid, standards-compliant PDF 1.4 documents natively without third-party bloat.

import { Invoice, DISTRIBUTOR_GSTIN, formatINR } from "@/lib/mock";
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

export function generateInvoicePDFBlob(
  invoice: Invoice,
  retailerProfile?: RetailerPublicProfile
): Blob {
  const buyerGstin = invoice.retailerGstin || retailerProfile?.gstin || "";
  const isIntraState = !buyerGstin || buyerGstin.startsWith("36");

  const subtotal = invoice.subtotal || invoice.items.reduce((sum, it) => sum + it.amount, 0);
  const discount = invoice.discount || 0;
  const taxableValue = invoice.taxableValue || Math.max(0, subtotal - discount);

  const cgst = isIntraState ? invoice.cgstAmount || Math.round(taxableValue * 0.025 * 100) / 100 : 0;
  const sgst = isIntraState ? invoice.sgstAmount || Math.round(taxableValue * 0.025 * 100) / 100 : 0;
  const igst = !isIntraState ? invoice.igstAmount || Math.round(taxableValue * 0.05 * 100) / 100 : 0;
  const grandTotal = invoice.grandTotal || invoice.total || (taxableValue + cgst + sgst + igst);

  const retailerName = invoice.retailerName || retailerProfile?.name || "Retail Partner";
  const retailerTown = invoice.retailerTown || retailerProfile?.town || "Siddipet";
  const stateLabel = isIntraState ? "Telangana (36)" : "Andhra Pradesh (37)";
  const placeOfSupply = isIntraState
    ? "Telangana (36) [Intra-state Supply]"
    : "Andhra Pradesh (37) [Inter-state Supply]";

  // Build PDF Content stream
  const lines: string[] = [];

  // Coordinate system: A4 page = 595.28 x 841.89 points
  // Origin (0, 0) is bottom-left; top is y=841.89

  // Header Blue Ribbon (top bar)
  lines.push("0.0 0.28 0.83 rg"); // Brand Blue #0047d3
  lines.push("0 820 595.28 22 re f");

  // Top Title
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

  // Document Badge (TAX INVOICE)
  lines.push("0.95 0.96 0.98 rg");
  lines.push("380 730 175 60 re f");
  lines.push("0.8 0.85 0.9 RG 1 w");
  lines.push("380 730 175 60 re s");

  lines.push("BT");
  lines.push("/F2 12 Tf");
  lines.push("0.1 0.1 0.2 rg");
  lines.push("390 772 Td");
  lines.push(`(${escapePdfText("TAX INVOICE")}) Tj`);
  lines.push("/F2 9 Tf");
  lines.push("0.0 0.28 0.83 rg");
  lines.push("390 758 Td");
  lines.push(`(${escapePdfText(`Invoice: ${invoice.invoiceNumber}`)}) Tj`);
  lines.push("/F1 8 Tf");
  lines.push("0.3 0.3 0.3 rg");
  lines.push("390 746 Td");
  lines.push(`(${escapePdfText(`Date: ${invoice.billedDate || invoice.date || "24 Oct 2026"}`)}) Tj`);
  lines.push("390 736 Td");
  lines.push(`(${escapePdfText(`Due Date: ${invoice.dueDate || "23 Nov 2026"}`)}) Tj`);
  lines.push("ET");

  // Divider Line
  lines.push("0.85 0.85 0.88 RG 0.75 w");
  lines.push("40 715 m 555 715 l S");

  // Billed To & Supply Information Box
  lines.push("0.97 0.98 0.99 rg");
  lines.push("40 635 250 70 re f");
  lines.push("0.88 0.9 0.93 RG 0.5 w");
  lines.push("40 635 250 70 re s");

  lines.push("BT");
  lines.push("/F2 8 Tf 0.5 0.5 0.5 rg");
  lines.push("48 693 Td (BILLED TO / BUYER) Tj");
  lines.push("/F2 10 Tf 0.1 0.1 0.1 rg");
  lines.push("48 679 Td");
  lines.push(`(${escapePdfText(retailerName)}) Tj`);
  lines.push("/F1 8 Tf 0.3 0.3 0.3 rg");
  lines.push("48 667 Td");
  lines.push(`(${escapePdfText(`${retailerTown}, ${stateLabel}`)}) Tj`);
  lines.push("48 655 Td");
  lines.push(`(${escapePdfText(`GSTIN: ${buyerGstin || "Unregistered"}`)}) Tj`);
  lines.push("48 643 Td");
  lines.push(`(${escapePdfText(`Order Reference: #${invoice.orderNumber || "ARK-PO"}`)}) Tj`);
  lines.push("ET");

  // Dispatch & Supply box
  lines.push("0.97 0.98 0.99 rg");
  lines.push("305 635 250 70 re f");
  lines.push("0.88 0.9 0.93 RG 0.5 w");
  lines.push("305 635 250 70 re s");

  lines.push("BT");
  lines.push("/F2 8 Tf 0.5 0.5 0.5 rg");
  lines.push("313 693 Td (DISPATCH & SUPPLY DETAILS) Tj");
  lines.push("/F1 8 Tf 0.3 0.3 0.3 rg");
  lines.push("313 679 Td");
  lines.push(`(${escapePdfText(`Place of Supply: ${placeOfSupply}`)}) Tj`);
  lines.push("313 667 Td");
  lines.push(`(${escapePdfText("Transporter: Navata Road Transport (NRT-77492)")}) Tj`);
  lines.push("313 655 Td");
  lines.push(`(${escapePdfText(`Credit Terms: ${invoice.creditDays || 30} Days Net`)}) Tj`);
  lines.push("313 643 Td");
  lines.push(`(${escapePdfText(`Payment Status: ${invoice.status || "Issued"}`)}) Tj`);
  lines.push("ET");

  // Line Items Table Header
  const tableTop = 615;
  lines.push("0.0 0.28 0.83 rg");
  lines.push(`40 ${tableTop - 20} 515 20 re f`);

  lines.push("BT");
  lines.push("/F2 8 Tf 1 1 1 rg");
  lines.push(`48 ${tableTop - 14} Td (S.No) Tj`);
  lines.push(`80 ${tableTop - 14} Td (Item Description & Brand) Tj`);
  lines.push(`300 ${tableTop - 14} Td (HSN) Tj`);
  lines.push(`360 ${tableTop - 14} Td (Boxes) Tj`);
  lines.push(`420 ${tableTop - 14} Td (Wholesale Rate) Tj`);
  lines.push(`495 ${tableTop - 14} Td (Amount) Tj`);
  lines.push("ET");

  // Line Items Rows
  let curY = tableTop - 20;
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      description: "Wholesale Hosiery Assortment",
      variant: "Standard Pack",
      brand: "Flybirds",
      hsn: "61091000",
      boxes: 50,
      rate: 325,
      amount: 16250,
    },
  ];

  items.forEach((item, index) => {
    curY -= 22;
    // Row background zebra stripe
    if (index % 2 === 1) {
      lines.push("0.97 0.98 0.99 rg");
      lines.push(`40 ${curY} 515 22 re f`);
    }

    // Border bottom
    lines.push("0.9 0.9 0.9 RG 0.5 w");
    lines.push(`40 ${curY} m 555 ${curY} l S`);

    lines.push("BT");
    lines.push("/F1 8 Tf 0.2 0.2 0.2 rg");
    lines.push(`48 ${curY + 6} Td (${index + 1}) Tj`);
    lines.push("/F2 8 Tf 0.1 0.1 0.1 rg");
    lines.push(`80 ${curY + 6} Td (${escapePdfText(item.description.slice(0, 36))}) Tj`);
    lines.push("/F1 8 Tf 0.4 0.4 0.4 rg");
    lines.push(`300 ${curY + 6} Td (${escapePdfText(item.hsn || "61091000")}) Tj`);
    lines.push("/F2 8 Tf 0.1 0.1 0.1 rg");
    lines.push(`365 ${curY + 6} Td (${item.boxes}) Tj`);
    lines.push("/F1 8 Tf 0.2 0.2 0.2 rg");
    lines.push(`420 ${curY + 6} Td (${escapePdfText(formatINR(item.rate))}) Tj`);
    lines.push("/F2 8 Tf 0.1 0.1 0.1 rg");
    lines.push(`495 ${curY + 6} Td (${escapePdfText(formatINR(item.amount))}) Tj`);
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
  lines.push(`48 ${totalsTop - 14} Td (INVOICE AMOUNT IN WORDS) Tj`);
  lines.push("/F2 8 Tf 0.1 0.1 0.2 rg");
  lines.push(`48 ${totalsTop - 28} Td (${escapePdfText(numberToWordsINR(grandTotal))}) Tj`);
  lines.push("/F1 7.5 Tf 0.4 0.4 0.4 rg");
  lines.push(`48 ${totalsTop - 44} Td (Bank: HDFC Bank, Secunderabad Main Branch) Tj`);
  lines.push(`48 ${totalsTop - 54} Td (A/C: 50200084920194  |  IFSC: HDFC0000128) Tj`);
  lines.push(`48 ${totalsTop - 66} Td (UPI ID: arkdistributors@hdfcbank) Tj`);
  lines.push(`48 ${totalsTop - 78} Td (Terms: 30 Days Net from date of invoice.) Tj`);
  lines.push("ET");

  // Totals Breakdown Table on Right
  lines.push("0.98 0.99 1.0 rg");
  lines.push(`${totalBoxLeft} ${totalsTop - 85} ${totalBoxWidth} 85 re f`);
  lines.push("0.8 0.85 0.9 RG 0.75 w");
  lines.push(`${totalBoxLeft} ${totalsTop - 85} ${totalBoxWidth} 85 re s`);

  lines.push("BT");
  lines.push("/F1 8 Tf 0.3 0.3 0.3 rg");
  lines.push(`${totalBoxLeft + 10} ${totalsTop - 14} Td (Subtotal:) Tj`);
  lines.push(`${totalBoxLeft + 130} ${totalsTop - 14} Td (${escapePdfText(formatINR(subtotal))}) Tj`);

  if (discount > 0) {
    lines.push(`${totalBoxLeft + 10} ${totalsTop - 26} Td (Discount:) Tj`);
    lines.push(`${totalBoxLeft + 130} ${totalsTop - 26} Td (-${escapePdfText(formatINR(discount))}) Tj`);
  }

  lines.push(`${totalBoxLeft + 10} ${totalsTop - 36} Td (Taxable Value:) Tj`);
  lines.push(`${totalBoxLeft + 130} ${totalsTop - 36} Td (${escapePdfText(formatINR(taxableValue))}) Tj`);

  if (isIntraState) {
    lines.push(`${totalBoxLeft + 10} ${totalsTop - 48} Td (CGST (2.5%):) Tj`);
    lines.push(`${totalBoxLeft + 130} ${totalsTop - 48} Td (${escapePdfText(formatINR(cgst))}) Tj`);

    lines.push(`${totalBoxLeft + 10} ${totalsTop - 60} Td (SGST (2.5%):) Tj`);
    lines.push(`${totalBoxLeft + 130} ${totalsTop - 60} Td (${escapePdfText(formatINR(sgst))}) Tj`);
  } else {
    lines.push(`${totalBoxLeft + 10} ${totalsTop - 54} Td (IGST (5.0%):) Tj`);
    lines.push(`${totalBoxLeft + 130} ${totalsTop - 54} Td (${escapePdfText(formatINR(igst))}) Tj`);
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
  lines.push(`(${escapePdfText("Certified that the particulars given above are true and correct. Computer-generated tax invoice.")}) Tj`);
  lines.push("40 33 Td");
  lines.push(`(${escapePdfText("ARK Distributors Wholesale Operations  *  Hyderabad / Secunderabad Hub")}) Tj`);
  lines.push("/F2 7.5 Tf 0.2 0.2 0.2 rg");
  lines.push("460 33 Td");
  lines.push(`(${escapePdfText("Authorized Signatory")}) Tj`);
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

export function downloadInvoicePDF(
  invoice: Invoice,
  retailerProfile?: RetailerPublicProfile
): void {
  const blob = generateInvoicePDFBlob(invoice, retailerProfile);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `ARK_Invoice_${invoice.invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

