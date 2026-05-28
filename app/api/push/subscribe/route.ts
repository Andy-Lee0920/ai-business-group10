import { NextRequest, NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });

  const body = await request.json().catch(() => null) as unknown;
  const subscription = normalizePushSubscription(body);
  if (!subscription) return NextResponse.json({ error: 'invalid_push_subscription' }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      subscription,
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
      last_seen_at: now,
      updated_at: now,
    }, { onConflict: 'endpoint' });

  if (error) return NextResponse.json({ error: 'push_subscription_unavailable' }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
}

function normalizePushSubscription(value: unknown): PushSubscriptionPayload | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const keys = candidate.keys as Record<string, unknown> | undefined;

  if (typeof candidate.endpoint !== 'string' || !candidate.endpoint.startsWith('https://')) return null;
  if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return null;
  if (keys.p256dh.length < 10 || keys.auth.length < 10) return null;

  return {
    endpoint: candidate.endpoint,
    expirationTime: typeof candidate.expirationTime === 'number' ? candidate.expirationTime : null,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  };
}
