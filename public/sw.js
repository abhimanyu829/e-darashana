/**
 * ACTION TRACKER — Push Notification Service Worker
 * File: public/sw.js
 *
 * Served at /sw.js by Vite (files in public/ are served verbatim).
 * Handles push events and shows notifications even when the tab is closed.
 */

const APP_NAME = 'Action Tracker';

// ─────────────────────────────────────────────────────────────────────────────
// PUSH EVENT: Fired when the backend sends a push message via web-push
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {
    title: APP_NAME,
    body: 'You have a new notification.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    url: '/',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch (_) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,          // collapses duplicate notifications with same tag
    renotify: true,
    requireInteraction: false,
    data: { url: payload.url },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CLICK: Focus existing tab or open new one
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app tab is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL & ACTIVATE: Minimal lifecycle — no caching needed here
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
