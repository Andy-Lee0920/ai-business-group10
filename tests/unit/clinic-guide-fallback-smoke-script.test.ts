import { spawn } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';
import { describe, expect, it } from 'vitest';

describe('clinic-guide-ai fallback smoke script', () => {
  it('proves a live function can be checked for an expected llm fallback result', async () => {
    const requests: Array<{ headers: http.IncomingHttpHeaders; body: unknown }> = [];
    const server = http.createServer((request, response) => {
      if (request.method !== 'POST' || request.url !== '/functions/v1/clinic-guide-ai') {
        response.writeHead(404).end();
        return;
      }

      let body = '';
      request.on('data', (chunk: Buffer) => { body += chunk.toString('utf8'); });
      request.on('end', () => {
        requests.push({ headers: request.headers, body: JSON.parse(body) });
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          matched: { id: 'gonal-f', brand_name_ko: '고날에프' },
          source: 'llm',
        }));
      });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('missing test server address');

    try {
      const result = await runNodeScript([
        'scripts/smoke-clinic-guide-ai.mjs',
        '--input',
        'gonalf typo',
        '--expect-source',
        'llm',
        '--expect-id',
        'gonal-f',
      ], {
        NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${address.port}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        FEVIO_SMOKE_PATIENT_ID: 'test-patient',
      });

      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: true,
        urlActionResult: '/clinic-update에서 환자가 약품명 표현을 입력했을 때 서버 경로가 클라이언트에 키를 노출하지 않고 후보 카드 또는 안전한 미매칭 상태를 반환한다.',
        result: {
          status: 200,
          source: 'llm',
          matchedId: 'gonal-f',
          matchedKo: '고날에프',
        },
      });
      expect(requests).toEqual([
        {
          headers: expect.objectContaining({
            authorization: 'Bearer test-anon-key',
            apikey: 'test-anon-key',
          }),
          body: { userInput: 'gonalf typo', patientId: 'test-patient' },
        },
      ]);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});

function runNodeScript(args: string[], env: Record<string, string>) {
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, args, {
      env: {
        ...process.env,
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}
