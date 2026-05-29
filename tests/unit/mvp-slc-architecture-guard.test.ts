import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const runtimeRoots = ['app', 'src'];

const legacySlcTypeConsumers = new Set([
  'app/(authed)/add/page.tsx',
  'app/(authed)/calendar/page.tsx',
  'app/(authed)/clinic-update/page.tsx',
  'app/(authed)/schedule/[id]/edit/page.tsx',
  'app/(authed)/settings/page.tsx',
  'app/api/clinic-guide/interview/route.ts',
  'app/api/onboard/candidates/confirm/route.ts',
  'app/api/onboard/photo-analyze/route.ts',
  'app/api/onboard/text-analyze/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/schedule/[id]/route.ts',
  'app/api/schedule/add/route.ts',
  'app/api/schedule/complete/route.ts',
  'app/api/schedule/route.ts',
  'src/components/action-card.tsx',
  'src/components/confirm-sheet.tsx',
  'src/components/home/ExecutionPreview.tsx',
  'src/domain/care-action-home-projection.ts',
  'src/domain/clinic-guide-interview.ts',
  'src/domain/clinic-guide-medication-normalizer.ts',
  'src/domain/slc-clinic-followup.ts',
  'src/domain/slc-clinic-update.ts',
  'src/domain/slc-home-focus.ts',
  'src/domain/slc-manual-add.ts',
  'src/domain/slc-records.ts',
  'src/features/add/manual-add-form.tsx',
  'src/features/calendar/calendar-screen.tsx',
  'src/features/clinic-update/clinic-update-form.tsx',
  'src/features/more/more-screen.tsx',
  'src/features/onboarding/onboarding-flow.ts',
  'src/features/onboarding/onboarding-screen.tsx',
  'src/features/partner/partner-view.tsx',
  'src/features/presentation/presentation-calendar-demo.tsx',
  'src/features/presentation/presentation-testbed.tsx',
  'src/features/schedule/schedule-edit-form.tsx',
  'src/features/today/home-page-loader.tsx',
  'src/features/today/today-screen.tsx',
  'src/lib/seed-helpers.ts',
  'src/lib/slc-fallback.ts',
  'src/types/clinic-guide.types.ts',
]);

const legacyScheduleTableConsumers = new Set([
  'app/(authed)/add/page.tsx',
  'app/(authed)/calendar/page.tsx',
  'app/(authed)/clinic-update/page.tsx',
  'app/(authed)/layout.tsx',
  'app/(authed)/partner/page.tsx',
  'app/(authed)/schedule/[id]/edit/page.tsx',
  'app/api/account/reset/route.ts',
  'app/api/clinic-update/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/records/route.ts',
  'app/api/schedule/[id]/route.ts',
  'app/api/schedule/add/route.ts',
  'app/api/schedule/complete/route.ts',
  'app/api/schedule/route.ts',
  'src/domain/slc-copy.ts',
  'src/domain/slc-mobile-quality.ts',
  'src/features/records/records-page-loader.ts',
  'src/features/today/home-page-loader.tsx',
]);

describe('MVP/SLC architecture guard', () => {
  it('keeps ADR 0018 as the active naming contract without forcing a sweep rename', () => {
    const adr = readFileSync('docs/04-decisions/0018-mvp-supersedes-slc.md', 'utf8');

    expect(adr).toContain('MVP가 SLC를 대체한다');
    expect(adr).toContain('새 코드만 MVP 용어 사용');
    expect(adr).toContain('즉시 일괄 rename 금지');
    expect(adr).toContain('SLC simplification trap');
  });

  it('keeps ADR 0013 as the canonical confirm-spine contract', () => {
    const adr = readFileSync('docs/04-decisions/0013-confirm-spine-canonical.md', 'utf8');

    expect(adr).toContain('`care_action_cards` is the single canonical executable care action surface');
    expect(adr).toContain('`schedule_items` is legacy/SLC compatibility only');
    expect(adr).toContain('`split_candidates` is the canonical candidate surface');
    expect(adr).toContain('Do not add `schedule_items` write paths for new OCR/AI/photo features');
  });

  it('keeps slc.types as a deprecated compatibility shim only', () => {
    expect(existsSync('src/types/mvp.types.ts')).toBe(true);

    const shim = readFileSync('src/types/slc.types.ts', 'utf8');
    const executableLines = shim
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    expect(shim).toContain('@deprecated');
    expect(shim).toContain('MVP-era code should import from `./mvp.types` instead');
    expect(executableLines).toEqual(["export * from './mvp.types';"]);
  });

  it('prevents new runtime code from importing the deprecated SLC type namespace', () => {
    const offenders = collectRuntimeFiles().filter((file) => {
      if (file === 'src/types/slc.types.ts') return false;
      const source = readFileSync(file, 'utf8');
      return /from ['"][^'"]*slc\.types['"]/u.test(source) && !legacySlcTypeConsumers.has(file);
    });

    expect(offenders).toEqual([]);
  });

  it('prevents new runtime surfaces from depending on legacy schedule tables', () => {
    const offenders = collectRuntimeFiles().filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /schedule_items|schedule_candidates/u.test(source) && !legacyScheduleTableConsumers.has(file);
    });

    expect(offenders).toEqual([]);
  });
});

function collectRuntimeFiles(): string[] {
  return runtimeRoots.flatMap((root) => walk(root));
}

function walk(path: string): string[] {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return /\.(ts|tsx)$/u.test(path) ? [path] : [];
  return readdirSync(path)
    .filter((entry) => !entry.startsWith('.') && entry !== 'node_modules')
    .flatMap((entry) => walk(join(path, entry)));
}
