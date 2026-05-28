#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const args = parseArgs(process.argv.slice(2));
if (!args.userId) fail('Usage: node scripts/prepare-pwa-live-push-card.mjs --user-id <uuid> [--offset-minutes 15|60] [--title <text>]');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceRoleKey) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const { data: member, error: memberError } = await supabase
  .from('couple_members')
  .select('couple_id,user_id,role')
  .eq('user_id', args.userId)
  .eq('role', 'primary')
  .maybeSingle();
if (memberError) fail(`couple_members lookup failed: ${memberError.message}`);
if (!member?.couple_id) fail('No primary couple_members row found for --user-id. Sign in/bootstrap the account first.');

const { data: state, error: stateError } = await supabase
  .from('couple_states')
  .select('couple_id,privacy_gate_accepted_at')
  .eq('couple_id', member.couple_id)
  .maybeSingle();
if (stateError) fail(`couple_states lookup failed: ${stateError.message}`);
if (!state?.privacy_gate_accepted_at) fail('privacy_gate_accepted_at is missing. Accept the privacy gate before creating sensitive test cards.');

const scheduledAt = new Date(Date.now() + args.offsetMinutes * 60 * 1000);
const careDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(scheduledAt);
const sourceText = `synthetic live push smoke: ${args.title} at ${scheduledAt.toISOString()}`;

const { data: inserted, error: insertError } = await supabase
  .from('care_action_cards')
  .insert({
    couple_id: member.couple_id,
    created_by: args.userId,
    assignee_role: 'primary_user',
    card_type: 'injection',
    title: args.title,
    description: 'synthetic live push smoke',
    source_text: sourceText,
    scheduled_at: scheduledAt.toISOString(),
    care_date: careDate,
    status: 'confirmed',
    confirmation_required: false,
    user_marked_important: false,
    partner_visible: true,
    medical_boundary_label: 'user_confirmed_instruction',
  })
  .select('id,couple_id,created_by,card_type,title,scheduled_at,status,partner_visible')
  .single();
if (insertError) fail(`care_action_cards insert failed: ${insertError.message}`);

console.log(JSON.stringify({
  createdAt: new Date().toISOString(),
  userId: args.userId,
  coupleId: member.couple_id,
  card: inserted,
  nextEvidenceCommand: `node scripts/collect-pwa-live-push-evidence.mjs --user-id ${args.userId} --card-id ${inserted.id} --rerun-scheduler`,
}, null, 2));

function parseArgs(argv) {
  const parsed = { userId: '', offsetMinutes: 15, title: 'Fevio push smoke 오비드렐' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--user-id' && next) { parsed.userId = next; index += 1; continue; }
    if (arg === '--offset-minutes' && next) {
      const value = Number.parseInt(next, 10);
      if (!Number.isInteger(value) || ![15, 60].includes(value)) fail('--offset-minutes must be 15 or 60');
      parsed.offsetMinutes = value;
      index += 1;
      continue;
    }
    if (arg === '--title' && next) { parsed.title = next.slice(0, 80); index += 1; continue; }
    fail(`Unknown or incomplete argument: ${arg}`);
  }
  return parsed;
}

function fail(message) {
  console.error(`prepare-pwa-live-push-card: ${message}`);
  process.exit(1);
}
