import { describe, expect, it } from 'vitest';
import { CARD_TYPES } from '../../src/types/care-cards.types';
import { CARD_TYPE_ICONS, CARE_PHASE_ICONS, COMPONENT_ICONS, getFevioIcon } from '../../src/design/icon-map';

describe('Fevio icon map', () => {
  it('maps every care card type to an explicit decorative icon spec', () => {
    expect(Object.keys(CARD_TYPE_ICONS).sort()).toEqual([...CARD_TYPES].sort());
    expect(getFevioIcon('card:injection')).toMatchObject({ tone: 'coral', size: 16 });
    expect(getFevioIcon('card:clinic_visit')).toMatchObject({ tone: 'sage', size: 16 });
  });

  it('provides phase hero and component icons without wildcard icon imports', () => {
    expect(CARE_PHASE_ICONS.injection).toMatchObject({ tone: 'coral', size: 32 });
    expect(CARE_PHASE_ICONS.waiting).toMatchObject({ tone: 'lavender', size: 32 });
    expect(COMPONENT_ICONS.partnerPresencePulse).toMatchObject({ tone: 'lavender', size: 20 });
    expect(COMPONENT_ICONS.quietChecklistUnchecked).toMatchObject({ size: 18 });
  });
});
