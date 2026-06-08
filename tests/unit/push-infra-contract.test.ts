import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('PWA push infrastructure contract', () => {
  it('stores push subscriptions in an authenticated RLS table without clinic payload columns', () => {
    const migration = readFileSync('supabase/migrations/202605190001_push_subscriptions.sql', 'utf8');

    expect(migration).toContain('create table if not exists public.push_subscriptions');
    expect(migration).toContain('user_id uuid not null references auth.users(id) on delete cascade');
    expect(migration).toContain('endpoint text not null unique');
    expect(migration).toContain('subscription jsonb not null');
    expect(migration).toContain('alter table public.push_subscriptions enable row level security');
    expect(migration).toContain('auth.uid() = user_id');
    expect(migration).not.toMatch(/memo|clinic_note|dose|diagnosis|raw_text/u);
  });

  it('handles push notification display and opens /home from notification clicks', () => {
    const worker = readFileSync('public/sw.js', 'utf8');

    expect(worker).toContain("addEventListener('push'");
    expect(worker).toContain('showNotification');
    expect(worker).toContain("url: '/home'");
    expect(worker).toContain("addEventListener('notificationclick'");
    expect(worker).toContain('clients.openWindow');
  });

  it('exposes a browser subscribe helper and wires the home bell to request permission', () => {
    const client = readFileSync('src/lib/pwa-push-client.ts', 'utf8');
    const homeCta = readFileSync('src/features/today/PushPermissionCta.tsx', 'utf8');
    const homeLoader = readFileSync('src/features/today/home-page-loader.tsx', 'utf8');

    expect(client).toContain('enablePushReminderSubscription');
    expect(client).toContain("navigator.serviceWorker.register('/sw.js')");
    expect(client).toContain('Notification.requestPermission()');
    expect(client).toContain("fetch('/api/push/subscribe'");
    expect(homeCta).toContain('enablePushReminderSubscription');
    expect(homeCta).toContain('data-push-subscription-status');
    expect(homeCta).toContain('알림 다시 받기');
    expect(homeLoader).toContain(".from('push_subscriptions')");
    expect(homeLoader).toContain(".is('revoked_at', null)");
    expect(homeLoader).toContain('hasActivePushSubscription');
  });

  it('declares iOS PWA install boundaries before requesting Home Screen push', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8')) as Record<string, unknown>;
    const client = readFileSync('src/lib/pwa-push-client.ts', 'utf8');
    const homeCta = readFileSync('src/features/today/PushPermissionCta.tsx', 'utf8');

    expect(manifest).toMatchObject({ id: '/', scope: '/', display: 'standalone' });
    expect(client).toContain('getPwaInstallGuidance');
    expect(homeCta).toContain('홈 화면에 추가');
    expect(homeCta).toContain('ios_add_to_home_screen');
  });

});
