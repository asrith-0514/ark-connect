const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const destDir = 'C:\\Users\\harsh\\.gemini\\antigravity\\brain\\9890dcc5-b0de-4dcb-952d-6faf96b33098';
const tempUserData = 'C:\\Users\\harsh\\AppData\\Local\\Temp\\edge_temp_backoffice_test_' + Date.now();

function runVerification() {
  return new Promise((resolve, reject) => {
    const browserPath = fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
      ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    console.log('Using browser:', browserPath);

    const proc = spawn(browserPath, [
      '--headless=new',
      '--remote-debugging-port=9299',
      `--user-data-dir=${tempUserData}`,
      '--hide-scrollbars',
      'http://127.0.0.1:3006/?mode=distributor&demo=true'
    ]);

    setTimeout(() => {
      http.get('http://127.0.0.1:9299/json', (res) => {
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

                // Viewport: 1440x900 (Desktop)
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 1440,
                  height: 900,
                  deviceScaleFactor: 1,
                  mobile: false
                });

                // Wait 2.5s for initial render
                await new Promise(r => setTimeout(r, 2500));

                // 0. Auto login as distributor owner if on auth screen
                await evalJs(`
                  (() => {
                    const demoDistBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Demo Fast Login') || b.textContent.includes('Distributor') || b.textContent.includes('Owner'));
                    if (demoDistBtn) demoDistBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 1000));

                // Ensure mode is distributor and nav is dashboard (Today)
                await evalJs(`
                  (() => {
                    const todayBtn = Array.from(document.querySelectorAll('aside button, button')).find(b => b.textContent.includes('Today'));
                    if (todayBtn) todayBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 500));

                // 1. 1440px Today Home (Light)
                console.log('--- Step 1: 1440px Today Home (Light) ---');
                await capture('backoffice_1440_today_light.png');

                // 2. 1440px Today Home (Dark)
                console.log('--- Step 2: 1440px Today Home (Dark) ---');
                await evalJs(`document.documentElement.setAttribute('data-theme', 'dark')`);
                await new Promise(r => setTimeout(r, 500));
                await capture('backoffice_1440_today_dark.png');
                await evalJs(`document.documentElement.setAttribute('data-theme', 'light')`);
                await new Promise(r => setTimeout(r, 300));

                // 3. 1440px Products & Pricing (Brand logos row, photo thumbnails, filter)
                console.log('--- Step 3: 1440px Products & Pricing ---');
                await evalJs(`
                  (() => {
                    const prodBtn = Array.from(document.querySelectorAll('aside button, button')).find(b => b.textContent.includes('Products & Pricing') || b.textContent.includes('Products'));
                    if (prodBtn) prodBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 800));
                await capture('backoffice_1440_products_photos.png');

                // 4. Open Product Image Upload Modal
                console.log('--- Step 4: Open Product Image Upload Modal ---');
                await evalJs(`
                  (() => {
                    const photoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('No Photos') || b.textContent.includes('photos') || b.textContent.includes('photo'));
                    if (photoBtn) photoBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 800));
                await capture('backoffice_product_image_modal.png');

                // Close modal
                await evalJs(`
                  (() => {
                    const doneBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Done' || b.getAttribute('aria-label') === 'Close');
                    if (doneBtn) doneBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 500));

                // Switch back to Today
                await evalJs(`
                  (() => {
                    const todayBtn = Array.from(document.querySelectorAll('aside button, button')).find(b => b.textContent.includes('Today'));
                    if (todayBtn) todayBtn.click();
                  })()
                `);
                await new Promise(r => setTimeout(r, 400));

                // 5. 1280x800 (Laptop)
                console.log('--- Step 5: 1280x800 Laptop Today ---');
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 1280,
                  height: 800,
                  deviceScaleFactor: 1,
                  mobile: false
                });
                await new Promise(r => setTimeout(r, 600));
                await capture('backoffice_1280_today.png');

                // 6. 768x1024 (Tablet)
                console.log('--- Step 6: 768x1024 Tablet Today ---');
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 768,
                  height: 1024,
                  deviceScaleFactor: 2,
                  mobile: false
                });
                await new Promise(r => setTimeout(r, 600));
                await capture('backoffice_768_today.png');

                // 7. 390x844 (Mobile - Phone Layout for Owner)
                console.log('--- Step 7: 390x844 Phone Layout (Light) ---');
                await send('Emulation.setDeviceMetricsOverride', {
                  width: 390,
                  height: 844,
                  deviceScaleFactor: 2,
                  mobile: true
                });
                await new Promise(r => setTimeout(r, 600));
                await capture('backoffice_390_today_light.png');

                // 8. 390x844 (Mobile - Phone Layout Dark)
                console.log('--- Step 8: 390x844 Phone Layout (Dark) ---');
                await evalJs(`document.documentElement.setAttribute('data-theme', 'dark')`);
                await new Promise(r => setTimeout(r, 500));
                await capture('backoffice_390_today_dark.png');
                await evalJs(`document.documentElement.setAttribute('data-theme', 'light')`);

                console.log('All Backoffice verification screenshots captured successfully!');
                proc.kill();
                resolve({ success: true });
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
    console.log('Backoffice Verification COMPLETE:', res);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Backoffice Verification FAILED:', err);
    process.exit(1);
  });
