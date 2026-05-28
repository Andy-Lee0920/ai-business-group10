import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const globals = readFileSync('app/globals.css', 'utf8');

describe('SLC color token contract', () => {
  it('defines the MVP neutral surface, coral accent, success, and warning tokens exactly once', () => {
    for (const token of [
      '--slc-bg: #FAF7F2;',
      '--slc-surface: #FFFDFC;',
      '--slc-surface-warm: #F7EFE9;',
      '--slc-border: #E9DED6;',
      '--slc-text: #2F2926;',
      '--slc-muted: #8A7F78;',
      '--slc-coral: #C95F4B;',
      '--slc-coral-light: #F4DCD5;',
      '--slc-coral-dark: #A94E3F;',
      '--slc-success: #6E8F72;',
      '--slc-warning: #B8793E;',
    ]) {
      expect(globals).toContain(token);
    }
  });

  it('uses success, not coral, for completed calendar/presentation states', () => {
    const calendar = readFileSync('src/features/calendar/calendar-screen.tsx', 'utf8');
    const presentationCalendar = readFileSync('src/features/presentation/presentation-calendar-demo.tsx', 'utf8');
    expect(calendar).toContain("status === 'completed' ? 'var(--slc-success)' : 'var(--slc-coral)'");
    expect(presentationCalendar).toContain("item.status === 'completed') return 'var(--slc-success)'");
    expect(presentationCalendar).not.toContain("item.status === 'completed') return 'var(--slc-coral)'");
  });

  it('keeps non-action privacy gate icons and eyebrow away from coral', () => {
    const privacy = readFileSync('app/privacy/page.tsx', 'utf8');
    expect(privacy).not.toContain("color: 'var(--slc-coral)'",
    );
    expect(privacy).toContain("color: 'var(--slc-muted)'");
    expect(privacy).toContain("color: 'var(--fevio-sage-dark)'");
    expect(privacy).toContain('var(--slc-coral-gradient)');
  });


  it('keeps settings and more informational labels away from coral', () => {
    const settingsPrivacy = readFileSync('app/(authed)/settings/privacy/page.tsx', 'utf8');
    const more = readFileSync('src/features/more/more-screen.tsx', 'utf8');

    expect(settingsPrivacy).not.toContain("데이터 보안</p>");
    expect(settingsPrivacy).toContain("데이터 보안</span>");
    expect(settingsPrivacy).not.toContain("color: 'var(--slc-coral)', margin: '0 0 8px' }");

    expect(more).not.toContain("공유와 설정 관리</p>");
    expect(more).toContain("공유와 설정 관리</span>");
    expect(more).not.toContain("muted ? 'var(--slc-muted)' : 'var(--slc-coral)'");
  });

  it('keeps raw partner invite links neutral while preserving More primary actions', () => {
    const more = readFileSync('src/features/more/more-screen.tsx', 'utf8');

    expect(more).not.toContain("color: 'var(--slc-coral)', fontFamily: 'monospace'");
    expect(more).toContain("color: 'var(--slc-muted)', fontFamily: 'monospace'");
    expect(more).toContain("background: tone === 'primary' ? 'var(--slc-coral)' : 'var(--slc-border)'");
  });


  it('keeps records journal/shared-record preview labels away from coral', () => {
    const records = [
      readFileSync('src/domain/records-surface-contract.ts', 'utf8'),
      readFileSync('src/features/records/records-screen.tsx', 'utf8'),
      readFileSync('src/features/records/journal/journal-preview.tsx', 'utf8'),
      readFileSync('src/features/records/community/community-preview.tsx', 'utf8'),
    ].join('\n');

    expect(records).toContain('커플저널');
    expect(records).toContain('오늘의 기분');
    expect(records).toContain("journal: '커플저널'");
    expect(records).toContain("community: '공유 기록'");
    expect(records).not.toContain("치료 실행 기록</span>");
    expect(records).not.toContain("파트너 확인 메모</span>");
    expect(records).not.toContain("공유 기록</p>");
    expect(records).toContain("color: 'var(--fevio-sage-dark)'");
    expect(records).toContain("background: 'var(--slc-coral)'");
  });

  it('keeps deprecated records billing visualization out of the runtime screen', () => {
    const records = readFileSync('src/features/records/records-screen.tsx', 'utf8');

    expect(records).not.toContain('CostLineChart');
    expect(records).not.toContain('receiptCountBadgeStyle');
    expect(records).not.toContain('정부지원금');
    expect(records).not.toContain('영수증');
    expect(records).not.toContain('stroke="var(--slc-coral)"');
    expect(records).not.toContain('fill="var(--slc-coral)"');
  });


  it('keeps clinic update review labels away from coral while preserving selected-state accents', () => {
    const clinicUpdate = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');

    expect(clinicUpdate).not.toContain("<h2 style={{ ...sectionTitleStyle, color: 'var(--slc-coral)' }}>정리된 내용</h2>");
    expect(clinicUpdate).toContain("<h2 style={{ ...sectionTitleStyle, color: 'var(--slc-text)' }}>정리된 내용</h2>");
    expect(clinicUpdate).not.toContain("<strong style={{ color: 'var(--slc-coral)' }}>AI 질문</strong>");
    expect(clinicUpdate).toContain("<strong style={{ color: 'var(--slc-muted)' }}>AI 질문</strong>");

    expect(clinicUpdate).toContain("active ? 'var(--slc-coral)' : '#EFE4DC'");
    expect(clinicUpdate).toContain("background: active ? 'var(--slc-coral-light)' : '#fff'");
  });


  it('keeps schedule edit header label neutral while preserving destructive/action affordances', () => {
    const editForm = readFileSync('src/features/schedule/schedule-edit-form.tsx', 'utf8');

    expect(editForm).not.toContain("<p style={{ margin: '0 0 5px', color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>일정 수정</p>");
    expect(editForm).toContain("<p style={{ margin: '0 0 5px', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 900 }}>일정 수정</p>");
    expect(editForm).toContain("background: 'var(--slc-coral)'");
    expect(editForm).toContain("color: 'var(--slc-coral)'");
  });

  it('keeps add date range guidance neutral while preserving selected mode and save CTAs', () => {
    const manualAdd = readFileSync('src/features/add/manual-add-form.tsx', 'utf8');

    expect(manualAdd).toContain("selected: { backgroundColor: 'var(--slc-coral)', color: '#fff' }");
    expect(manualAdd).not.toContain("range_middle: { backgroundColor: 'var(--slc-coral-light)', color: 'var(--slc-coral)' }");
    expect(manualAdd).toContain("range_middle: { backgroundColor: 'var(--slc-surface-warm)', color: 'var(--slc-muted)' }");
    expect(manualAdd).not.toContain("today: { color: 'var(--slc-coral)', fontWeight: 800 }");
    expect(manualAdd).toContain("today: { color: 'var(--fevio-sage-dark)', fontWeight: 800 }");
    expect(manualAdd).toContain("background: form.scheduleMode === mode ? 'var(--slc-coral)' : 'var(--slc-border)'");
    expect(manualAdd).toContain("marginTop: 32, background: 'var(--slc-coral)', color: '#fff'");
  });

  it('keeps onboarding decorative icons, preview labels, and progress away from coral', () => {
    const onboardingCss = readFileSync('app/onboarding/onboarding.module.css', 'utf8');
    const onboardingUi = readFileSync('src/features/onboarding/onboarding-ui.tsx', 'utf8');

    for (const selector of ['.methodIcon', '.homePreviewCard small', '.methodHeroCard i']) {
      const start = onboardingCss.indexOf(`${selector} {`);
      const block = start >= 0 ? onboardingCss.slice(start, onboardingCss.indexOf('}', start) + 1) : '';
      expect(block).not.toContain('var(--slc-coral');
      expect(block).toContain('var(--fevio-sage-dark');
    }
    const progressBlock = onboardingCss.match(/\.candidateProgressFill\s*\{[^}]+\}/u)?.[0] ?? '';
    expect(progressBlock).not.toContain('background: var(--slc-coral)');
    expect(progressBlock).toContain('background: var(--fevio-sage-dark)');

    expect(onboardingCss).toContain('border-color: var(--slc-coral)');
    expect(onboardingCss).toContain('color: var(--slc-coral)');
    expect(onboardingUi).toContain("primary: 'var(--slc-coral)'");
  });


  it('keeps partner projection status labels from using coral as informational color', () => {
    const partnerView = readFileSync('src/features/partner/partner-view.tsx', 'utf8');

    expect(partnerView).not.toContain("color: 'var(--slc-coral)', fontWeight: 600, margin: 0 }}>오늘 병원 방문 후 일정이 변경됐어요");
    expect(partnerView).toContain("color: 'var(--slc-warning)', fontWeight: 600, margin: 0 }}>오늘 병원 방문 후 일정이 변경됐어요");
    expect(partnerView).not.toContain("color: 'var(--slc-coral)', fontWeight: 600 }}>읽기 전용</span>");
    expect(partnerView).toContain("color: 'var(--slc-muted)', fontWeight: 600 }}>읽기 전용</span>");
  });


  it('keeps presentation testbed labels neutral while preserving active navigation coral', () => {
    const homeDemo = readFileSync('src/features/today/presentation-home-demo.tsx', 'utf8');
    const testbedNav = readFileSync('src/features/presentation/presentation-testbed.tsx', 'utf8');

    expect(homeDemo).not.toContain('Fevio scenario testbed');
    expect(homeDemo).not.toContain('PresentationTestbedNav');
    expect(homeDemo).toContain('<TodayScreen');
    expect(homeDemo).toContain('병원 안내 기준으로 다음 실행을 정리했어요.');
    expect(homeDemo).not.toContain('StageHomeScreen');
    expect(testbedNav).toContain("background: active ? 'var(--slc-coral)' : 'rgba(255, 255, 255, 0.72)'"
    );
  });


  it('keeps clinic update decorative progress, badges, and icons away from coral', () => {
    const clinicUpdate = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');

    expect(clinicUpdate).not.toContain("<span style={{ color: 'var(--slc-coral)', fontWeight: 900 }}>{label}</span>");
    expect(clinicUpdate).toContain("<span style={{ color: 'var(--slc-muted)', fontWeight: 900 }}>{label}</span>");
    expect(clinicUpdate).toContain("const progressFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: 'var(--slc-coral-light)' };");
    for (const styleName of ['badgeStyle', 'statusLineStyle', 'hospitalIconStyle', 'aiChipStyle', 'iconPillStyle']) {
      const declaration = clinicUpdate.match(new RegExp(`const ${styleName}[^;]+;`, 'u'))?.[0] ?? '';
      expect(declaration).not.toContain("color: 'var(--slc-coral)'"
      );
    }
    expect(clinicUpdate).toContain("border: `2px solid ${active ? 'var(--slc-coral)' : '#F0E1D6'}`");
  });

});
