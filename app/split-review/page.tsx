import { hasSupabasePublicConfig } from '../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';
import {
  fetchSplitReviewByDraftId,
  isFetchableDraftId,
  type SplitReviewSupabaseClient,
} from '../../src/lib/split-review-source';
import { SplitReviewClient } from './split-review-client';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{ draftId?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const draftId = params?.draftId ?? null;
  const initialReview = await loadInitialReview(draftId);

  return (
    <main className="app-shell split-review-shell">
      <SplitReviewClient initialReview={initialReview} />
    </main>
  );
}

async function loadInitialReview(draftId: string | null) {
  if (!draftId || !isFetchableDraftId(draftId) || !hasSupabasePublicConfig()) return null;

  try {
    const supabase = await createCookieBackedSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return fetchSplitReviewByDraftId(supabase as unknown as SplitReviewSupabaseClient, draftId, user.id);
  } catch {
    return null;
  }
}
