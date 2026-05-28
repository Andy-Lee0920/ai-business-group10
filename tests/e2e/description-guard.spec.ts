import { expect, test } from '@playwright/test';

test('confirm screen warns on medical-boundary phrases without blocking save', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/capture');

  await page.getByLabel('병원에서 들은 내용').fill('용량을 올리세요\n오늘 21시 고날에프 1회');
  await page.getByRole('button', { name: '케어 흐름으로 나누기' }).click();

  await expect(page).toHaveURL(/\/split-review\?draftId=/u);
  await expect(page.getByText('의료 판단 표현 확인')).toBeVisible();
  await expect(page.getByText('용량 조정 표현')).toBeVisible();
  await page.getByRole('group', { name: '1번 항목 분류' }).getByRole('button', { name: '파트너에게 공유' }).click();
  await page.getByRole('button', { name: '그래도 저장하고 확정하기' }).click();

  await expect(page).toHaveURL(/\/\?capture=confirmed$/u);
});

test('partner view renders user-confirmed description text as-is after warning policy', async ({ page }) => {
  await page.route('**/api/partner/description-warning-token/cards', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            title: '고날에프 주사',
            scheduled_at: '2026-05-10T21:00:00.000+09:00',
            card_type: 'injection',
            description: '용량을 올리세요',
            display_state: 'current',
          },
        ],
      }),
    });
  });

  await page.goto('/partner/description-warning-token');

  await expect(page.getByText('용량을 올리세요')).toBeVisible();
  await expect(page.getByText(/raw memo|visit_inputs|source_input_id/u)).toHaveCount(0);
});
