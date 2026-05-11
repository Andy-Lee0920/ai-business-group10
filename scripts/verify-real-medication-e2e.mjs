#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';

loadEnvFile('.env.local');

const port = Number(process.env.FEVIO_VERIFY_PORT ?? 3107);
const baseURL = `http://127.0.0.1:${port}`;
const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
const runId = randomUUID().slice(0, 8);
const email = `fevio-e2e-${Date.now()}-${runId}@example.com`;
const password = `Fevio-${runId}-Passw0rd!`;
const medName = `Fevio 실제DB 검증 ${runId}`;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = null;
let server = null;
let browser = null;

try {
  userId = await createDisposableUser();
  const session = await signInDisposableUser();
  server = await startNextServer();
  browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    {
      name: storageKey,
      value: encodeSupabaseCookie(session),
      domain: '127.0.0.1',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);
  const page = await context.newPage();

  const privacyResponse = await page.request.post('/api/privacy/accept', {
    headers: { accept: 'application/json' },
  });
  if (!privacyResponse.ok()) {
    throw new Error(`Privacy accept failed: ${privacyResponse.status()} ${await privacyResponse.text()}`);
  }

  await context.addCookies([{ name: 'fevio_privacy_accepted', value: '1', domain: '127.0.0.1', path: '/', httpOnly: false, sameSite: 'Lax' }]);
  await page.goto('/medication');
  await page.getByRole('button', { name: '주사' }).click();
  await page.getByLabel('이름').fill(medName);
  await page.getByLabel('용량').fill('250mcg');
  await page.getByRole('button', { name: '용량을 내가 확인했어요' }).click();
  await page.getByLabel('시간').fill('22:00');
  await page.getByRole('group', { name: '반복 선택' }).getByRole('button', { name: '오늘만' }).click();
  await page.getByRole('button', { name: '꼭 챙겨야 해요' }).click();
  await page.getByRole('button', { name: '카드 만들기' }).click();
  await page.getByTestId('medication-card').getByText(medName).waitFor({ state: 'visible' });

  const created = await findCreatedCard();
  const completeResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/medication/complete') && response.request().method() === 'POST',
  );
  await page.getByTestId('medication-card').getByRole('button', { name: '완료로 표시' }).click();
  const completeResponse = await completeResponsePromise;
  if (!completeResponse.ok()) {
    throw new Error(`Completion API failed: ${completeResponse.status()} ${await completeResponse.text()}`);
  }
  const completePayload = await completeResponse.json();
  if (completePayload.persisted !== true) {
    throw new Error(`Completion API did not persist to Supabase: ${JSON.stringify(completePayload)}`);
  }
  await page.getByTestId('medication-card').getByText('완료', { exact: true }).waitFor({ state: 'visible' });
  const completed = await findCardById(created.id);
  if (completed.status !== 'completed') {
    throw new Error(`Completion did not persist. card=${created.id} status=${completed.status}`);
  }

  console.log(JSON.stringify({
    ok: true,
    evidence: {
      baseURL,
      userId,
      cardId: created.id,
      title: created.title,
      status: completed.status,
      partnerVisible: created.partner_visible,
      sourceInputId: created.source_input_id,
      storage: 'supabase',
    },
  }, null, 2));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill('SIGTERM');
  if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
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
  if (!value) throw new Error(`${key} is required for real Supabase verification.`);
  return value;
}

async function createDisposableUser() {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? 'missing user'}`);
  return data.user.id;
}

async function signInDisposableUser() {
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`signIn failed: ${error?.message ?? 'missing session'}`);
  return data.session;
}

function encodeSupabaseCookie(session) {
  return `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`;
}

async function startNextServer() {
  const child = spawn('npx', ['next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_FEVIO_PRESENTATION_MODE: '0',
      FEVIO_PRESENTATION_MODE: '0',
      NEXT_PUBLIC_FEVIO_PRESENTATION_HOSTS: '',
      FEVIO_PRESENTATION_HOSTS: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => process.stderr.write(`[next] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[next] ${chunk}`));
  await waitForHttp(baseURL, 90_000);
  return child;
}

function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error(`Timed out waiting for ${url}`));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

async function findCreatedCard() {
  const { data, error } = await admin
    .from('care_action_cards')
    .select('id,title,status,partner_visible,source_input_id,created_by')
    .eq('created_by', userId)
    .ilike('title', `%${medName}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) throw new Error(`Created card not found in Supabase: ${error?.message ?? 'missing row'}`);
  if (!data.partner_visible) throw new Error(`Created card is not partner_visible: ${data.id}`);
  if (!data.source_input_id) throw new Error(`Created card is missing source_input_id: ${data.id}`);
  return data;
}

async function findCardById(id) {
  const { data, error } = await admin
    .from('care_action_cards')
    .select('id,status')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error(`Card lookup failed: ${error?.message ?? 'missing row'}`);
  return data;
}
