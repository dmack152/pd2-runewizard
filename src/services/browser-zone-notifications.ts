import { AlertCancelled, type ZoneAlert } from "./zone-alert-engine";

export class AlertNoLongerDue extends AlertCancelled {}

function bounded<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timeout = 0;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => { timeout = window.setTimeout(() => reject(new Error("Browser notification request timed out")), milliseconds); }),
  ]).finally(() => window.clearTimeout(timeout));
}

export function createBrowserNotificationSender(isCurrent: (event: ZoneAlert) => boolean) {
  let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

  function prepareWorker() {
    if (!registrationPromise) {
      const register = async () => {
        const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}zone-notifications.js`);
        if (registration.active?.state !== "activated") {
          const worker = registration.installing || registration.waiting || registration.active;
          if (!worker) throw new Error("No notification worker available");
          await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Notification worker activation timed out")); }, 4500);
            const cleanup = () => { window.clearTimeout(timeout); worker.removeEventListener("statechange", changed); };
            const changed = () => {
              if (worker.state === "activated") { cleanup(); resolve(); }
              else if (worker.state === "redundant") { cleanup(); reject(new Error("Notification worker activation failed")); }
            };
            worker.addEventListener("statechange", changed);
            changed();
          });
        }
        return registration;
      };
      // Preparation has no delivery side effect, even if it completes after timeout.
      registrationPromise = bounded(register(), 5000).catch(error => { registrationPromise = null; throw error; });
    }
    return registrationPromise;
  }

  const send = async (event: ZoneAlert, sound: { silent: boolean; renotify: boolean }) => {
    const remaining = Math.max(1, Math.ceil((event.startsAt - Date.now()) / 60000));
    const options: NotificationOptions & { renotify: boolean } = {
      body: event.advance ? `${event.name} becomes corrupted in ${remaining} minute${remaining === 1 ? "" : "s"}.` : `${event.name} is now corrupted.`,
      tag: `pd2-zone-${encodeURIComponent(event.id)}`,
      ...sound,
      data: { id: event.id, url: new URL(`${import.meta.env.BASE_URL}#corrupted-zones`, window.location.origin).href },
    };
    if (!isCurrent(event)) throw new AlertNoLongerDue();
    // Desktop trackers such as pd2.tools create the notification directly.
    // Do not put worker registration/activation in front of a desktop alert.
    let native: Notification | null = null;
    try {
      // eslint-disable-next-line compat/compat -- Optional API; callers check support and permission.
      native = new Notification("PD2 Corrupted Zone", options);
    } catch { /* Mobile browsers may require showNotification on a worker. */ }
    if (native) {
      const notification = native;
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => { notification.close(); reject(new Error("Browser did not confirm notification display")); }, 5000);
        notification.onshow = () => { window.clearTimeout(timeout); resolve(); };
        notification.onerror = () => { window.clearTimeout(timeout); reject(new Error("Browser rejected notification display")); };
        notification.onclick = () => { window.focus(); window.location.hash = "corrupted-zones"; notification.close(); };
      });
      return;
    }
    if ("serviceWorker" in navigator) {
      let registration: ServiceWorkerRegistration | null = null;
      try { registration = await prepareWorker(); } catch { /* Desktop constructor fallback below. */ }
      if (!isCurrent(event)) throw new AlertNoLongerDue();
      if (registration) {
        try {
          await bounded(registration.showNotification("PD2 Corrupted Zone", options), 5000);
          return;
        } catch (error) {
          // A timed-out platform request may already have been accepted. Query its stable ID
          // before considering another transport; do not race a second popup against it.
          try {
            const existing = await bounded(registration.getNotifications({ tag: options.tag }), 1500);
            if (existing.length) return;
          } catch { /* No acceptance evidence; let the engine retry this same ID later. */ }
          throw error;
        }
      }
    }
    throw new Error("No supported notification delivery method is available");
  };
  return Object.assign(send, {
    prepare: () => "serviceWorker" in navigator ? prepareWorker().then(() => undefined).catch(() => undefined) : Promise.resolve(),
  });
}
