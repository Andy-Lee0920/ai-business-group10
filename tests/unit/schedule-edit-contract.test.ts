import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const apiRoute = readFileSync('app/api/schedule/[id]/route.ts', 'utf8');
const editPage = readFileSync('app/(authed)/schedule/[id]/edit/page.tsx', 'utf8');
const actionCard = readFileSync('src/components/action-card.tsx', 'utf8');
const todayScreen = readFileSync('src/features/today/today-screen.tsx', 'utf8');
const calendarScreen = readFileSync('src/features/calendar/calendar-screen.tsx', 'utf8');
const recordsScreen = readFileSync('src/features/records/records-screen.tsx', 'utf8');
const editForm = readFileSync('src/features/schedule/schedule-edit-form.tsx', 'utf8');

describe('schedule edit contract', () => {
  it('renders a protected edit form for registered schedule content', () => {
    expect(editForm).toContain('data-testid="schedule-edit-form"');
    expect(editForm).toContain('일정 수정');
    expect(editForm).toContain('수정 저장');
    expect(editForm).toContain('type="datetime-local"');
    expect(editForm).toContain('fetch(`/api/schedule/${item.id}`');
    expect(editForm).toContain('var(--slc-coral)');
    expect(editForm).toContain('이 일정 삭제');
  });

  it('keeps schedule edit controls within the mobile form width', () => {
    expect(editForm).toContain('const pageStyle');
    expect(editForm).toContain("overflowX: 'hidden'");
    expect(editForm).toContain("minWidth: 0");
    expect(editForm).toContain("gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'");
    expect(editForm).toContain("maxWidth: '100%'");
  });

  it('updates only the authenticated patient owned schedule row', () => {
    expect(apiRoute).toContain('export async function PATCH');
    expect(apiRoute).toContain("from('schedule_items')");
    expect(apiRoute).toContain('.update({');
    expect(apiRoute).toContain(".eq('id', id)");
    expect(apiRoute).toContain(".eq('patient_id', user.id)");
    expect(apiRoute).toContain('updated_at');
  });

  it('exposes edit entry points from home, calendar, and records schedule rows', () => {
    for (const source of [actionCard, todayScreen, calendarScreen, recordsScreen]) {
      expect(source).toContain('/schedule/${');
    }
    expect(editPage).toContain('ScheduleEditForm');
    expect(editPage).toContain("from('schedule_items')");
    expect(editPage).toContain(".eq('patient_id', user.id)");
  });

  it('uses chevron edit affordances on schedule timeline rows', () => {
    for (const source of [todayScreen, recordsScreen]) {
      expect(source).toContain('>›</Link>');
      expect(source).toContain('fontSize: 22');
      expect(source).toContain('lineHeight: 1');
      expect(source).not.toContain('>수정</Link>');
    }
    expect(calendarScreen).toContain('function TimelineRow');
    expect(calendarScreen).toContain('paddingLeft: 28');
    expect(calendarScreen).toContain('left: 10');
    expect(calendarScreen).toContain('>›</span>');
    expect(calendarScreen).not.toContain('function TimelineCard');
  });
});
