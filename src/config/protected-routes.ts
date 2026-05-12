const PROTECTED_APP_PREFIXES = [
  '/home',
  '/onboarding',
  '/capture',
  '/schedule',
  '/medication',
  '/ivf-record',
  '/emotion',
  '/protocol',
  '/split-review',
  '/settings',
] as const;

export function isProtectedAppPath(pathname: string) {
  return PROTECTED_APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
