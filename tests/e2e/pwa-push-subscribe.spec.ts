import { devices, expect, test, type Page } from '@playwright/test';

type PushTestWindow = Window & {
  __pushPermissionRequestCalls: number;
};

test('home inline CTA creates one push_subscriptions row after active user click', async ({ page }) => {
  const postedSubscriptions: string[] = [];
  await installMockPushBrowser(page, 'granted');
  await page.route('**/api/push/subscribe', async (route) => {
    postedSubscriptions.push(route.request().postData() ?? '');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto('/home?care=injection');
  const toggle = page.getByTestId('home-reminder-toggle');
  await expect(toggle).toHaveAttribute('data-reminder-state', 'off');

  await toggle.click();

  await expect(toggle).toHaveAttribute('data-push-subscription-status', 'subscribed');
  await expect(toggle).toHaveAttribute('data-reminder-state', 'on');
  expect(postedSubscriptions).toHaveLength(1);
  expect(JSON.parse(postedSubscriptions[0])).toMatchObject({
    endpoint: 'https://push.example.test/e2e',
    expirationTime: null,
    keys: {
      p256dh: 'p256dh-key-material',
      auth: 'auth-key-material',
    },
  });
  await expectPermissionRequestCalls(page, 1);
});

test.describe('iPhone non-installed Safari guard', () => {
  const iphone = devices['iPhone 13'];
  test.use({
    viewport: iphone.viewport,
    deviceScaleFactor: iphone.deviceScaleFactor,
    isMobile: iphone.isMobile,
    hasTouch: iphone.hasTouch,
    userAgent: iphone.userAgent,
  });

  test('shows one-line guidance and skips permission request', async ({ page }) => {
    let subscribeRequests = 0;
    await installMockPushBrowser(page, 'granted');
    await page.route('**/api/push/subscribe', async (route) => {
      subscribeRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/home?care=injection');
    const toggle = page.getByTestId('home-reminder-toggle');
    await toggle.click();

    await expect(page.getByText('iPhone 알림은 홈 화면에 추가한 뒤 켤 수 있어요')).toBeVisible();
    await expect(toggle).toHaveAttribute('data-push-subscription-status', 'ios_install_required');
    await expectPermissionRequestCalls(page, 0);
    expect(subscribeRequests).toBe(0);
  });
});

async function installMockPushBrowser(page: Page, permissionResult: NotificationPermission) {
  await page.addInitScript((result) => {
    const testWindow = window as unknown as PushTestWindow;
    testWindow.__pushPermissionRequestCalls = 0;

    class TestNotification {
      static permission: NotificationPermission = 'default';

      static async requestPermission() {
        testWindow.__pushPermissionRequestCalls += 1;
        TestNotification.permission = result;
        return result;
      }
    }

    const subscription = {
      toJSON: () => ({
        endpoint: 'https://push.example.test/e2e',
        expirationTime: null,
        keys: {
          p256dh: 'p256dh-key-material',
          auth: 'auth-key-material',
        },
      }),
    };
    const registration = {
      pushManager: {
        getSubscription: async () => null,
        subscribe: async () => subscription,
      },
    };

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: TestNotification,
    });
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: async () => registration,
        ready: Promise.resolve(registration),
      },
    });
  }, permissionResult);
}

async function expectPermissionRequestCalls(page: Page, expected: number) {
  await expect.poll(async () => page.evaluate(() => {
    const testWindow = window as unknown as PushTestWindow;
    return testWindow.__pushPermissionRequestCalls;
  })).toBe(expected);
}
