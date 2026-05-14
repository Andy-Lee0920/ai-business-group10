import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../../src/components/bottom-nav';

describe('SLC bottom navigation', () => {
  it('labels the home destination as 홈, not 오늘', () => {
    expect(NAV_ITEMS.find((item) => item.href === '/home')?.label).toBe('홈');
  });
});
