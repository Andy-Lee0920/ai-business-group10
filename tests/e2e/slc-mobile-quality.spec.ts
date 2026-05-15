import { expect, test } from '@playwright/test';
import { SLC_FORBIDDEN_VISIBLE_COPY, SLC_MOBILE_ROUTES, SLC_MOBILE_VIEWPORTS } from '../../src/domain/slc-mobile-quality';

test.describe('SLC mobile quality smoke', () => {
  for (const viewport of SLC_MOBILE_VIEWPORTS) {
    test(`public first fold is app-like on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/privacy');

      const shell = page.locator('main.app-shell').first();
      const box = await shell.boundingBox();
      const visibleText = await page.locator('body').innerText();

      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      for (const forbidden of SLC_FORBIDDEN_VISIBLE_COPY) expect(visibleText).not.toContain(forbidden);
      await expect(page.getByRole('button', { name: '확인하고 계속' })).toBeVisible();
    });
  }


  test('keeps the desktop iPhone chrome when moving from onboarding shell to home shell', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });

    await page.goto('/privacy');
    const privacyShell = page.locator('main.app-shell').first();
    await expect(privacyShell).toBeVisible();
    const privacyBox = await privacyShell.boundingBox();
    expect(privacyBox?.width).toBeLessThanOrEqual(450);
    await expect(privacyShell).toHaveCSS('border-top-width', '5px');

    await page.goto('/home');
    const authedFrame = page.locator('.fevio-authed-frame').first();
    await expect(authedFrame).toBeVisible();
    const homeBox = await authedFrame.boundingBox();
    expect(homeBox?.width).toBeLessThanOrEqual(450);
    await expect(authedFrame).toHaveCSS('border-top-width', '5px');
    await expect(page.locator('.fevio-bottom-nav')).toBeVisible();
  });

  test('documents the protected SLC route set for authenticated mobile smoke', async () => {
    expect(SLC_MOBILE_ROUTES).toEqual(['/privacy', '/onboarding', '/home', '/add', '/records', '/clinic-update', '/partner', '/more']);
  });

  test('renders the full SLC route set in presentation mode without technical copy', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of SLC_MOBILE_ROUTES) {
      const response = await page.goto(route);
      expect(response?.ok(), `${route} should respond successfully`).toBe(true);

      const visibleText = await page.locator('body').innerText();
      expect(visibleText.trim().length, `${route} should render user-facing content`).toBeGreaterThan(0);
      expect(visibleText, `${route} should not show a generic app error`).not.toMatch(/Application error|Unhandled Runtime Error|This page could not be found/i);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${route} should not overflow the mobile viewport`,
      ).toBeLessThanOrEqual(390);
      for (const forbidden of SLC_FORBIDDEN_VISIBLE_COPY) expect(visibleText, route).not.toContain(forbidden);
    }
  });

  test('Clinic Guide update flow exposes the reference UI path in presentation mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clinic-update');

    await expect(page.getByRole('heading', { name: /병원 안내를/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /사진으로 업데이트/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /문자로 업데이트/ })).toBeVisible();
    await page.getByRole('button', { name: /직접 수정/ }).click();
    await page.getByRole('button', { name: '직접 입력 form 열기' }).click();
    await expect(page.getByText('1/4')).toBeVisible();
    await expect(page.getByText('✦ Clinic Guide AI')).toHaveCount(0);
    await expect(page.getByLabel('Clinic Guide AI 질문')).toHaveCount(0);

    await page.getByRole('button', { name: '바뀌었어요' }).click();
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.getByText('2/4')).toBeVisible();
    await page.getByRole('button', { name: '네' }).click();
    await page.getByLabel('약 이름 검색').fill('고날');
    await expect(page.getByText('고날에프')).toBeVisible();
    await expect(page.getByRole('button', { name: /직접 입력/ })).toBeVisible();
    await page.getByRole('button', { name: '약 선택 완료' }).click();

    await page.getByRole('button', { name: '2일' }).click();
    await expect(page.getByLabel('다음 방문일 제안')).toBeVisible();
    await page.getByRole('button', { name: '네, 표시할게요' }).click();
    await expect(page.getByText(/다음 방문:/)).toBeVisible();
    await page.getByRole('button', { name: '다음' }).click();

    await page.locator('textarea').fill('트리거는 내일 오후 예정이라고 들었어요');
    await expect(page.getByLabel('정리된 내용')).toContainText('트리거는 내일 오후 예정이라고 들었어요');
    await page.getByRole('button', { name: '저장 전 확인' }).click();

    await expect(page.getByRole('heading', { name: '저장 전 확인해주세요' })).toBeVisible();
    await expect(page.getByRole('button', { name: /저장하고 업데이트/ })).toBeVisible();
  });

});
