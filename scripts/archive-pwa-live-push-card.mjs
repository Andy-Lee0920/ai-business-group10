#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const args = parseArgs(process.argv.slice(2));
if (!args.cardId) fail('Usage: node scripts/archive-pwa-live-push-card.mjs --card-id <uuid>');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceRoleKey) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const { data: card, error: lookupError } = await supabase
  .from('care_action_cards')
  .select('id,title,description,source_text,status,scheduled_at')
  .eq('id', args.cardId)
  .maybeSingle();
if (lookupError) fail(`care_action_cards lookup failed: ${lookupError.message}`);
if (!card) fail('No care_action_cards row found for --card-id.');

const marker = 'synthetic live push smoke';
if (!(card.description === marker || String(card.source_text ?? '').includes(marker))) {
  fail('refuses to archive non-synthetic cards; marker not found in description/source_text');
}

const { data: archived, error: updateError } = await supabase
  .from('care_action_cards')
  .update({ status: 'archived', updated_at: new Date().toISOString() })
  .eq('id', args.cardId)
  .select('id,title,status,scheduled_at,updated_at')
  .single();
if (updateError) fail(`care_action_cards archive failed: ${updateError.message}`);

console.log(JSON.stringify({ archivedAt: new Date().toISOString(), card: archived }, null, 2));

function parseArgs(argv) {
  const parsed = { cardId: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--card-id' && next) { parsed.cardId = next; index += 1; continue; }
    fail(`Unknown or incomplete argument: ${arg}`);
  }
  return parsed;
}

function fail(message) {
  console.error(`archive-pwa-live-push-card: ${message}`);
  process.exit(1);
}
