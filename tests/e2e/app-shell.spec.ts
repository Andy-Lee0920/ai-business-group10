import { expect, test } from '@playwright/test';

test('mobile visitor sees the Fevio landing shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Fevio \[페비오\]/ })).toBeVisible();
  await expect(page.getByText('로그인 없이 발표용 시나리오를 바로 보여주는 Fevio 데모입니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: '발표 데모 바로 보기' })).toHaveAttribute('href', '/home');
  await expect(page.getByRole('link', { name: 'Privacy Gate부터 보기' })).toHaveAttribute('href', '/privacy?mode=presentation');
  await expect(page.getByRole('link', { name: /Google/ })).toHaveCount(0);
});

test('dynamic home keeps the Fevio app shell available', async ({ page }) => {
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: '오늘의 실행 카드' })).toBeVisible();
});

test('not-found page renders the Fevio 404 shell', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '홈으로 돌아가기' })).toHaveAttribute('href', '/');
});
