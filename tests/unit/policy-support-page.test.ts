import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('app/(authed)/policy-support/page.tsx', 'utf8');

describe('policy support page shell', () => {
  it('renders the four policy support screens from one entrypoint', () => {
    expect(page).toMatch(/["']input["']/u);
    expect(page).toMatch(/["']result["']/u);
    expect(page).toMatch(/["']checklist["']/u);
    expect(page).toMatch(/["']contact["']/u);
    expect(page).toContain('정보 입력');
    expect(page).toContain('가능성');
    expect(page).toContain('체크리스트');
    expect(page).toContain('문의 메일');
  });

  it('keeps the policy support copy framed as possibility and public-health-center confirmation', () => {
    expect(page).toContain('보건소 최종 확인 필요');
    expect(page).toContain('지원 대상 여부를 확정하지 않아요');
    expect(page).toContain('evaluatePolicySupport');
    expect(page).toContain('시술 시작 전 확인');
    expect(page).toContain('지원결정통지서');
    expect(page).toContain('민감정보 제외');
    expect(page).not.toContain('100% 받을 수 있습니다');
    expect(page).not.toContain('지원 대상입니다');
    expect(page).not.toContain('무조건 신청 가능합니다');
  });

  it('uses a Seoul district dropdown and non-radio buttons for input values', () => {
    expect(page).toContain('function DistrictDropdown');
    expect(page).toContain('서울 자치구 선택');
    expect(page).toContain('서울특별시 {district}');
    expect(page).toContain('function ChoiceGroup');
    expect(page).toContain('aria-pressed');
    expect(page).not.toContain('role="radio"');
    expect(page).not.toContain('aria-checked');
    expect(page).not.toContain('function RadioGroup');
    expect(page).toContain('지원결정통지서');
    expect(page).toContain('원외약제비');
  });

  it('keeps policy support input interactions in local state instead of link navigation', () => {
    expect(page).toContain('useState<PolicySupportStep>');
    expect(page).toContain('setParams({ ...params');
    expect(page).not.toContain('buildPolicySupportHref');
  });
});
