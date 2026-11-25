import http from 'http';
import fs from 'fs';
import os from 'os';
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

function startServer(port = 4176, root = 'dist') {
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

async function run() {
  const server = await startServer(4176);
  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9522;
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

  await waitPort(port);
  const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
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

  await new Promise((resolve) => { ws.onopen = resolve; });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('[TEST] Navigating to cleanroom HDD explorer...');
  await send('Page.navigate', { url: 'http://127.0.0.1:4176/?skipPreloader=1' });
  // Wait for glTF and Draco decompression
  await new Promise((r) => setTimeout(r, 7000));

  // Verify initial state
  const eval1 = await send('Runtime.evaluate', {
    expression: 'window.useHddStore.getState().selectedPartId',
    returnByValue: true
  });
  console.log('[TEST] Initial selectedPartId:', eval1.result.value);

  // Debug buttons on page
  const buttonsDebug = await send('Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText,
        title: b.title,
        ariaLabel: b.getAttribute('aria-label'),
        classes: b.className
      }))
    `,
    returnByValue: true
  });
  console.log('[TEST DEBUG] Buttons found on page:', JSON.stringify(buttonsDebug.result.value, null, 2));

  const saveShots = process.argv.includes('--save-shots');
  const shotDir = saveShots ? path.join(os.tmpdir(), 'hecks_test_shots') : null;
  if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

  const captureOptional = async (filename) => {
    if (!shotDir) return;
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(shotDir, filename);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`[TEST] Saved ${outPath}`);
  };

  // 1. Verify closed Hero state shows only exterior/underside callouts (5 parts)
  const figButtonsClosed = (buttonsDebug.result.value || []).filter((b) => b.text.startsWith('FIG_'));
  console.log(`[TEST] Closed hero callout count: ${figButtonsClosed.length}`);
  if (figButtonsClosed.length !== 5) {
    throw new Error(`Expected 5 exterior callouts when closed, got ${figButtonsClosed.length}`);
  }
  await captureOptional('hero.png');

  // 2. Test selecting Platters (Part 04) and verifying auto-explode reveals internals
  console.log('[TEST] Selecting Magnetic Platters (Part 04)...');
  await send('Runtime.evaluate', {
    expression: 'window.useHddStore.getState().setSelectedPartId("platters")',
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 1200));

  const explodeAfterPlatters = await send('Runtime.evaluate', {
    expression: 'window.useHddStore.getState().explodedProgress',
    returnByValue: true
  });
  console.log('[TEST] explodedProgress after selecting platters:', explodeAfterPlatters.result.value);
  if (explodeAfterPlatters.result.value < 0.35) {
    throw new Error(`Expected auto-explode >= 0.35, got ${explodeAfterPlatters.result.value}`);
  }
  await captureOptional('selected_platters.png');

  // 3. Test Keyboard J navigation (Next part) & L (callout toggle) & 1 (Hero preset)
  console.log('[TEST] Pressing "J" key for sequential navigation...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', text: 'j', key: 'j', code: 'KeyJ' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', text: 'j', key: 'j', code: 'KeyJ' });
  await new Promise((r) => setTimeout(r, 600));

  const eval3 = await send('Runtime.evaluate', {
    expression: 'window.useHddStore.getState().selectedPartId',
    returnByValue: true
  });
  console.log('[TEST] Selected part after pressing J:', eval3.result.value);
  if (eval3.result.value !== 'spindle_motor') {
    throw new Error(`Expected spindle_motor after J, got ${eval3.result.value}`);
  }
  await captureOptional('selected_spindle.png');

  // 4. Test Exploded View at 100% (Assembly Overview) shows all 11 callouts
  console.log('[TEST] Deselecting part and setting exploded progress to 100%...');
  await send('Runtime.evaluate', {
    expression: 'window.useHddStore.getState().setSelectedPartId(null); window.useHddStore.getState().setExplodedProgress(1.0);',
    returnByValue: true
  });
  await new Promise((r) => setTimeout(r, 1800));

  const explodedCountRes = await send('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('button')).filter(b => b.innerText.startsWith('FIG_')).length`,
    returnByValue: true
  });
  console.log('[TEST] Exploded 100% callout count:', explodedCountRes.result.value);
  if (explodedCountRes.result.value !== 11) {
    throw new Error(`Expected 11 callouts at 100% explode, got ${explodedCountRes.result.value}`);
  }
  await captureOptional('exploded.png');

  // 5. Test 'L' key toggles callouts off & back on
  await send('Input.dispatchKeyEvent', { type: 'keyDown', text: 'l', key: 'l', code: 'KeyL' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', text: 'l', key: 'l', code: 'KeyL' });
  await new Promise((r) => setTimeout(r, 250));
  const pinsAfterL = await send('Runtime.evaluate', {
    expression: 'window.useHddStore.getState().showCalloutPins',
    returnByValue: true
  });
  if (pinsAfterL.result.value !== false) {
    throw new Error('Expected L hotkey to hide callout pins');
  }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', text: 'l', key: 'l', code: 'KeyL' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', text: 'l', key: 'l', code: 'KeyL' });

  console.log('[TEST] All checks passed cleanly!');
  chromeProc.kill();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {}
  server.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
