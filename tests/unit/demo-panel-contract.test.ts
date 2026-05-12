import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('state-driven demo panels', () => {
  it('renders patient utilities from DemoState actions instead of old static care props', () => {
    const source = readFileSync('app/demo/patient-panel.tsx', 'utf8');
    expect(source).toContain('UtilityCardRenderer');
    expect(source).toContain('dispatch({ type: \'COMPLETE_CARD\'');
    expect(source).toContain('dispatch({ type: \'UPDATE_CARD_VALUE\'');
    expect(source).toContain('dispatch({ type: \'SET_SHARING_LEVEL\'');
    expect(source).toContain('dispatch({ type: \'CONFIRM_BY_PATIENT\'');
    expect(source).toContain('confirmedByPatient');
    expect(source).not.toContain('checked: ReadonlySet');
    expect(source).not.toContain('scenario.care');
  });

  it('renders partner view as permission projection of shared state', () => {
    const source = readFileSync('app/demo/partner-panel.tsx', 'utf8');
    expect(source).toContain('getVisiblePartnerCards');
    expect(source).toContain('ResultSharedStatus');
    expect(source).toContain('DoNotInterpretCard');
    expect(source).toContain('dispatch({ type: \'COMPLETE_CARD\'');
    expect(source).not.toContain('checked: ReadonlySet');
    expect(source).not.toContain('scenario.care');
    expect(source).not.toMatch(/성공했어요|실패했어요|정상입니다|위험합니다/u);
  });
});
