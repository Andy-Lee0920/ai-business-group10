export type ServerConfigSource = Record<string, string | undefined>;

const DEFAULT_PRESENTATION_HOSTS = ['ai-business-group10.vercel.app', 'project-oznp0.vercel.app'];

export function getPrivacyContactEmail(source: ServerConfigSource = process.env) {
  return source.PRIVACY_CONTACT_EMAIL?.trim() || 'privacy@fevio.app';
}

export function getPublicAppUrl(source: ServerConfigSource = process.env) {
  return source.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
}

export function isPresentationMode(source: ServerConfigSource = process.env) {
  const value = source.NEXT_PUBLIC_FEVIO_PRESENTATION_MODE ?? source.FEVIO_PRESENTATION_MODE ?? '';
  if (['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())) return true;

  return [
    source.NEXT_PUBLIC_APP_URL,
    source.VERCEL_PROJECT_PRODUCTION_URL,
    source.VERCEL_URL,
  ].some((hostOrUrl) => isPresentationHost(hostOrUrl, source));
}

export function isPresentationHost(
  hostOrUrl: string | null | undefined,
  source: ServerConfigSource = process.env,
) {
  const hostname = normalizeHostname(hostOrUrl);
  if (!hostname) return false;

  return getPresentationHosts(source).includes(hostname);
}

export function isPresentationRequest(
  request: { headers: Pick<Headers, 'get'> },
  source: ServerConfigSource = process.env,
) {
  return isPresentationMode(source) || isPresentationHost(request.headers.get('host'), source);
}

function getPresentationHosts(source: ServerConfigSource) {
  const configured = source.NEXT_PUBLIC_FEVIO_PRESENTATION_HOSTS ?? source.FEVIO_PRESENTATION_HOSTS ?? '';
  return configured
    .split(',')
    .map((host) => normalizeHostname(host))
    .filter((host): host is string => Boolean(host))
    .concat(DEFAULT_PRESENTATION_HOSTS);
}

function normalizeHostname(hostOrUrl: string | null | undefined) {
  const value = hostOrUrl?.trim().toLowerCase();
  if (!value) return null;

  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname;
  } catch {
    return value.split('/')[0]?.split(':')[0] || null;
  }
}
