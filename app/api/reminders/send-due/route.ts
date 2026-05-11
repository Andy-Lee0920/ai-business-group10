import { NextRequest, NextResponse } from 'next/server';
import { SupabaseReminderDispatchStore } from '../../../../src/lib/reminder-dispatch-repository';
import { ResendReminderMailer, requireReminderMailerConfig } from '../../../../src/lib/resend-reminder-mailer';
import { createSupabaseServiceRoleClient } from '../../../../src/lib/server-supabase-admin';
import { dispatchDueEmailReminders } from '../../../../src/services/reminder-dispatch-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return dispatch(request);
}

export async function POST(request: NextRequest) {
  return dispatch(request);
}

async function dispatch(request: NextRequest) {
  const secret = process.env.REMINDER_DISPATCH_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'Reminder dispatch secret is not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized reminder dispatch.' }, { status: 401 });
  }

  const config = requireReminderMailerConfig();
  const supabase = createSupabaseServiceRoleClient();
  const result = await dispatchDueEmailReminders({
    store: new SupabaseReminderDispatchStore(supabase as never),
    mailer: new ResendReminderMailer(config.apiKey, config.fromEmail),
    now: new Date(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin,
  });

  return NextResponse.json({ ok: true, result }, { headers: { 'cache-control': 'no-store' } });
}
