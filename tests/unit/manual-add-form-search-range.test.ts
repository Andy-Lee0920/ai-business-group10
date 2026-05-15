import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const addPage = readFileSync('app/(authed)/add/page.tsx', 'utf8');
const formSource = readFileSync('src/features/add/manual-add-form.tsx', 'utf8');

describe('ManualAddForm search and range repeat contract', () => {
  it('keeps the legacy manual form searchable while /add uses schedule mode', () => {
    expect(addPage).toContain('ClinicUpdateForm');
    expect(addPage).toContain('mode="schedule"');
    expect(formSource).toContain('route');
    expect(formSource).toContain('category');
    expect(formSource).toContain('aliases');
    expect(formSource).toContain('brand_name_en');
  });

  it('uses iOS search, alias matching, and a fixed direct-input row instead of a flat list', () => {
    expect(formSource).toContain('type="search"');
    expect(formSource).toContain('약 이름을 검색하세요');
    expect(formSource).toContain('brand_name_en');
    expect(formSource).toContain('aliases');
    expect(formSource).toContain('직접 입력');
    expect(formSource).toContain('selectedCategory');
    expect(formSource).not.toContain('medications.map((m)');
  });

  it('shows the canonical search empty-state illustration when medication search has no matches', () => {
    expect(formSource).toContain('SLCIllustration');
    expect(formSource).toContain('slcAssets.empty.search');
    expect(formSource).toContain('검색 결과가 없어요');
    expect(formSource).not.toContain('<img');
  });

  it('renders a DayPicker range mode with daily time and 30-day guidance', () => {
    expect(formSource).toContain('DayPicker');
    expect(formSource).toContain('mode="range"');
    expect(formSource).toContain('단일 날짜');
    expect(formSource).toContain('기간 반복');
    expect(formSource).toContain('매일 이 시간에');
    expect(formSource).toContain('최대 30일');
  });
});
