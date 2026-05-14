import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = 'supabase/migrations';

const slcMigrations = [
  '202605130001_slc_medications.sql',
  '202605130002_slc_partner_links.sql',
  '202605130003_slc_schedule_items.sql',
  '202605130004_slc_completion_records.sql',
  '202605130005_slc_clinic_updates.sql',
  '202605130006_slc_user_profiles.sql',
  '202605130007_slc_user_consents.sql',
  '202605130008_slc_partner_read_rls.sql',
  '202605140001_slc_partner_profile_identity.sql',
];

function readMigration(fileName: string) {
  return readFileSync(join(migrationsDir, fileName), 'utf8');
}

describe('SLC Supabase migrations', () => {
  it('keeps migration versions unique after the SLC schema push repair', () => {
    const versions = readdirSync(migrationsDir)
      .filter((fileName) => fileName.endsWith('.sql'))
      .map((fileName) => fileName.slice(0, 12));

    expect(new Set(versions).size).toBe(versions.length);
  });

  it('keeps partner_links before every SLC policy that reads partner-linked patient data', () => {
    const migrationNames = readdirSync(migrationsDir)
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();

    expect(migrationNames.filter((fileName) => fileName.includes('_slc_'))).toEqual(slcMigrations);

    const partnerLinksIndex = migrationNames.indexOf('202605130002_slc_partner_links.sql');
    for (const fileName of [
      '202605130003_slc_schedule_items.sql',
      '202605130004_slc_completion_records.sql',
      '202605130005_slc_clinic_updates.sql',
      '202605130008_slc_partner_read_rls.sql',
    ]) {
      expect(migrationNames.indexOf(fileName)).toBeGreaterThan(partnerLinksIndex);
      expect(readMigration(fileName)).toContain('partner_links');
    }
  });

  it('defines the onboarding blocker tables with row-level security enabled', () => {
    const userProfiles = readMigration('202605130006_slc_user_profiles.sql');
    const userConsents = readMigration('202605130007_slc_user_consents.sql');

    expect(userProfiles).toContain('create table if not exists user_profiles');
    expect(userProfiles).toContain('alter table user_profiles enable row level security');
    expect(userProfiles).toContain('drop policy if exists "own_profile" on user_profiles');

    expect(userConsents).toContain('create table if not exists user_consents');
    expect(userConsents).toContain('alter table user_consents enable row level security');
    expect(userConsents).toContain('drop policy if exists "own_consent" on user_consents');
  });

  it('defines every table needed for the SLC today execution loop', () => {
    const migrationText = slcMigrations.map(readMigration).join('\n');

    for (const tableName of [
      'medications',
      'partner_links',
      'schedule_items',
      'completion_records',
      'clinic_updates',
      'user_profiles',
      'user_consents',
    ]) {
      expect(migrationText).toContain(`create table if not exists ${tableName}`);
    }
  });

  it('keeps partner approval identity joinable and readable by the patient owner', () => {
    const identity = readMigration('202605140001_slc_partner_profile_identity.sql');

    expect(identity).toContain('partner_links_partner_profile_fkey');
    expect(identity).toContain('foreign key (partner_id)');
    expect(identity).toContain('references public.user_profiles(id)');
    expect(identity).toContain('patient_read_linked_partner_profiles');
    expect(identity).toContain('partner_links.patient_id = auth.uid()');
    expect(identity).toContain("partner_links.status in ('requested', 'approved')");
  });
});
