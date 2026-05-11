import { expect, test } from '@playwright/test';

test('mobile visitor sees the Fevio landing shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Fevio \[페비오\]/ })).toBeVisible();
  await expect(page.getByText('로그인 없이 발표용 시나리오를 바로 보여주는 Fevio 데모입니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: '듀얼뷰 데모 바로 보기' })).toHaveAttribute('href', '/demo');
  await expect(page.getByText('Privacy Gate부터 보기')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Google/ })).toHaveCount(0);
});

test('dynamic home keeps the Fevio app shell available', async ({ page }) => {
  await page.goto('/home');
  await expect(page.locator('main.app-shell')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '주 탐색' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘은 시간을 함께 지키는 날' })).toBeVisible();
  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  await expect(page.getByRole('link', { name: /일정 변경/ })).toHaveAttribute('href', '/schedule');
  await expect(page.getByRole('link', { name: /약·주사 확인/ })).toHaveAttribute('href', '/medication');
});

test('desktop home is constrained to an iPhone 17-width frame with in-frame navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/home?care=injection');

  const shellBox = await page.locator('main.app-shell').first().boundingBox();
  const navBox = await page.getByRole('navigation', { name: '주 탐색' }).boundingBox();
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  expect(shellBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(shellBox!.width).toBeLessThanOrEqual(440);
  expect(shellBox!.width).toBeGreaterThanOrEqual(430);
  expect(navBox!.width).toBeLessThanOrEqual(440);
  expect(navBox!.width).toBeGreaterThanOrEqual(430);
  expect(Math.abs(shellBox!.x + shellBox!.width / 2 - viewportWidth / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(navBox!.x + navBox!.width / 2 - viewportWidth / 2)).toBeLessThanOrEqual(1);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
});

test('not-found page renders the Fevio 404 shell', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '홈으로 돌아가기' })).toHaveAttribute('href', '/');
});
