import { expect, test } from '@playwright/test';

test('mobile visitor sees the Fevio landing shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Fevio \[페비오\]/ })).toBeVisible();
  await expect(page.getByText('병원 안내가 치료자에게는 실행 카드로, 파트너에게는 함께 챙길 역할로 바뀌는 데모입니다.')).toBeVisible();
  await expect(page.getByTestId('north-star-tagline')).toHaveText('병원 안내를 오늘 실행으로, 파트너에게는 함께 챙길 역할로.');
  await expect(page.getByRole('link', { name: '듀얼뷰 데모 바로 보기' })).toHaveAttribute('href', '/demo');
  await expect(page.getByText('Privacy Gate부터 보기')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Google/ })).toHaveCount(0);
});

test('dynamic home keeps the Fevio app shell available', async ({ page }) => {
  await page.goto('/home?care=injection');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '주 탐색' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '오늘 실행' })).toBeVisible();
  const bottomNav = page.getByRole('navigation', { name: '하단 주요 메뉴' });
  await expect(bottomNav).toBeVisible();
  await expect(bottomNav.getByRole('link').nth(0)).toHaveAccessibleName('홈');
  await expect(bottomNav.getByRole('link').nth(1)).toHaveAccessibleName('캘린더');
  await expect(bottomNav.getByRole('button', { name: '추가 메뉴 열기' })).toBeVisible();
  await expect(bottomNav.getByRole('link').nth(2)).toHaveAccessibleName('기록');
  await expect(bottomNav.getByRole('link').nth(3)).toHaveAccessibleName('설정');
  await expect(page.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/home');
  await expect(page.getByRole('link', { name: '캘린더' })).toHaveAttribute('href', '/calendar');
  await expect(page.getByRole('link', { name: '기록' })).toHaveAttribute('href', '/records');
  await expect(bottomNav.getByRole('link', { name: '설정' })).toHaveAttribute('href', '/settings');
  await page.getByRole('button', { name: '추가 메뉴 열기' }).click();
  await expect(page.getByTestId('create-bottom-sheet')).toBeVisible();
  await expect(page.getByRole('link', { name: /주사·복약 남기기/ })).toHaveAttribute('href', '/add');
  await expect(page.getByRole('link', { name: /병원 방문 남기기/ })).toHaveAttribute('href', '/clinic-update');
  await expect(bottomNav).not.toContainText('흐름');
  await expect(bottomNav).not.toContainText('케어');
  await expect(bottomNav).not.toContainText('공유');
});

test('desktop home is constrained to an iPhone 17-width frame with the refined bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/home?care=injection');

  const shellBox = await page.locator('#home-screen').boundingBox();
  const navBox = await page.getByRole('navigation', { name: '하단 주요 메뉴' }).boundingBox();
  const frameMetrics = await page.evaluate(() => ({
    bodyIphoneFrame: document.body.dataset.iphoneFrame,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(shellBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(shellBox!.width).toBeLessThanOrEqual(440);
  expect(shellBox!.width).toBeGreaterThanOrEqual(430);
  expect(frameMetrics.bodyIphoneFrame).toBe('1');
  expect(Math.abs(shellBox!.x + shellBox!.width / 2 - frameMetrics.viewportWidth / 2)).toBeLessThanOrEqual(1);
  expect(navBox!.width).toBeLessThanOrEqual(440);
  expect(Math.abs(navBox!.x + navBox!.width / 2 - frameMetrics.viewportWidth / 2)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('navigation', { name: '주 탐색' })).toHaveCount(0);
  expect(frameMetrics.scrollWidth).toBeLessThanOrEqual(frameMetrics.viewportWidth);
});


test('desktop frame bootstrap keeps explicit opt-out and custom demo routes unframed', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('/home?care=injection&frame=0');
  await expect(page.locator('body')).toHaveAttribute('data-iphone-frame', '0');

  await page.goto('/demo');
  await expect(page.locator('body')).toHaveAttribute('data-iphone-frame', '0');

  await page.goto('/partner/demo');
  await expect(page.locator('body')).toHaveAttribute('data-iphone-frame', '0');
});

test('not-found page renders the Fevio 404 shell', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '홈으로 돌아가기' })).toHaveAttribute('href', '/');
});
