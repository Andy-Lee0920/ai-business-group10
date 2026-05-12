import { expect, test } from '@playwright/test';


test('presentation landing opens the dual-view demo without auth steps', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: '듀얼뷰 데모 바로 보기' })).toHaveAttribute('href', '/demo');
  await expect(page.getByText('Google로 시작하기')).toHaveCount(0);
  await expect(page.getByText('Privacy Gate부터 보기')).toHaveCount(0);
});

test('presentation home defaults to an immersive injection-day care instrument', async ({ page }) => {
  await page.goto('/home?care=injection');

  await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', 'injection');
  const phaseNav = page.getByRole('navigation', { name: '케어 단계 전환' });
  await expect(phaseNav).toBeVisible();
  await expect(phaseNav.getByRole('link', { name: '주사', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('compact-hero-greeting')).toContainText('주사 준비');
  await expect(page.getByTestId('mission-card-pair')).toContainText('오늘의 미션');
  await expect(page.getByTestId('mission-card-pair')).toContainText('고날에프');
  await expect(page.getByTestId('quick-stat-row')).toContainText('파트너');
  await expect(page.getByTestId('partner-connect-bar')).toBeVisible();
  await expect(page.getByTestId('partner-bar-icon')).toBeVisible();
  await expect(page.getByRole('button', { name: /준비 체크리스트 보기/ })).toBeVisible();
  await expect(page.getByText(/Dynamic Home|signalGrid|오늘의 실행 카드|LIVE SYNC|rev \d+|CARE FLOW/)).toHaveCount(0);

  const missionTop = await page.getByTestId('mission-card-pair').evaluate((element) => element.getBoundingClientRect().top);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(missionTop).toBeLessThan(viewportHeight * 0.36);
});

test('presentation home applies the immersive/adaptive contract to every care day', async ({ page }) => {
  const scenarios = [
    { care: 'injection', phase: 'injection', tab: '주사', heading: '주사 준비', action: '준비 체크리스트 보기' },
    { care: 'clinic', phase: 'clinic', tab: '병원', heading: '병원 방문', action: '진료 브리핑 열기' },
    { care: 'waiting', phase: 'waiting', tab: '대기', heading: '기다리는 날', action: null },
  ];

  for (const scenario of scenarios) {
    await page.goto(`/home?care=${scenario.care}`);
    const scopedPhaseNav = page.getByRole('navigation', { name: '케어 단계 전환' });
    await expect(page.getByTestId('care-atmosphere-layer')).toHaveAttribute('data-phase', scenario.phase);
    await expect(scopedPhaseNav.getByRole('link', { name: scenario.tab, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('compact-hero-greeting')).toContainText(scenario.heading);
    await expect(page.getByTestId('partner-connect-bar')).toBeVisible();
    await expect(page.getByTestId('partner-bar-icon')).toBeVisible();
    await expect(page.getByText(/Dynamic Home|signalGrid|오늘의 실행 카드|LIVE SYNC|rev \d+|CARE FLOW/)).toHaveCount(0);

    if (scenario.action) {
      await expect(page.getByRole('button', { name: new RegExp(scenario.action) })).toBeVisible();
    }
  }
});

test('presentation home changes component order by care phase', async ({ page }) => {
  const orders: Record<string, string[]> = {};
  const trackedIds = new Set(['compact-hero-greeting', 'mission-card-pair', 'quick-stat-row', 'home-action-card', 'partner-connect-bar']);

  for (const care of ['injection', 'clinic', 'waiting'] as const) {
    await page.goto(`/home?care=${care}`);
    orders[care] = await page.evaluate((ids) =>
      Array.from(document.querySelectorAll('[data-testid]'))
        .map((element) => element.getAttribute('data-testid') ?? '')
        .filter((id) => ids.includes(id))
        .slice(0, 5),
    Array.from(trackedIds));
  }

  expect(orders.injection).toEqual(['compact-hero-greeting', 'mission-card-pair', 'quick-stat-row', 'partner-connect-bar']);
  expect(orders.clinic[0]).toBe('compact-hero-greeting');
  expect(orders.clinic).toContain('home-action-card');
  expect(orders.clinic).not.toEqual(orders.injection);
  expect(orders.waiting[1]).toBe('home-action-card');
  expect(orders.waiting).toContain('partner-connect-bar');
  expect(new Set(Object.values(orders).map((order) => order.join('>'))).size).toBe(3);
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


test('presentation /demo behaves like utility panels, not text placeholders', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/demo');

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
  await expect(page.getByText('Shared care')).toHaveCount(0);
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
  expect(stageStyles.backgroundColor).toBe('rgb(247, 244, 238)');
  expect(stageStyles.backgroundImage).not.toContain('74, 107, 73');
  expect(stageStyles.backgroundImage).toContain('radial-gradient');
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
    expect(frame.width).toBeGreaterThanOrEqual(350);
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
  await expect(page.getByText('오늘 어떤 케어 장면을 볼까요?')).toBeVisible();
  await expect(page.getByRole('group', { name: '오늘 어떤 케어 장면을 볼까요?' }).getByRole('button', { name: '주사 준비' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('내 화면은 케어 흐름, 파트너 화면은 역할만 보여줍니다.')).toHaveCount(1);
  await expect(page.getByText('함께 이어짐')).toBeVisible();
  await expect(page.getByTestId('primary-user-avatar')).toBeVisible();
  await expect(page.getByTestId('partner-avatar')).toBeVisible();
  await expect(page.getByTestId('couple-avatar-pair')).toBeVisible();
  await expect(page.locator('[data-testid="primary-user-avatar"] path')).toHaveCount(0);
  await expect(page.locator('[data-testid="partner-avatar"] path')).toHaveCount(0);
  await expect(page.locator('[data-testid="couple-avatar-pair"] path')).toHaveCount(0);
  await expect(page.getByTestId('demo-phase-icon')).toBeVisible();
  await expect(page.getByTestId('demo-partner-role-icon')).toBeVisible();
  await expect(page.getByTestId('demo-partner-presence-pulse')).toHaveCount(2);
  await expect(page.getByText(/Live Sync|Live mirror|LIVE SYNC/)).toHaveCount(0);
  await expect(patient).toContainText('21:00 주사 준비');
  await expect(partner).toContainText('약 이름과 시간을 함께 확인');
  await expect(patient).toContainText('병원 안내');
  await expect(patient).toContainText('약 이름, 시간, 준비물을 함께 확인합니다.');
  await expect(partner).toContainText('공유된 핵심');
  await expect(patient).toContainText('주사 준비 체크');
  await expect(patient).toContainText('일정 변경');
  await expect(patient).toContainText('중요 알림');
  await expect(patient).toContainText('완료 체크');
  await expect(patient).toContainText('부부 연결');
  await expect(partner).toContainText('확인자');
  await expect(partner).toContainText('공간 준비');

  const demoUiMetrics = await page.evaluate(() => {
    const patientPanel = document.querySelector('[data-testid="demo-patient-panel"]') as HTMLElement | null;
    const firstCard = patientPanel?.querySelector('.fevio-card') as HTMLElement | null;
    const liveLabel = Array.from(document.querySelectorAll('[data-testid="demo-patient-panel"] span')).find((element) =>
      element.textContent?.includes('파트너에게 보이는 역할'),
    ) as HTMLElement | undefined;
    const liveBody = document.querySelector('[data-testid="patient-sync-mirror"] p') as HTMLElement | null;
    const stepBadge = Array.from(document.querySelectorAll('span')).find((element) => element.textContent === '1/3') as HTMLElement | undefined;
    const bridge = document.querySelector('[data-testid="live-sync-bridge"]') as HTMLElement | null;

    const styles = (element: HTMLElement | null | undefined) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        color: style.color,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        paddingTop: style.paddingTop,
        rowGap: style.rowGap,
        textTransform: style.textTransform,
      };
    };

    const bridgeBefore = bridge ? getComputedStyle(bridge, '::before') : null;
    return {
      panel: patientPanel ? { paddingTop: getComputedStyle(patientPanel).paddingTop, rowGap: getComputedStyle(patientPanel).rowGap } : null,
      firstCard: styles(firstCard),
      liveLabel: styles(liveLabel),
      liveBody: styles(liveBody),
      stepBadge: styles(stepBadge),
      bridgeLine: bridgeBefore
        ? {
            height: bridgeBefore.height,
            opacity: bridgeBefore.opacity,
            backgroundImage: bridgeBefore.backgroundImage,
          }
        : null,
    };
  });

  expect(demoUiMetrics.panel).toMatchObject({ paddingTop: '59px', rowGap: '10px' });
  expect(demoUiMetrics.firstCard?.backgroundImage).toContain('radial-gradient');
  expect(demoUiMetrics.firstCard).toMatchObject({ borderRadius: '16px', paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px', paddingLeft: '16px' });
  expect(demoUiMetrics.firstCard?.boxShadow).toContain('rgba(0, 0, 0, 0.05)');
  expect(demoUiMetrics.liveLabel).toMatchObject({ color: 'rgb(156, 163, 175)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' });
  expect(demoUiMetrics.liveBody).toMatchObject({ color: 'rgb(107, 114, 128)', fontSize: '12px' });
  expect(demoUiMetrics.stepBadge).toMatchObject({ backgroundColor: 'rgb(243, 244, 246)', borderRadius: '99px', paddingTop: '6px', paddingRight: '12px', paddingBottom: '6px', paddingLeft: '12px' });
  expect(demoUiMetrics.bridgeLine).toMatchObject({ height: '1.5px', opacity: '0.4' });

  await page.getByRole('button', { name: '펜 용량 확인' }).click();
  await expect(page.getByRole('button', { name: /펜 용량 확인/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '약 이름·시간 대조' }).click();
  await expect(page.getByRole('button', { name: /약 이름·시간 대조/ })).toHaveAttribute('aria-pressed', 'true');

  await patient.getByRole('button', { name: '오늘 항목 완료' }).click();
  await expect(partner).toContainText('완료됨');
  await expect(page.getByTestId('partner-sync-mirror')).toContainText('완료 상태가 파트너 화면에 반영됐습니다');
  await partner.getByRole('button', { name: '확인 완료', exact: true }).click();
  await expect(patient).toContainText('파트너가 확인했어요');
  await expect(page.getByTestId('patient-sync-mirror')).toContainText('파트너 확인이 내 화면에 반영됐습니다');

  await page.getByRole('group', { name: '오늘 어떤 케어 장면을 볼까요?' }).getByRole('button', { name: '병원 다녀오기' }).click();
  await expect(page.getByRole('group', { name: '오늘 어떤 케어 장면을 볼까요?' }).getByRole('button', { name: '병원 다녀오기' })).toHaveAttribute('aria-pressed', 'true');
  await expect(patient).toContainText('질문과 기록 준비');
  await expect(patient).toContainText('방문 체크리스트');
  await expect(patient).toContainText('09:00');
  await expect(partner).toContainText('동행자');
  await expect(partner).toContainText('다음 일정을 함께 기록');
  await expect(partner).toContainText('이동 시간 확인');

  await page.getByRole('group', { name: '오늘 어떤 케어 장면을 볼까요?' }).getByRole('button', { name: '기다리는 중' }).click();
  await expect(page.getByRole('group', { name: '오늘 어떤 케어 장면을 볼까요?' }).getByRole('button', { name: '기다리는 중' })).toHaveAttribute('aria-pressed', 'true');
  await expect(patient).toContainText('확인할 것만 남깁니다');
  await expect(patient).toContainText('차분한 체크인');
  await expect(patient).toContainText('조용 모드');
  await expect(partner).toContainText('곁에 있는 사람');
  await expect(partner).toContainText('묻기보다 곁에 있기');
  await expect(partner).toContainText('결과 묻지 않기');
});
