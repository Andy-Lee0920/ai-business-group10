export type PartnerShareLinkSummary = {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastAccessedAt: string | null;
  revokedAt: string | null;
};

export type PartnerShareLinkRevokeResult = {
  revoked_at: string;
};
