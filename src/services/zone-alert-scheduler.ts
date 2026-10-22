import { zoneAt, ZONE_INTERVAL } from "../data/corrupted-zones";
import { getAdvanceMinutes, type AlertPreferences } from "./zone-alert-engine";

type SchedulerOptions = {
  now: () => number;
  preferences: () => AlertPreferences;
  wake: () => void;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
};

// Arm independent deadlines in advance, like exiledagain's tracker. Delivery
// still validates current preferences and receipts in the shared alert engine.
export function createZoneAlarmSchedule(options: SchedulerOptions) {
  const timers = new Set<number>();
  function stop() {
    timers.forEach(id => options.clearTimeout(id));
    timers.clear();
  }
  function arm() {
    stop();
    const preferences = options.preferences();
    if (!preferences.enabled || !preferences.selected.length) return;
    const now = options.now();
    const advanceTime = getAdvanceMinutes(preferences.advanceMinutes) * 60000;
    const horizon = now + 24 * 60 * 60000;
    const at = (time: number, callback: () => void) => {
      const id = options.setTimeout(() => { timers.delete(id); callback(); }, Math.max(0, time - now));
      timers.add(id);
    };
    for (let start = zoneAt(now).endsAt; start <= horizon + advanceTime; start += ZONE_INTERVAL) {
      const zone = zoneAt(start);
      if (!preferences.selected.includes(zone.name)) continue;
      if (start <= horizon) at(start, options.wake);
      const reminder = start - advanceTime;
      if (preferences.advanceEnabled && reminder > now && reminder <= horizon) at(reminder, options.wake);
    }
    at(horizon, () => { options.wake(); arm(); });
  }
  return { arm, stop };
}
