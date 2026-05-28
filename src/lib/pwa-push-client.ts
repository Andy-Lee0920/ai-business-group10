import { getPwaInstallGuidance } from './pwa-install-guidance';

export { getPwaInstallGuidance };

export type PushReminderSubscriptionStatus =
  | 'idle'
  | 'requesting'
  | 'subscribed'
  | 'unsupported'
  | 'ios_install_required'
  | 'missing_vapid_key'
  | 'permission_denied'
  | 'server_error';

export const PUSH_PERMISSION_DENIED_STORAGE_KEY = 'fevio_push_permission_denied';

export async function enablePushReminderSubscription(): Promise<PushReminderSubscriptionStatus> {
  if (!supportsWebPush()) return 'unsupported';
  if (getPwaInstallGuidance() === 'ios_add_to_home_screen') return 'ios_install_required';

  if (hasRememberedPermissionDenial() || Notification.permission === 'denied') {
    rememberPermissionDenial();
    return 'permission_denied';
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) return 'missing_vapid_key';

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== 'granted') {
    rememberPermissionDenial();
    return 'permission_denied';
  }
  clearRememberedPermissionDenial();

  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  });

  return response.ok ? 'subscribed' : 'server_error';
}

function supportsWebPush() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

function hasRememberedPermissionDenial() {
  try {
    return window.localStorage.getItem(PUSH_PERMISSION_DENIED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberPermissionDenial() {
  try {
    window.localStorage.setItem(PUSH_PERMISSION_DENIED_STORAGE_KEY, '1');
  } catch {
    // Permission denial remains sticky in the browser even if localStorage is unavailable.
  }
}

function clearRememberedPermissionDenial() {
  try {
    window.localStorage.removeItem(PUSH_PERMISSION_DENIED_STORAGE_KEY);
  } catch {
    // localStorage access can fail in restricted browser modes.
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/gu, '+').replace(/_/gu, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
