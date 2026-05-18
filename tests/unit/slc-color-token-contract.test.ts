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


  it('keeps records screen section labels away from coral while preserving action/alert colors', () => {
    const records = readFileSync('src/features/records/records-screen.tsx', 'utf8');

    expect(records).not.toContain("영수증 입력</p>");
    expect(records).toContain("영수증 입력</span>");
    expect(records).not.toContain("시작일 기준</p>");
    expect(records).toContain("시작일 기준</span>");
    expect(records).not.toContain("이번 사이클 실부담</p>");
    expect(records).toContain("이번 사이클 실부담</span>");

    expect(records).toContain('role="alert" style={{ color: \'var(--slc-coral)\'');
    expect(records).toContain("sheetSubmitStyle");
  });

  it('keeps records financial visualization and passive guidance away from coral', () => {
    const records = readFileSync('src/features/records/records-screen.tsx', 'utf8');

    expect(records).not.toContain("summary.net < 0 ? 'var(--slc-coral)' : 'var(--slc-text)'");
    expect(records).toContain("summary.net < 0 ? 'var(--slc-warning)' : 'var(--slc-text)'");
    expect(records).not.toContain("<>주사 시작 <strong style={{ color: 'var(--slc-coral)' }}>{cycleDay}일차</strong></>");
    expect(records).toContain("<>주사 시작 <strong style={{ color: 'var(--fevio-sage-dark)' }}>{cycleDay}일차</strong></>");
    expect(records).not.toContain('stroke="var(--slc-coral)"');
    expect(records).not.toContain('fill="var(--slc-coral)"');
    expect(records).toContain('stroke="var(--fevio-sage-dark)"');
    expect(records).toContain('fill="var(--fevio-sage-dark)"');
    expect(records).not.toContain("color: 'var(--slc-coral)', fontWeight: 900 }}>{info.action}</p>");
    expect(records).toContain("color: 'var(--fevio-sage-dark)', fontWeight: 900 }}>{info.action}</p>");
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


  it('keeps partner projection status labels from using coral as informational color', () => {
    const partnerView = readFileSync('src/features/partner/partner-view.tsx', 'utf8');

    expect(partnerView).not.toContain("color: 'var(--slc-coral)', fontWeight: 600, margin: 0 }}>오늘 병원 방문 후 일정이 변경됐어요");
    expect(partnerView).toContain("color: 'var(--slc-warning)', fontWeight: 600, margin: 0 }}>오늘 병원 방문 후 일정이 변경됐어요");
    expect(partnerView).not.toContain("color: 'var(--slc-coral)', fontWeight: 600 }}>읽기 전용</span>");
    expect(partnerView).toContain("color: 'var(--slc-muted)', fontWeight: 600 }}>읽기 전용</span>");
  });


  it('keeps presentation testbed labels neutral while preserving active navigation coral', () => {
    const calendarDemo = readFileSync('src/features/presentation/presentation-calendar-demo.tsx', 'utf8');
    const homeDemo = readFileSync('src/features/today/presentation-home-demo.tsx', 'utf8');
    const testbedNav = readFileSync('src/features/presentation/presentation-testbed.tsx', 'utf8');

    expect(calendarDemo).not.toContain("color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>시나리오 테스트 베드");
    expect(calendarDemo).toContain("color: 'var(--slc-muted)', fontSize: 12, fontWeight: 900 }}>시나리오 테스트 베드");
    expect(homeDemo).not.toContain("color: 'var(--slc-coral)', fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em'");
    expect(homeDemo).toContain("color: 'var(--slc-muted)', fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em'");
    expect(homeDemo).toContain("background: 'var(--slc-surface-warm)', color: 'var(--slc-muted)'"
    );
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
