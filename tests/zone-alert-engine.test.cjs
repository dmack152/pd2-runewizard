const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const entry = path.resolve(__dirname, '../src/services/zone-alert-engine.ts');
const compiled = esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
const loaded = new Module(entry, module);
loaded.filename = entry;
loaded.paths = module.paths;
loaded._compile(compiled, entry);
const { createZoneAlertEngine, dueZoneAlerts, AlertCancelled } = loaded.exports;
const base = Date.parse('2026-10-22T18:40:00Z'); // Cow Level begins at 18:45 UTC.
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };

function harness(overrides = {}) {
  const prefs = { enabled: true, advanceEnabled: true, soundEnabled: true, selected: ['Cow Level'] };
  const receipts = new Map();
  const log = [];
  const state = { time: base, prefs, receipts, log };
  const ports = {
    now: () => state.time, preferences: () => prefs,
    receipts: { has: id => receipts.has(id), put: (id, expiry) => receipts.set(id, expiry) },
    lock: async action => action(),
    sound: async enabled => ({ mode: enabled ? 'chime' : 'off', play: async () => { log.push('chime'); return true; } }),
    notify: async (event, options) => { log.push({ event, options }); },
    sent: (event, delivery) => log.push({ sent: event.id, delivery }),
    failed: (event, error, retryAt) => log.push({ failed: event.id, retryAt }),
    ...overrides,
  };
  state.ports = ports;
  state.engine = createZoneAlertEngine(ports);
  return state;
}

test('five-minute boundary and zone-start alerts have separate stable IDs', async () => {
  const h = harness();
  h.time = base - 1;
  assert.equal(dueZoneAlerts(h.time, h.prefs).length, 0);
  h.time = base;
  await h.engine.check();
  await h.engine.check();
  h.time = base + 5 * 60000;
  await h.engine.check();
  const notifications = h.log.filter(e => e.event);
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].event.advance, true);
  assert.equal(notifications[1].event.advance, false);
  assert.notEqual(notifications[0].event.id, notifications[1].event.id);
  assert.equal(h.log.filter(e => e === 'chime').length, 2);
});

test('chime waits for notification acceptance', async () => {
  const gate = deferred();
  const h = harness({ notify: async () => gate.promise });
  const delivery = h.engine.check();
  await new Promise(setImmediate);
  assert.equal(h.log.includes('chime'), false);
  assert.equal(h.receipts.size, 0);
  gate.resolve();
  await delivery;
  assert.equal(h.log.filter(e => e === 'chime').length, 1);
  assert.equal(h.receipts.size, 1);
});

test('failed delivery makes no sound, keeps preferences, retries once after backoff', async () => {
  let fail = true;
  let calls = 0;
  const h = harness({ notify: async () => { calls++; if (fail) throw new Error('offline'); } });
  await h.engine.check();
  assert.equal(h.prefs.enabled, true);
  assert.equal(h.log.includes('chime'), false);
  assert.equal(h.receipts.size, 0);
  h.time += 30000;
  await h.engine.check();
  assert.equal(calls, 1);
  fail = false;
  h.time += 30000;
  await h.engine.check();
  await h.engine.check();
  assert.equal(calls, 2);
  assert.equal(h.log.filter(e => e === 'chime').length, 1);
});

test('sound off silences notification and chime', async () => {
  const h = harness();
  h.prefs.soundEnabled = false;
  await h.engine.check();
  assert.equal(h.log.find(e => e.event).options.silent, true);
  assert.equal(h.log.includes('chime'), false);
});

test('background/blocked audio plan requests system sound', async () => {
  const h = harness({ sound: async () => ({ mode: 'browser' }) });
  await h.engine.check();
  assert.equal(h.log.find(e => e.event).options.silent, false);
  assert.equal(h.log.find(e => e.sent).delivery.sound, 'browser');
});

test('chime failure uses browser sound on the same unique alert', async () => {
  const h = harness({ sound: async () => ({ mode: 'chime', play: async () => false }) });
  await h.engine.check();
  await h.engine.check();
  const attempts = h.log.filter(e => e.event);
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].event.id, attempts[1].event.id);
  assert.equal(attempts[0].options.silent, true);
  assert.equal(attempts[1].options.silent, false);
  assert.equal(h.receipts.size, 1);
});

for (const change of ['pause', 'unselect', 'advance off', 'expired']) {
  test(`revalidates after async audio preparation: ${change}`, async () => {
    const gate = deferred();
    const h = harness({ sound: async () => { await gate.promise; return { mode: 'browser' }; } });
    const pending = h.engine.check();
    await new Promise(setImmediate);
    if (change === 'pause') h.prefs.enabled = false;
    if (change === 'unselect') h.prefs.selected = [];
    if (change === 'advance off') h.prefs.advanceEnabled = false;
    if (change === 'expired') h.time += 6 * 60000;
    gate.resolve();
    await pending;
    assert.equal(h.log.filter(e => e.event).length, 0);
  });
}

test('two tabs under a shared lock produce one notification and one chime', async () => {
  let chain = Promise.resolve();
  const lock = async action => { const next = chain.then(action); chain = next.catch(() => {}); await next; };
  const h = harness({ lock });
  const second = createZoneAlertEngine(h.ports);
  await Promise.all([h.engine.check(), second.check(), h.engine.check()]);
  assert.equal(h.log.filter(e => e.event).length, 1);
  assert.equal(h.log.filter(e => e === 'chime').length, 1);
});

test('refresh/return does not replay a delivered event', async () => {
  const h = harness();
  await h.engine.check();
  await createZoneAlertEngine(h.ports).check();
  assert.equal(h.log.filter(e => e.event).length, 1);
});

test('receipt storage failure does not resend an accepted notification', async () => {
  const h = harness({ receipts: { has: () => false, put: () => { throw new Error('storage blocked'); } } });
  await h.engine.check();
  await h.engine.check();
  assert.equal(h.log.filter(e => e.event).length, 1);
  assert.equal(h.log.filter(e => e === 'chime').length, 1);
});

test('a failed active-zone alert does not suppress the upcoming reminder', async () => {
  const h = harness({ notify: async event => { if (!event.advance) throw new Error('failed active alert'); } });
  h.prefs.selected.push('Outer Cloister and Barracks');
  await h.engine.check();
  assert.equal(h.log.filter(e => e.failed).length, 1);
  assert.equal(h.log.filter(e => e.sent).length, 1);
});

test('cancelled transport does not record failure, acceptance, or sound', async () => {
  const h = harness({ notify: async () => { throw new AlertCancelled(); } });
  await h.engine.check();
  assert.equal(h.receipts.size, 0);
  assert.deepEqual(h.log, []);
});

test('muting while delivery is pending suppresses the prepared chime', async () => {
  const gate = deferred();
  const h = harness({ notify: async () => gate.promise });
  const pending = h.engine.check();
  await new Promise(setImmediate);
  h.prefs.soundEnabled = false;
  gate.resolve();
  await pending;
  assert.equal(h.log.includes('chime'), false);
  assert.equal(h.log.find(e => e.sent).delivery.sound, 'off');
});

test('UI callback failure cannot replay an accepted alert', async () => {
  const h = harness({ sent: () => { throw new Error('UI unavailable'); } });
  await h.engine.check();
  await h.engine.check();
  assert.equal(h.log.filter(e => e.event).length, 1);
});
