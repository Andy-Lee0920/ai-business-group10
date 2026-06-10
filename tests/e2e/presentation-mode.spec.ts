import { expect, test } from '@playwright/test';

test('presentation landing opens the dual-view demo without auth steps', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: '듀얼뷰 데모 바로 보기' })).toHaveAttribute('href', '/demo');
  await expect(page.getByText('Google로 시작하기')).toHaveCount(0);
  await expect(page.getByText('Privacy Gate부터 보기')).toHaveCount(0);
});

test('presentation home defaults to a full-bleed care-state instrument', async ({ page }) => {
  await page.goto('/home?care=injection');

  const screen = page.locator('#home-screen');
  const hero = page.getByTestId('home-full-bleed-hero');
  const operation = page.getByTestId('home-operation-screen');

  await expect(screen).toHaveAttribute('data-home-experience', 'care-state-hero');
  await expect(screen).toHaveAttribute('data-hero-surface', /brief|execution/);
  await expect(hero).toBeVisible();
  await expect(page.getByTestId('home-hero-zone')).toBeVisible();
  await expect(operation).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘 실행' })).toBeVisible();
  await expect(page.getByTestId('home-hero-zone')).toContainText(/확인이 필요한 일정이 있어요|병원 안내 기준으로 다음 실행을 정리했어요\.|천천히 준비하면 돼요|오늘은 예정된 일정이 없어요/);
  await expect(page.getByText('확인할 항목은 아래에 접어뒀어요')).toHaveCount(0);
  await expect(page.getByTestId('home-sheet-handle')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '일정 날짜' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘 확인할 항목' })).toBeVisible();
  await expect(page.getByRole('region', { name: '병원 안내 기준' })).toBeVisible();
  await expect(page.getByTestId('partner-connect-bar')).toHaveCount(0);
  await expect(page.getByText(/Dynamic Home|signalGrid|오늘의 실행 카드|LIVE SYNC|rev \d+|CARE FLOW|오늘의 배아/)).toHaveCount(0);

  const geometry = await page.evaluate(() => {
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
  expect(geometry).not.toBeNull();
  expect(geometry!.heroPosition).toBe('sticky');
  expect(geometry!.heroHeight).toBeGreaterThan(geometry!.viewportHeight * 0.55);
  expect(Math.abs(geometry!.operationTop - geometry!.heroBottom)).toBeLessThan(28);
});

test('presentation home keeps the care-state contract across query variants', async ({ page }) => {
  for (const care of ['injection', 'clinic', 'waiting'] as const) {
    await page.goto(`/home?care=${care}`);

    await expect(page.locator('#home-screen')).toHaveAttribute('data-home-experience', 'care-state-hero');
    await expect(page.getByTestId('home-full-bleed-hero')).toBeVisible();
    await expect(page.getByTestId('home-hero-zone')).toBeVisible();
    await expect(page.getByTestId('home-operation-screen')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '일정 날짜' }).getByRole('button', { name: '오늘' })).toBeVisible();
    await expect(page.getByTestId('partner-connect-bar')).toHaveCount(0);
    await expect(page.getByText(/Dynamic Home|signalGrid|오늘의 실행 카드|LIVE SYNC|rev \d+|CARE FLOW|오늘의 배아/)).toHaveCount(0);
  }
});

test('presentation home orders the hero before the operation surface', async ({ page }) => {
  const orders: Record<string, string[]> = {};
  const trackedIds = new Set(['home-full-bleed-hero', 'home-hero-zone', 'home-operation-screen']);

  for (const care of ['injection', 'clinic', 'waiting'] as const) {
    await page.goto(`/home?care=${care}`);
    orders[care] = await page.evaluate((ids) =>
      Array.from(document.querySelectorAll('[data-testid]'))
        .map((element) => element.getAttribute('data-testid') ?? '')
        .filter((id) => ids.includes(id))
        .slice(0, 5),
    Array.from(trackedIds));
  }

  for (const order of Object.values(orders)) {
    expect(order.slice(0, 3)).toEqual(['home-full-bleed-hero', 'home-hero-zone', 'home-operation-screen']);
  }
  expect(new Set(Object.values(orders).map((order) => order.join('>'))).size).toBe(1);
});

test('presentation capture pre-fills the clinic memo sample', async ({ page }) => {
  await page.context().addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/capture');

  await expect(page.getByLabel('병원에서 들은 내용')).toContainText('고날에프');
  await expect(page.getByLabel('병원에서 들은 내용')).toContainText('프로게스테론');
});

test('presentation /partner/demo renders a sanitized partner view', async ({ page }) => {
  await page.goto('/partner/demo');

  await expect(page.getByRole('heading', { name: '파트너 오늘 할 일' })).toBeVisible();
  await expect(page.getByTestId('partner-avatar')).toBeVisible();
  await expect(page.locator('[data-testid="partner-avatar"] path')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '오늘 내 역할' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '도움 행동' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '오늘 피하기' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '21:00 고날에프 — 내가 확인한 용량' })).toBeVisible();
  await expect(page.getByText(/rev \\d+|sync_revision|raw_text|token|user_id|원문 메모/)).toHaveCount(0);
});


test('presentation /demo stage URL behaves like utility panels, not text placeholders', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/demo?mode=stage&stage=2');

  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const documentScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const stage = page.getByTestId('demo-preview-stage');
  const frames = page.getByTestId('demo-device-frame');
  const islands = page.getByTestId('demo-dynamic-island');
  const sideButtons = page.getByTestId('demo-device-button');
  const patient = page.getByTestId('demo-patient-panel');
  const partner = page.getByTestId('demo-partner-panel');

  await expect(stage).toBeVisible();
  await expect(frames).toHaveCount(2);
  await expect(islands).toHaveCount(2);
  await expect(sideButtons).toHaveCount(8);
  await expect(page.getByRole('region', { name: '발표 내러티브' })).toHaveCount(0);
  await expect(page.getByText('Problem')).toHaveCount(0);
  await expect(page.getByText('Input')).toHaveCount(0);
  await expect(page.getByTestId('shared-care-state-panel')).toBeVisible();
  await expect(page.getByText('문제는 부주의가 아니라 전달 구조입니다')).toHaveCount(0);
  await expect(page.getByText('병원에서 들은 말이 집에서 다시 설명되는 동안 빠집니다.')).toHaveCount(0);
  await expect(page.getByText('선택 한 번으로 내 화면과 파트너 행동이 같이 바뀝니다.')).toHaveCount(0);
  await expect(page.getByText('9:41')).toHaveCount(0);
  expect(documentScrollHeight).toBeLessThanOrEqual(viewportHeight);

  const stageStyles = await stage.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      backgroundColor: styles.backgroundColor,
      backgroundImage: styles.backgroundImage,
      materialThin: styles.getPropertyValue('--fevio-material-thin-blur').trim(),
      materialRegular: styles.getPropertyValue('--fevio-material-regular-blur').trim(),
      materialThick: styles.getPropertyValue('--fevio-material-thick-blur').trim(),
    };
  });
  expect(stageStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(stageStyles.backgroundImage).not.toContain('74, 107, 73');
  expect(stageStyles.backgroundImage).toContain('radial-gradient');
  expect(stageStyles.backgroundImage).toContain('linear-gradient');
  expect(stageStyles.materialThin).toBe('30px');
  expect(stageStyles.materialRegular).toBe('40px');
  expect(stageStyles.materialThick).toBe('50px');

  const frameMetrics = await frames.evaluateAll((elements) =>
    elements.map((element) => {
      const frame = element.getBoundingClientRect();
      const island = element.querySelector('[data-testid="demo-dynamic-island"]')?.getBoundingClientRect();
      const screen = element.querySelector('[data-testid$="-panel"]')?.getBoundingClientRect();
      const frameStyles = getComputedStyle(element);
      const islandElement = element.querySelector('[data-testid="demo-dynamic-island"]') as HTMLElement | null;
      const islandStyles = islandElement ? getComputedStyle(islandElement) : null;
      return {
        width: frame.width,
        height: frame.height,
        cssWidth: Number.parseFloat(frameStyles.width),
        cssHeight: Number.parseFloat(frameStyles.height),
        radius: frameStyles.borderRadius,
        borderColor: frameStyles.borderColor,
        bezelWidth: frameStyles.getPropertyValue('--demo-device-bezel-width').trim(),
        screenInsetToken: frameStyles.getPropertyValue('--demo-device-screen-inset').trim(),
        islandScreenTopToken: frameStyles.getPropertyValue('--demo-dynamic-island-screen-top').trim(),
        visibleInsetLeft: screen ? screen.left - frame.left : null,
        visibleInsetTop: screen ? screen.top - frame.top : null,
        safeAreaTop: frameStyles.getPropertyValue('--device-safe-top').trim(),
        safeAreaBottom: frameStyles.getPropertyValue('--device-safe-bottom').trim(),
        transform: frameStyles.transform,
        islandTop: island ? island.top - frame.top : null,
        islandTopFromScreen: island && screen ? island.top - screen.top : null,
        islandCenterOffset: island ? Math.abs(island.left + island.width / 2 - (frame.left + frame.width / 2)) : null,
        islandBackground: islandStyles?.backgroundColor ?? '',
        islandCssTop: Number.parseFloat(islandStyles?.top ?? '0'),
        islandCssWidth: Number.parseFloat(islandStyles?.width ?? '0'),
        islandCssHeight: Number.parseFloat(islandStyles?.height ?? '0'),
        islandCssRadius: Number.parseFloat(islandStyles?.borderRadius ?? '0'),
        islandOverlapsScreenTop: Boolean(island && screen && island.top < screen.top + 42),
      };
    }),
  );

  for (const frame of frameMetrics) {
    expect(frame.cssWidth).toBeCloseTo(440, 1);
    expect(frame.cssHeight).toBeCloseTo(956, 1);
    expect(frame.width).toBeGreaterThanOrEqual(349);
    expect(frame.width).toBeLessThanOrEqual(440);
    expect(frame.height).toBeGreaterThanOrEqual(760);
    expect(frame.radius).toBe('53px');
    expect(frame.borderColor).toBe('rgb(10, 12, 11)');
    expect(frame.bezelWidth).toBe('3px');
    expect(frame.screenInsetToken).toBe('7px');
    expect(frame.islandScreenTopToken).toBe('11px');
    expect(frame.visibleInsetLeft).not.toBeNull();
    expect(frame.visibleInsetTop).not.toBeNull();
    expect(frame.visibleInsetLeft!).toBeLessThanOrEqual(10);
    expect(frame.visibleInsetTop!).toBeLessThanOrEqual(10);
    expect(frame.safeAreaTop).toBe('59px');
    expect(frame.safeAreaBottom).toBe('34px');
    expect(frame.transform).not.toBe('none');
    expect(frame.islandTop).not.toBeNull();
    expect(frame.islandTopFromScreen).not.toBeNull();
    expect(frame.islandTopFromScreen!).toBeGreaterThanOrEqual(8);
    expect(frame.islandTopFromScreen!).toBeLessThanOrEqual(11);
    expect(frame.islandCenterOffset).not.toBeNull();
    expect(frame.islandCenterOffset!).toBeLessThanOrEqual(1);
    expect(frame.islandBackground).toBe('rgb(0, 0, 0)');
    expect(frame.islandCssTop).toBeCloseTo(18, 1);
    expect(frame.islandCssWidth).toBeCloseTo(125.67, 1);
    expect(frame.islandCssHeight).toBeCloseTo(36.67, 1);
    expect(frame.islandCssRadius).toBeCloseTo(18.33, 1);
    expect(frame.islandOverlapsScreenTop).toBe(true);
  }

  await expect(page.getByRole('heading', { name: '내 화면', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '파트너 화면', exact: true })).toBeVisible();
  await expect(page.getByText('발표자용 단계 전환')).toBeVisible();
  await expect(page.getByTestId('stage-pill-2')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('배란 유도');
  await expect(page.getByTestId('primary-user-avatar')).toBeVisible();
  await expect(page.getByTestId('partner-avatar')).toBeVisible();
  await expect(page.getByTestId('source-to-care-bridge')).toBeVisible();
  await expect(page.getByTestId('source-to-care-bridge')).toContainText('Fevio가 읽은 병원 안내');
  await expect(page.getByText(/Live Sync|Live mirror|LIVE SYNC/)).toHaveCount(0);

  await expect(patient).toContainText('21:00 주사 기록');
  await expect(patient).toContainText('약 이름과 시간');
  await expect(patient).toContainText('주사 기록');
  await expect(partner).toContainText('약 이름과 준비물 확인');
  await expect(partner).toContainText('공유 상태');
  await expect(partner).toContainText('케어 공유 중');
  await expect(partner).toContainText('용량 변경 제안');

  await patient.getByRole('button', { name: /주사 완료 기록/ }).click();
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('완료된 행동 1건');
  await partner.getByRole('button', { name: /약 이름 확인/ }).click();
  await expect(partner.getByRole('button', { name: /약 이름 확인/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('stage-pill-5').click();
  await expect(page.getByTestId('stage-pill-5')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('배아 배양');
  await expect(patient).toContainText('Day 1·3·5 상태 변경');
  await expect(patient).toContainText('배아 업데이트');
  await expect(partner).toContainText('먼저 묻지 않기');

  await page.getByTestId('stage-pill-7').click();
  await expect(page.getByTestId('stage-pill-7')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('임신 확인');
  await expect(patient).toContainText('결과와 다음 일정 분리');
  await expect(patient).toContainText('공유 범위');
  await expect(partner).toContainText('수치 해석하지 않기');
  await expect(partner).toContainText('다음 검사일');
});
test('presentation /demo supports every stage deep link without raw component labels or squeezed Korean text', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const forbiddenSurfaceCopy = /BetaHcgInputCard|ResultVisibilityControl|NextStepPlanner|EmbryoUpdateTimeline|SharedUpdateStatus|QuietSupportCard|TransferSummaryCard|LutealMedicationTracker|Permission projection|cards visible|Utility components|scheduled\/actual\/recorded/;

  for (const stage of [1, 2, 3, 4, 5, 6, 7]) {
    await page.goto(`/demo?mode=stage&stage=${stage}`);
    await expect(page.getByTestId(`stage-pill-${stage}`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('shared-care-state-panel')).toBeVisible();
    await expect(page.getByText(forbiddenSurfaceCopy)).toHaveCount(0);

    const layout = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="productCard"], [class*="productActionRow"]')) as HTMLElement[];
      return cards.map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height, text: element.innerText.slice(0, 80) };
      });
    });

    expect(layout.length).toBeGreaterThanOrEqual(6);
    for (const card of layout) {
      expect(card.width, `${stage}: ${card.text}`).toBeGreaterThan(270);
      expect(card.height, `${stage}: ${card.text}`).toBeLessThan(190);
    }
  }
});

test('presentation /demo stage 7 changes partner projection when patient changes sharing scope', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/demo?mode=stage&stage=7');

  const partner = page.getByTestId('demo-partner-panel');
  const patient = page.getByTestId('demo-patient-panel');

  await expect(page.getByTestId('stage-pill-7')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('일정만 공유');
  await expect(partner).toContainText('일정만 공유 중');
  await expect(partner).toContainText('다음 검사일');
  await expect(partner).toContainText('수치 해석하지 않기');
  await expect(partner.getByRole('button', { name: /공유 상태/ })).toHaveCount(0);

  await patient.getByRole('button', { name: '케어 공유' }).click();
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('케어 공유');
  await expect(partner).toContainText('케어 공유 중');
  await expect(partner.getByRole('button', { name: /공유 상태/ })).toBeVisible();

  await patient.getByRole('button', { name: '감정까지' }).click();
  await expect(page.getByTestId('shared-care-state-panel')).toContainText('감정까지 공유');
  await expect(partner).toContainText('감정까지 공유 중');
});
