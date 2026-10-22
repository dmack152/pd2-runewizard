import { zoneAt, ZONE_INTERVAL } from "../data/corrupted-zones";

export type AlertPreferences = { enabled: boolean; advanceEnabled: boolean; advanceMinutes?: number; soundEnabled: boolean; selected: readonly string[] };
export type ZoneAlert = { id: string; name: string; startsAt: number; advance: boolean; advanceMinutes: number; dueAt: number; expiresAt: number };
export type AlertSound = "off" | "chime" | "browser" | "blocked";
export type SoundPlan = { mode: "off" | "chime" | "browser"; play?: () => Promise<boolean> };
export type AlertDelivery = { sound: AlertSound; checkedAt: number };
export class AlertCancelled extends Error {}

export function getAdvanceMinutes(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12 ? value : 5;
}

export function alertId(name: string, startsAt: number, advance: boolean, advanceMinutes?: number): string {
  const minutes = getAdvanceMinutes(advanceMinutes);
  // Preserve existing five-minute receipts; other timings are separate reminders.
  const phase = !advance ? "active" : minutes === 5 ? "advance" : `advance:${minutes}`;
  return `${startsAt}:${name}:${phase}`;
}

export function dueZoneAlerts(now: number, preferences: AlertPreferences): ZoneAlert[] {
  if (!preferences.enabled) return [];
  const advanceMinutes = getAdvanceMinutes(preferences.advanceMinutes);
  const current = zoneAt(now);
  const zones = [{ ...current, advance: false }];
  if (preferences.advanceEnabled && now >= current.endsAt - advanceMinutes * 60000) zones.push({ ...zoneAt(current.endsAt), advance: true });
  return zones.filter(zone => preferences.selected.includes(zone.name)).map(zone => ({
    id: alertId(zone.name, zone.startsAt, zone.advance, advanceMinutes),
    name: zone.name,
    startsAt: zone.startsAt,
    advance: zone.advance,
    advanceMinutes: zone.advance ? advanceMinutes : 0,
    dueAt: zone.startsAt - (zone.advance ? advanceMinutes * 60000 : 0),
    expiresAt: zone.advance ? zone.startsAt : zone.startsAt + ZONE_INTERVAL,
  }));
}

type EngineOptions = {
  now: () => number;
  preferences: () => AlertPreferences;
  receipts: { has: (id: string) => boolean; put: (id: string, expiresAt: number) => void };
  lock: (action: () => Promise<void>) => Promise<void>;
  sound: (enabled: boolean) => Promise<SoundPlan>;
  notify: (event: ZoneAlert, options: { silent: boolean; renotify: boolean }) => Promise<void>;
  sent: (event: ZoneAlert, delivery: AlertDelivery) => void;
  failed: (event: ZoneAlert, error: unknown, retryAt: number) => void;
};

/** One delivery path for all real alerts. Browser-specific effects are injected. */
export function createZoneAlertEngine(options: EngineOptions) {
  const inFlight = new Set<string>();
  const accepted = new Set<string>();
  const retries = new Map<string, number>();
  const eligible = (event: ZoneAlert) => dueZoneAlerts(options.now(), options.preferences()).some(item => item.id === event.id && item.dueAt === event.dueAt);
  const known = (id: string) => {
    if (accepted.has(id)) return true;
    try { return options.receipts.has(id); } catch { return false; }
  };

  async function deliver(event: ZoneAlert) {
    if (inFlight.has(event.id) || known(event.id) || (retries.get(event.id) || 0) > options.now()) return;
    inFlight.add(event.id);
    try {
      await options.lock(async () => {
        // Re-read receipts and preferences after acquiring the cross-tab lock.
        if (known(event.id) || !eligible(event)) return;
        const wantedSound = options.preferences().soundEnabled;
        let plan: SoundPlan;
        try { plan = await options.sound(wantedSound); } catch { plan = { mode: wantedSound ? "browser" : "off" }; }
        if (!wantedSound && options.preferences().soundEnabled) {
          try { plan = await options.sound(true); } catch { plan = { mode: "browser" }; }
        }
        if (known(event.id) || !eligible(event)) return;
        const soundEnabled = options.preferences().soundEnabled;
        const mode = soundEnabled ? plan.mode : "off";
        await options.notify(event, { silent: mode !== "browser", renotify: true });

        // Persist acceptance before attempting sound: audio failures must never resend an alert.
        accepted.add(event.id);
        retries.delete(event.id);
        try { options.receipts.put(event.id, event.expiresAt); } catch { /* In-memory receipt still prevents repeats. */ }
        let sound: AlertSound = mode;
        if (mode === "chime" && options.preferences().soundEnabled) {
          let played = false;
          try { played = !!plan.play && await plan.play(); } catch { /* Request platform sound below. */ }
          if (!played && options.preferences().soundEnabled) {
            // Replace the same notification rather than creating another logical alert.
            // This is a fallback only when the prepared chime could not start.
            try { await options.notify(event, { silent: false, renotify: true }); sound = "browser"; }
            catch { sound = "blocked"; }
          }
        } else if (!options.preferences().soundEnabled) sound = "off";
        try { options.sent(event, { sound, checkedAt: options.now() }); } catch { /* UI errors cannot cause duplicate delivery. */ }
      });
    } catch (error) {
      if (!accepted.has(event.id) && !(error instanceof AlertCancelled)) {
        const retryAt = options.now() + 60000;
        retries.set(event.id, retryAt);
        options.failed(event, error, retryAt);
      }
    } finally { inFlight.delete(event.id); }
  }

  return {
    async check() {
      for (const event of dueZoneAlerts(options.now(), options.preferences())) await deliver(event);
      for (const id of retries.keys()) if (!dueZoneAlerts(options.now(), options.preferences()).some(event => event.id === id)) retries.delete(id);
    },
  };
}
