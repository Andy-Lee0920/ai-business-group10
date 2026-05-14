#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

loadEnvFile('.env.local');

try {
  const options = parseArgs(process.argv.slice(2));
  const result = await smokeClinicGuideAi(options);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
}

async function smokeClinicGuideAi(options) {
  const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL').replace(/\/+$/u, '');
  const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const patientId = process.env.FEVIO_SMOKE_PATIENT_ID?.trim() || 'clinic-guide-smoke-patient';
  const endpoint = `${supabaseUrl}/functions/v1/clinic-guide-ai`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ userInput: options.input, patientId }),
  });
  const body = await response.json().catch(() => ({}));
  const source = body?.source ?? null;
  const matchedId = body?.matched?.id ?? null;
  const matchedKo = body?.matched?.brand_name_ko ?? null;

  if (options.expectSource && source !== options.expectSource) {
    throw new Error(`Expected source ${options.expectSource}, received ${source ?? 'null'}`);
  }
  if (options.expectId && matchedId !== options.expectId) {
    throw new Error(`Expected matched id ${options.expectId}, received ${matchedId ?? 'null'}`);
  }

  return {
    ok: true,
    urlActionResult: '/clinic-update에서 환자가 약품명 표현을 입력했을 때 서버 경로가 클라이언트에 키를 노출하지 않고 후보 카드 또는 안전한 미매칭 상태를 반환한다.',
    request: {
      endpoint,
      input: options.input,
      patientId,
    },
    result: {
      status: response.status,
      source,
      matchedId,
      matchedKo,
    },
  };
}

function parseArgs(args) {
  const options = {
    input: '',
    expectSource: '',
    expectId: '',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === '--input') {
      options.input = requireValue(arg, next);
      index += 1;
    } else if (arg === '--expect-source') {
      options.expectSource = requireValue(arg, next);
      index += 1;
    } else if (arg === '--expect-id') {
      options.expectId = requireValue(arg, next);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      throw new Error('Usage: node scripts/smoke-clinic-guide-ai.mjs --input <text> [--expect-source aliases|llm|none] [--expect-id <medication-id>]');
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.input.trim()) throw new Error('--input is required');
  if (options.expectSource && !['aliases', 'llm', 'none'].includes(options.expectSource)) {
    throw new Error('--expect-source must be aliases, llm, or none');
  }

  return options;
}

function requireValue(name, value) {
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...parts] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = parts.join('=').replace(/^['"]|['"]$/g, '');
  }
}

function requiredEnv(key) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} is required for clinic-guide-ai smoke verification.`);
  return value;
}
