/**
 * PUSH NOTIFICATION SERVICE — Frontend
 * Handles service worker registration, permission request, and subscription lifecycle.
 * Pure module — no React dependencies.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Convert VAPID base64 public key to Uint8Array (required by browser)
// ─────────────────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Register the service worker
// ─────────────────────────────────────────────────────────────────────────────
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service Workers not supported in this browser.');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] Service worker registered:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[Push] Service worker registration failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Request notification permission + subscribe + send to backend
// ─────────────────────────────────────────────────────────────────────────────
export async function requestAndSubscribe(userId: string, authToken: string): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('[Push] This browser does not support notifications.');
    return;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY is not set.');
    return;
  }

  // Register Service Worker
  console.info('[Push] Registering service worker...');
  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
  });
  console.info('[Push] Service Worker registered:', registration.scope);

  // Request permission
  console.info('[Push] Checking permission state...');
  let permission = Notification.permission;
  if (permission === 'default') {
    console.info('[Push] Requesting notification permission...');
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    console.warn('[Push] Permission not granted:', permission);
    return;
  }
  console.info('[Push] Permission granted.');

  // Subscription
  console.info('[Push] Checking for existing subscription...');
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    console.info('[Push] No subscription found. Creating new one...');
    const publicKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey.buffer as ArrayBuffer,
    });
    console.info('[Push] New subscription created.');
  } else {
    console.info('[Push] Existing subscription found.');
  }

  // Send to backend
  console.info('[Push] Syncing subscription with backend...');
  try {
    const res = await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (res.ok) {
      console.log('[Push] Subscription saved to backend ✔');
    } else {
      const err = await res.json();
      console.error('[Push] Backend subscription error:', err);
    }
  } catch (err) {
    console.error('[Push] Failed to create push subscription:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Unsubscribe (called on logout or user preference)
// ─────────────────────────────────────────────────────────────────────────────
export async function unsubscribeFromPush(authToken: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch(`${API_BASE}/notifications/unsubscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    console.log('[Push] Unsubscribed from push notifications ✔');
  } catch (err) {
    console.error('[Push] Unsubscribe failed:', err);
  }
}
