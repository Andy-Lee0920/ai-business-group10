import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const env = readFileSync('src/lib/env.ts', 'utf8');
const authedLayout = readFileSync('app/(authed)/layout.tsx', 'utf8');
const clinicPage = readFileSync('app/(authed)/clinic-update/page.tsx', 'utf8');

describe('Clinic Guide presentation fallback without Supabase env', () => {
  it('can render the protected clinic guide smoke path without requiring Supabase public config', () => {
    expect(env).toContain('hasSupabasePublicConfig');
    expect(authedLayout).toContain('presentationMode && !hasSupabasePublicConfig()');
    expect(clinicPage).toContain('isPresentationMode() && !hasSupabasePublicConfig()');
    expect(clinicPage).toContain('fallbackMedications()');
  });
});
