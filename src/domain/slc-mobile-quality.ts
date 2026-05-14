export const SLC_MOBILE_VIEWPORTS = [
  { name: 'iPhone 17 Pro', width: 390, height: 844 },
  { name: 'iPhone 17 Pro Max', width: 430, height: 932 },
] as const;

export const SLC_MOBILE_ROUTES = ['/privacy', '/onboarding', '/home', '/add', '/records', '/clinic-update', '/partner', '/more'] as const;

export const SLC_FORBIDDEN_VISIBLE_COPY = [
  '직접입력 가능한 옵션을 만들어야함',
  'schema cache',
  'public.',
  'user_profiles',
  'clinic_updates',
  'schedule_items',
  'Supabase',
  'PostgREST',
  'TODO',
  'FIXME',
] as const;

export const SLC_CTA_STATE_CONTRACT = {
  active: {
    background: '#C4614A',
    opacity: 1,
  },
  disabled: {
    opacityMax: 0.7,
    requiresDisabledAttribute: true,
  },
} as const;
