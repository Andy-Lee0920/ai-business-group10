#!/usr/bin/env node
const DEFAULT_PRODUCTION_URL = 'https://project-oznp0.vercel.app';

function normalizeBaseUrl(value) {
  const url = new URL(value || DEFAULT_PRODUCTION_URL);
  url.pathname = url.pathname.replace(/\/$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

async function fetchText(baseUrl, path, init) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual', ...init });
  const text = await response.text();
  return { response, text };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function assertManifest(manifest) {
  assert(manifest && typeof manifest === 'object', 'manifest must be a JSON object');
  assert(manifest.id === '/', 'manifest.id must be / for iOS Home Screen identity continuity');
  assert(manifest.scope === '/', 'manifest.scope must be / for notification tap-through to /home');
  assert(manifest.start_url === '/', 'manifest.start_url must be /');
  assert(manifest.display === 'standalone', 'manifest.display must be standalone');
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest must include install icons');
}

export function assertServiceWorker(worker) {
  assert(worker.includes("addEventListener('push'"), 'service worker must handle push events');
  assert(worker.includes('showNotification'), 'service worker must display notifications');
  assert(worker.includes('notificationclick'), 'service worker must handle notificationclick');
  assert(worker.includes('clients.openWindow'), 'service worker must open /home on notification tap');
  assert(worker.includes("url: '/home'"), 'service worker fallback notification URL must be /home');
}

export function assertAuthSafePushRoutes({ subscribeStatus, reminderStatus }) {
  assert([401, 405].includes(subscribeStatus), `/api/push/subscribe GET must be auth-safe or method-blocked, got ${subscribeStatus}`);
  assert([401, 405, 503].includes(reminderStatus), `/api/reminders/send-due GET without auth must not dispatch, got ${reminderStatus}`);
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.argv[2] || process.env.FEVIO_PRODUCTION_URL);

  const manifestResult = await fetchText(baseUrl, '/manifest.json');
  assert(manifestResult.response.status === 200, `/manifest.json returned ${manifestResult.response.status}`);
  assertManifest(JSON.parse(manifestResult.text));
  console.log('PWA prereq pass: /manifest.json has id/scope/start_url/standalone/icons');

  const workerResult = await fetchText(baseUrl, '/sw.js');
  assert(workerResult.response.status === 200, `/sw.js returned ${workerResult.response.status}`);
  assertServiceWorker(workerResult.text);
  console.log('PWA prereq pass: /sw.js handles push + notificationclick to /home');

  const subscribeResult = await fetchText(baseUrl, '/api/push/subscribe');
  const reminderResult = await fetchText(baseUrl, '/api/reminders/send-due');
  assertAuthSafePushRoutes({
    subscribeStatus: subscribeResult.response.status,
    reminderStatus: reminderResult.response.status,
  });
  console.log(`PWA prereq pass: push routes are auth-safe without test credentials (${subscribeResult.response.status}/${reminderResult.response.status})`);

  console.log('\nProduction PWA prerequisite smoke Green:');
  console.log(`- URL: ${baseUrl}`);
  console.log('- Manifest: id/scope/start_url/display/icons verified');
  console.log('- Service worker: push display + notification tap-through verified');
  console.log('- Push endpoints: reachable but do not dispatch without auth');
  console.log('- Live-device receipt remains required for #382/#383');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
