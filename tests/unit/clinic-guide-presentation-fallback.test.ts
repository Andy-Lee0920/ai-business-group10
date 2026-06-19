import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const env = readFileSync('src/lib/env.ts', 'utf8');
const authedLayout = readFileSync('app/(authed)/layout.tsx', 'utf8');
const clinicPage = readFileSync('app/(authed)/clinic-update/page.tsx', 'utf8');
const addPage = readFileSync('app/(authed)/add/page.tsx', 'utf8');
const homePage = readFileSync('app/(authed)/home/page.tsx', 'utf8');
const homeLoader = readFileSync('src/features/today/home-page-loader.tsx', 'utf8');
const homeDemo = readFileSync('src/features/today/presentation-home-demo.tsx', 'utf8');
const recordsPage = readFileSync('app/(authed)/records/page.tsx', 'utf8');
const recordsLoader = readFileSync('src/features/records/records-page-loader.ts', 'utf8');
const calendarPage = readFileSync('app/(authed)/calendar/page.tsx', 'utf8');
const partnerPage = readFileSync('app/(authed)/partner/page.tsx', 'utf8');
const morePage = readFileSync('app/(authed)/more/page.tsx', 'utf8');
const settingsPage = readFileSync('app/(authed)/settings/page.tsx', 'utf8');

describe('Clinic Guide presentation fallback without Supabase env', () => {
  it('can render the protected clinic guide smoke path without requiring Supabase public config', () => {
    expect(env).toContain('hasSupabasePublicConfig');
    expect(authedLayout).toContain('isPresentationRequest({ headers: requestHeaders })');
    expect(authedLayout).toContain('const skipSupabase = presentationMode;');
    expect(clinicPage).toContain('isPresentationRequest({ headers: requestHeaders })');
    expect(clinicPage).toContain('fallbackMedications()');
    expect(morePage).toContain("permanentRedirect('/settings')");
    for (const page of [addPage, partnerPage, settingsPage]) {
      expect(page).toContain('isPresentationRequest({ headers: requestHeaders })');
    }
    expect(homePage).toContain('renderHomePage');
    expect(homeLoader).toContain('isPresentationRequest({ headers: requestHeaders })');
    expect(homeLoader).toContain('AdaptiveHomeDemo');
    expect(homeDemo).toContain('<AdaptiveHomeDemo');
    expect(homeDemo).not.toContain('StageHomeScreen');
    expect(homeDemo).not.toContain('PresentationTestbedNav');
    expect(calendarPage).toContain('isPresentationRequest({ headers: requestHeaders })');
    expect(calendarPage).toContain('CalendarScreen items={buildPresentationItems()}');
    expect(calendarPage).not.toContain('PresentationCalendarDemo');
    expect(recordsPage).toContain('loadRecordsScreenProps');
    expect(recordsLoader).toContain('buildPresentationItems()');
    expect(settingsPage).toContain('buildPresentationPartnerLinks()');
  });
});
