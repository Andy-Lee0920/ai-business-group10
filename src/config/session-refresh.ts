export function shouldResetAppSession(url: URL) {
  if (url.pathname === '/auth/reset') return false;
  return url.searchParams.get('refresh') === '1' || url.searchParams.get('reset') === '1';
}
