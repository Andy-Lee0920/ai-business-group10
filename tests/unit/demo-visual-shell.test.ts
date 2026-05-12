import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('demo visual shell contract', () => {
  it('rejects the foggy visual rescue stack and keeps the shell clean', () => {
    const css = readFileSync('app/demo/dual-panel-demo.module.css', 'utf8');

    expect(css).toContain('/* P0 visual reset: clean iOS material shell. */');
    expect(css).toContain('.demoShell_coral');
    expect(css).toContain('.demoShell_sage');
    expect(css).toContain('.demoShell_lavender');
    expect(css).not.toContain('feTurbulence');
    expect(css).not.toContain('mix-blend-mode: soft-light');
    expect(css).not.toContain('backdrop-filter: blur(24px)');
    expect(css).not.toContain('rgba(255, 255, 255, 0.58)');
  });

  it('keeps generated demo copy and surrounding chrome product-safe', () => {
    const client = readFileSync('app/demo/dual-panel-demo-client.tsx', 'utf8');

    expect(client).toContain('source-to-care-bridge');
    expect(client).toContain('현재 단계');
    expect(client).not.toContain('Care state');
    expect(client).not.toContain('homeSurfaceLinks');
    expect(client).not.toContain('visibleEntrypointLinks');
    expect(client).not.toContain('Quick Capture');
    expect(client).not.toContain('Prescription Capture');
    expect(client).not.toContain('빠른 입력');
    expect(client).not.toContain('처방전 입력');
  });

  it('keeps the memo input screen single-purpose instead of an explainer page', () => {
    const input = readFileSync('app/demo/demo-input-screen.tsx', 'utf8');

    expect(input).toContain('병원 안내 붙여넣기');
    expect(input).toContain('케어 화면 만들기');
    expect(input).toContain('예시 넣기');
    expect(input).not.toContain('phoneFunnelTopBar');
    expect(input).not.toContain('Fevio Demo');
    expect(input).not.toContain('먼저 누구로 시작할까요?');
    expect(input).not.toContain('환자 본인');
    expect(input).not.toContain('배우자·파트너');
    expect(input).not.toContain('interviewAnswerChip');
    expect(input).not.toContain('병원 안내를 그대로 넣어주세요');
    expect(input).not.toContain('약, 방문, 결과 일정이 섞여 있어도');
    expect(input).not.toContain('약 봉투·메모 사진 예시로 채우기');
    expect(input).not.toContain('데모에서는 사진 예시가 텍스트로 채워집니다.');
  });

});
