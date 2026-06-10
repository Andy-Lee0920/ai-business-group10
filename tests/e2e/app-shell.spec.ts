import { expect, test } from '@playwright/test';

async function acceptPrivacyGate(page: import('@playwright/test').Page) {
  await page.context().addCookies([
    { name: 'fevio_privacy_gate_v1', value: 'accepted', url: 'http://127.0.0.1:3000' },
    { name: 'fevio_privacy_accepted', value: '1', url: 'http://127.0.0.1:3000' },
    { name: 'fevio_privacy_gate_v1', value: 'accepted', url: 'http://localhost:3000' },
    { name: 'fevio_privacy_accepted', value: '1', url: 'http://localhost:3000' },
  ]);
}

test('mobile visitor sees the Fevio landing shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Fevio \[페비오\]/ })).toBeVisible();
  await expect(page.getByText('병원 안내가 치료자에게는 실행 카드로, 파트너에게는 함께 챙길 역할로 바뀌는 데모입니다.')).toBeVisible();
  await expect(page.getByText('병원 안내를 오늘 실행으로, 파트너에게는 함께 챙길 역할로.')).toBeVisible();
  await expect(page.getByRole('link', { name: '듀얼뷰 데모 바로 보기' })).toHaveAttribute('href', '/demo');
  await expect(page.getByRole('link', { name: '설문 참여하기' })).toHaveAttribute('href', '/survey');
});

test('dynamic home keeps the Fevio app shell available', async ({ page }) => {
  await acceptPrivacyGate(page);
  await page.goto('/home?care=injection');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '주 탐색' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '오늘 실행' })).toBeVisible();
  const bottomNav = page.getByRole('navigation', { name: '하단 주요 메뉴' });
  await expect(bottomNav).toBeVisible();
  await expect(bottomNav.getByRole('link').nth(0)).toHaveAccessibleName('홈');
  await expect(bottomNav.getByRole('link').nth(1)).toHaveAccessibleName('캘린더');
  await expect(bottomNav.getByRole('link').nth(2)).toHaveAccessibleName('케어 에이전트 열기');
  await expect(bottomNav.getByRole('link').nth(3)).toHaveAccessibleName('기록');
  await expect(bottomNav.getByRole('link').nth(4)).toHaveAccessibleName('설정');
  await expect(page.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/home');
  await expect(page.getByRole('link', { name: '캘린더' })).toHaveAttribute('href', '/calendar');
  await expect(bottomNav.getByRole('link', { name: '케어 에이전트 열기' })).toHaveAttribute('href', '/care-agent');
  await expect(page.getByRole('link', { name: '기록' })).toHaveAttribute('href', '/records');
  await expect(bottomNav.getByRole('link', { name: '설정' })).toHaveAttribute('href', '/settings');
  await bottomNav.getByRole('link', { name: '케어 에이전트 열기' }).click();
  await expect(page.getByRole('heading', { name: '무엇을 확인할까요?' })).toBeVisible();
  await expect(page.getByText('케어 에이전트')).toBeVisible();
  await expect(page.getByRole('link', { name: '주사·복약 남기기' })).toHaveAttribute('href', '/add');
  await expect(page.getByRole('link', { name: '병원 방문 남기기' })).toHaveAttribute('href', '/clinic-update');
  await expect(bottomNav).not.toContainText('흐름');
  await expect(bottomNav).not.toContainText('케어');
  await expect(bottomNav).not.toContainText('공유');
});

test('desktop home is constrained to an iPhone 17-width frame with the refined bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await acceptPrivacyGate(page);
  await page.goto('/home?care=injection');

  const shellBox = await page.locator('.fevio-authed-frame').first().boundingBox();
  const navBox = await page.getByRole('navigation', { name: '하단 주요 메뉴' }).boundingBox();
  const handleBox = await page.getByTestId('home-sheet-handle').boundingBox();
  const frameMetrics = await page.evaluate(() => {
    const frame = document.querySelector('.fevio-authed-frame') as HTMLElement | null;
    const main = document.querySelector('.fevio-authed-main') as HTMLElement | null;
    const frameStyle = frame ? getComputedStyle(frame) : null;
    const mainStyle = main ? getComputedStyle(main) : null;
    return {
      bodyIphoneFrame: document.body.dataset.iphoneFrame,
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      frameBorderTopWidth: frameStyle?.borderTopWidth ?? '',
      frameBorderTopColor: frameStyle?.borderTopColor ?? '',
      frameBorderRadius: frameStyle?.borderTopLeftRadius ?? '',
      frameOverflowY: frameStyle?.overflowY ?? '',
      mainOverflowY: mainStyle?.overflowY ?? '',
      mainClientHeight: main?.clientHeight ?? 0,
      mainScrollHeight: main?.scrollHeight ?? 0,
    };
  });

  expect(shellBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(handleBox).not.toBeNull();
  expect(frameMetrics.bodyIphoneFrame).toBe('1');
  expect(shellBox!.width).toBeGreaterThanOrEqual(430);
  expect(shellBox!.width).toBeLessThanOrEqual(440);
  expect(shellBox!.height).toBeLessThanOrEqual(900 - 48);
  expect(Math.abs(shellBox!.x + shellBox!.width / 2 - frameMetrics.viewportWidth / 2)).toBeLessThanOrEqual(1);
  expect(frameMetrics.frameBorderTopWidth).toBe('5px');
  expect(frameMetrics.frameBorderTopColor).toBe('rgb(5, 7, 6)');
  expect(Number.parseFloat(frameMetrics.frameBorderRadius)).toBeGreaterThanOrEqual(50);
  expect(frameMetrics.frameOverflowY).toBe('hidden');
  expect(frameMetrics.mainOverflowY).toBe('auto');
  expect(frameMetrics.mainScrollHeight).toBeGreaterThanOrEqual(frameMetrics.mainClientHeight);
  expect(navBox!.width).toBeLessThanOrEqual(440);
  expect(Math.abs(navBox!.x + navBox!.width / 2 - frameMetrics.viewportWidth / 2)).toBeLessThanOrEqual(1);
  expect(handleBox!.y).toBeLessThan(navBox!.y - 120);
  await expect(page.getByRole('navigation', { name: '주 탐색' })).toHaveCount(0);
  expect(frameMetrics.scrollWidth).toBeLessThanOrEqual(frameMetrics.viewportWidth);
  expect(frameMetrics.documentScrollHeight).toBeLessThanOrEqual(900);
});

test('not-found page renders the Fevio 404 shell', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '홈으로 돌아가기' })).toHaveAttribute('href', '/');
});
