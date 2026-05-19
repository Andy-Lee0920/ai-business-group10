import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

function loadServiceWorker(overrides: Record<string, unknown> = {}) {
  const listeners = new Map<string, (event: any) => void>();
  const openedUrls: string[] = [];
  const focusedUrls: string[] = [];
  const notifications: Array<{ title: string; options: Record<string, unknown> }> = [];

  const self = {
    location: { origin: 'https://project-oznp0.vercel.app' },
    registration: {
      showNotification: (title: string, options: Record<string, unknown>) => {
        notifications.push({ title, options });
        return Promise.resolve();
      },
    },
    clients: {
      matchAll: async () => [],
      openWindow: async (url: string) => {
        openedUrls.push(url);
        return undefined;
      },
    },
    skipWaiting: () => Promise.resolve(),
    addEventListener: (type: string, handler: (event: any) => void) => {
      listeners.set(type, handler);
    },
    ...overrides,
  };

  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, URL });
  return { listeners, openedUrls, focusedUrls, notifications };
}

describe('service worker notification behavior', () => {
  it('opens /home when a notification without explicit URL is clicked', async () => {
    const { listeners, openedUrls } = loadServiceWorker();
    const waitUntilPromises: Array<Promise<unknown>> = [];
    const event = {
      notification: { data: {}, close: () => undefined },
      waitUntil: (promise: Promise<unknown>) => { waitUntilPromises.push(promise); return promise; },
    };

    listeners.get('notificationclick')?.(event);
    await Promise.all(waitUntilPromises);

    expect(openedUrls).toEqual(['https://project-oznp0.vercel.app/home']);
  });

  it('keeps notification click URLs same-origin and path-only', async () => {
    const { listeners, notifications } = loadServiceWorker();
    const waitUntilPromises: Array<Promise<unknown>> = [];
    const event = {
      data: { json: () => ({ title: '외부 링크', body: '무시', url: 'https://evil.example/leak' }) },
      waitUntil: (promise: Promise<unknown>) => { waitUntilPromises.push(promise); return promise; },
    };

    listeners.get('push')?.(event);
    await Promise.all(waitUntilPromises);

    expect(notifications[0].options.data).toEqual({ url: '/home' });
  });
});
