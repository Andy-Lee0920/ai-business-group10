import { expect, test } from '@playwright/test';

test('schedule cancel keeps the low-energy form local without writing', async ({ page }) => {
  let scheduleWrites = 0;
  await page.route('**/api/schedule', async (route) => {
    scheduleWrites += 1;
    await route.continue();
  });
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/schedule');

  await expect(page.getByRole('heading', { name: '일정을 조용히 정리해요' })).toBeVisible();
  await expect(page.getByText('환자')).toHaveCount(0);

  await page.getByRole('button', { name: '검사' }).click();
  await page.getByLabel('날짜').fill('2026-05-13');
  await page.getByLabel('시간').fill('09:30');
  await page.getByRole('textbox', { name: '메모' }).fill('채혈 확인');
  await page.getByRole('button', { name: '그만둘게요' }).click();

  await expect(page.getByText('저장을 멈췄어요. 필요할 때 다시 적어 주세요.')).toBeVisible();
  await expect(page.getByText('일정 추가 확정')).toHaveCount(0);
  await expect(page).toHaveURL(/\/schedule$/u);
  expect(scheduleWrites).toBe(0);
});

test('schedule confirm creates one explicit summary after submit', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/schedule');

  await page.getByRole('button', { name: '바꿀래요' }).click();
  await page.getByRole('button', { name: '검사' }).click();
  await page.getByLabel('날짜').fill('2026-05-13');
  await page.getByLabel('시간').fill('09:30');
  await page.getByRole('textbox', { name: '메모' }).fill('채혈 확인');
  await page.getByRole('button', { name: '이 일정으로 저장' }).click();

  await expect(page.getByText('일정 변경 확정: 2026-05-13 09:30 검사 — 채혈 확인')).toBeVisible();
});


test('schedule cancellation can be explicitly saved as a visible confirmed update', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/schedule');

  await page.getByRole('button', { name: '취소를 남길래요' }).click();
  await page.getByRole('button', { name: '방문' }).click();
  await page.getByLabel('날짜').fill('2026-05-13');
  await page.getByLabel('시간').fill('09:30');
  await page.getByRole('textbox', { name: '메모' }).fill('방문 취소 확인');
  await page.getByRole('button', { name: '이 취소 내용을 저장' }).click();

  await expect(page.getByText('일정 취소 확정: 2026-05-13 09:30 방문 — 방문 취소 확인')).toBeVisible();
});
