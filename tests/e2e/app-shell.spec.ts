import { expect, test } from '@playwright/test';

test('mobile visitor sees the Fevio landing shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Fevio \[페비오\]/ })).toBeVisible();
  await expect(page.getByText('병원에서 들은 말을, 오늘 부부가 함께 실행할 카드로.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Google로 시작하기' })).toHaveAttribute('href', '/auth/sign-in');
  await expect(page.getByRole('link', { name: '개인정보 처리방침' })).toHaveAttribute('href', '/privacy');
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
