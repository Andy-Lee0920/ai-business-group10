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

});
