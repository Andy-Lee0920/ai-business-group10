import { NextResponse } from 'next/server';
import {
  createPartnerShareLinkRepository,
  type SupabasePartnerShareLinkClient,
} from '../../../../../src/lib/partner-share-link-repository';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { revokeLink } from '../../../../../src/services/partner-share-link-service';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCookieBackedSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  try {
    const repository = createPartnerShareLinkRepository(
      supabase as unknown as SupabasePartnerShareLinkClient,
    );
    const result = await revokeLink(id, userResult.user.id, repository);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: messageOf(error) }, { status: 403 });
  }
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : '회수할 수 없습니다';
}
