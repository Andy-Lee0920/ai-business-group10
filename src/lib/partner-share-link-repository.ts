import type { PartnerShareLinkRepository, PartnerShareLinkRow } from '../services/partner-share-link-service';

type QueryError = { message: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: QueryError | null }>;
type PartnerShareLinkDbRow = PartnerShareLinkRow & {
  partner_share_events?: Array<{ acknowledged_at: string }> | null;
};

type SelectQuery = QueryResult<PartnerShareLinkDbRow[]> & {
  eq(column: string, value: string): SelectQuery;
  is(column: string, value: null): SelectQuery;
  order(column: string, options: { ascending: boolean }): SelectQuery;
};

type UpdateQuery = {
  eq(column: string, value: string): UpdateQuery;
  select(columns: string): SingleQuery;
};

type SingleQuery = {
  maybeSingle(): QueryResult<PartnerShareLinkRow>;
};

type PartnerShareLinkTable = {
  select(columns: string): SelectQuery;
  update(values: { revoked_at: string }): UpdateQuery;
};

export type SupabasePartnerShareLinkClient = {
  from(table: 'partner_share_links'): PartnerShareLinkTable;
};

const SUMMARY_COLUMNS = 'id, created_by, created_at, expires_at, revoked_at';
const LIST_COLUMNS = `${SUMMARY_COLUMNS}, partner_share_events(acknowledged_at)`;

export function createPartnerShareLinkRepository(
  supabase: SupabasePartnerShareLinkClient,
): PartnerShareLinkRepository {
  return {
    async listByUser(userId) {
      const { data, error } = await supabase
        .from('partner_share_links')
        .select(LIST_COLUMNS)
        .eq('created_by', userId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(withLastAccessedAt);
    },
    async revokeByOwner(linkId, userId, revokedAt) {
      const { data, error } = await supabase
        .from('partner_share_links')
        .update({ revoked_at: revokedAt })
        .eq('id', linkId)
        .eq('created_by', userId)
        .select(SUMMARY_COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  };
}

function withLastAccessedAt(row: PartnerShareLinkDbRow): PartnerShareLinkRow {
  const acknowledgedAt =
    row.partner_share_events
      ?.map((event) => event.acknowledged_at)
      .sort()
      .at(-1) ?? null;
  return {
    id: row.id,
    created_by: row.created_by,
    created_at: row.created_at,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
    last_accessed_at: acknowledgedAt,
  };
}
