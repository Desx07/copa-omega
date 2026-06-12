/// <reference lib="webworker" />

// Bladers Santa Fe — Push Notifications Service Worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Bladers Santa Fe",
      body: event.data.text(),
    };
  }

  const { title, body, icon, url } = payload;

  const options = {
    body: body || "",
    icon: icon || "/bladers-logo.png",
    badge: "/bladers-logo.png",
    data: { url: url || "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title || "Bladers Santa Fe", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    // Try to focus an existing tab, otherwise open a new one
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Activate immediately — skip waiting
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
