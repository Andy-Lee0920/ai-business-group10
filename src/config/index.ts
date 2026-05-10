export type ServerConfigSource = Record<string, string | undefined>;

export function getPrivacyContactEmail(source: ServerConfigSource = process.env) {
  return source.PRIVACY_CONTACT_EMAIL?.trim() || 'privacy@fevio.app';
}

export function getPublicAppUrl(source: ServerConfigSource = process.env) {
  return source.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
}

export function isPresentationMode(source: ServerConfigSource = process.env) {
  const value = source.NEXT_PUBLIC_FEVIO_PRESENTATION_MODE ?? source.FEVIO_PRESENTATION_MODE ?? '';
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
