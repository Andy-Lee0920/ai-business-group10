import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('app/(authed)/policy-support/page.tsx', 'utf8');

describe('policy support page shell', () => {
  it('renders the four policy support screens from one entrypoint', () => {
    expect(page).toContain("'input'");
    expect(page).toContain("'result'");
    expect(page).toContain("'checklist'");
    expect(page).toContain("'contact'");
    expect(page).toContain('정보 입력');
    expect(page).toContain('가능성');
    expect(page).toContain('체크리스트');
    expect(page).toContain('문의 메일');
  });

  it('keeps the policy support copy framed as possibility and public-health-center confirmation', () => {
    expect(page).toContain('보건소 최종 확인 필요');
    expect(page).toContain('지원 대상 여부를 확정하지 않아요');
    expect(page).toContain('신청 검토 가능성 있음');
    expect(page).toContain('지원결정통지서');
    expect(page).toContain('민감정보 제외');
    expect(page).not.toContain('100% 받을 수 있습니다');
    expect(page).not.toContain('지원 대상입니다');
    expect(page).not.toContain('무조건 신청 가능합니다');
  });
});
