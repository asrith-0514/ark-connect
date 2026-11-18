#!/usr/bin/env node
/**
 * ARK Platform - Demo Control Server-Rendered HTML Verification Script
 * Validates that production-built SSR HTML strictly conceals demo controls
 * without ?demo=true, and renders them when ?demo=true is present.
 *
 * NOTE: This covers server-rendered HTML only.
 *
 * Run with: npm run check:demo
 */

const http = require("http");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

function findAvailablePort(preferredPort = 3008) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      // Try an ephemeral port if preferred port fails
      const fallback = net.createServer();
      fallback.unref();
      fallback.on("error", reject);
      fallback.listen(0, "127.0.0.1", () => {
        const port = fallback.address().port;
        fallback.close(() => resolve(port));
      });
    });
    server.listen(preferredPort, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function fetchHtml(baseUrl, routePath) {
  return new Promise((resolve, reject) => {
    http
      .get(`${baseUrl}${routePath}`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, html: data }));
      })
      .on("error", reject);
  });
}

function waitForReady(baseUrl, maxAttempts = 30) {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetchHtml(baseUrl, "/api/auth/session");
        if (res.status === 200) {
          return resolve(true);
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 400));
    }
    reject(new Error("Timeout waiting for Next.js production server"));
  });
}

async function runDemoChecks() {
  console.log("\n========================================================================");
  console.log("   ARK PLATFORM - DEMO GATING SERVER-RENDERED HTML VERIFICATION         ");
  console.log("========================================================================\n");
  console.log("Notice: This test validates server-rendered initial HTML responses only.\n");

  const port = await findAvailablePort(3008);
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Starting Next.js production server on ${baseUrl}...`);
  const nextBin = path.join(__dirname, "../node_modules/next/dist/bin/next");
  const serverProcess = spawn(process.execPath, [nextBin, "start", "-p", String(port), "-H", "127.0.0.1"], {
    stdio: "pipe",
    cwd: path.join(__dirname, ".."),
  });

  serverProcess.stderr.on("data", (d) => {
    // Suppress harmless deprecation warnings
    const str = d.toString();
    if (!str.includes("DEP0190")) {
      // console.error(str);
    }
  });

  try {
    await waitForReady(baseUrl);
    console.log("Server ready. Running server-rendered HTML assertions...\n");

    const results = [];
    const errors = [];

    // Check 1: GET / (no flag)
    {
      const res = await fetchHtml(baseUrl, "/");
      const htmlLower = res.html.toLowerCase();
      const hasDemoSwitcher = htmlLower.includes("demo switcher");
      const hasSyncTally = res.html.includes("Sync Tally");
      const hasDemoStateSim = res.html.includes("Demo State Simulator");

      const passed = !hasDemoSwitcher && !hasSyncTally && !hasDemoStateSim && res.status === 200;
      if (!passed) {
        errors.push(`GET / failed: switcher=${hasDemoSwitcher}, syncTally=${hasSyncTally}, stateSim=${hasDemoStateSim}`);
      }
      results.push({
        test: "GET / (unauthenticated, no ?demo=true)",
        passed,
        details: [
          `HTTP Status: ${res.status}`,
          `Demo Switcher absent: ${!hasDemoSwitcher}`,
          `Sync Tally button absent: ${!hasSyncTally}`,
          `Demo State Simulator absent: ${!hasDemoStateSim}`,
        ],
      });
    }

    // Check 2: GET /staff (no flag)
    {
      const res = await fetchHtml(baseUrl, "/staff");
      const htmlLower = res.html.toLowerCase();
      const hasDemoSwitcher = htmlLower.includes("demo switcher");
      const hasSyncTally = res.html.includes("Sync Tally");

      const passed = !hasDemoSwitcher && !hasSyncTally && res.status === 200;
      if (!passed) {
        errors.push(`GET /staff failed: switcher=${hasDemoSwitcher}, syncTally=${hasSyncTally}`);
      }
      results.push({
        test: "GET /staff (unauthenticated, no ?demo=true)",
        passed,
        details: [
          `HTTP Status: ${res.status}`,
          `Demo Switcher absent: ${!hasDemoSwitcher}`,
          `Sync Tally button absent: ${!hasSyncTally}`,
        ],
      });
    }

    // Check 3: GET /?mode=distributor&view=dashboard (no flag)
    {
      const res = await fetchHtml(baseUrl, "/?mode=distributor&view=dashboard");
      const htmlLower = res.html.toLowerCase();
      const hasDemoSwitcher = htmlLower.includes("demo switcher");
      const hasSyncTally = res.html.includes("Sync Tally");
      const hasDemoStateSim = res.html.includes("Demo State Simulator");

      const passed = !hasDemoSwitcher && !hasSyncTally && !hasDemoStateSim && res.status === 200;
      if (!passed) {
        errors.push(
          `GET /?mode=distributor&view=dashboard failed: switcher=${hasDemoSwitcher}, syncTally=${hasSyncTally}, stateSim=${hasDemoStateSim}`
        );
      }
      results.push({
        test: "GET /?mode=distributor&view=dashboard (no ?demo=true)",
        passed,
        details: [
          `HTTP Status: ${res.status}`,
          `Demo Switcher absent: ${!hasDemoSwitcher}`,
          `Sync Tally button absent: ${!hasSyncTally}`,
          `Demo State Simulator absent: ${!hasDemoStateSim}`,
        ],
      });
    }

    // Check 4: GET /?demo=true (with demo flag)
    {
      const res = await fetchHtml(baseUrl, "/?demo=true");
      const htmlLower = res.html.toLowerCase();
      const hasDemoSwitcher = htmlLower.includes("demo switcher");

      const passed = hasDemoSwitcher && res.status === 200;
      if (!passed) {
        errors.push(`GET /?demo=true failed: expected demo switcher to be present (status: ${res.status})`);
      }
      results.push({
        test: "GET /?demo=true (with ?demo=true)",
        passed,
        details: [
          `HTTP Status: ${res.status}`,
          `Demo Switcher present: ${hasDemoSwitcher}`,
        ],
      });
    }

    // Print summary
    console.log("SUMMARY REPORT:\n");
    results.forEach((r) => {
      const symbol = r.passed ? "[PASS]" : "[FAIL]";
      console.log(`${symbol} ${r.test}`);
      r.details.forEach((d) => console.log(`       • ${d}`));
      console.log("");
    });

    if (errors.length === 0) {
      console.log(" PASS  All server-rendered HTML demo gating checks passed successfully!\n");
      process.exit(0);
    } else {
      console.log(" FAIL  Demo gating check failures detected:\n");
      errors.forEach((e) => console.log(`       ✖ ${e}`));
      console.log("");
      process.exit(1);
    }
  } finally {
    try {
      serverProcess.kill("SIGTERM");
    } catch {}
  }
}

runDemoChecks().catch((err) => {
  console.error("Fatal error during check:demo execution:", err);
  process.exit(1);
});
