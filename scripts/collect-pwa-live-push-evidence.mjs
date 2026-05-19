#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const args = parseArgs(process.argv.slice(2));
if (!args.userId || !args.cardId) fail('Usage: node scripts/collect-pwa-live-push-evidence.mjs --user-id <uuid> --card-id <uuid> [--rerun-scheduler]');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceRoleKey) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const schedulerRerun = args.rerunScheduler ? await rerunScheduler() : { attempted: false };
const [{ data: subscriptions, error: subscriptionError }, { data: dispatches, error: dispatchError }] = await Promise.all([
  supabase
    .from('push_subscriptions')
    .select('id,user_id,endpoint,user_agent,last_seen_at,updated_at,created_at')
    .eq('user_id', args.userId)
    .order('updated_at', { ascending: false }),
  supabase
    .from('reminder_dispatches')
    .select('id,card_id,scheduled_at,channel,status,provider_message_id,sent_at,created_at,updated_at')
    .eq('card_id', args.cardId)
    .order('created_at', { ascending: false }),
]);

if (subscriptionError) fail(`push_subscriptions query failed: ${subscriptionError.message}`);
if (dispatchError) fail(`reminder_dispatches query failed: ${dispatchError.message}`);

const evidence = {
  checkedAt: new Date().toISOString(),
  userId: args.userId,
  cardId: args.cardId,
  schedulerRerun,
  pushSubscriptions: (subscriptions ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    endpoint: maskEndpoint(row.endpoint),
    user_agent: row.user_agent,
    last_seen_at: row.last_seen_at,
    updated_at: row.updated_at,
    created_at: row.created_at,
  })),
  reminderDispatches: (dispatches ?? []).map((row) => ({
    id: row.id,
    card_id: row.card_id,
    scheduled_at: row.scheduled_at,
    channel: row.channel,
    status: row.status,
    provider_message_id: maskProviderMessageId(row.provider_message_id),
    sent_at: row.sent_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })),
};

console.log(JSON.stringify(evidence, null, 2));

async function rerunScheduler() {
  const secret = process.env.REMINDER_DISPATCH_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://project-oznp0.vercel.app';
  if (!secret) return { attempted: false, reason: 'REMINDER_DISPATCH_SECRET or CRON_SECRET not set' };

  const response = await fetch(`${appUrl.replace(/\/$/u, '')}/api/reminders/send-due`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  }).catch((error) => ({ ok: false, status: 0, statusText: error instanceof Error ? error.message : 'fetch_failed' }));

  return {
    attempted: true,
    appUrl,
    status: response.status,
    ok: response.ok,
  };
}

function maskEndpoint(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    const tail = value.slice(-6);
    return `${url.origin}/...${tail}`;
  } catch {
    return `...${value.slice(-6)}`;
  }
}

function maskProviderMessageId(value) {
  if (typeof value !== 'string' || !value) return null;
  return value.length <= 8 ? '...masked' : `...${value.slice(-8)}`;
}

function parseArgs(argv) {
  const parsed = { userId: '', cardId: '', rerunScheduler: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--user-id' && next) { parsed.userId = next; index += 1; continue; }
    if (arg === '--card-id' && next) { parsed.cardId = next; index += 1; continue; }
    if (arg === '--rerun-scheduler') { parsed.rerunScheduler = true; continue; }
    fail(`Unknown or incomplete argument: ${arg}`);
  }
  return parsed;
}

function fail(message) {
  console.error(`collect-pwa-live-push-evidence: ${message}`);
  process.exit(1);
}
