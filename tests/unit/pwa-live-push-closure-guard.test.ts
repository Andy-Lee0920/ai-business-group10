import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/verify-live-push-closure-evidence.mjs';

function makeEvidence() {
  return {
    checkedAt: '2026-05-19T00:00:00.000Z',
    userId: 'user-1',
    cardId: 'card-1',
    schedulerRerun: { attempted: true, status: 200, ok: true },
    pushSubscriptions: [{ endpoint: 'https://push.example/...abcdef', updated_at: '2026-05-19T00:00:00.000Z' }],
    reminderDispatches: [
      { card_id: 'card-1', scheduled_at: '2026-05-19T00:15:00.000Z', channel: 'web_push_t15', status: 'sent', provider_message_id: '...message1' },
    ],
  };
}

describe('live push closure evidence guard', () => {
  it('fails Android closure when physical receipt/tap/lock-screen media is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fevio-push-guard-'));
    const evidencePath = join(dir, 'evidence.json');
    writeFileSync(evidencePath, JSON.stringify(makeEvidence()));

    const result = spawnSync('node', [scriptPath, '--platform', 'android', '--evidence-json', evidencePath], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('L3 media is required');
    expect(result.stderr).toContain('L4 media is required');
    expect(result.stderr).toContain('L6 media is required');
  });

  it('passes Android closure when DB evidence and L3/L4/L6 media are present', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fevio-push-guard-'));
    const evidencePath = join(dir, 'evidence.json');
    const l3 = join(dir, 'l3.png');
    const l4 = join(dir, 'l4.png');
    const l6 = join(dir, 'l6.mov');
    writeFileSync(evidencePath, JSON.stringify(makeEvidence()));
    writeFileSync(l3, 'screenshot');
    writeFileSync(l4, 'screenshot');
    writeFileSync(l6, 'video');

    const output = execFileSync('node', [scriptPath, '--platform', 'android', '--evidence-json', evidencePath, '--l3-media', l3, '--l4-media', l4, '--l6-media', l6], { encoding: 'utf8' });

    expect(output).toContain('Android live push closure evidence verified');
  });

  it('requires iOS Home Screen install media in addition to L3/L4/L6', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fevio-push-guard-'));
    const evidencePath = join(dir, 'evidence.json');
    const l3 = join(dir, 'l3.png');
    const l4 = join(dir, 'l4.png');
    const l6 = join(dir, 'l6.mov');
    writeFileSync(evidencePath, JSON.stringify(makeEvidence()));
    writeFileSync(l3, 'screenshot');
    writeFileSync(l4, 'screenshot');
    writeFileSync(l6, 'video');

    const result = spawnSync('node', [scriptPath, '--platform', 'ios', '--evidence-json', evidencePath, '--l3-media', l3, '--l4-media', l4, '--l6-media', l6], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('iOS Home Screen install media is required');
  });
});
