// Displays alerts requested by an open Runewizard tab; no background polling or caching.
self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const home = new URL(self.registration.scope);
  let url = new URL("#corrupted-zones", home);
  try {
    const requested = new URL(event.notification.data.url);
    if (requested.origin === home.origin && requested.pathname === home.pathname) url = requested;
  } catch { /* Use the registered app location. */ }
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async clients => {
    const existing = clients.find(client => new URL(client.url).pathname === url.pathname);
    if (existing) {
      existing.postMessage({ type: "OPEN_CORRUPTED_ZONES" });
      return existing.focus();
    }
    return self.clients.openWindow(url.href);
  }));
});
