import { expect, test } from '@playwright/test';

test('desktop renders Fevio inside an iPhone-width shell with sage outside background', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const shell = page.locator('main.app-shell').first();
  const shellBox = await shell.boundingBox();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const bodyBackgroundImage = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  const shellBackgroundColor = await shell.evaluate((element) => getComputedStyle(element).backgroundColor);
  const bodyBackgroundColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  expect(shellBox).not.toBeNull();
  expect(shellBox!.width).toBeLessThanOrEqual(390);
  expect(Math.abs(shellBox!.x + shellBox!.width / 2 - viewportWidth / 2)).toBeLessThanOrEqual(1);
  expect(bodyBackgroundImage).toContain('gradient');
  expect(bodyBackgroundColor).not.toEqual(shellBackgroundColor);
});

test('mobile viewport keeps shell readable without horizontal overflow', async ({ page }) => {
  await page.goto('/');

  const shellBox = await page.locator('main.app-shell').first().boundingBox();
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  expect(shellBox).not.toBeNull();
  expect(shellBox!.width).toBeLessThanOrEqual(390);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
});
