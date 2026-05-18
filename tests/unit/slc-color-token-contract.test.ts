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

});
