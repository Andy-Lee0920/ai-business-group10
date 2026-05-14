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

  test('documents the protected SLC route set for authenticated mobile smoke', async () => {
    expect(SLC_MOBILE_ROUTES).toEqual(['/privacy', '/onboarding', '/home', '/add', '/records', '/clinic-update', '/partner', '/more']);
  });
});
