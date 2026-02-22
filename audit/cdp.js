// Minimal CDP client using Node 22 built-in WebSocket
const http = require('http');

const CHROMIUM_IP = process.env.CHROMIUM_IP || '172.18.0.9';
const CDP_PORT = process.env.CDP_PORT || 9223;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function getBrowserWsUrl() {
  const data = await httpGet(`http://${CHROMIUM_IP}:${CDP_PORT}/json/version`);
  return data.webSocketDebuggerUrl;
}

function createCdpConnection(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();
    const listeners = [];

    ws.onerror = reject;
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
      for (const [method, cb] of listeners) {
        if (msg.method === method) cb(msg.params);
      }
    };

    function send(method, params = {}) {
      const myId = id++;
      return new Promise((res) => {
        pending.set(myId, res);
        ws.send(JSON.stringify({ id: myId, method, params }));
      });
    }

    ws.onopen = () => resolve({
      send,
      on(method, cb) { listeners.push([method, cb]); },
      close() { ws.close(); }
    });
  });
}

async function openPage(url, width = 1440, height = 900) {
  const browserWs = await getBrowserWsUrl();
  const browser = await createCdpConnection(browserWs);
  const resp = await browser.send('Target.createTarget', { url: 'about:blank' });
  const targetId = resp.result.targetId;
  browser.close();

  const targets = await httpGet(`http://${CHROMIUM_IP}:${CDP_PORT}/json`);
  const target = targets.find(t => t.id === targetId);
  const page = await createCdpConnection(target.webSocketDebuggerUrl);

  await page.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false
  });
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('DOM.enable');

  const loadPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve('timeout'), 15000);
    page.on('Page.loadEventFired', () => { clearTimeout(timer); resolve('loaded'); });
  });
  await page.send('Page.navigate', { url });
  await loadPromise;
  // Shorter wait for local pages, longer for external
  const isLocal = url.includes('172.18') || url.includes('localhost');
  await new Promise(r => setTimeout(r, isLocal ? 1000 : 2000));

  async function evaluate(expression) {
    const result = await page.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true
    });
    if (result.result?.exceptionDetails) {
      throw new Error(result.result.exceptionDetails.exception?.description || 'eval error');
    }
    return result.result?.result?.value;
  }

  async function screenshot(timeoutMs = 30000) {
    const result = await Promise.race([
      page.send('Page.captureScreenshot', { format: 'png', quality: 80 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('screenshot timeout')), timeoutMs))
    ]);
    return Buffer.from(result.result.data, 'base64');
  }

  async function destroy() {
    page.close();
    const bws = await getBrowserWsUrl();
    const b = await createCdpConnection(bws);
    await b.send('Target.closeTarget', { targetId });
    b.close();
  }

  // Simulate hover on an element
  async function hover(selector) {
    const rect = await evaluate(`
      (function() {
        var el = document.querySelector('${selector.replace(/'/g, "\\'")}');
        if (!el) return null;
        var r = el.getBoundingClientRect();
        return { x: r.left + r.width/2, y: r.top + r.height/2 };
      })()
    `);
    if (!rect) return false;
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: rect.x, y: rect.y
    });
    await new Promise(r => setTimeout(r, 300));
    return true;
  }

  // Scroll the main content panel
  async function scrollTo(selector, top) {
    await evaluate(`
      (function() {
        var el = document.querySelector('${selector.replace(/'/g, "\\'")}');
        if (el) el.scrollTop = ${top};
      })()
    `);
    await new Promise(r => setTimeout(r, 500));
  }

  async function click(selector) {
    const rect = await evaluate(`
      (function() {
        var el = document.querySelector('${selector.replace(/'/g, "\\'")}');
        if (!el) return null;
        var r = el.getBoundingClientRect();
        return { x: r.left + r.width/2, y: r.top + r.height/2 };
      })()
    `);
    if (!rect) return false;
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await new Promise(r => setTimeout(r, 300));
    return true;
  }

  async function reload(waitMs = 5000) {
    const loadP = new Promise(resolve => {
      const timer = setTimeout(() => resolve('timeout'), 15000);
      page.on('Page.loadEventFired', () => { clearTimeout(timer); resolve('loaded'); });
    });
    await page.send('Page.reload');
    await loadP;
    await new Promise(r => setTimeout(r, waitMs));
  }

  return { evaluate, screenshot, destroy, hover, scrollTo, click, reload, targetId };
}

module.exports = { openPage };
