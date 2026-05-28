import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('schedule P1 design contract (#44)', () => {
  it('uses the shared iPhone shell width and tokenized surface colors', () => {
    const css = readFileSync('app/schedule/schedule.css', 'utf8');
    expect(css).toContain('max-width: var(--fevio-phone-frame-max)');
    expect(css).toContain('var(--fevio-sage-dark)');
    expect(css).toContain('var(--fevio-border-subtle)');
    expect(css).not.toContain('max-width: 720px');
  });
});
