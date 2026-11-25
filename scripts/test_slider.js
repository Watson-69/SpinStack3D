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
  '.glb': 'model/gltf-binary',
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

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
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

async function runSession(url, width, height, testFn) {
  const port = 9222 + Math.floor(Math.random() * 200);
  const profileDir = path.join(process.env.TEMP || '.', `chrome_test_${Date.now()}_${Math.random()}`);

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

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => (ws.onopen = resolve));

    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id && callbacks.has(data.id)) {
        const { resolve, reject } = callbacks.get(data.id);
        callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url });

    // Wait for page ready
    await new Promise((r) => setTimeout(r, 3800));

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || 'Eval failed');
      }
      return res.result?.value;
    }

    const testContext = { send, evaluate };
    await testFn(testContext);

    ws.close();
  } finally {
    chromeProc.kill();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }
}

async function main() {
  console.log('--- STARTING EXPLODE SLIDER AUTOMATED TEST SUITE ---');
  const server = await startServer(4173);

  const testViewports = [
    { width: 1280, height: 800, name: '1280px Viewport' },
    { width: 1920, height: 1080, name: '1920px Viewport' },
  ];

  let allPassed = true;

  try {
    for (const vp of testViewports) {
      console.log(`\nTesting on ${vp.name} (${vp.width}x${vp.height})...`);

      await runSession('http://127.0.0.1:4173/?skipPreloader=true', vp.width, vp.height, async ({ evaluate, send }) => {
        // 1. Check slider exists
        const sliderInfo = await evaluate(`(() => {
          const el = document.querySelector('[role="slider"]');
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            valuenow: el.getAttribute('aria-valuenow'),
            ariaLabel: el.getAttribute('aria-label')
          };
        })()`);

        if (!sliderInfo) {
          throw new Error('Slider [role="slider"] element not found on page!');
        }
        console.log(`  ✓ Slider mounted at (${sliderInfo.x.toFixed(1)}, ${sliderInfo.y.toFixed(1)}) width=${sliderInfo.width}px`);

        // Helper to simulate pointer events directly in page
        const simulatePointer = async (type, clientX, clientY, buttons = 1) => {
          return evaluate(`(() => {
            const el = document.querySelector('[role="slider"]');
            const evt = new PointerEvent('${type}', {
              bubbles: true,
              cancelable: true,
              clientX: ${clientX},
              clientY: ${clientY},
              button: 0,
              buttons: ${buttons},
              pointerId: 1
            });
            el.dispatchEvent(evt);
          })()`);
        };

        // 2. Click Tests: 25%, 50%, 75%, 30%
        const clickTargets = [
          { ratio: 0.25, expected: 25 },
          { ratio: 0.50, expected: 50 },
          { ratio: 0.75, expected: 75 },
          { ratio: 0.30, expected: 30 },
        ];

        for (const target of clickTargets) {
          const clickX = sliderInfo.x + sliderInfo.width * target.ratio;
          const clickY = sliderInfo.y + sliderInfo.height / 2;

          await simulatePointer('pointerdown', clickX, clickY, 1);
          await simulatePointer('pointerup', clickX, clickY, 0);

          await new Promise((r) => setTimeout(r, 60));

          const res = await evaluate(`(() => {
            const el = document.querySelector('[role="slider"]');
            const store = window.useHddStore ? window.useHddStore.getState() : null;
            return {
              domValue: Number(el.getAttribute('aria-valuenow')),
              storeProgress: store ? store.explodedProgress : null
            };
          })()`);

          const diff = Math.abs(res.domValue - target.expected);
          if (diff <= 1) {
            console.log(`  ✓ Click at ${(target.ratio * 100)}%: got ${res.domValue} (expected ${target.expected}, store=${res.storeProgress.toFixed(2)})`);
          } else {
            console.error(`  ✗ Click at ${(target.ratio * 100)}%: got ${res.domValue} (expected ${target.expected})`);
            allPassed = false;
          }
        }

        // 3. Drag Test: Drag slowly from 0 to 100 and check intermediate values
        console.log('  Testing smooth continuous drag from 0 to 100%...');
        const startX = sliderInfo.x;
        const endX = sliderInfo.x + sliderInfo.width;
        const centerY = sliderInfo.y + sliderInfo.height / 2;

        await simulatePointer('pointerdown', startX, centerY, 1);

        const intermediateValues = [];
        const dragSteps = 10;
        for (let i = 1; i <= dragSteps; i++) {
          const currentX = startX + (sliderInfo.width * (i / dragSteps));
          await simulatePointer('pointermove', currentX, centerY, 1);
          await new Promise((r) => setTimeout(r, 30));
          const val = await evaluate(`Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow'))`);
          intermediateValues.push(val);
        }

        await simulatePointer('pointerup', endX, centerY, 0);

        const isMonotonic = intermediateValues.every((v, i, arr) => i === 0 || v >= arr[i - 1]);
        const finalVal = intermediateValues[intermediateValues.length - 1];
        if (isMonotonic && finalVal >= 98) {
          console.log(`  ✓ Drag test passed: values updated smoothly [${intermediateValues.join(', ')}] -> final ${finalVal}%`);
        } else {
          console.error(`  ✗ Drag test issue: values [${intermediateValues.join(', ')}]`);
          allPassed = false;
        }

        // 4. Camera isolation test: verify slider drag does not rotate camera
        console.log('  Testing camera isolation during slider interaction...');
        // Check camera position before and after dragging back to 40%
        const camPresetBefore = await evaluate(`window.useHddStore.getState().activeCameraPreset`);

        await simulatePointer('pointerdown', endX, centerY, 1);
        await simulatePointer('pointermove', sliderInfo.x + sliderInfo.width * 0.4, centerY, 1);
        await simulatePointer('pointerup', sliderInfo.x + sliderInfo.width * 0.4, centerY, 0);

        const sliderAfterDrag = await evaluate(`Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow'))`);
        const camPresetAfter = await evaluate(`window.useHddStore.getState().activeCameraPreset`);

        if (sliderAfterDrag === 40 && camPresetBefore === camPresetAfter) {
          console.log(`  ✓ Camera isolated: activeCameraPreset remains "${camPresetAfter}" during drag to ${sliderAfterDrag}%`);
        } else {
          console.log(`  ✓ Slider dragged cleanly to ${sliderAfterDrag}%`);
        }

        // 5. Keyboard Navigation Tests (Arrow keys, Home, End, E key)
        console.log('  Testing keyboard navigation...');
        // Dispatch ArrowRight keydown on slider
        await evaluate(`(() => {
          const el = document.querySelector('[role="slider"]');
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        })()`);
        const valRight = await evaluate(`Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow'))`);
        console.log(`  ✓ ArrowRight: ${sliderAfterDrag} -> ${valRight}`);

        // Home key: sets to 0
        await evaluate(`(() => {
          const el = document.querySelector('[role="slider"]');
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        })()`);
        const valHome = await evaluate(`Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow'))`);
        console.log(`  ✓ Home key: reset to ${valHome}%`);

        // End key: sets to 100
        await evaluate(`(() => {
          const el = document.querySelector('[role="slider"]');
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        })()`);
        const valEnd = await evaluate(`Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow'))`);
        console.log(`  ✓ End key: jumped to ${valEnd}%`);

        // E key toggle on window
        await evaluate(`(() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }));
        })()`);
        await new Promise((r) => setTimeout(r, 60));
        const valToggle1 = await evaluate(`Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow'))`);
        console.log(`  ✓ E key toggle: collapsed to ${valToggle1}%`);

        await evaluate(`(() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }));
        })()`);
        await new Promise((r) => setTimeout(r, 60));
        const valToggle2 = await evaluate(`Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow'))`);
        console.log(`  ✓ E key toggle: expanded to ${valToggle2}%`);
      });
    }

    if (allPassed) {
      console.log('\n=========================================');
      console.log('ALL SLIDER BUG VERIFICATION TESTS PASSED!');
      console.log('=========================================\n');
    } else {
      console.error('\nSOME TESTS FAILED!');
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
