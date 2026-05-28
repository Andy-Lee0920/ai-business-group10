self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const fallback = { title: 'Fevio 알림', body: '확인할 일정이 있어요.', url: '/home' };
  let payload = fallback;

  try {
    const parsed = event.data?.json();
    if (parsed && typeof parsed === 'object') payload = { ...fallback, ...parsed };
  } catch {
    payload = fallback;
  }

  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title : fallback.title;
  const body = typeof payload.body === 'string' && payload.body.trim() ? payload.body : fallback.body;
  const url = typeof payload.url === 'string' && payload.url.startsWith('/') ? payload.url : fallback.url;

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/icon-512.png',
    badge: '/favicon.ico',
    data: { url },
    tag: typeof payload.tag === 'string' ? payload.tag : 'fevio-reminder',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/home';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client && client.url === absoluteUrl) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(absoluteUrl);
    return undefined;
  })());
});
