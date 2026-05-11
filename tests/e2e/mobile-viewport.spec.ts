import { expect, test } from '@playwright/test';

test('desktop renders Fevio inside an iPhone 17 shell with internal phone scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const shell = page.locator('main.app-shell').first();
  const shellBox = await shell.boundingBox();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const documentScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const shellOverflowY = await shell.evaluate((element) => getComputedStyle(element).overflowY);
  const shellPaddingTop = await shell.evaluate((element) => getComputedStyle(element).paddingTop);
  const bodyBackgroundImage = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  const shellBackgroundColor = await shell.evaluate((element) => getComputedStyle(element).backgroundColor);
  const bodyBackgroundColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const shellIsland = await shell.evaluate((element) => {
    const island = getComputedStyle(element, '::before');
    return {
      backgroundColor: island.backgroundColor,
      height: island.height,
      marginTop: island.marginTop,
      position: island.position,
      top: island.top,
      transform: island.transform,
      width: island.width,
    };
  });

  expect(shellBox).not.toBeNull();
  expect(shellBox!.width).toBeLessThanOrEqual(440);
  expect(shellBox!.width).toBeGreaterThanOrEqual(430);
  expect(shellBox!.height).toBeLessThanOrEqual(956);
  expect(Math.abs(shellBox!.x + shellBox!.width / 2 - viewportWidth / 2)).toBeLessThanOrEqual(1);
  expect(documentScrollHeight).toBeLessThanOrEqual(viewportHeight);
  expect(shellOverflowY).toBe('auto');
  expect(shellPaddingTop).toBe('0px');
  expect(bodyBackgroundImage).toContain('gradient');
  expect(bodyBackgroundImage).not.toContain('74, 107, 73');
  expect(bodyBackgroundColor).toBe('rgb(247, 244, 238)');
  expect(bodyBackgroundColor).not.toEqual(shellBackgroundColor);
  expect(shellIsland.backgroundColor).toBe('rgb(0, 0, 0)');
  expect(Number.parseFloat(shellIsland.width)).toBeCloseTo(125.67, 1);
  expect(Number.parseFloat(shellIsland.height)).toBeCloseTo(36.67, 1);
  expect(shellIsland.position).toBe('fixed');
  expect(shellIsland.marginTop).toBe('0px');
  expect(shellIsland.top).toBe('35px');
  expect(shellIsland.transform).toContain('matrix');
});

test('mobile viewport keeps shell readable without horizontal overflow', async ({ page }) => {
  await page.goto('/');

  const shellBox = await page.locator('main.app-shell').first().boundingBox();
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  expect(shellBox).not.toBeNull();
  expect(shellBox!.width).toBeLessThanOrEqual(viewportWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
});

test('onboarding uses real mobile width without an artificial phone bezel', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/onboarding');

  const metrics = await page.evaluate(() => {
    const shell = document.querySelector('main.app-shell');
    const title = document.querySelector('h1');
    const shellBox = shell?.getBoundingClientRect();
    return {
      shellWidth: shellBox?.width ?? 0,
      viewportWidth: window.innerWidth,
      h1FontSize: Number.parseFloat(getComputedStyle(title!).fontSize),
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(metrics.shellWidth).toBeGreaterThanOrEqual(metrics.viewportWidth - 1);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.h1FontSize).toBeLessThanOrEqual(36);
});
