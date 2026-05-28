import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PUSH_PERMISSION_DENIED_STORAGE_KEY,
  enablePushReminderSubscription,
} from '../../src/lib/pwa-push-client';

type PermissionCallCounter = () => number;

describe('push permission CTA guardrails', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('does not call push permission from component mount effects', () => {
    expect(collectUseEffectPermissionCalls([
      'src/features/today/PushPermissionCta.tsx',
      'src/features/today/today-screen.tsx',
    ])).toEqual([]);
  });

  it('remembers a denied permission and does not ask again in the same page session', async () => {
    const permissionCalls = installWebPushGlobals({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      requestResult: 'denied',
    });
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBAUGBwg');

    const first = await enablePushReminderSubscription();
    const second = await enablePushReminderSubscription();

    expect(first).toBe('permission_denied');
    expect(second).toBe('permission_denied');
    expect(permissionCalls()).toBe(1);
    expect(window.localStorage.getItem(PUSH_PERMISSION_DENIED_STORAGE_KEY)).toBe('1');
  });

  it('skips permission request for non-installed iPhone Safari and returns install guidance state', async () => {
    const permissionCalls = installWebPushGlobals({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
      requestResult: 'granted',
      standalone: false,
    });
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBAUGBwg');

    const status = await enablePushReminderSubscription();

    expect(status).toBe('ios_install_required');
    expect(permissionCalls()).toBe(0);
  });

  it('records ADR 0026 as the inline CTA permission-trigger decision', () => {
    const adr = readFileSync('docs/04-decisions/0026-push-permission-ui-trigger.md', 'utf8');

    expect(adr).toContain('Status');
    expect(adr).toContain('Accepted');
    expect(adr).toContain('inline CTA');
    expect(adr).toContain('component mount');
    expect(adr).toContain('Injection-day only');
    expect(adr).toContain('After confirm flow');
    expect(adr).toContain('iOS Safari');
  });
});

function collectUseEffectPermissionCalls(paths: readonly string[]) {
  const matches: string[] = [];

  for (const path of paths) {
    const source = readFileSync(path, 'utf8');
    const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && isUseEffectCall(node)) {
        const callback = node.arguments[0];
        if (callback) collectPermissionCallsInside(path, callback, matches);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return matches;
}

function collectPermissionCallsInside(path: string, node: ts.Node, matches: string[]) {
  const visit = (child: ts.Node) => {
    if (ts.isCallExpression(child) && isPermissionRequestCall(child)) {
      matches.push(`${path}:${child.getText()}`);
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
}

function isUseEffectCall(node: ts.CallExpression) {
  const expression = node.expression;
  return (ts.isIdentifier(expression) && expression.text === 'useEffect')
    || (ts.isPropertyAccessExpression(expression) && expression.name.text === 'useEffect');
}

function isPermissionRequestCall(node: ts.CallExpression) {
  const expression = node.expression;
  if (ts.isIdentifier(expression)) return expression.text === 'enablePushReminderSubscription';
  return ts.isPropertyAccessExpression(expression) && expression.name.text === 'requestPermission';
}

function installWebPushGlobals({
  userAgent,
  platform,
  maxTouchPoints,
  requestResult,
  standalone,
}: {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  requestResult: NotificationPermission;
  standalone?: boolean;
}): PermissionCallCounter {
  let permissionCallCount = 0;
  const localStorage = createLocalStorageStub();

  class TestNotification {
    static permission: NotificationPermission = 'default';

    static async requestPermission() {
      permissionCallCount += 1;
      return requestResult;
    }
  }

  const notificationConstructor = TestNotification as unknown as typeof Notification;
  const serviceWorkerRegistration = {
    pushManager: {
      getSubscription: async () => null,
      subscribe: async () => ({
        toJSON: () => ({
          endpoint: 'https://push.example.test/unit',
          expirationTime: null,
          keys: {
            p256dh: 'p256dh-key-material',
            auth: 'auth-key-material',
          },
        }),
      }),
    },
  };
  const serviceWorkerContainer = {
    register: async () => serviceWorkerRegistration,
    ready: Promise.resolve(serviceWorkerRegistration),
  };
  const matchMedia = () => ({ matches: false }) as MediaQueryList;

  vi.stubGlobal('Notification', notificationConstructor);
  vi.stubGlobal('window', {
    Notification: notificationConstructor,
    PushManager: function PushManager() {},
    localStorage,
    matchMedia,
  } as unknown as Window);
  vi.stubGlobal('navigator', {
    serviceWorker: serviceWorkerContainer,
    userAgent,
    platform,
    maxTouchPoints,
    standalone,
  } as unknown as Navigator);

  return () => permissionCallCount;
}

function createLocalStorageStub() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  } as unknown as Storage;
}
