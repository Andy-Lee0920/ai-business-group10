import { expect, test } from '@playwright/test';

test('presentation home defaults to the injection-day partner action story', async ({ page }) => {
  await page.goto('/home');

  const cards = page.getByTestId('home-action-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText(/고날에프|오비트렐/);
  await expect(page.getByRole('button', { name: '주사 준비 체크 시작' })).toBeVisible();
  await expect(page.getByText('오늘 파트너의 역할')).toBeVisible();
  await expect(page.getByText('오늘은 확인자')).toBeVisible();
});

test('presentation home switches between three treatment situations', async ({ page }) => {
  await page.goto('/home?care=injection');
  await expect(page.getByRole('button', { name: '주사 준비 체크 시작' })).toBeVisible();
  await expect(page.getByText('오늘은 확인자')).toBeVisible();

  await page.goto('/home?care=clinic');
  await expect(page.getByRole('button', { name: '방문 체크리스트 열기' })).toBeVisible();
  await expect(page.getByText('오늘은 동행자')).toBeVisible();

  await page.goto('/home?care=waiting');
  await expect(page.getByRole('button', { name: '차분한 체크인 시작' })).toBeVisible();
  await expect(page.getByText('오늘은 곁에 있는 사람')).toBeVisible();
});

test('presentation capture pre-fills the clinic memo sample', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/capture');

  await expect(page.getByLabel('병원에서 들은 내용')).toContainText('고날에프');
  await expect(page.getByLabel('병원에서 들은 내용')).toContainText('프로게스테론');
});

test('presentation /partner/demo renders a sanitized partner view', async ({ page }) => {
  await page.goto('/partner/demo');

  await expect(page.getByRole('heading', { name: '파트너 오늘 할 일' })).toBeVisible();
  await expect(page.getByText('오늘 21시 고날에프 1회')).toBeVisible();
  await expect(page.getByText(/raw_text|token|user_id|원문 메모/)).toHaveCount(0);
});
