import { reactive } from "vue";
import { corruptedZones, zoneAt, ZONE_INTERVAL } from "@/data/corrupted-zones";
import { alertId, createZoneAlertEngine, dueZoneAlerts, type AlertDelivery, type SoundPlan } from "@/services/zone-alert-engine";
import { createBrowserNotificationSender } from "@/services/browser-zone-notifications";

const settingsKey = "runewizard-zone-alerts";
const deliveredKey = "runewizard-zone-alert-delivered";
const historyKey = "runewizard-zone-alert-history";
type AlertRecord = { name: string; startsAt: number; advance: boolean; status: "sent" | "missed" | "failed"; checkedAt: number; sound?: AlertDelivery["sound"] };
const createZoneState = () => reactive({
  now: Date.now(),
  selected: [] as string[],
  enabled: false,
  permissionBlocked: false,
  busy: false,
  message: "",
  notice: null as { name: string; startsAt: number; advance: boolean; expiresAt?: number } | null,
  soundEnabled: false,
  soundReady: false,
  soundMessage: "",
  advanceEnabled: false,
  lastNotification: "",
  history: [] as AlertRecord[],
  schedulerMessage: "",
  supported: typeof Notification !== "undefined" && "requestPermission" in Notification && "permission" in Notification && window.isSecureContext,
});
// Keep the shared state attached to existing components during local hot updates.
export const zoneState: ReturnType<typeof createZoneState> = import.meta.hot?.data.zoneState || createZoneState();

const delivered: Set<string> = import.meta.hot?.data.delivered || new Set<string>();
let audio: AudioContext | null = import.meta.hot?.data.audio || null;
let stopClock: (() => void) | null = null;

function save() {
  try { localStorage.setItem(settingsKey, JSON.stringify({ selected: zoneState.selected, enabled: zoneState.enabled, soundEnabled: zoneState.soundEnabled, advanceEnabled: zoneState.advanceEnabled })); } catch { /* Optional persistence. */ }
}

function notificationPermission(): NotificationPermission {
  if (!zoneState.supported) return "denied";
  // eslint-disable-next-line compat/compat -- Optional API guarded by supported.
  return Notification.permission;
}

function recordAlert(zone: AlertZone, status: AlertRecord["status"], sound?: AlertDelivery["sound"]) {
  const entry = { ...zone, status, checkedAt: Date.now(), sound };
  zoneState.history = [entry, ...(zoneState.history || []).filter(item => !(item.name === entry.name && item.startsAt === entry.startsAt && item.advance === entry.advance))].slice(0, 10);
  try { localStorage.setItem(historyKey, JSON.stringify(zoneState.history)); } catch { /* Diagnostics are optional. */ }
}

export function reminderWasSent(name: string, startsAt: number): boolean {
  const key = alertId(name, startsAt, true);
  if (delivered.has(key)) return true;
  try { return !!JSON.parse(localStorage.getItem(deliveredKey) || "{}")[key]; } catch { return false; }
}

async function unlockSound(): Promise<boolean> {
  try {
    if (typeof AudioContext === "undefined") throw new Error("Audio unavailable");
    if (!audio || audio.state === "closed") {
      audio = new AudioContext();
      audio.onstatechange = () => { zoneState.soundReady = audio?.state === "running"; };
    }
    if (audio.state !== "running") await resumeAudio(audio);
    zoneState.soundReady = audio.state === "running";
    if (!zoneState.soundReady) throw new Error("Audio suspended");
    zoneState.soundMessage = "Sound is ready in this tab. Keep the tab unmuted.";
    return true;
  } catch {
    zoneState.soundReady = false;
    zoneState.soundMessage = "Sound is blocked or unavailable. Unmute this tab and click Test sound.";
    return false;
  }
}

async function resumeAudio(context: AudioContext) {
  let timeout = 0;
  try {
    await Promise.race([
      context.resume(),
      new Promise<never>((_, reject) => { timeout = window.setTimeout(() => reject(new Error("Audio resume blocked")), 2000); }),
    ]);
  } finally { window.clearTimeout(timeout); }
}

async function playChime() {
  if (!audio || audio.state === "closed") {
    zoneState.soundReady = false;
    zoneState.soundMessage = "Click Test sound to activate sound in this tab after opening or reloading the site.";
    return false;
  }
  const context = audio;
  try {
    // An unlocked context can become suspended while the tab is in the background.
    // Resume it for each alert, independently of desktop notification delivery.
    if (context.state !== "running") await resumeAudio(context);
    if (context.state !== "running") throw new Error("Audio is not running");
    zoneState.soundReady = true;
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.2;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.32);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
    zoneState.soundMessage = `Chime played at ${new Date(zoneState.now).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Keep the tab unmuted.`;
    return true;
  } catch {
    zoneState.soundReady = false;
    zoneState.soundMessage = "The browser suspended or blocked the chime. Restore this tab and click Test sound. Desktop notifications are still sent separately.";
    return false;
  }
}

export async function testAlertSound() {
  if (await unlockSound()) await playChime();
}

export async function setAlertSound(enabled: boolean) {
  zoneState.soundEnabled = enabled;
  save();
  if (enabled) await testAlertSound();
}

export function setAdvanceAlert(enabled: boolean) {
  zoneState.advanceEnabled = enabled;
  save();
  void checkAlert();
}

export function selectAlertZone(name: string, checked: boolean) {
  zoneState.selected = checked ? [...new Set([...zoneState.selected, name])] : zoneState.selected.filter(zone => zone !== name);
  save();
  void checkAlert();
}

export function clearAlertZones() {
  zoneState.selected = [];
  save();
}

export function pauseAlerts() {
  zoneState.enabled = false;
  zoneState.message = "Notifications paused.";
  save();
}

export async function enableAlerts() {
  if (!zoneState.supported || zoneState.busy || !zoneState.selected.length) return;
  zoneState.busy = true;
  try {
    if (zoneState.soundEnabled) void unlockSound();
    // Optional API: feature-detected above and requested only after a visitor clicks Enable.
    // eslint-disable-next-line compat/compat
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      zoneState.enabled = false;
      zoneState.message = permission === "denied" ? "Notifications are blocked. Allow them in your browser’s site settings, then try again." : "Permission was not granted. You can enable notifications when you’re ready.";
    } else {
      zoneState.enabled = true;
      zoneState.message = "Notifications enabled for your selected zones.";
    }
    save();
    await checkAlert();
  } catch {
    zoneState.enabled = false;
    zoneState.message = "This browser could not enable notifications. Try opening the site in Chrome, Edge, or Firefox.";
    save();
  } finally { zoneState.busy = false; }
}

type AlertZone = { name: string; startsAt: number; advance: boolean };

export function dismissZoneNotice() {
  zoneState.notice = null;
}

function readReceipts(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(deliveredKey) || "{}");
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  } catch { /* In-memory receipts work when storage is unavailable. */ }
  return {};
}

async function sharedDeliveryLock(action: () => Promise<void>) {
  type Locks = { request(name: string, options: { ifAvailable: boolean }, callback: (lock: { name: string } | null) => Promise<void>): Promise<void> };
  const locks = (navigator as Navigator & { locks?: Locks }).locks;
  if (locks) {
    await locks.request("runewizard-zone-alert-delivery", { ifAvailable: true }, async lock => { if (lock) await action(); });
  } else await action();
}

async function prepareAlertSound(enabled: boolean): Promise<SoundPlan> {
  if (!enabled) return { mode: "off" };
  if (document.visibilityState !== "visible") {
    zoneState.soundMessage = "Background alerts request your browser’s notification sound. Chrome and device sound settings control its volume.";
    return { mode: "browser" };
  }
  if (audio && audio.state !== "closed") {
    try {
      if (audio.state !== "running") await resumeAudio(audio);
      if (audio.state === "running") return { mode: "chime", play: playChime };
    } catch { /* Browser notification sound is the fallback. */ }
  }
  zoneState.soundReady = false;
  zoneState.soundMessage = "Browser notification sound requested because the site chime is not ready. Test sound activates the chime in this tab.";
  return { mode: "browser" };
}

const sendZoneNotification = createBrowserNotificationSender(event => zoneState.enabled && notificationPermission() === "granted" && dueZoneAlerts(Date.now(), zoneState).some(item => item.id === event.id));
const alertEngine = createZoneAlertEngine({
  now: () => Date.now(),
  preferences: () => zoneState,
  receipts: {
    has: id => delivered.has(id) || (readReceipts()[id] || 0) > Date.now(),
    put(id, expiresAt) {
      delivered.add(id);
      const receipts = readReceipts();
      receipts[id] = expiresAt;
      for (const key of Object.keys(receipts)) if (receipts[key] <= Date.now()) delete receipts[key];
      try { localStorage.setItem(deliveredKey, JSON.stringify(receipts)); } catch { /* In-memory acceptance still prevents duplicates. */ }
    },
  },
  lock: sharedDeliveryLock,
  sound: prepareAlertSound,
  notify: sendZoneNotification,
  sent(event, delivery) {
    zoneState.notice = { ...event };
    recordAlert(event, "sent", delivery.sound);
    zoneState.lastNotification = `${event.name} (${event.advance ? "advance reminder" : "active now"}) · ${new Date(delivery.checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    zoneState.message = "Notification sent. Your alerts remain enabled.";
  },
  failed(event) {
    recordAlert(event, "failed");
    zoneState.message = "Notification delivery failed. Alerts remain enabled and retry in one minute while this alert is still relevant. No chime plays for a failed delivery.";
  },
});

async function checkAlert() {
  zoneState.permissionBlocked = zoneState.supported && notificationPermission() !== "granted";
  if (!zoneState.enabled || !zoneState.supported) return;
  if (zoneState.permissionBlocked) {
    zoneState.message = "Browser notification permission is blocked. Your saved alert setting is still on; allow notifications in site settings or click Enable notifications.";
    return;
  }
  await alertEngine.check();
}

export function loadZoneSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;
    zoneState.selected = Array.isArray(saved.selected) ? corruptedZones.filter(zone => saved.selected.includes(zone)) : [];
    zoneState.soundEnabled = saved.soundEnabled === true;
    zoneState.advanceEnabled = saved.advanceEnabled === true;
    if (zoneState.soundEnabled && !zoneState.soundReady) zoneState.soundMessage = "Click Test sound to activate sound in this tab after opening or reloading the site.";
    zoneState.enabled = saved.enabled === true;
    zoneState.permissionBlocked = zoneState.supported && notificationPermission() !== "granted";
  } catch { /* Preserve current settings if storage is blocked or invalid. */ }
}

function startZoneClock() {
  if (stopClock) stopClock();
  loadZoneSettings();
  try {
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    if (Array.isArray(history)) zoneState.history = history.filter(item => item && corruptedZones.includes(item.name) && ["sent", "missed", "failed"].includes(item.status) && typeof item.startsAt === "number" && typeof item.checkedAt === "number").slice(0, 10);
  } catch { /* Preserve in-memory history. */ }
  const tick = () => {
    const previousCheck = zoneState.now;
    zoneState.now = Date.now();
    if (zoneState.now - previousCheck > 75000) {
      const gapMinutes = Math.max(1, Math.round((zoneState.now - previousCheck) / 60000));
      zoneState.schedulerMessage = `The page did not check alerts for about ${gapMinutes} minutes. The browser or device may have paused it.`;
      if (zoneState.enabled && zoneState.advanceEnabled) {
        const start = zoneAt(Math.max(previousCheck, zoneState.now - 24 * 60 * 60000)).endsAt;
        for (let time = start; time <= zoneState.now; time += ZONE_INTERVAL) {
          const zone = zoneAt(time);
          if (zone.startsAt - 5 * 60000 > previousCheck && zoneState.selected.includes(zone.name) && !reminderWasSent(zone.name, zone.startsAt)) {
            recordAlert({ ...zone, advance: true }, "missed");
          }
        }
      }
    }
    if (zoneState.notice && zoneState.now >= (zoneState.notice.expiresAt || zoneState.notice.startsAt + (zoneState.notice.advance ? 0 : ZONE_INTERVAL))) zoneState.notice = null;
    void checkAlert();
  };
  tick();
  const timer = window.setInterval(tick, 1000);
  document.addEventListener("visibilitychange", tick);
  document.addEventListener("resume", tick);
  window.addEventListener("focus", tick);
  window.addEventListener("pageshow", tick);
  const syncSettings = (event: StorageEvent) => {
    if (event.key === settingsKey || event.key === null) { loadZoneSettings(); tick(); }
  };
  window.addEventListener("storage", syncSettings);
  const openFromNotification = (event: MessageEvent) => {
    if (event.data?.type === "OPEN_CORRUPTED_ZONES") { window.location.hash = "corrupted-zones"; window.focus(); }
  };
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", openFromNotification);
  stopClock = () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
    document.removeEventListener("resume", tick);
    window.removeEventListener("focus", tick);
    window.removeEventListener("pageshow", tick);
    window.removeEventListener("storage", syncSettings);
    if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", openFromNotification);
    stopClock = null;
  };
  return stopClock;
}

if (import.meta.hot) {
  import.meta.hot.data.zoneState = zoneState;
  import.meta.hot.dispose(data => {
    data.zoneState = zoneState;
    data.audio = audio;
    data.delivered = delivered;
    if (stopClock) stopClock();
  });
}

// The clock belongs to the page, rather than App's mount/unmount lifecycle.
// Every hot replacement installs its own timer after the old module disposes it.
startZoneClock();

export function zoneCountdown(timestamp: number): string {
  const seconds = Math.max(0, Math.ceil((timestamp - zoneState.now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m ${remainder}s` : `${minutes}:${remainder}`;
}
