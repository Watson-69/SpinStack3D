import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm'
};

function startServer(port = 4173, root = 'dist') {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    let filePath = path.join(process.cwd(), root, reqPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', reqPath);
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), root, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function waitPort(port, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Chrome port ${port} did not respond`);
}

async function inspectViewport(url, width, height, scale = 1, screenshotName = null) {
  const port = 9400 + Math.floor(Math.random() * 200);
  const profileDir = path.join(process.env.TEMP || '.', `chrome_reg_${Date.now()}_${Math.random()}`);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--hide-scrollbars',
    '--no-first-run',
    'about:blank'
  ]);

  try {
    await waitPort(port);
    const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const tab = await newTabRes.json();
    const wsUrl = tab.webSocketDebuggerUrl;

    const result = await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let id = 1;
      const callbacks = new Map();

      function send(method, params = {}) {
        return new Promise((res) => {
          const reqId = id++;
          callbacks.set(reqId, res);
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });
      }

      ws.onopen = async () => {
        await send('Emulation.setDeviceMetricsOverride', {
          width,
          height,
          deviceScaleFactor: scale,
          mobile: false
        });
        await send('Page.enable');
        await send('Page.navigate', { url });
      };

      ws.onmessage = async (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id && callbacks.has(data.id)) {
          const cb = callbacks.get(data.id);
          callbacks.delete(data.id);
          cb(data.result);
          return;
        }

        if (data.method === 'Page.loadEventFired') {
          setTimeout(async () => {
            const evalRes = await send('Runtime.evaluate', {
              expression: `(() => {
                const docEl = document.documentElement;
                const winWidth = window.innerWidth;
                const winHeight = window.innerHeight;
                const scrollWidth = docEl.scrollWidth;
                const clientWidth = docEl.clientWidth;
                
                const sidebar = document.querySelector('nav[aria-label="Component directory"]')?.closest('div.shrink-0');
                const main = document.querySelector('main');
                const specPanel = document.querySelector('aside[aria-label="Component specifications"]');
                const specContainer = specPanel?.closest('div.shrink-0');

                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
                const mainRect = main ? main.getBoundingClientRect() : null;
                const specRect = specContainer ? specContainer.getBoundingClientRect() : (specPanel ? specPanel.getBoundingClientRect() : null);

                const specRightOverflow = specRect ? Math.max(0, Math.round(specRect.right - winWidth)) : 0;
                const specIsInside = specRect ? (specRect.right <= winWidth + 1 && specRect.left >= 0) : true;
                const hasHOverflow = scrollWidth > clientWidth;

                // Check text clipping in spec table
                const tableCells = Array.from(document.querySelectorAll('table td')).map(td => ({
                  text: td.innerText,
                  scrollWidth: td.scrollWidth,
                  clientWidth: td.clientWidth,
                  isClipped: td.scrollWidth > td.clientWidth + 1
                }));

                return {
                  winWidth,
                  winHeight,
                  scrollWidth,
                  clientWidth,
                  hasHOverflow,
                  sidebarRect: sidebarRect ? { left: Math.round(sidebarRect.left), right: Math.round(sidebarRect.right), width: Math.round(sidebarRect.width) } : null,
                  mainRect: mainRect ? { left: Math.round(mainRect.left), right: Math.round(mainRect.right), width: Math.round(mainRect.width) } : null,
                  specRect: specRect ? { left: Math.round(specRect.left), right: Math.round(specRect.right), width: Math.round(specRect.width) } : null,
                  specRightOverflow,
                  specIsInside,
                  clippedCellsCount: tableCells.filter(c => c.isClipped).length,
                };
              })()`,
              returnByValue: true
            });

            if (screenshotName && process.argv.includes('--save-shots')) {
              const os = await import('os');
              const shotRes = await send('Page.captureScreenshot', { format: 'png' });
              if (shotRes && shotRes.data) {
                const buffer = Buffer.from(shotRes.data, 'base64');
                const outDir = path.join(os.tmpdir(), 'hecks_layout_verification');
                fs.mkdirSync(outDir, { recursive: true });
                fs.writeFileSync(path.join(outDir, screenshotName), buffer);
              }
            }

            ws.close();
            resolve(evalRes?.result?.value);
          }, 5500);
        }
      };

      ws.onerror = reject;
    });

    return result;
  } finally {
    chromeProc.kill();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }
}

async function run() {
  const server = await startServer(4173);
  try {
    const viewports = [
      { w: 1920, h: 1080, scale: 1, name: 'verified_1920.png', label: '1080p Full HD' },
      { w: 1536, h: 864, scale: 1.25, name: 'verified_1536_scale125.png', label: '1536px (125% DPI scale)' },
      { w: 1440, h: 900, scale: 1, name: 'verified_1440.png', label: '1440x900 MacBook/Standard' },
      { w: 1366, h: 768, scale: 1, name: 'verified_1366.png', label: '1366x768 Standard Laptop' },
      { w: 1280, h: 800, scale: 1, name: 'verified_1280.png', label: '1280x800 Desktop Baseline' },
      { w: 1280, h: 800, scale: 1.5, name: 'verified_1280_scale150.png', label: '1280px (150% High DPI)' },
      { w: 1200, h: 800, scale: 1, name: 'verified_1200.png', label: '1200px Medium Desktop' },
      { w: 1100, h: 800, scale: 1, name: 'verified_1100.png', label: '1100px Compact Desktop' },
      { w: 1024, h: 768, scale: 1, name: 'verified_1024.png', label: '1024x768 iPad / Tablet' },
      { w: 900, h: 700, scale: 1, name: 'verified_900.png', label: '900px Snapped Window' },
    ];

    console.log('========================================================================');
    console.log('RUNNING RESPONSIVE REGRESSION TEST SUITE (SPEC PANEL & 3D CANVAS)');
    console.log('========================================================================\n');

    let allPassed = true;

    for (const vp of viewports) {
      const res = await inspectViewport('http://127.0.0.1:4173/?skipPreloader=true', vp.w, vp.h, vp.scale, vp.name);
      
      const passInside = res.specIsInside && res.specRightOverflow === 0;
      const passNoHScroll = !res.hasHOverflow;
      const passCanvas = res.mainRect && res.mainRect.width > 200;

      const passed = passInside && passNoHScroll && passCanvas;
      if (!passed) allPassed = false;

      const statusTag = passed ? '✅ PASS' : '❌ FAIL';

      console.log(`${statusTag} [${vp.label}] ${vp.w}x${vp.h} (scale=${vp.scale}):`);
      console.log(`    Sidebar Rect:`, res.sidebarRect);
      console.log(`    3D Canvas Rect:`, res.mainRect ? `${res.mainRect.width}px wide (left=${res.mainRect.left}, right=${res.mainRect.right})` : 'none');
      console.log(`    Right Spec Panel:`, res.specRect ? `${res.specRect.width}px wide (left=${res.specRect.left}, right=${res.specRect.right})` : 'none');
      console.log(`    Spec Right Overflow: ${res.specRightOverflow}px (inside viewport: ${res.specIsInside})`);
      console.log(`    Horizontal Overflow: ${res.hasHOverflow ? 'YES (BAD)' : 'NO (GOOD)'}`);
      console.log('');
    }

    // Also test with a component selected (Specs table view)
    console.log('Testing with selected component (Platters Specs Tab):');
    const selectedRes = await inspectViewport('http://127.0.0.1:4173/?skipPreloader=true&selected=platters', 1280, 800, 1, 'verified_selected_1280.png');
    const selPassed = selectedRes.specIsInside && !selectedRes.hasHOverflow;
    console.log(`${selPassed ? '✅ PASS' : '❌ FAIL'} Selected Component View 1280x800:`);
    console.log(`    Spec Right Overflow: ${selectedRes.specRightOverflow}px, Clipped Cells: ${selectedRes.clippedCellsCount}`);
    console.log('');

    if (allPassed && selPassed) {
      console.log('========================================================================');
      console.log('🎉 ALL RESPONSIVE REGRESSION TESTS PASSED! ZERO CLIPPING, FULL VIEWPORT!');
      console.log('========================================================================');
    } else {
      console.error('❌ SOME TESTS FAILED.');
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
