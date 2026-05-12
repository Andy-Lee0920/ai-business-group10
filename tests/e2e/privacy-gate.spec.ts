import { expect, test } from '@playwright/test';

test('privacy gate keeps sensitive consent compact and exposes deletion details on demand', async ({ page }) => {
  await page.goto('/privacy');

  await expect(page.getByRole('heading', { name: '시작 전에 세 가지만 확인해요' })).toBeVisible();
  await expect(page.getByText('민감정보와 의료 경계 동의')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Privacy Gate 핵심 확인 항목' }).getByRole('listitem')).toHaveCount(3);
  await expect(page.getByText('삭제 요청은')).toBeHidden();
  await page.getByText('보관·삭제·공유 세부 안내').click();
  await expect(page.getByText('삭제 요청은')).toBeVisible();
  await expect(page.getByText('privacy@fevio.app')).toBeVisible();
  await expect(page.getByText('자동 삭제는 v1.x 예정')).toBeVisible();
  await expect(page.getByText('파트너 연결 해제')).toBeVisible();
  await expect(page.getByRole('link', { name: '공유 링크 설정' })).toHaveAttribute('href', '/settings/sharing');
  await expect(page.getByRole('button', { name: '동의하고 시작' })).toBeVisible();
  await expect(page.getByRole('link', { name: '동의하지 않고 돌아가기' })).toHaveAttribute('href', '/');

  const metrics = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="privacy-gate-card"]') as HTMLElement | null;
    const firstItem = document.querySelector('[data-testid="privacy-consent-list"] li') as HTMLElement | null;
    const cardStyle = card ? getComputedStyle(card) : null;
    const itemStyle = firstItem ? getComputedStyle(firstItem) : null;
    return {
      cardPadding: cardStyle?.paddingTop,
      cardGap: cardStyle?.rowGap,
      itemPadding: itemStyle?.paddingTop,
    };
  });

  expect(metrics).toMatchObject({ cardPadding: '20px', cardGap: '16px', itemPadding: '10px' });
});
