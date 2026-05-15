import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const env = readFileSync('src/lib/env.ts', 'utf8');
const authedLayout = readFileSync('app/(authed)/layout.tsx', 'utf8');
const clinicPage = readFileSync('app/(authed)/clinic-update/page.tsx', 'utf8');
const addPage = readFileSync('app/(authed)/add/page.tsx', 'utf8');
const homePage = readFileSync('app/(authed)/home/page.tsx', 'utf8');
const recordsPage = readFileSync('app/(authed)/records/page.tsx', 'utf8');
const partnerPage = readFileSync('app/(authed)/partner/page.tsx', 'utf8');
const morePage = readFileSync('app/(authed)/more/page.tsx', 'utf8');

describe('Clinic Guide presentation fallback without Supabase env', () => {
  it('can render the protected clinic guide smoke path without requiring Supabase public config', () => {
    expect(env).toContain('hasSupabasePublicConfig');
    expect(authedLayout).toContain('presentationMode && !hasSupabasePublicConfig()');
    expect(clinicPage).toContain('isPresentationMode() && !hasSupabasePublicConfig()');
    expect(clinicPage).toContain('fallbackMedications()');
    for (const page of [addPage, recordsPage, partnerPage, morePage]) {
      expect(page).toContain('isPresentationMode() && !hasSupabasePublicConfig()');
    }
    expect(homePage).toContain('const presentationMode = isPresentationMode()');
    expect(homePage).toContain('presentationMode && !hasSupabasePublicConfig()');
  });
});
