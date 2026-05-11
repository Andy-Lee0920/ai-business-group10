import { expect, test } from '@playwright/test';

test('root page exposes Fevio brand metadata and install icons', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og-image\.png$/);
  await expect(page.getByRole('img', { name: 'Fevio 페비오' })).toBeVisible();
});

test('brand assets are served from public files', async ({ page }) => {
  await page.goto('/');

  for (const path of ['/favicon.svg', '/icon-512.png', '/apple-touch-icon.png', '/og-image.png', '/logo.svg', '/manifest.json']) {
    const response = await page.request.get(path);
    expect(response.status(), `${path} should be available`).toBe(200);
  }
});
