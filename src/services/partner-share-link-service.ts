import type { PartnerShareLinkRevokeResult, PartnerShareLinkSummary } from '../types/partner-share-link.types';

export type PartnerShareLinkRow = {
  id: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_accessed_at?: string | null;
};

export type PartnerShareLinkRepository = {
  listByUser(userId: string): Promise<PartnerShareLinkRow[]>;
  revokeByOwner(linkId: string, userId: string, revokedAt: string): Promise<PartnerShareLinkRow | null>;
};

export async function listActiveLinksForUser(
  userId: string,
  repository: PartnerShareLinkRepository,
): Promise<PartnerShareLinkSummary[]> {
  assertNonEmpty(userId, 'user id가 필요합니다');
  const rows = await repository.listByUser(userId);
  return rows.filter((row) => row.revoked_at === null).map(toSummary);
}

export async function revokeLink(
  linkId: string,
  userId: string,
  repository: PartnerShareLinkRepository,
  now: () => string = () => new Date().toISOString(),
): Promise<PartnerShareLinkRevokeResult> {
  assertNonEmpty(linkId, 'link id가 필요합니다');
  assertNonEmpty(userId, 'user id가 필요합니다');
  const revokedAt = now();
  const row = await repository.revokeByOwner(linkId, userId, revokedAt);
  if (!row) throw new Error('권한이 없습니다');
  return { revoked_at: row.revoked_at ?? revokedAt };
}

function toSummary(row: PartnerShareLinkRow): PartnerShareLinkSummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastAccessedAt: row.last_accessed_at ?? null,
    revokedAt: row.revoked_at,
  };
}

function assertNonEmpty(value: string, message: string) {
  if (!value.trim()) throw new Error(message);
}
