import { describe, expect, it } from 'vitest';
import { fevioTokens } from '../../src/design/tokens';
import { fevioPrimitiveStyles, uiClassNames } from '../../src/components/ui';

describe('Fevio design tokens and UI primitive class contracts', () => {
  it('keeps the SLC color tokens from the design direction', () => {
    expect(fevioTokens.color).toMatchObject({
      sage: '#6F8F6E',
      lavender: '#B9AED6',
      cream: '#F6F4F1',
      coral: '#E07A68',
    });
    expect(fevioTokens.material.grainTexture).toBe('var(--fevio-grain-texture)');
  });

  it('renders primitive classes from token-backed contracts', () => {
    expect(uiClassNames.card()).toContain('fevio-card');
    expect(uiClassNames.button('primary')).toBe('fevio-button fevio-button--primary');
    expect(uiClassNames.badge('coral')).toBe('fevio-badge fevio-badge--coral');
    expect(uiClassNames.notice('lavender')).toBe('fevio-notice fevio-notice--lavender');
  });

  it('renders low-energy input and sync primitive classes', () => {
    expect(uiClassNames.selectionChip(false, 'sage')).toBe('fevio-selection-chip fevio-selection-chip--sage');
    expect(uiClassNames.selectionChip(true, 'coral')).toBe(
      'fevio-selection-chip fevio-selection-chip--coral fevio-selection-chip--selected',
    );
    expect(uiClassNames.confirmChip(true, 'lavender')).toBe(
      'fevio-confirm-chip fevio-confirm-chip--lavender fevio-confirm-chip--selected',
    );
    expect(uiClassNames.statusBadge('synced')).toBe('fevio-status-badge fevio-status-badge--synced');
    expect(uiClassNames.timeInput()).toBe('fevio-time-input');
  });



  it('provides mobile-first primitive style contracts for Session B surfaces', () => {
    expect(fevioTokens.color).toMatchObject({
      slcCoral: '#C95F4B',
      slcBg: '#FAF7F2',
      slcText: '#2F2926',
    });
    expect(fevioPrimitiveStyles.screenShell().maxWidth).toBe(430);
    expect(fevioPrimitiveStyles.primaryCta(false).minHeight).toBe(52);
    expect(fevioPrimitiveStyles.choiceCard(true).border).toContain('var(--slc-coral)');
    expect(fevioPrimitiveStyles.settingsRow().minHeight).toBe(56);
  });

  it('marks selected segmented buttons with text-independent state', () => {
    expect(uiClassNames.segment(false)).toBe('fevio-segment');
    expect(uiClassNames.segment(true)).toBe('fevio-segment fevio-segment--selected');
  });
});
