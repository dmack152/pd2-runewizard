const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const entry = path.resolve(__dirname, '../src/services/zone-alert-scheduler.ts');
const compiled = esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
const loaded = new Module(entry, module);
loaded.filename = entry;
loaded._compile(compiled, entry);
const { createZoneAlarmSchedule } = loaded.exports;
const base = Date.parse('2026-10-22T18:39:59Z');
function harness() {
  let time = base, sequence = 0;
  const jobs = new Map(), wakes = [];
  const prefs = { enabled: true, selected: ['Cow Level'], advanceEnabled: true, soundEnabled: false };
  const schedule = createZoneAlarmSchedule({
    now: () => time, preferences: () => prefs, wake: () => wakes.push(time),
    setTimeout(callback, delay) { const id = ++sequence; jobs.set(id, { callback, at: time + delay }); return id; },
    clearTimeout(id) { jobs.delete(id); },
  });
  function advance(target) {
    time = target;
    for (const [id, job] of [...jobs]) if (job.at <= time) { jobs.delete(id); job.callback(); }
  }
  return { prefs, schedule, jobs, wakes, advance };
}
test('reminder and start deadlines fire independently of display-clock ticks', () => {
  const h = harness();
  h.schedule.arm();
  assert.equal(Math.min(...[...h.jobs.values()].map(j => j.at)), base + 1000);
  h.advance(base + 1000);
  h.advance(base + 301000);
  assert.deepEqual(h.wakes, [base + 1000, base + 301000]);
});
test('rearming never leaves duplicate deadlines, stopping removes every callback', () => {
  const h = harness();
  h.schedule.arm();
  const size = h.jobs.size;
  h.schedule.arm();
  assert.equal(h.jobs.size, size);
  h.schedule.stop();
  h.advance(base + 86400000);
  assert.equal(h.jobs.size, 0);
  assert.equal(h.wakes.length, 0);
});
test('pausing or clearing selected zones cancels prearmed alarms', () => {
  for (const change of ['pause', 'clear']) {
    const h = harness();
    h.schedule.arm();
    if (change === 'pause') h.prefs.enabled = false;
    else h.prefs.selected = [];
    h.schedule.arm();
    assert.equal(h.jobs.size, 0);
  }
});
test('turning off advance reminders preserves zone-start alarms', () => {
  const h = harness();
  h.prefs.advanceEnabled = false;
  h.schedule.arm();
  h.advance(base + 1000);
  assert.equal(h.wakes.length, 0);
  h.advance(base + 301000);
  assert.equal(h.wakes.length, 1);
});
test('the schedule renews after a day without focus or display-clock events', () => {
  const h = harness();
  h.schedule.arm();
  h.advance(base + 86400000);
  assert.ok([...h.jobs.values()].every(job => job.at > base + 86400000));
  assert.ok(h.jobs.size > 1);
});

test('changing the early-alert choice replaces the previously armed reminder', () => {
  const h = harness();
  h.schedule.arm();
  h.prefs.advanceMinutes = 1;
  h.schedule.arm();
  h.advance(base + 1000);
  assert.equal(h.wakes.length, 0);
  h.advance(base + 241000);
  assert.equal(h.wakes.length, 1);
});

test('twelve-minute reminders are armed before the old five-minute window', () => {
  let time = Date.parse('2026-10-22T18:32:59Z'), id = 0;
  const jobs = new Map(), wakes = [];
  const schedule = createZoneAlarmSchedule({
    now: () => time,
    preferences: () => ({ enabled: true, selected: ['Cow Level'], advanceEnabled: true, advanceMinutes: 12, soundEnabled: false }),
    wake: () => wakes.push(time),
    setTimeout: (callback, delay) => { jobs.set(++id, { callback, at: time + delay }); return id; },
    clearTimeout: id => jobs.delete(id),
  });
  schedule.arm();
  time += 1000;
  for (const job of jobs.values()) if (job.at <= time) job.callback();
  assert.deepEqual(wakes, [Date.parse('2026-10-22T18:33:00Z')]);
});
