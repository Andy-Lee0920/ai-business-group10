import { expect, test } from '@playwright/test';

test('user can revoke a partner share link and see it marked revoked', async ({ page }) => {
  let revoked = false;
  await page.route('**/api/partner-share-links', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        links: revoked
          ? []
          : [
              {
                id: 'link-1',
                createdAt: '2026-05-10T01:00:00.000Z',
                expiresAt: '2026-05-17T01:00:00.000Z',
                lastAccessedAt: null,
                revokedAt: null,
              },
            ],
      }),
    });
  });
  await page.route('**/api/partner-share-links/link-1/revoke', async (route) => {
    revoked = true;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ revoked_at: '2026-05-11T01:00:00.000Z' }),
    });
  });

  await page.goto('/settings/sharing');

  await expect(page.getByRole('heading', { name: '파트너 공유 링크' })).toBeVisible();
  await expect(page.getByText('2026-05-17')).toBeVisible();
  await page.getByRole('button', { name: '링크 회수' }).click();
  await expect(page.getByText('이 링크는 즉시 무효화됩니다. 계속할까요?')).toBeVisible();
  await page.getByRole('button', { name: '계속 회수' }).click();

  await expect(page.getByText('회수됨')).toBeVisible();
  await expect(page.getByRole('button', { name: '링크 회수' })).toHaveCount(0);
});

test('revoked partner link shows invalid partner view state', async ({ page }) => {
  await page.route('**/api/partner/revoked-token/cards', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'partner_link_not_found' }) });
  });

  await page.goto('/partner/revoked-token');

  await expect(page.getByText('이 링크는 만료되었거나 더 이상 유효하지 않아요.')).toBeVisible();
});
