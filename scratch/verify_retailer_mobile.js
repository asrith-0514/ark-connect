const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const destDir = 'C:\\Users\\harsh\\.gemini\\antigravity\\brain\\9890dcc5-b0de-4dcb-952d-6faf96b33098';
const tempUserData = 'C:\\Users\\harsh\\AppData\\Local\\Temp\\edge_temp_mobile_test_' + Date.now();

function runVerification() {
  return new Promise((resolve, reject) => {
    const browserPath = fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
      ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    console.log('Using browser:', browserPath);

    const proc = spawn(browserPath, [
      '--headless=new',
      '--remote-debugging-port=9288',
      `--user-data-dir=${tempUserData}`,
      '--hide-scrollbars',
      'http://127.0.0.1:3005/?demo=true'
    ]);

    setTimeout(() => {
      http.get('http://127.0.0.1:9288/json', (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', async () => {
          try {
            const targets = JSON.parse(raw);
            const pageTarget = targets.find(t => t.type === 'page');
            if (!pageTarget) {
              proc.kill();
              return reject(new Error('No page target found'));
            }

            const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
            let msgId = 1;

            const send = (method, params = {}) => {
              const id = msgId++;
              ws.send(JSON.stringify({ id, method, params }));
              return new Promise((resP) => {
                const handler = (event) => {
                  const data = JSON.parse(event.data);
                  if (data.id === id) {
                    ws.removeEventListener('message', handler);
                    resP(data.result);
                  }
                };
                ws.addEventListener('message', handler);
              });
            };

            const capture = async (name) => {
              const screenshot = await send('Page.captureScreenshot', { format: 'png' });
              const outPath = path.join(destDir, name);
              fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
              console.log('Saved screenshot:', name);
            };

            const evalJs = async (expr) => {
              const res = await send('Runtime.evaluate', {
                expression: expr,
                returnByValue: true
              });
              return res && res.result ? res.result.value : null;
            };

            ws.onopen = async () => {
              try {
                await send('Page.enable');
                await send('DOM.enable');
                await send('Runtime.enable');

                // Set Viewport: 360 x 800 (Primary Target)
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 360,
                  height: 800,
                  deviceScaleFactor: 2,
                  mobile: true
                });

                // Wait 2s for page hydration & initial render
                await new Promise(r => setTimeout(r, 2000));

                // 0. Auto-login if on auth screen
                await evalJs(`
                  (() => {
                    const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Demo Fast Login') || b.textContent.includes('Quick Demo Login'));
                    if (demoBtn) demoBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 1000));

                // Check Horizontal Scroll
                const scrollWidth = await evalJs(`document.documentElement.scrollWidth`);
                const clientWidth = await evalJs(`document.documentElement.clientWidth`);
                console.log(`Viewport 360x800 check: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
                const hasHorizontalScroll = scrollWidth > 360;
                console.log(`Horizontal scroll detected: ${hasHorizontalScroll ? 'YES (FAIL)' : 'NO (PASS)'}`);

                // 1. Home 360x800 Light
                console.log('--- Step 1: 360x800 Home (Light) ---');
                await capture('retailer_360x800_home_light.png');

                // 2. Home 360x800 Dark
                console.log('--- Step 2: 360x800 Home (Dark) ---');
                await evalJs(`document.documentElement.setAttribute('data-theme', 'dark')`);
                await new Promise(r => setTimeout(r, 500));
                await capture('retailer_360x800_home_dark.png');
                await evalJs(`document.documentElement.setAttribute('data-theme', 'light')`);
                await new Promise(r => setTimeout(r, 300));

                // 3. Navigate to Shop Tab
                console.log('--- Step 3: Shop Tab (2-column grid & filter chips) ---');
                await evalJs(`
                  (() => {
                    const shopTab = Array.from(document.querySelectorAll('nav button, button')).find(b => b.textContent.includes('Shop') || b.textContent.includes('షాప్'));
                    if (shopTab) shopTab.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 800));

                // Open Variant Matrix Bottom Sheet
                console.log('--- Step 4: Open Variant Matrix Bottom Sheet ---');
                await evalJs(`
                  (() => {
                    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Select Sizes') || b.textContent.includes('Add Sizes') || b.textContent.includes('Preview'));
                    if (addBtn) addBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 800));
                await capture('retailer_360x800_shop_matrix_light.png');

                // Add to Order & verify Docked PO Bar
                console.log('--- Step 5: Add to Order & PO Dock Bar ---');
                await evalJs(`
                  (() => {
                    const addOrderBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add to Order'));
                    if (addOrderBtn) addOrderBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 800));

                // 4. Open Full-Screen Review PO
                console.log('--- Step 6: Full Screen Review PO ---');
                await evalJs(`
                  (() => {
                    const reviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review PO') || b.textContent.includes('Review Order'));
                    if (reviewBtn) reviewBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 800));
                await capture('retailer_360x800_review_po.png');

                // Close Review PO
                await evalJs(`
                  (() => {
                    const backBtn = document.querySelector('button[aria-label="Back to Shop"]');
                    if (backBtn) backBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 500));

                // Return to Home tab
                await evalJs(`
                  (() => {
                    const homeTab = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Home') || b.textContent.includes('హోమ్'));
                    if (homeTab) homeTab.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 500));

                // 5. Viewport: 390x844 (iPhone)
                console.log('--- Step 7: Viewport 390x844 (iPhone) ---');
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 390,
                  height: 844,
                  deviceScaleFactor: 2,
                  mobile: true
                });
                await new Promise(r => setTimeout(r, 600));
                await capture('retailer_390x844_home.png');

                // 6. Viewport: 768x1024 (Tablet)
                console.log('--- Step 8: Viewport 768x1024 (Tablet) ---');
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 768,
                  height: 1024,
                  deviceScaleFactor: 2,
                  mobile: false
                });
                await new Promise(r => setTimeout(r, 600));
                await capture('retailer_768_home.png');

                // 7. Telugu Language Toggle
                console.log('--- Step 9: Telugu Language Switch ---');
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 360,
                  height: 800,
                  deviceScaleFactor: 2,
                  mobile: true
                });
                await evalJs(`
                  (() => {
                    const langBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('తె') || b.textContent.includes('EN | తె'));
                    if (langBtn) langBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 600));
                await capture('retailer_telugu_toggle.png');

                console.log('All verification screenshots captured successfully!');
                proc.kill();
                resolve({ success: true, hasHorizontalScroll });
              } catch (err) {
                proc.kill();
                reject(err);
              }
            };
          } catch (e) {
            proc.kill();
            reject(e);
          }
        });
      }).on('error', (err) => {
        proc.kill();
        reject(err);
      });
    }, 2000);
  });
}

runVerification()
  .then((res) => {
    console.log('Verification COMPLETE:', res);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification FAILED:', err);
    process.exit(1);
  });
