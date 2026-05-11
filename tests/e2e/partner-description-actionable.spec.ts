import { expect, test } from '@playwright/test';

test('partner view shows confirmed action cue without raw memo leak', async ({ page }) => {
  await page.route('**/api/partner/e2e-token/cards', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            safe_id: 'safe-injection',
            title: '고날에프 주사',
            scheduled_at: '2026-05-10T21:00:00.000+09:00',
            card_type: 'injection',
            description: '오늘 21시 고날에프 1회',
            display_state: 'current',
            sync_revision: 7,
            partner_role: '확인자',
            partner_action: '주사 시간 30분 전 준비물과 조용한 공간을 함께 확인해 주세요.',
            avoid_prompt: '마지막 순간 질문하거나 재촉하지 않기',
            visibility: 'partner_safe',
          },
        ],
      }),
    });
  });

  await page.goto('/partner/e2e-token');

  await expect(page.getByRole('heading', { name: '오늘 내 역할' })).toBeVisible();
  await expect(page.getByText('확인자')).toBeVisible();
  await expect(page.getByRole('heading', { name: '도움 행동' })).toBeVisible();
  await expect(page.getByLabel('도움 행동').getByText('주사 시간 30분 전 준비물과 조용한 공간을 함께 확인해 주세요.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘 피하기' })).toBeVisible();
  await expect(page.getByText('마지막 순간 질문하거나 재촉하지 않기')).toBeVisible();
  await expect(page.getByLabel('공유된 케어').getByText('오늘 21시 고날에프 1회')).toBeVisible();
  await expect(page.getByText(/rev 7|revision|sync_revision|원문 메모|raw memo|visit_inputs|source_input_id/)).toHaveCount(0);
});
