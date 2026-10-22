const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const esbuild = require('esbuild');
const compiled = esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../src/services/browser-zone-notifications.ts')],
  bundle: true, platform: 'node', format: 'cjs', write: false,
  define: { 'import.meta.env.BASE_URL': '"/pd2-runewizard/"' },
}).outputFiles[0].text;
const event = { id: '123:Cow Level:advance', name: 'Cow Level', startsAt: Date.now() + 300000, advance: true };
function harness(worker, { nativeAvailable = !worker, nativeEvent = 'show' } = {}) {
  const calls = [], timers = new Map();
  let sequence = 0, current = true;
  class Notification {
    constructor(title, options) {
      if (!nativeAvailable) throw new TypeError('Use a service worker');
      calls.push({ title, options, native: true });
      queueMicrotask(() => { if (nativeEvent === 'show') this.onshow?.(); else if (nativeEvent === 'error') this.onerror?.(); });
    }
    close() {}
  }
  const module = { exports: {} };
  const context = { module, exports: module.exports, Notification, URL, Date,
    navigator: worker ? { serviceWorker: { register: async () => worker } } : {},
    window: { location: { origin: 'http://localhost:8080' }, focus() {},
      setTimeout: fn => { timers.set(++sequence, fn); return sequence; }, clearTimeout: id => timers.delete(id) },
  };
  vm.runInNewContext(compiled, context);
  const sender = module.exports.createBrowserNotificationSender(() => current);
  return { send: (options = { silent: false, renotify: true }) => sender(event, options), prepare: sender.prepare, calls, timers, cancel: () => current = false };
}
const activeWorker = extra => ({ active: { state: 'activated' }, ...extra });
test('worker notifications carry the stable ID, sound preference, and tracker route', async () => {
  let options;
  const h = harness(activeWorker({ showNotification: async (_, value) => options = value }));
  await h.send({ silent: true, renotify: true });
  assert.equal(options.tag, 'pd2-zone-123%3ACow%20Level%3Aadvance');
  assert.equal(options.silent, true);
  assert.equal(options.data.url, 'http://localhost:8080/pd2-runewizard/#corrupted-zones');
  assert.equal(h.calls.length, 0);
  assert.equal(h.timers.size, 0);
});
test('worker rejection with acceptance evidence does not create another popup', async () => {
  const h = harness(activeWorker({ showNotification: async () => { throw Error('timeout'); }, getNotifications: async () => [{}] }));
  await h.send();
  assert.equal(h.calls.length, 0);
});
test('worker rejection without acceptance evidence fails for retry, without a racing fallback', async () => {
  const h = harness(activeWorker({ showNotification: async () => { throw Error('rejected'); }, getNotifications: async () => [] }));
  await assert.rejects(h.send(), /rejected/);
  assert.equal(h.calls.length, 0);
});
test('desktop notification waits for onshow and preserves sound settings', async () => {
  const h = harness();
  await h.send();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].options.silent, false);
  assert.equal(h.timers.size, 0);
});

test('desktop sends immediately even when a worker is unavailable', async () => {
  const h = harness({}, { nativeAvailable: true });
  await h.send();
  assert.equal(h.calls.length, 1);
  assert.equal(h.timers.size, 0);
});

test('browser display rejection propagates instead of being recorded as accepted', async () => {
  const h = harness(null, { nativeEvent: 'error' });
  await assert.rejects(h.send(), /rejected notification/);
  assert.equal(h.calls.length, 1);
  assert.equal(h.timers.size, 0);
});

test('worker can be prepared before a mobile alert is due', async () => {
  let sent = 0;
  const h = harness(activeWorker({ showNotification: async () => sent++ }));
  await h.prepare();
  assert.equal(sent, 0);
  await h.send();
  assert.equal(sent, 1);
});
test('cancelling during registration prevents notification delivery', async () => {
  const h = harness(activeWorker({ showNotification: async () => { throw Error('must not send'); } }));
  const pending = h.send();
  h.cancel();
  await assert.rejects(pending, error => error.constructor.name === 'AlertNoLongerDue');
  assert.equal(h.calls.length, 0);
});
