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

async function testWidths() {
  const server = await startServer(4173);
  const port = 9350;
  const profileDir = path.join(process.env.TEMP || '.', `chrome_test_${Date.now()}`);

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
    const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('http://127.0.0.1:4173/?skipPreloader=true')}`, { method: 'PUT' });
    const tab = await newTabRes.json();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    function send(method, params = {}) {
      return new Promise((res) => {
        const reqId = id++;
        callbacks.set(reqId, res);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id && callbacks.has(data.id)) {
        const cb = callbacks.get(data.id);
        callbacks.delete(data.id);
        cb(data.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));
    await send('Page.enable');

    // Wait 2s for initial load
    await new Promise((r) => setTimeout(r, 2000));

    const testCases = [
      { w: 1920, h: 1080, scale: 1 },
      { w: 1600, h: 900, scale: 1 },
      { w: 1440, h: 900, scale: 1 },
      { w: 1366, h: 768, scale: 1 },
      { w: 1280, h: 800, scale: 1 },
      { w: 1280, h: 800, scale: 1.25 },
      { w: 1200, h: 800, scale: 1 },
      { w: 1150, h: 800, scale: 1 },
      { w: 1105, h: 800, scale: 1 },
      { w: 1100, h: 800, scale: 1 },
      { w: 1050, h: 800, scale: 1 },
      { w: 900, h: 800, scale: 1 },
      { w: 800, h: 600, scale: 1 },
    ];

    console.log('Testing viewport layout dimensions:');
    for (const tc of testCases) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: tc.w,
        height: tc.h,
        deviceScaleFactor: tc.scale,
        mobile: false
      });
      // trigger resize event in window
      await send('Runtime.evaluate', { expression: `window.dispatchEvent(new Event('resize'))` });
      await new Promise((r) => setTimeout(r, 300));

      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const winWidth = window.innerWidth;
          const rootEl = document.querySelector('.relative.w-screen') || document.getElementById('root');
          const header = document.querySelector('header');
          const sidebar = document.querySelector('nav[aria-label="Component directory"]')?.closest('div.shrink-0');
          const main = document.querySelector('main');
          const focusCard = document.querySelector('aside[aria-label="Component specifications"]');
          const focusContainer = focusCard?.closest('div.shrink-0');

          return {
            winWidth,
            rootScrollWidth: rootEl ? rootEl.scrollWidth : 0,
            rootClientWidth: rootEl ? rootEl.clientWidth : 0,
            headerScrollWidth: header ? header.scrollWidth : 0,
            headerClientWidth: header ? header.clientWidth : 0,
            sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : 0,
            mainWidth: main ? main.getBoundingClientRect().width : 0,
            focusWidth: focusContainer ? focusContainer.getBoundingClientRect().width : 0,
            focusRight: focusContainer ? focusContainer.getBoundingClientRect().right : 0,
            overflowPixels: focusContainer ? (focusContainer.getBoundingClientRect().right - winWidth) : 0,
            isNarrow: window.innerWidth <= 1100
          };
        })()`,
        returnByValue: true
      });

      const v = evalRes.result.value;
      console.log(`[${tc.w}x${tc.h} scale=${tc.scale}] win=${v.winWidth} rootScroll=${v.rootScrollWidth} rootClient=${v.rootClientWidth} headerScroll=${v.headerScrollWidth} sidebar=${v.sidebarWidth} main=${v.mainWidth} focus=${v.focusWidth} focusRight=${v.focusRight} (overflow: ${v.overflowPixels}px, isNarrow: ${v.isNarrow})`);
    }

    ws.close();
  } finally {
    chromeProc.kill();
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
    server.close();
  }
}

testWidths().catch(console.error);
