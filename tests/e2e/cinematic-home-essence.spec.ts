import { expect, test } from '@playwright/test';

test('home opens as a cinematic Care OS surface instead of a generic card list', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/home?care=injection');

  const screen = page.locator('#home-screen');
  const hero = page.getByTestId('home-full-bleed-hero');
  const heroZone = page.getByTestId('home-hero-zone');
  const operation = page.getByTestId('home-operation-screen');

  await expect(screen).toHaveAttribute('data-home-experience', 'care-state-hero');
  await expect(screen).toHaveAttribute('data-hero-surface', /brief|execution/);
  await expect(hero).toBeVisible();
  await expect(heroZone).toBeVisible();
  await expect(operation).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘 실행' })).toBeVisible();
  await expect(heroZone).toContainText(/확인이 필요한 일정이 있어요|병원 안내 기준으로 다음 실행을 정리했어요\.|천천히 준비하면 돼요|오늘은 예정된 일정이 없어요/);
  await expect(page.getByText('확인할 항목은 아래에 접어뒀어요')).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘 확인할 항목' })).toBeVisible();
  await expect(page.getByRole('region', { name: '병원 안내 기준' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '일정 날짜' })).toBeVisible();

  const metrics = await page.evaluate(() => {
    const heroElement = document.querySelector('[data-testid="home-full-bleed-hero"]');
    const operationElement = document.querySelector('[data-testid="home-operation-screen"]');
    if (!heroElement || !operationElement) return null;
    const heroRect = heroElement.getBoundingClientRect();
    const operationRect = operationElement.getBoundingClientRect();
    return {
      heroPosition: getComputedStyle(heroElement).position,
      heroHeight: heroRect.height,
      heroBottom: heroRect.bottom,
      operationTop: operationRect.top,
      viewportHeight: window.innerHeight,
    };
  });
  expect(metrics).not.toBeNull();
  expect(metrics!.heroPosition).toBe('sticky');
  expect(metrics!.heroHeight).toBeGreaterThan(metrics!.viewportHeight * 0.55);
  expect(Math.abs(metrics!.operationTop - metrics!.heroBottom)).toBeLessThan(28);
  await expect(page.getByTestId('partner-connect-bar')).toHaveCount(0);
  await expect(page.getByText('확정된 카드')).toHaveCount(0);
  await expect(page.getByText('Low-energy input')).toHaveCount(0);
  await expect(page.getByText('Dynamic Home')).toHaveCount(0);
  await expect(page.getByTestId('care-moment-ring')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '오늘의 실행 카드' })).toHaveCount(0);
  await expect(page.getByText('오늘의 배아')).toHaveCount(0);
  await expect(page.getByText('임박')).toHaveCount(0);
});

test('home injection countdown ticks down in the live presentation fixture', async ({ page }) => {
  await page.goto('/home');

  const hero = page.getByTestId('injection-countdown-hero');
  await expect(hero).toContainText('남은 시간');
  await expect(page.getByTestId('countdown-sheet-lift')).toHaveCount(0);

  const firstHeroSeconds = parseCountdownSeconds(await hero.innerText());
  expect(firstHeroSeconds).not.toBeNull();

  await page.waitForTimeout(2400);

  const secondHeroSeconds = parseCountdownSeconds(await hero.innerText());
  expect(secondHeroSeconds).not.toBeNull();
  expect(secondHeroSeconds!).toBeLessThan(firstHeroSeconds!);
});

function parseCountdownSeconds(text: string) {
  const match = text.match(/남은 시간\s*(\d{2}):(\d{2})/) ?? text.match(/(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
