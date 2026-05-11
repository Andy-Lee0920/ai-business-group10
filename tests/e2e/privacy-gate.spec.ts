import { expect, test } from '@playwright/test';

test('privacy gate shows the deletion-request v1.x microcopy', async ({ page }) => {
  await page.goto('/privacy');

  await expect(page.getByRole('heading', { name: '민감정보와 의료 경계 동의' })).toBeVisible();
  await expect(page.getByText('삭제 요청')).toBeVisible();
  await expect(page.getByText('privacy@fevio.app')).toBeVisible();
  await expect(page.getByText('자동 삭제는 v1.x 예정')).toBeVisible();
  await expect(page.getByText('파트너 연결 해제')).toBeVisible();
  await expect(page.getByRole('link', { name: '공유 링크 설정' })).toHaveAttribute('href', '/settings/sharing');
  await expect(page.getByRole('button', { name: '동의하고 시작' })).toBeVisible();
  await expect(page.getByRole('link', { name: '동의하지 않고 돌아가기' })).toHaveAttribute('href', '/');
});
