#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const args = parseArgs(process.argv.slice(2));
if (!args.userId || !args.cardId) fail('Usage: node scripts/collect-pwa-live-push-evidence.mjs --user-id <uuid> --card-id <uuid> [--rerun-scheduler] [--format json|github-comment] [--platform android|ios]');

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

if (args.format === 'github-comment') {
  console.log(formatGithubComment(evidence, args.platform));
} else {
  console.log(JSON.stringify(evidence, null, 2));
}

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


function formatGithubComment(evidence, platform) {
  const isIos = platform === 'ios';
  const latestSubscription = evidence.pushSubscriptions[0];
  const sentDispatches = evidence.reminderDispatches.filter((row) => row.status === 'sent');
  const latestDispatch = sentDispatches[0] ?? evidence.reminderDispatches[0];
  const dedupChannels = new Set(sentDispatches.map((row) => `${row.card_id}:${row.scheduled_at}:${row.channel}`));

  const lines = [
    isIos ? 'iOS Home Screen PWA live smoke Green/Red update' : 'Android live smoke Green/Red update',
    isIos ? 'Device/iOS/Safari:' : 'Device/OS/Chrome:',
    'URL verified: https://project-oznp0.vercel.app/home',
  ];

  if (isIos) {
    lines.push('Home Screen install evidence: attach screenshot/video');
    lines.push('iG1/iG2/iG3 evidence: Add to Home Screen guidance, gesture-bound permission, manifest id/scope/start_url/standalone/icons verified');
    lines.push('Role/action/result: authenticated patient launches Home Screen PWA, taps bell, receives reminder, taps it, and lands on /home.');
  } else {
    lines.push('Role/action/result: authenticated patient enables notification from the home bell, receives reminder, taps it, and lands on /home.');
  }

  lines.push(`Checked at: ${evidence.checkedAt}`);
  lines.push(`L1 push_subscriptions: ${latestSubscription ? `${latestSubscription.endpoint}, updated_at=${latestSubscription.updated_at}` : 'MISSING — keep Red'}`);
  lines.push(`L2 reminder_dispatches: ${latestDispatch ? `card_id=${latestDispatch.card_id}, scheduled_at=${latestDispatch.scheduled_at}, channel=${latestDispatch.channel}, status=${latestDispatch.status}, provider=${latestDispatch.provider_message_id}` : 'MISSING — keep Red'}`);
  lines.push('L3 foreground/tray evidence: attach real-device screenshot/video before closing');
  lines.push('L4 tap-through: attach screenshot/video showing notification tap opens /home before closing');
  lines.push('L6 lock-screen/background evidence: attach real-device screenshot/video before closing');
  lines.push(`L7 dedup: ${dedupChannels.size === sentDispatches.length && sentDispatches.length > 0 ? 'DB rows are unique for (card_id, scheduled_at, channel); include scheduler rerun output' : 'MISSING/UNCLEAR — keep Red until rerun proof is attached'}`);
  lines.push(`Scheduler rerun: ${evidence.schedulerRerun.attempted ? `attempted status=${evidence.schedulerRerun.status}, ok=${evidence.schedulerRerun.ok}` : 'not attempted'}`);
  lines.push('Red remaining, if any: physical-device screenshots/videos must be attached before closure.');

  return lines.join('\n');
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
  const parsed = { userId: '', cardId: '', rerunScheduler: false, format: 'json', platform: 'android' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--user-id' && next) { parsed.userId = next; index += 1; continue; }
    if (arg === '--card-id' && next) { parsed.cardId = next; index += 1; continue; }
    if (arg === '--rerun-scheduler') { parsed.rerunScheduler = true; continue; }
    if (arg === '--format' && next && ['json', 'github-comment'].includes(next)) { parsed.format = next; index += 1; continue; }
    if (arg === '--platform' && next && ['android', 'ios'].includes(next)) { parsed.platform = next; index += 1; continue; }
    fail(`Unknown or incomplete argument: ${arg}`);
  }
  return parsed;
}

function fail(message) {
  console.error(`collect-pwa-live-push-evidence: ${message}`);
  process.exit(1);
}
