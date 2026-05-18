import { NextRequest, NextResponse } from 'next/server';
import { SupabaseReminderDispatchStore } from '../../../../src/lib/reminder-dispatch-repository';
import { createSupabaseServiceRoleClient } from '../../../../src/lib/server-supabase-admin';
import { requireWebPushConfig, WebPushReminderPusher } from '../../../../src/lib/web-push-reminder-pusher';
import { dispatchDuePushReminders } from '../../../../src/services/reminder-dispatch-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return dispatch(request);
}

export async function POST(request: NextRequest) {
  return dispatch(request);
}

async function dispatch(request: NextRequest) {
  const secrets = [process.env.REMINDER_DISPATCH_SECRET?.trim(), process.env.CRON_SECRET?.trim()]
    .filter((value): value is string => Boolean(value));
  if (!secrets.length) return NextResponse.json({ error: 'Reminder dispatch secret is not configured.' }, { status: 503 });
  const authorization = request.headers.get('authorization');
  if (!secrets.some((secret) => authorization === `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized reminder dispatch.' }, { status: 401 });
  }

  const config = requireWebPushConfig();
  const supabase = createSupabaseServiceRoleClient();
  const result = await dispatchDuePushReminders({
    store: new SupabaseReminderDispatchStore(supabase as never),
    pusher: new WebPushReminderPusher(config),
    now: new Date(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin,
  });

  return NextResponse.json({ ok: true, result }, { headers: { 'cache-control': 'no-store' } });
}
