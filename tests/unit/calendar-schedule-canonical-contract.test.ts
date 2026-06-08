import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const calendarPage = readFileSync('app/(authed)/calendar/page.tsx', 'utf8');
const scheduleRoute = readFileSync('app/api/schedule/route.ts', 'utf8');
const scheduleIdRoute = readFileSync('app/api/schedule/[id]/route.ts', 'utf8');
const scheduleAddRoute = readFileSync('app/api/schedule/add/route.ts', 'utf8');
const editPage = readFileSync('app/(authed)/schedule/[id]/edit/page.tsx', 'utf8');
const addPage = readFileSync('app/(authed)/add/page.tsx', 'utf8');
const clinicUpdatePage = readFileSync('app/(authed)/clinic-update/page.tsx', 'utf8');
const partnerPage = readFileSync('app/(authed)/partner/page.tsx', 'utf8');
const partnerCareCardReader = readFileSync('src/features/partner/read-partner-care-cards.ts', 'utf8');

describe('Slice 5 calendar/schedule canonical compatibility contract', () => {
  it('makes calendar and schedule reads prefer projected care_action_cards before legacy schedule_items fallback', () => {
    for (const source of [calendarPage, scheduleRoute]) {
      const canonicalIndex = source.indexOf("from('care_action_cards')");
      const legacyIndex = source.indexOf("from('schedule_items')");

      expect(canonicalIndex).toBeGreaterThanOrEqual(0);
      expect(legacyIndex).toBeGreaterThanOrEqual(0);
      expect(canonicalIndex).toBeLessThan(legacyIndex);
      expect(source).toContain('projectCareActionCardsForSchedule');
      expect(source).toContain('mergeCanonicalScheduleItemsWithLegacyFallback');
      expect(source).toContain(".eq('created_by', user.id)");
      expect(source).toContain(".in('status', ['confirmed', 'completed'])");
    }
  });

  it('does not hide care_date-only canonical cards behind scheduled_at range filters', () => {
    const canonicalRead = calendarPage.slice(calendarPage.indexOf("from('care_action_cards')"), calendarPage.indexOf("from('schedule_items')"));
    const apiCanonicalRead = scheduleRoute.slice(scheduleRoute.indexOf("from('care_action_cards')"), scheduleRoute.indexOf("from('schedule_items')"));

    expect(canonicalRead).not.toContain("gte('scheduled_at'");
    expect(canonicalRead).not.toContain("lte('scheduled_at'");
    expect(apiCanonicalRead).not.toContain("gte('scheduled_at'");
    expect(apiCanonicalRead).not.toContain("lte('scheduled_at'");
    expect(calendarPage).toContain('isWithinRange(item.scheduled_at, start, end)');
    expect(scheduleRoute).toContain('isWithinRange(item.scheduled_at, todayStart, todayEnd)');
  });

  it('lets canonical calendar rows open the edit surface before falling back to legacy schedule rows', () => {
    expect(editPage.indexOf("from('care_action_cards')")).toBeLessThan(editPage.indexOf("from('schedule_items')"));
    expect(editPage).toContain('projectCareActionCardForSchedule');
    expect(editPage).toContain(".eq('created_by', user.id)");
    expect(scheduleIdRoute.indexOf("from('care_action_cards')")).toBeLessThan(scheduleIdRoute.indexOf("from('schedule_items')"));
    expect(scheduleIdRoute).toContain('source: \'care_action_cards\'');
    expect(scheduleIdRoute).toContain('source: \'legacy_schedule_items\'');
    expect(scheduleIdRoute).toContain('Legacy compatibility fallback');
  });

  it('keeps old schedule add/edit writes explicitly labeled as legacy compatibility, not new canonical inserts', () => {
    expect(scheduleAddRoute).toContain('Legacy compatibility write');
    expect(scheduleIdRoute).toContain('Legacy compatibility fallback');
    expect(scheduleAddRoute).toContain("from('schedule_items')");
    expect(scheduleIdRoute).toContain("from('schedule_items')");
    expect(scheduleAddRoute).not.toContain("from('care_action_cards')");
  });

  it('preserves primary-user add/clinic-update current item compatibility and leaves partner read untouched', () => {
    expect(addPage).toContain("from('care_action_cards')");
    expect(addPage).toContain("from('schedule_items')");
    expect(addPage).toContain('id,patient_id,medication_id,type,title,scheduled_at,dose,unit,status,source,created_at');
    expect(addPage).toContain('mergeCanonicalScheduleItemsWithLegacyFallback');
    expect(clinicUpdatePage).toContain("from('care_action_cards')");
    expect(clinicUpdatePage).toContain("from('schedule_items')");
    expect(clinicUpdatePage).toContain('id,patient_id,medication_id,type,title,scheduled_at,dose,unit,status,source,created_at');
    expect(clinicUpdatePage).toContain('mergeCanonicalScheduleItemsWithLegacyFallback');
    expect(partnerPage).toContain('getPartnerVisibleCareCards');
    expect(partnerPage).toContain('linkedPatientId: link.patient_id');
    expect(partnerCareCardReader).toContain("eq('created_by', input.linkedPatientId)");
    expect(partnerCareCardReader).toContain("eq('partner_visible', true)");
  });
});
