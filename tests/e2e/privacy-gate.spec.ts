import { expect, test } from '@playwright/test';

test('privacy gate presents one premium storage-scope confirmation before onboarding', async ({ page }) => {
  await page.goto('/privacy');

  await expect(page.getByText('개인정보 보호 안내')).toBeVisible();
  await expect(page.getByRole('heading', { name: '시작 전에 저장 범위를 확인해 주세요' })).toBeVisible();
  await expect(page.getByText('Fevio는 로그인 상태와 사용자가 직접 입력한 일정, 약명, 완료 여부를 저장합니다.')).toBeVisible();
  await expect(page.getByText('이 정보는 오늘 할 일, 기록, 파트너 읽기 전용 화면을 만들기 위해 사용됩니다.')).toBeVisible();
  await expect(page.getByText('Fevio는 의료 판단을 하지 않고 병원 안내를 기록·확인하는 도구입니다.')).toBeVisible();
  await expect(page.getByText('민감정보와 의료 경계 동의')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '확인하고 계속' })).toBeVisible();

  const metrics = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="privacy-gate-card"]') as HTMLElement | null;
    const cardStyle = card ? getComputedStyle(card) : null;
    return {
      cardPadding: cardStyle?.paddingTop,
      cardRadius: cardStyle?.borderRadius,
      cardShadow: cardStyle?.boxShadow,
    };
  });

  expect(metrics.cardPadding).toBe('32px');
  expect(metrics.cardRadius).toBe('36px');
  expect(metrics.cardShadow).toContain('rgba');
});
