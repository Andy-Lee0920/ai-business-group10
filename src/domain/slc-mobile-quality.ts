export const SLC_MOBILE_VIEWPORTS = [
  { name: 'iPhone 17 Pro', width: 390, height: 844 },
  { name: 'iPhone 17 Pro Max', width: 430, height: 932 },
] as const;

export const SLC_MOBILE_ROUTES = ['/privacy', '/onboarding', '/home', '/add', '/records', '/clinic-update', '/partner', '/more'] as const;

export const SLC_STANDALONE_CAPTURE_ROUTES = [
  '/onboard/prescription-capture',
  '/onboard/quick-capture',
  '/onboard/full-setup',
] as const;

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

export const SLC_HOME_FORBIDDEN_EMBRYO_COPY = [
  '오늘의 배아',
  '기적',
  '소중한 생명',
  '무럭무럭',
  '두근두근',
  'D-Day',
  '배양 실패',
  '착상 대기',
  '임신 확인까지',
  '잘 하고 있어요',
] as const;

export const SLC_CTA_STATE_CONTRACT = {
  active: {
    background: '#D95F4C',
    opacity: 1,
  },
  disabled: {
    opacityMax: 0.7,
    requiresDisabledAttribute: true,
  },
} as const;
