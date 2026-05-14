const PROTECTED_APP_PREFIXES = [
  '/home',
  '/onboarding',
  '/records',
  '/clinic-update',
  '/more',
  '/add',
  '/schedule',
  '/medication',
  '/ivf-record',
] as const;

const PROTECTED_APP_EXACT_PATHS = ['/partner'] as const;

export function isProtectedAppPath(pathname: string) {
  if (PROTECTED_APP_EXACT_PATHS.some((path) => pathname === path)) return true;
  return PROTECTED_APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
