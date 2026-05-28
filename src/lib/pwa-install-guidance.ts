export type PwaInstallGuidance = 'ios_add_to_home_screen' | 'none';

export function getPwaInstallGuidance(): PwaInstallGuidance {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'none';
  if (!isIosBrowser()) return 'none';
  return isStandalonePwa() ? 'none' : 'ios_add_to_home_screen';
}

function isIosBrowser() {
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  return /iPad|iPhone|iPod/u.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1);
}

function isStandalonePwa() {
  const navigatorStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayStandalone = typeof window.matchMedia === 'function'
    && window.matchMedia('(display-mode: standalone)').matches;
  return navigatorStandalone || displayStandalone;
}
