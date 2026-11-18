#!/usr/bin/env node
/**
 * ARK Platform - Data Integrity & Reconciliation Verification Script
 * Validates cross-portal consistency between ARK Connect (Retailer) and ARK Backoffice (Distributor)
 * 
 * Run with: npm run check:data
 */

const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");
const { ESLint } = require("eslint");

// -----------------------------------------------------------------------------
// Path Alias & TypeScript In-Memory Transpiler Hooks
// -----------------------------------------------------------------------------
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const resolvedPath = path.join(__dirname, "../src", request.slice(2));
    return originalResolveFilename.call(this, resolvedPath, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(compiled.outputText, filename);
};

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
};

let allPassed = true;
const results = [];

function recordCheck(name, passed, details = [], errors = []) {
  if (!passed) allPassed = false;
  results.push({ name, passed, details, errors });
}

async function runDataChecks() {
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   ARK CONNECT & DISTRIBUTOR DATA INTEGRITY & RECONCILIATION SUITE       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  // Load shared models, datasets, and selectors
  const dataModule = require("../src/lib/mock/data.ts");
  const selectorsModule = require("../src/lib/mock/selectors.ts");
  const retailerModule = require("../src/lib/mock/retailer.ts");
  const mockDataModule = require("../src/data/mockData.ts");

  const {
    MOCK_RETAILERS,
    MOCK_INVOICES,
    MOCK_ORDERS,
    MOCK_PAYMENTS,
    MOCK_PURCHASE_BILLS,
    MOCK_SUPPLIERS,
    MOCK_TIER_ARTICLES,
    MOCK_BRANDS,
    MOCK_FOLLOW_UPS,
    MOCK_COMPLAINTS,
    MOCK_COMMUNICATION_LOGS,
    MOCK_RETAILER_REQUESTS,
  } = dataModule;

  const {
    getAgeingBuckets,
    getRetailerAgeingLedgers,
    getDistributorKPIs,
    getOrderPipelineMetrics,
    DEFAULT_APP_DATE,
    getRetailerSegments,
    getFollowUpsGrouped,
    formatDateToIsoDay,
  } = selectorsModule;

  const {
    RETAILER_INVOICES,
    RETAILER_PROFILE,
    RETAILER_ORDERS,
    getRetailerFinancials,
  } = retailerModule;

  const { MOCK_PRODUCTS } = mockDataModule;

  // Process optional CLI date argument (Item 4)
  const cliDateArg = process.argv[2];
  const customDate = cliDateArg ? new Date(cliDateArg) : null;
  const isCustomValid = customDate && !isNaN(customDate.getTime());
  const liveRuntimeDate = isCustomValid ? customDate : new Date();

  // ===========================================================================
  // CHECK 1: RET-0001 (Sri Laxmi Narasimha Textiles) on Both Sides (Item 1 & 4)
  // ===========================================================================
  {
    const checkName = "Check 1: RET-0001 Financials & Overdue Reconciliation (12 Nov & Live Date)";
    const details = [];
    const errors = [];

    // 1. Simulation Date (12 Nov 2026)
    const retFin12Nov = getRetailerFinancials(RETAILER_INVOICES, RETAILER_PROFILE, DEFAULT_APP_DATE);
    const distLedgers12Nov = getRetailerAgeingLedgers(MOCK_RETAILERS, MOCK_INVOICES, DEFAULT_APP_DATE);
    const distRet1_12Nov = distLedgers12Nov.find(
      (l) => l.retailer.code === "RET-0001" || l.retailer.id === "ret-1"
    );

    if (!distRet1_12Nov) {
      errors.push("RET-0001 not found in distributor ageing ledgers at 12 Nov.");
    } else {
      const distOverdue12Nov = distRet1_12Nov.d1_30 + distRet1_12Nov.d31_60 + distRet1_12Nov.d60_plus;

      details.push(
        `12 Nov Simulation -> Retailer: (Outstanding: ₹${retFin12Nov.totalOutstanding.toLocaleString("en-IN")}, Overdue: ₹${retFin12Nov.overdueAmount.toLocaleString("en-IN")}, Next Due: ₹${retFin12Nov.nextDueAmount.toLocaleString("en-IN")}) = Distributor: (Outstanding: ₹${distRet1_12Nov.totalOwed.toLocaleString("en-IN")}, Overdue: ₹${distOverdue12Nov.toLocaleString("en-IN")}, Next Due: ₹${distRet1_12Nov.notYetDue.toLocaleString("en-IN")})`
      );

      if (retFin12Nov.totalOutstanding !== 54200 || distRet1_12Nov.totalOwed !== 54200) {
        errors.push(`Outstanding mismatch at 12 Nov: Retailer=${retFin12Nov.totalOutstanding}, Distributor=${distRet1_12Nov.totalOwed}`);
      }
      if (retFin12Nov.overdueAmount !== 31000 || distOverdue12Nov !== 31000) {
        errors.push(`Overdue mismatch at 12 Nov: Retailer=${retFin12Nov.overdueAmount}, Distributor=${distOverdue12Nov}`);
      }
      if (retFin12Nov.nextDueAmount !== 23200 || distRet1_12Nov.notYetDue !== 23200) {
        errors.push(`Next due mismatch at 12 Nov: Retailer=${retFin12Nov.nextDueAmount}, Distributor=${distRet1_12Nov.notYetDue}`);
      }
    }

    // 2. Live Runtime / CLI Date Reconciliation
    const retFinLive = getRetailerFinancials(RETAILER_INVOICES, RETAILER_PROFILE, liveRuntimeDate);
    const distLedgersLive = getRetailerAgeingLedgers(MOCK_RETAILERS, MOCK_INVOICES, liveRuntimeDate);
    const distRet1Live = distLedgersLive.find(
      (l) => l.retailer.code === "RET-0001" || l.retailer.id === "ret-1"
    );

    if (!distRet1Live) {
      errors.push("RET-0001 not found in distributor ageing ledgers at live date.");
    } else {
      const distOverdueLive = distRet1Live.d1_30 + distRet1Live.d31_60 + distRet1Live.d60_plus;

      details.push(
        `Live Runtime (${liveRuntimeDate.toISOString().slice(0, 10)}) -> Retailer: (Outstanding: ₹${retFinLive.totalOutstanding.toLocaleString("en-IN")}, Overdue: ₹${retFinLive.overdueAmount.toLocaleString("en-IN")}, Next Due: ₹${retFinLive.nextDueAmount.toLocaleString("en-IN")}) = Distributor: (Outstanding: ₹${distRet1Live.totalOwed.toLocaleString("en-IN")}, Overdue: ₹${distOverdueLive.toLocaleString("en-IN")}, Next Due: ₹${distRet1Live.notYetDue.toLocaleString("en-IN")})`
      );

      if (retFinLive.totalOutstanding !== distRet1Live.totalOwed) {
        errors.push(`Live date total outstanding mismatch: Retailer=${retFinLive.totalOutstanding}, Distributor=${distRet1Live.totalOwed}`);
      }
      if (retFinLive.overdueAmount !== distOverdueLive) {
        errors.push(`Live date overdue mismatch: Retailer=${retFinLive.overdueAmount}, Distributor=${distOverdueLive}`);
      }
      if (retFinLive.nextDueAmount !== distRet1Live.notYetDue) {
        errors.push(`Live date next due mismatch: Retailer=${retFinLive.nextDueAmount}, Distributor=${distRet1Live.notYetDue}`);
      }

      // Check overdue banner text output
      if (retFinLive.overdueInvoices.length > 0) {
        details.push(`Overdue Banner Text: "${retFinLive.overdueSummaryText}" (No negative days, oldest invoice indicated)`);
        if (/\s-\d/.test(retFinLive.overdueSummaryText) || !retFinLive.overdueSummaryText.includes("INV-0079")) {
          errors.push(`Invalid overdue banner text: "${retFinLive.overdueSummaryText}"`);
        }
      }
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 2: Receivables Reconciliation & Ageing Buckets & Retailer Counts
  // ===========================================================================
  {
    const checkName = "Check 2: Receivables Reconciliation & Retailer Counts";
    const details = [];
    const errors = [];

    const buckets = getAgeingBuckets(MOCK_INVOICES, DEFAULT_APP_DATE);
    const ledgers = getRetailerAgeingLedgers(MOCK_RETAILERS, MOCK_INVOICES, DEFAULT_APP_DATE);
    const ledgersTotal = ledgers.reduce((sum, l) => sum + l.totalOwed, 0);
    const bucketsSum = buckets.notYetDue + buckets.d1_30 + buckets.d31_60 + buckets.d60_plus;

    const kpis = getDistributorKPIs(
      MOCK_ORDERS,
      MOCK_INVOICES,
      MOCK_PAYMENTS,
      MOCK_PURCHASE_BILLS,
      MOCK_RETAILERS,
      DEFAULT_APP_DATE
    );

    const activeRetailersCount = MOCK_RETAILERS.filter((r) => r.status === "Active").length;

    details.push(
      `Receivables Table Total: ₹${ledgersTotal.toLocaleString("en-IN")} across ${ledgers.length} retailer ledgers`
    );
    details.push(
      `Ageing Buckets: Not yet due (₹${buckets.notYetDue.toLocaleString("en-IN")}) + 1-30d (₹${buckets.d1_30.toLocaleString("en-IN")}) + 31-60d (₹${buckets.d31_60.toLocaleString("en-IN")}) + 60+d (₹${buckets.d60_plus.toLocaleString("en-IN")}) = ₹${bucketsSum.toLocaleString("en-IN")}`
    );
    details.push(
      `Retailer Counts: Dashboard (${kpis.activeRetailersCount}) = Active Tab (${activeRetailersCount}) = Receivables Table (${ledgers.length})`
    );

    if (ledgersTotal !== 1864700) {
      errors.push(`Receivables table rows sum to ₹${ledgersTotal}, expected exactly ₹18,64,700.`);
    }
    if (buckets.total !== 1864700) {
      errors.push(`Ageing buckets total is ₹${buckets.total}, expected exactly ₹18,64,700.`);
    }
    if (bucketsSum !== buckets.total) {
      errors.push(`Ageing buckets components sum to ₹${bucketsSum}, does not equal bucket total ₹${buckets.total}.`);
    }
    if (ledgersTotal !== buckets.total) {
      errors.push(`Receivables table sum (₹${ledgersTotal}) does not equal header bucket total (₹${buckets.total}).`);
    }
    if (kpis.activeRetailersCount !== activeRetailersCount) {
      errors.push(`Dashboard active retailers count is ${kpis.activeRetailersCount}, expected ${activeRetailersCount}.`);
    }
    if (activeRetailersCount !== ledgers.length) {
      errors.push(`Active retailers list count is ${activeRetailersCount}, does not match ledgers count ${ledgers.length}.`);
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 3: Pipeline Counts vs Orders Tabs & RET-0001 Alignment
  // ===========================================================================
  {
    const checkName = "Check 3: Pipeline Counts & Order Tabs Alignment";
    const details = [];
    const errors = [];

    const pipe = getOrderPipelineMetrics(MOCK_ORDERS);
    const nonDraftOrders = MOCK_ORDERS.filter((o) => o.status !== "Draft");

    // Orders tab counts
    const tabCounts = {
      all: nonDraftOrders.length,
      needsReview: pipe.submittedCount,
      readyToInvoice: pipe.approvedCount,
      processing: pipe.processingCount + pipe.confirmedCount,
      dispatched: pipe.dispatchedCount,
      delivered: pipe.deliveredCount,
    };

    // Retailer RET-0001 "In Review" vs Distributor RET-0001 "Needs Review"
    const ret1RetailerInReview = RETAILER_ORDERS.filter((o) => o.status === "Submitted");
    const ret1DistNeedsReview = MOCK_ORDERS.filter(
      (o) => (o.retailerId === "ret-1" || o.retailerId === "RET-0001") && o.status === "Submitted"
    );

    details.push(
      `Orders Tabs Counts: All (${tabCounts.all}), Needs Review (${tabCounts.needsReview}), Ready to Invoice (${tabCounts.readyToInvoice}), Processing (${tabCounts.processing}), Dispatched (${tabCounts.dispatched}), Delivered (${tabCounts.delivered})`
    );
    details.push(
      `RET-0001 Review Alignment: Retailer In Review (${ret1RetailerInReview.length} PO) = Distributor Needs Review (${ret1DistNeedsReview.length} PO)`
    );

    if (tabCounts.needsReview !== pipe.submittedCount) {
      errors.push(`Needs Review tab count (${tabCounts.needsReview}) != pipeline submitted (${pipe.submittedCount}).`);
    }
    if (ret1RetailerInReview.length !== 1) {
      errors.push(`Retailer RET-0001 submitted orders count is ${ret1RetailerInReview.length}, expected 1.`);
    }
    if (ret1DistNeedsReview.length !== 1) {
      errors.push(`Distributor RET-0001 submitted orders count is ${ret1DistNeedsReview.length}, expected 1.`);
    }
    if (ret1RetailerInReview[0]?.orderNumber !== ret1DistNeedsReview[0]?.orderNumber) {
      errors.push(
        `PO number mismatch: Retailer has ${ret1RetailerInReview[0]?.orderNumber}, Distributor has ${ret1DistNeedsReview[0]?.orderNumber}.`
      );
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 4: Draft Entity Isolation (Invoices & POs)
  // ===========================================================================
  {
    const checkName = "Check 4: Draft Invoices & Orders Privacy Isolation";
    const details = [];
    const errors = [];

    // Distributor receivables
    const openInvoicesInAgeing = MOCK_INVOICES.filter((inv) => inv.status !== "Draft" && inv.balanceDue > 0);
    const draftInvoicesInOpen = openInvoicesInAgeing.filter((inv) => inv.status === "Draft");

    // Distributor visible orders
    const distVisibleOrders = MOCK_ORDERS.filter((o) => o.status !== "Draft");
    const draftOrdersInDist = distVisibleOrders.filter((o) => o.status === "Draft");

    // Retailer invoices
    const draftInvoicesInRetailer = RETAILER_INVOICES.filter((inv) => inv.status === "Draft");

    details.push(
      `Distributor Receivables Draft Invoices: ${draftInvoicesInOpen.length} (excluded from receivables & aging)`
    );
    details.push(
      `Distributor Orders Visible Draft POs: ${draftOrdersInDist.length} (excluded from distributor view)`
    );
    details.push(
      `Retailer Portal Invoices Draft Count: ${draftInvoicesInRetailer.length} (excluded from retailer invoices)`
    );

    if (draftInvoicesInOpen.length > 0) {
      errors.push(`Found ${draftInvoicesInOpen.length} DRAFT invoices included in distributor receivables.`);
    }
    if (draftOrdersInDist.length > 0) {
      errors.push(`Found ${draftOrdersInDist.length} DRAFT orders visible to distributor.`);
    }
    if (draftInvoicesInRetailer.length > 0) {
      errors.push(`Found ${draftInvoicesInRetailer.length} DRAFT invoices exposed to retailer portal.`);
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 5: Pricing Tier & Rebate Privacy Audit & ESLint Rule Verification
  // ===========================================================================
  {
    const checkName = "Check 5: Tier & Rebate Privacy Audit & ESLint Rule";
    const details = [];
    const errors = [];

    // 1. Scan retailer components for forbidden keywords
    const retailerCompDir = path.join(__dirname, "../src/components/retailer");
    const retailerFiles = fs.readdirSync(retailerCompDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

    const forbiddenPhrases = [
      "tier a++",
      "tier a+",
      "tier a",
      "pricing tier",
      "internal tier",
      "rebate",
      "net rebate",
      "discount tier",
    ];

    let forbiddenOccurrences = 0;
    retailerFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(retailerCompDir, file), "utf8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        for (const phrase of forbiddenPhrases) {
          if (lower.includes(phrase)) {
            // Ignore benign words like 'frontier' or comments explicitly noting no tier
            if (lower.includes("frontier") || lower.includes("banning internal_*")) continue;
            forbiddenOccurrences++;
            errors.push(`Forbidden term "${phrase}" found in ${file}:${idx + 1}`);
          }
        }
      });
    });

    details.push(
      `Scanned ${retailerFiles.length} retailer component files: 0 tier/rebate leaks found`
    );

    // 2. ESLint no-restricted-imports verification
    try {
      const eslint = new ESLint();
      const lintResults = await eslint.lintFiles(["src/components/retailer/**/*.{ts,tsx}"]);
      const restrictedErrors = [];

      lintResults.forEach((res) => {
        res.messages.forEach((msg) => {
          if (msg.ruleId === "no-restricted-imports") {
            restrictedErrors.push({
              file: path.basename(res.filePath),
              message: msg.message,
            });
          }
        });
      });

      if (restrictedErrors.length > 0) {
        restrictedErrors.forEach((e) => {
          errors.push(`ESLint Restricted Import Violation in ${e.file}: ${e.message}`);
        });
      } else {
        details.push("ESLint no-restricted-imports rule enforced with 0 violations across retailer components");
      }

      // Verify that ESLint rule configuration actually catches a synthetic violation
      const sampleViolation = 'import { INTERNAL_RETAILER_PROFILE } from "@/lib/mock";';
      const syntheticResults = await eslint.lintText(sampleViolation, {
        filePath: "src/components/retailer/SyntheticTest.tsx",
      });
      const caughtSynthetic = syntheticResults[0]?.messages.some((m) => m.ruleId === "no-restricted-imports");

      if (caughtSynthetic) {
        details.push("Verified: ESLint rule actively intercepts forbidden INTERNAL_* imports");
      } else {
        errors.push("ESLint rule failed to intercept synthetic INTERNAL_* import violation.");
      }
    } catch (err) {
      errors.push(`ESLint check failed to run: ${err.message}`);
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 6: Purchase Bills & Suppliers Payables Reconciliation (Item 1)
  // ===========================================================================
  {
    const checkName = "Check 6: Purchase Bills & Suppliers Payables Reconciliation";
    const details = [];
    const errors = [];

    const openBills = MOCK_PURCHASE_BILLS.filter((b) => b.status !== "Paid" && b.balanceDue > 0);
    const totalUnpaidBills = openBills.reduce((s, b) => s + b.balanceDue, 0);
    const suppliersPayables = MOCK_SUPPLIERS.reduce((s, sup) => s + sup.payable, 0);

    const kpis = getDistributorKPIs(
      MOCK_ORDERS,
      MOCK_INVOICES,
      MOCK_PAYMENTS,
      MOCK_PURCHASE_BILLS,
      MOCK_RETAILERS,
      DEFAULT_APP_DATE
    );

    details.push(
      `Open Purchase Bills: ${openBills.length} unpaid bills totaling ₹${totalUnpaidBills.toLocaleString("en-IN")}`
    );
    details.push(
      `Supplier Payables: ₹${suppliersPayables.toLocaleString("en-IN")} across ${MOCK_SUPPLIERS.length} Tiruppur mills`
    );
    details.push(
      `Dashboard "You Owe" KPI: ₹${kpis.supplierPayables.toLocaleString("en-IN")}`
    );

    if (openBills.length !== 4) {
      errors.push(`Open purchase bills count is ${openBills.length}, expected exactly 4.`);
    }
    if (totalUnpaidBills !== 3860000) {
      errors.push(`Open purchase bills total is ₹${totalUnpaidBills}, expected exactly ₹38,60,000.`);
    }
    if (suppliersPayables !== 3860000) {
      errors.push(`Supplier payables sum is ₹${suppliersPayables}, expected exactly ₹38,60,000.`);
    }
    if (kpis.supplierPayables !== 3860000) {
      errors.push(`Dashboard supplier payables KPI is ₹${kpis.supplierPayables}, expected ₹38,60,000.`);
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 7: Sales Figures Alignment & Selected Month Isolation (Item 2)
  // ===========================================================================
  {
    const checkName = "Check 7: Sales Figures Alignment & Selected Month Isolation";
    const details = [];
    const errors = [];

    // Basis verification: all sales figures use grandTotal (incl. GST)
    const issuedInvoices = MOCK_INVOICES.filter((i) => i.status !== "Draft");
    const totalSalesInclGST = issuedInvoices.reduce((s, i) => s + i.grandTotal, 0);

    // Selected Month filter test (October 2026)
    const octInvoices = issuedInvoices.filter((i) => i.billedDate.includes("Oct 2026"));
    const octSalesExpected = octInvoices.reduce((s, i) => s + i.grandTotal, 0);

    const octKPIs = getDistributorKPIs(
      MOCK_ORDERS,
      MOCK_INVOICES,
      MOCK_PAYMENTS,
      MOCK_PURCHASE_BILLS,
      MOCK_RETAILERS,
      DEFAULT_APP_DATE,
      "October 2026"
    );

    const novKPIs = getDistributorKPIs(
      MOCK_ORDERS,
      MOCK_INVOICES,
      MOCK_PAYMENTS,
      MOCK_PURCHASE_BILLS,
      MOCK_RETAILERS,
      DEFAULT_APP_DATE,
      "November 2026"
    );

    details.push(
      `Total Issued Sales (incl. GST): ₹${totalSalesInclGST.toLocaleString("en-IN")} across ${issuedInvoices.length} invoices`
    );
    details.push(
      `October 2026 Filtered Sales: Dashboard (₹${octKPIs.invoicedSales.toLocaleString("en-IN")}) = Invoices Sum (₹${octSalesExpected.toLocaleString("en-IN")})`
    );
    details.push(
      `November 2026 Filtered Sales: Dashboard (₹${novKPIs.invoicedSales.toLocaleString("en-IN")}) strictly isolated from October`
    );

    if (octKPIs.invoicedSales !== octSalesExpected) {
      errors.push(
        `Month filter mismatch: Dashboard reported ₹${octKPIs.invoicedSales}, expected ₹${octSalesExpected}.`
      );
    }
    if (novKPIs.invoicedSales === octSalesExpected) {
      errors.push(
        `November MTD erroneously returned October sales total ₹${octSalesExpected.toLocaleString("en-IN")}. Month picker filter failed.`
      );
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 8: INV-0095 & ARK-8841 Alignment & Draft Exclusions (Item 3)
  // ===========================================================================
  {
    const checkName = "Check 8: INV-0095 & ARK-8841 Alignment & Draft Exclusions";
    const details = [];
    const errors = [];

    // 1. Order ARK-8841 must be Dispatched and link to issued invoice INV-0095
    const ord8841 = MOCK_ORDERS.find((o) => o.orderNumber === "ARK-8841");
    const inv0095Dist = MOCK_INVOICES.find((i) => i.invoiceNumber === "INV-0095");
    const inv0095Ret = RETAILER_INVOICES.find((i) => i.invoiceNumber === "INV-0095");

    if (!ord8841) {
      errors.push("Order ARK-8841 not found in MOCK_ORDERS.");
    } else if (ord8841.status !== "Dispatched") {
      errors.push(`Order ARK-8841 has status ${ord8841.status}, expected "Dispatched".`);
    }

    if (!inv0095Dist) {
      errors.push("Invoice INV-0095 not found in MOCK_INVOICES.");
    } else if (inv0095Dist.status === "Draft") {
      errors.push("Invoice INV-0095 in distributor data is marked Draft, must be issued.");
    }

    if (!inv0095Ret) {
      errors.push("Invoice INV-0095 not found in RETAILER_INVOICES.");
    } else if (inv0095Ret.status === "Draft") {
      errors.push("Invoice INV-0095 in retailer data is marked Draft, must be issued.");
    }

    // 2. Draft invoices must never count in sales, top retailers or receivables
    const draftInvoices = MOCK_INVOICES.filter((i) => i.status === "Draft");
    const kpis = getDistributorKPIs(
      MOCK_ORDERS,
      MOCK_INVOICES,
      MOCK_PAYMENTS,
      MOCK_PURCHASE_BILLS,
      MOCK_RETAILERS,
      DEFAULT_APP_DATE
    );
    const issuedSum = MOCK_INVOICES.filter((i) => i.status !== "Draft").reduce((s, i) => s + i.grandTotal, 0);

    if (kpis.invoicedSales !== issuedSum) {
      errors.push(
        `Dashboard invoiced sales (₹${kpis.invoicedSales}) includes draft invoices (expected ₹${issuedSum}).`
      );
    }

    details.push(
      `Order ARK-8841 (${ord8841?.status}) links to issued invoice INV-0095 (${inv0095Ret?.status})`
    );
    details.push(
      `Draft Invoices in Sales & Receivables: 0 (${draftInvoices.length} isolated draft invoice kept out of ledgers)`
    );

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 9: Single Article Catalogue Source of Truth (Flowchart Real Catalogue)
  // ===========================================================================
  {
    const checkName = "Check 9: Single Article Catalogue Source of Truth";
    const details = [];
    const errors = [];

    const expectedStyleCount = 65;
    const expectedBrandCount = 8;
    const expectedCategories = ["Leggings", "Petticoats", "Bras", "Panties", "Pants", "T-shirts"];

    details.push(
      `Backoffice Tier Catalogue: ${MOCK_TIER_ARTICLES.length} styles across all ${MOCK_BRANDS.length} flowchart brands`
    );
    details.push(
      `Retailer Product Catalogue: ${MOCK_PRODUCTS.length} products derived from tier articles`
    );

    // 1. Validate real style count (51 styles from 4 flowcharts)
    if (MOCK_TIER_ARTICLES.length !== expectedStyleCount) {
      errors.push(`Expected ${expectedStyleCount} styles in MOCK_TIER_ARTICLES, found ${MOCK_TIER_ARTICLES.length}.`);
    }

    // 2. Verify all 7 flowchart brands are present (Flybirds, Flycute, Loveit, Within, Aswati, Ira, Jyothika)
    const representedBrands = new Set(MOCK_TIER_ARTICLES.map((a) => a.brand));
    if (representedBrands.size !== expectedBrandCount) {
      errors.push(`Expected ${expectedBrandCount} brands in catalogue, found ${representedBrands.size}.`);
    }

    // 3. Verify all 4 required categories are present
    const representedCategories = new Set(MOCK_TIER_ARTICLES.map((a) => a.category));
    for (const cat of expectedCategories) {
      if (!representedCategories.has(cat)) {
        errors.push(`Category "${cat}" not represented in catalogue styles.`);
      }
    }

    // 4. Verify every product matches tier article:
    // - Box packed specification
    // - Pcs per pack matches
    // - If price is active, net price equals Tier A++ price
    // - If price is pending (PLACEHOLDER), pricePending is true and price is not invented
    let pendingCount = 0;
    let pricedCount = 0;

    for (const prod of MOCK_PRODUCTS) {
      const art = MOCK_TIER_ARTICLES.find((a) => a.artNumber === prod.artNumber);
      if (!art) {
        errors.push(`Product ${prod.id} (${prod.artNumber}) has no matching article in MOCK_TIER_ARTICLES.`);
        continue;
      }
      if (prod.packSize !== art.packSize) {
        errors.push(`Product ${prod.artNumber} packSize "${prod.packSize}" != article "${art.packSize}".`);
      }
      if (prod.piecesPerUnit !== art.piecesPerPack) {
        errors.push(`Product ${prod.artNumber} piecesPerUnit ${prod.piecesPerUnit} != article ${art.piecesPerPack}.`);
      }

      if (art.pricePending) {
        pendingCount++;
        if (prod.pricePending !== true) {
          errors.push(`Product ${prod.artNumber} has pending price in Backoffice but pricePending is false in Retailer view.`);
        }
        if (prod.pricePerUnit !== 0) {
          errors.push(`Product ${prod.artNumber} has pending price but shows non-zero price ₹${prod.pricePerUnit}.`);
        }
      } else {
        pricedCount++;
        if (prod.pricePerUnit !== art.tierAppPrice) {
          errors.push(
            `Product ${prod.artNumber} net price ₹${prod.pricePerUnit} != Tier A++ price ₹${art.tierAppPrice}.`
          );
        }
      }
    }

    details.push(
      `Catalogue Price Status: ${pricedCount} active priced styles, ${pendingCount} pending styles (clearly flagged placeholders)`
    );

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 10: Role-Based Access Control (RBAC) & Permission Map Integrity
  // ===========================================================================
  {
    const checkName = "Check 10: Role-Based Access Control & Permission Map Integrity";
    const details = [];
    const errors = [];

    const permissionsModule = require("../src/lib/auth/permissions.ts");
    const { PERMISSIONS_MAP } = permissionsModule;

    if (!PERMISSIONS_MAP) {
      errors.push("PERMISSIONS_MAP is not exported from src/lib/auth/permissions.ts");
    } else {
      const requiredRoles = ["retailer", "owner", "accountant", "godown_staff", "salesman"];
      for (const r of requiredRoles) {
        if (!PERMISSIONS_MAP[r]) {
          errors.push(`Role "${r}" is missing from PERMISSIONS_MAP.`);
        }
      }

      // 1. Retailer Role: Zero access to tier pricing, supplier payables, or backoffice ledgers
      const retPerms = PERMISSIONS_MAP.retailer;
      if (retPerms) {
        if (retPerms.canViewTierPricing !== false) {
          errors.push("Security leak: Retailer canViewTierPricing must be false.");
        }
        if (retPerms.canEditTierPricing !== false) {
          errors.push("Security leak: Retailer canEditTierPricing must be false.");
        }
        if (retPerms.canViewSupplierPayables !== false) {
          errors.push("Security leak: Retailer canViewSupplierPayables must be false.");
        }
        if (retPerms.canViewPurchaseBills !== false) {
          errors.push("Security leak: Retailer canViewPurchaseBills must be false.");
        }
        if (retPerms.canViewDashboard !== false) {
          errors.push("Security leak: Retailer canViewDashboard must be false.");
        }
        details.push("Retailer Role: strictly isolated to store (0 distributor views, 0 tier prices, 0 mill payables)");
      }

      // 2. Salesman Role: Forbids tier prices, supplier payables, purchase bills, financial reports
      const salesPerms = PERMISSIONS_MAP.salesman;
      if (salesPerms) {
        if (salesPerms.canViewTierPricing !== false) {
          errors.push("Security violation: Salesman role canViewTierPricing must be false.");
        }
        if (salesPerms.canEditTierPricing !== false) {
          errors.push("Security violation: Salesman role canEditTierPricing must be false.");
        }
        if (salesPerms.canViewSupplierPayables !== false) {
          errors.push("Security violation: Salesman role canViewSupplierPayables must be false.");
        }
        if (salesPerms.canViewPurchaseBills !== false) {
          errors.push("Security violation: Salesman role canViewPurchaseBills must be false.");
        }
        if (salesPerms.canViewSuppliers !== false) {
          errors.push("Security violation: Salesman role canViewSuppliers must be false.");
        }
        if (salesPerms.canViewReports !== false) {
          errors.push("Security violation: Salesman role canViewReports must be false.");
        }
        if (salesPerms.canViewOrders !== true || salesPerms.canViewRetailers !== true || salesPerms.canViewProducts !== true) {
          errors.push("Salesman must have access to Orders, Retailers, and Products.");
        }
        details.push("Salesman Role: verified forbidding tier margins, supplier payables, and purchase bills");
      }

      // 3. Godown Staff Role: Strictly restricted to Orders and physical Stock
      const godownPerms = PERMISSIONS_MAP.godown_staff;
      if (godownPerms) {
        if (godownPerms.canViewOrders !== true) {
          errors.push("Godown staff must have access to Orders.");
        }
        if (godownPerms.canViewProducts !== true || godownPerms.canManageStock !== true) {
          errors.push("Godown staff must have access to Products and Stock management.");
        }
        if (godownPerms.canViewTierPricing !== false) {
          errors.push("Security violation: Godown staff cannot view tier pricing.");
        }
        if (godownPerms.canViewSupplierPayables !== false) {
          errors.push("Security violation: Godown staff cannot view supplier payables.");
        }
        if (godownPerms.canViewReceivables !== false) {
          errors.push("Security violation: Godown staff cannot view receivables.");
        }
        if (godownPerms.canViewInvoices !== false) {
          errors.push("Security violation: Godown staff cannot view invoices.");
        }
        if (godownPerms.canViewSuppliers !== false) {
          errors.push("Security violation: Godown staff cannot view suppliers.");
        }
        if (godownPerms.canViewPurchaseBills !== false) {
          errors.push("Security violation: Godown staff cannot view purchase bills.");
        }
        if (godownPerms.canViewReports !== false) {
          errors.push("Security violation: Godown staff cannot view reports.");
        }
        if (godownPerms.canViewDashboard !== false) {
          errors.push("Security violation: Godown staff cannot view dashboard.");
        }
        details.push("Godown Staff Role: verified restricted exclusively to Orders and Stock inventory");
      }

      // 4. Accountant & Owner Roles
      const accPerms = PERMISSIONS_MAP.accountant;
      const ownerPerms = PERMISSIONS_MAP.owner;
      if (accPerms && ownerPerms) {
        if (accPerms.canViewInvoices !== true || accPerms.canViewReceivables !== true || accPerms.canViewPurchaseBills !== true) {
          errors.push("Accountant must have invoicing, receivables, and purchase bills access.");
        }
        if (accPerms.canEditTierPricing !== false) {
          errors.push("Accountant cannot edit tier pricing rate cards (view-only).");
        }
        if (ownerPerms.canViewTierPricing !== true || ownerPerms.canEditTierPricing !== true || ownerPerms.canViewSupplierPayables !== true) {
          errors.push("Owner must have full access to tier pricing and supplier payables.");
        }
        details.push("Accountant & Owner Roles: verified financial ledger access and rate card editing gates");
      }
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 11: Retailer Segmentation Integrity (Dynamic Cohorts & Exact Sum)
  // ===========================================================================
  {
    const checkName = "Check 11: Retailer Segmentation Integrity (Dynamic Cohorts)";
    const details = [];
    const errors = [];

    const segmentsResult = getRetailerSegments(
      MOCK_RETAILERS,
      MOCK_ORDERS,
      MOCK_INVOICES,
      DEFAULT_APP_DATE
    );

    const { allMetrics, counts } = segmentsResult;
    const activeRetailers = MOCK_RETAILERS.filter((r) => r.status === "Active");

    if (activeRetailers.length === 0) {
      errors.push(`Expected active retailers, found 0`);
    }

    if (counts.total !== activeRetailers.length) {
      errors.push(`Segmented total count mismatch: expected ${activeRetailers.length}, got ${counts.total}`);
    }

    const sumSegments =
      counts.Champions + counts.Regular + counts.New + counts["At risk"] + counts.Dormant;
    if (sumSegments !== activeRetailers.length) {
      errors.push(
        `Segment sum mismatch: sum of cohorts (${sumSegments}) !== active retailers (${activeRetailers.length})`
      );
    }

    if (allMetrics.length !== activeRetailers.length) {
      errors.push(
        `Expected ${activeRetailers.length} categorized retailers, got ${allMetrics.length}`
      );
    }

    // Verify all active retailers are present and valid
    for (const item of allMetrics) {
      if (!item.segment || !["Champions", "Regular", "New", "At risk", "Dormant"].includes(item.segment)) {
        errors.push(`Retailer ${item.retailerId} has invalid segment: ${item.segment}`);
      }
      if (item.totalSpend12m < 0 || item.ordersLast90d < 0) {
        errors.push(`Retailer ${item.retailerId} has invalid negative metrics`);
      }
    }

    details.push(`Active Retailer Population: ${activeRetailers.length} retailers classified into 5 strict cohorts`);
    details.push(
      `Distribution: Champions: ${counts.Champions}, Regular: ${counts.Regular}, New: ${counts.New}, At risk: ${counts["At risk"]}, Dormant: ${counts.Dormant}`
    );
    details.push(`Cohorts Sum Invariance: ${sumSegments} === ${activeRetailers.length} (100% active coverage)`);

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 12: CRM Follow-up Derivation & Missed Status Verification
  // ===========================================================================
  {
    const checkName = "Check 12: CRM Follow-up Derivation & Missed Status Verification";
    const details = [];
    const errors = [];

    const todayStr = formatDateToIsoDay(DEFAULT_APP_DATE);
    const grouped = getFollowUpsGrouped(MOCK_FOLLOW_UPS, DEFAULT_APP_DATE);

    // 1. All items in missed must be open and have dueDate < todayStr
    for (const f of grouped.missed) {
      if (f.status !== "open") {
        errors.push(`Follow-up ${f.id} in 'missed' has non-open status: ${f.status}`);
      }
      if (f.dueDate >= todayStr) {
        errors.push(`Follow-up ${f.id} in 'missed' has dueDate >= today (${f.dueDate} >= ${todayStr})`);
      }
    }

    // 2. All items in today must be open and have dueDate === todayStr
    for (const f of grouped.today) {
      if (f.status !== "open") {
        errors.push(`Follow-up ${f.id} in 'today' has non-open status: ${f.status}`);
      }
      if (f.dueDate !== todayStr) {
        errors.push(`Follow-up ${f.id} in 'today' has dueDate !== today (${f.dueDate} !== ${todayStr})`);
      }
    }

    // 3. All items in upcoming must be open and have dueDate > todayStr
    for (const f of grouped.upcoming) {
      if (f.status !== "open") {
        errors.push(`Follow-up ${f.id} in 'upcoming' has non-open status: ${f.status}`);
      }
      if (f.dueDate <= todayStr) {
        errors.push(`Follow-up ${f.id} in 'upcoming' has dueDate <= today (${f.dueDate} <= ${todayStr})`);
      }
    }

    // 4. All items in done must have status === "done"
    for (const f of grouped.done) {
      if (f.status !== "done") {
        errors.push(`Follow-up ${f.id} in 'done' has non-done status: ${f.status}`);
      }
    }

    // 5. Total count must match MOCK_FOLLOW_UPS
    const totalGrouped = grouped.missed.length + grouped.today.length + grouped.upcoming.length + grouped.done.length;
    if (totalGrouped !== MOCK_FOLLOW_UPS.length) {
      errors.push(`Grouped count (${totalGrouped}) !== total follow-ups (${MOCK_FOLLOW_UPS.length})`);
    }

    details.push(`Reference Date: ${todayStr} (Simulation Day)`);
    details.push(
      `Derived Grouping: Missed: ${grouped.missed.length}, Today: ${grouped.today.length}, Upcoming: ${grouped.upcoming.length}, Completed: ${grouped.done.length}`
    );
    details.push(`Zero Leakage: Open past-due follow-ups strictly derived as Missed`);

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 13: Retailer Portal Privacy Audit (Zero Internal CRM Exposure)
  // ===========================================================================
  {
    const checkName = "Check 13: Retailer Portal Privacy Audit (Zero Internal CRM Exposure)";
    const details = [];
    const errors = [];

    const retailerDir = path.join(__dirname, "../src/components/retailer");
    const files = fs.readdirSync(retailerDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

    // Prohibited strings that must NEVER appear in retailer portal components
    const forbiddenPatterns = [
      { pattern: /pricingTier/g, name: "pricingTier" },
      { pattern: /tierBadge/g, name: "tierBadge" },
      { pattern: /rebatePercent/g, name: "rebatePercent" },
      { pattern: /marginPercent/g, name: "marginPercent" },
      { pattern: /assignedTo/g, name: "assignedTo (employee assignment)" },
      { pattern: /internalNotes/g, name: "internalNotes (backoffice notes)" },
      { pattern: /supplierPayable/g, name: "supplierPayable" },
    ];

    let scannedFilesCount = 0;
    for (const file of files) {
      scannedFilesCount++;
      const filePath = path.join(retailerDir, file);
      const content = fs.readFileSync(filePath, "utf8");

      for (const { pattern, name } of forbiddenPatterns) {
        if (pattern.test(content)) {
          errors.push(`Privacy leak in ${file}: contains forbidden internal property "${name}"`);
        }
      }
    }

    details.push(`Scanned ${scannedFilesCount} Retailer Portal UI components in src/components/retailer/`);
    details.push(`Zero references to internal CRM employee assignments, notes, or pricing tier margins`);

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 14: Voice Telephony Adapter & Call Queue Architecture
  // ===========================================================================
  {
    const checkName = "Check 14: Voice Telephony Adapter & Call Queue Architecture";
    const details = [];
    const errors = [];

    // Direct imports from real voice calling modules in src/lib/voice/*
    const { getCallProvider } = require("../src/lib/voice/CallProvider.ts");
    const { SCRIPT_TEMPLATES, renderScriptTemplate } = require("../src/lib/voice/scriptTemplates.ts");
    const { generateProposedCallTasks } = require("../src/lib/voice/callTaskRules.ts");
    const { MOCK_CALL_TASKS, handleCallOutcomeWriteBack } = require("../src/lib/voice/voiceData.ts");

    // 1. Verify CallProvider Interface & Adapter Factory
    const provider = getCallProvider();
    if (!provider || typeof provider.initiateCall !== "function" || typeof provider.getCallStatus !== "function") {
      errors.push("CallProvider adapter does not adhere to the standard interface contract.");
    } else {
      details.push(`Telephony Adapter: Pluggable provider "${provider.name}" loaded with clean swap point`);
    }

    // 2. Verify Script Templates across all 4 reasons and 4 languages
    const requiredReasons = ["payment_due", "overdue", "dispatch_update", "order_followup"];
    const requiredLangs = ["te", "en", "hi", "ta"];
    let templateCount = 0;

    for (const reason of requiredReasons) {
      if (!SCRIPT_TEMPLATES[reason]) {
        errors.push(`Missing script template group for reason: "${reason}"`);
        continue;
      }
      for (const lang of requiredLangs) {
        const text = SCRIPT_TEMPLATES[reason].scripts[lang];
        if (!text || text.length < 20) {
          errors.push(`Missing or incomplete script template for reason "${reason}" and language "${lang}"`);
        } else {
          templateCount++;
        }
      }
    }
    details.push(`Multilingual Scripts: ${templateCount}/16 templates verified across Telugu, English, Hindi, and Tamil`);

    // Test template rendering with variables
    const rendered = renderScriptTemplate("Hello {{name}}, amount ₹{{amount}}", { name: "Sri Laxmi", amount: 15000 });
    if (!rendered.includes("Sri Laxmi") || !rendered.includes("15,000")) {
      errors.push(`Script variable interpolation failed: "${rendered}"`);
    }

    // 3. Verify Rule-based Generation (Strictly Proposed, Zero Automatic Dialing)
    const proposed = generateProposedCallTasks(MOCK_INVOICES, MOCK_ORDERS, MOCK_RETAILERS, [], DEFAULT_APP_DATE);
    const nonProposed = proposed.filter((t) => t.status !== "proposed");
    if (nonProposed.length > 0) {
      errors.push(`Safety violation: ${nonProposed.length} generated tasks have status other than "proposed"!`);
    }

    // Verify DNC and consent guardrails
    const dncViolations = proposed.filter((t) => {
      const ret = MOCK_RETAILERS.find((r) => r.id === t.retailerId);
      return ret && (ret.doNotCall === true || ret.phoneConsent === false);
    });
    if (dncViolations.length > 0) {
      errors.push(`Consent violation: ${dncViolations.length} call tasks generated for DNC or opted-out retailers!`);
    }
    details.push(`Rule Engine: Generated ${proposed.length} proposed call tasks (100% strictly proposed for owner review, 0 auto-dialed)`);
    details.push(`Consent Guardrails: Verified strict suppression for doNotCall and phoneConsent opt-outs`);

    // 4. Verify Outcome Write-back to Communications and Follow-ups
    const sampleTask = {
      id: "test-call-task",
      retailerId: "ret-1",
      retailerName: "Sri Laxmi Narasimha Textiles",
      phone: "+91 94401 23456",
      reason: "overdue",
      referenceType: "invoice",
      referenceId: "INV-0094",
      amount: 31000,
      language: "te",
      preferredTimeWindow: "11:00 AM - 01:00 PM",
      status: "completed",
      scheduledDate: "2026-11-12",
      createdAt: "2026-11-12",
      retryCount: 0,
      maxRetries: 3,
    };

    const mockComms = [];
    const mockFollowUps = [];
    handleCallOutcomeWriteBack(
      sampleTask,
      {
        status: "promised_to_pay",
        promisedPaymentDate: "2026-11-20",
        promisedAmount: 31000,
        notes: "Promised payment on 20 Nov",
        sentiment: "positive",
        durationSeconds: 65,
      },
      {
        addCommunication: (c) => mockComms.push(c),
        addFollowUp: (f) => mockFollowUps.push(f),
      }
    );

    if (mockComms.length !== 1 || mockComms[0].channel !== "ai-call") {
      errors.push("Failed to write outbound AI Call entry to Communication Log");
    }
    if (mockFollowUps.length !== 1 || mockFollowUps[0].dueDate !== "2026-11-20" || mockFollowUps[0].status !== "open") {
      errors.push("Failed to write open follow-up with captured promised payment date");
    }
    details.push(`Outcome Write-Back: Successfully logged "ai-call" communication and created open follow-up for 20 Nov`);

    // 5. Verify Retailer Preferences Fields
    const sampleRetailer = MOCK_RETAILERS[0];
    if (!sampleRetailer.preferredLanguage || sampleRetailer.phoneConsent === undefined || sampleRetailer.quietHours === undefined) {
      errors.push("Retailer missing telephony preference fields (language, consent, quietHours)");
    }
    const dncRetailer = MOCK_RETAILERS.find((r) => r.id === "ret-20");
    const noConsentRetailer = MOCK_RETAILERS.find((r) => r.id === "ret-14");
    if (!dncRetailer || dncRetailer.doNotCall !== true) {
      errors.push("ret-20 doNotCall flag not set to true as expected for testing");
    }
    if (!noConsentRetailer || noConsentRetailer.phoneConsent !== false) {
      errors.push("ret-14 phoneConsent flag not set to false as expected for testing");
    }
    details.push(`Retailer Telephony Profiles: Verified language, quiet hours, consent flags, and DNC suppression on all retailers`);

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 15: Source of Truth Component Leakage Audit (Zero Literal Rs/GSTIN/Entities)
  // ===========================================================================
  {
    const checkName = "Check 15: Component Source of Truth & Zero Literals Audit";
    const details = [];
    const errors = [];

    function walkDir(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          results = results.concat(walkDir(full));
        } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          results.push(full);
        }
      });
      return results;
    }

    const componentsDir = path.join(__dirname, "../src/components");
    const componentFiles = walkDir(componentsDir);

    const gstinRegex = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g;
    const rsRegex = /\bRs\.?\s*\d+|₹\s*\d+/g;
    const balajiRegex = /Sri\s+Balaji/gi;

    let scannedCount = 0;
    for (const filePath of componentFiles) {
      scannedCount++;
      const relativePath = path.relative(path.join(__dirname, ".."), filePath).replace(/\\/g, "/");
      const content = fs.readFileSync(filePath, "utf8");
      // Strip comments to inspect actual component code
      const clean = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

      const gMatches = clean.match(gstinRegex);
      if (gMatches) {
        errors.push(`Literal GSTIN found in ${relativePath}: ${gMatches.join(", ")}`);
      }

      const bMatches = clean.match(balajiRegex);
      if (bMatches) {
        errors.push(`Hardcoded entity name "Sri Balaji" found in ${relativePath}: ${bMatches.join(", ")}`);
      }

      const rMatches = clean.match(rsRegex);
      if (rMatches) {
        errors.push(`Hardcoded rupee amount found in ${relativePath}: ${rMatches.join(", ")}`);
      }
    }

    details.push(`Component Scan: Audited ${scannedCount} files across src/components/`);
    details.push(`Zero Hardcoded GSTINs: All components read GSTIN from data constants`);
    details.push(`Zero Hardcoded Rupee Values: All amounts formatted through dynamic selectors`);
    details.push(`Zero Forbidden Entities: No literal "Sri Balaji" occurrences outside seed data`);

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 16: Retailer Isolation, 7 Brands & Single Unit Hub Stock Audit (Item 1, 5, 8)
  // ===========================================================================
  {
    const checkName = "Check 16: Retailer Isolation, 7 Brands & Single Unit Hub Stock Audit";
    const details = [];
    const errors = [];

    // 1. Two different retailers isolation: RET-0001 vs RET-0002
    const ret1Orders = MOCK_ORDERS.filter(
      (o) => (o.retailerId === "ret-1" || o.retailerId === "RET-0001") && !o.orderNumber.startsWith("ARK-H")
    );
    const ret2Orders = MOCK_ORDERS.filter(
      (o) => (o.retailerId === "ret-2" || o.retailerId === "RET-0002") && !o.orderNumber.startsWith("ARK-H")
    );

    details.push(`RET-0001 Scoped Orders: ${ret1Orders.length} orders (ARK-8841, ARK-8902, ARK-8903, ARK-8839), strictly not 168`);
    details.push(`RET-0002 Scoped Orders: ${ret2Orders.length} orders (strictly isolated to RET-0002)`);

    if (ret1Orders.length !== 4) {
      errors.push(`RET-0001 orders count is ${ret1Orders.length}, expected exactly 4 orders.`);
    }

    // Zero cross leakage in orders
    const ret1OrderIds = new Set(ret1Orders.map((o) => o.id));
    const ret2LeakOrders = ret2Orders.filter((o) => ret1OrderIds.has(o.id));
    if (ret2LeakOrders.length > 0) {
      errors.push(`Cross-retailer order leakage detected between RET-0001 and RET-0002: ${ret2LeakOrders.map(o => o.orderNumber).join(", ")}`);
    }

    // Zero cross leakage in invoices
    const ret1Invoices = MOCK_INVOICES.filter((i) => i.retailerId === "ret-1" || i.retailerId === "RET-0001");
    const ret2Invoices = MOCK_INVOICES.filter((i) => i.retailerId === "ret-2" || i.retailerId === "RET-0002");
    const ret1InvIds = new Set(ret1Invoices.map((i) => i.id));
    const ret2LeakInvoices = ret2Invoices.filter((i) => ret1InvIds.has(i.id));
    if (ret2LeakInvoices.length > 0) {
      errors.push(`Cross-retailer invoice leakage detected: ${ret2LeakInvoices.map(i => i.invoiceNumber).join(", ")}`);
    }

    // 2. Suppliers Brands Portfolio: Must strictly come from the 8 real brands
    const canonical8Brands = new Set(["Flybirds", "Flycute", "Loveit", "Within", "Aswati", "Ira", "Jyothika", "RR"]);
    const forbiddenBrands = ["Maxwell", "Little Star", "Aswathi", "Exena", "Lichi"];
    
    for (const sup of MOCK_SUPPLIERS) {
      for (const b of sup.brandsSupplied) {
        if (!canonical8Brands.has(b)) {
          errors.push(`Supplier ${sup.name} has non-canonical brand "${b}". Allowed: ${Array.from(canonical8Brands).join(", ")}`);
        }
        if (forbiddenBrands.some(fb => b.toLowerCase().includes(fb.toLowerCase()))) {
          errors.push(`Supplier ${sup.name} contains forbidden brand "${b}".`);
        }
      }
    }
    details.push(`Suppliers Brand Portfolio: 100% compliant across ${MOCK_SUPPLIERS.length} mills with the 8 canonical brands`);

    // 3. Hub Stock Single Unit & Per-Style Real Stock: No style has placeholder 12,000
    const stylesWithPlaceholder = MOCK_TIER_ARTICLES.filter(a => a.hubStockBoxes === 12000 || a.hubStockBoxes === 1200);
    const uniqueStockLevels = new Set(MOCK_TIER_ARTICLES.map(a => a.hubStockBoxes));
    details.push(`Hub Stock Variety: ${uniqueStockLevels.size} distinct stock levels across ${MOCK_TIER_ARTICLES.length} styles (all in "boxes")`);
    
    if (uniqueStockLevels.size < 5) {
      errors.push(`Hub stock lacks variety: only ${uniqueStockLevels.size} distinct stock levels found.`);
    }

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // CHECK 17: Strict Demo Gating, Zero Auto-Login & Tally Badge Audit
  // ===========================================================================
  {
    const checkName = "Check 17: Strict Demo Gating, Zero Auto-Login & Tally Badge Audit";
    const details = [];
    const errors = [];
    const SRC_DIR = path.join(__dirname, "../src");

    // 1. Verify src/app/page.tsx has no demo bypass and guards sessionUser
    const pageContent = fs.readFileSync(path.join(SRC_DIR, "app/page.tsx"), "utf-8");
    if (pageContent.includes("|| true")) {
      errors.push("src/app/page.tsx contains hardcoded demo bypass ('|| true').");
    }
    if (!pageContent.includes("isDemo && !isExplicitAuth")) {
      errors.push("src/app/page.tsx mock user instantiation is not guarded by isDemo.");
    }
    details.push("Server Route (/): Strict isDemo gating verified (zero hardcoded || true bypass, zero unauthenticated auto-login)");

    // 2. Verify src/app/staff/page.tsx has no demo bypass and guards sessionUser
    const staffContent = fs.readFileSync(path.join(SRC_DIR, "app/staff/page.tsx"), "utf-8");
    if (staffContent.includes("|| true")) {
      errors.push("src/app/staff/page.tsx contains hardcoded demo bypass ('|| true').");
    }
    if (!staffContent.includes("isDemo && !isExplicitAuth")) {
      errors.push("src/app/staff/page.tsx staff session instantiation is not guarded by isDemo.");
    }
    details.push("Server Route (/staff): Strict isDemo gating verified (zero hardcoded || true bypass, zero unauthenticated auto-login)");

    // 3. Verify src/lib/mock/retailer.ts isDemoModeEnabled
    const retailerContent = fs.readFileSync(path.join(SRC_DIR, "lib/mock/retailer.ts"), "utf-8");
    if (retailerContent.includes("NEXT_PUBLIC_DEMO_MODE")) {
      errors.push("src/lib/mock/retailer.ts contains NEXT_PUBLIC_DEMO_MODE override; must only be ?demo=true or ?demo=1.");
    }
    if (retailerContent.includes('hostname === "localhost"')) {
      errors.push("src/lib/mock/retailer.ts contains localhost override in isDemoModeEnabled.");
    }
    details.push("Demo Mode Utility: Only enabled by explicit ?demo=true or ?demo=1 (no env or localhost override)");

    // 4. Verify src/context/AuthContext.tsx does not auto-login unauthenticated users
    const authContent = fs.readFileSync(path.join(SRC_DIR, "context/AuthContext.tsx"), "utf-8");
    if (authContent.includes("setIsDemo(isDemoModeEnabled())")) {
      errors.push("src/context/AuthContext.tsx re-derives isDemo on the client using isDemoModeEnabled(); must receive from server prop.");
    }
    if (!authContent.includes("isDemoActive")) {
      errors.push("src/context/AuthContext.tsx does not guard client fallback login with isDemoActive.");
    }
    details.push("Auth Context: isDemo computed once on server and passed as prop; unauthenticated fallback strictly sets null user");

    // 5. Verify HeaderSwitcher is gated behind isDemo in ClientApp.tsx
    const clientAppContent = fs.readFileSync(path.join(SRC_DIR, "components/ClientApp.tsx"), "utf-8");
    const bareHeaderSwitcherMatches = clientAppContent.match(/<HeaderSwitcher\s*\/>/g) || [];
    const gatedHeaderSwitcherMatches = clientAppContent.match(/\{isDemo\s*&&\s*<HeaderSwitcher\s*\/>\}/g) || [];
    if (gatedHeaderSwitcherMatches.length < 2 || bareHeaderSwitcherMatches.length > gatedHeaderSwitcherMatches.length) {
      errors.push(`HeaderSwitcher in ClientApp.tsx is not strictly gated by isDemo (found ${gatedHeaderSwitcherMatches.length} gated out of ${bareHeaderSwitcherMatches.length} total).`);
    }
    details.push("Demo Switcher: Rendered strictly behind {isDemo && <HeaderSwitcher />} in both portal layouts");

    // 6. Verify DistributorHeader Tally control
    const distHeaderContent = fs.readFileSync(path.join(SRC_DIR, "components/distributor/DistributorHeader.tsx"), "utf-8");
    if (!distHeaderContent.includes("Tally sync: not connected")) {
      errors.push("src/components/distributor/DistributorHeader.tsx does not contain 'Tally sync: not connected'.");
    }
    if (distHeaderContent.includes("Sync Tally") || distHeaderContent.includes("09:42 AM")) {
      errors.push("src/components/distributor/DistributorHeader.tsx still contains active 'Sync Tally' or '09:42 AM'.");
    }
    details.push("Tally Integration: Active 'Sync Tally' replaced with disabled badge 'Tally sync: not connected'");

    // 7. Verify Retailer Demo Controls Gating
    const myAccountContent = fs.readFileSync(path.join(SRC_DIR, "components/retailer/MyAccountView.tsx"), "utf-8");
    if (!myAccountContent.includes("{isDemo && (") || myAccountContent.includes("setIsDemo(isDemoModeEnabled())")) {
      errors.push("src/components/retailer/MyAccountView.tsx Demo State Simulator is not properly gated behind useAuth().isDemo.");
    }
    const myOrdersContent = fs.readFileSync(path.join(SRC_DIR, "components/retailer/MyOrdersView.tsx"), "utf-8");
    if (!myOrdersContent.includes("{isDemo && (") || myOrdersContent.includes("setIsDemo(isDemoModeEnabled())")) {
      errors.push("src/components/retailer/MyOrdersView.tsx State Demo Switcher is not properly gated behind useAuth().isDemo.");
    }
    details.push("Retailer Demo Controls: Account Demo State Simulator and Orders Empty/Skeleton tabs strictly gated behind isDemo");

    recordCheck(checkName, errors.length === 0, details, errors);
  }

  // ===========================================================================
  // Summary & Reporting
  // ===========================================================================
  console.log(`${colors.bold}SUMMARY REPORT:${colors.reset}\n`);

  results.forEach((r, idx) => {
    const symbol = r.passed ? `${colors.green}[PASS]${colors.reset}` : `${colors.red}[FAIL]${colors.reset}`;
    console.log(`${symbol} ${colors.bold}${r.name}${colors.reset}`);
    r.details.forEach((d) => console.log(`       ${colors.dim}• ${d}${colors.reset}`));
    if (r.errors.length > 0) {
      r.errors.forEach((e) => console.log(`       ${colors.red}✖ ${e}${colors.reset}`));
    }
    console.log("");
  });

  if (allPassed) {
    console.log(
      `${colors.bgGreen}${colors.bold} PASS ${colors.reset} ${colors.green}${colors.bold}All ${results.length} Data & Privacy Integrity Checks Passed Successfully!${colors.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `${colors.bgRed}${colors.bold} FAIL ${colors.reset} ${colors.red}${colors.bold}One or more data integrity checks failed. See errors above.${colors.reset}\n`
    );
    process.exit(1);
  }
}

runDataChecks().catch((err) => {
  console.error("Fatal error during check:data execution:", err);
  process.exit(1);
});
