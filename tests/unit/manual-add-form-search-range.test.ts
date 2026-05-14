import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const addPage = readFileSync('app/(authed)/add/page.tsx', 'utf8');
const formSource = readFileSync('src/features/add/manual-add-form.tsx', 'utf8');

describe('ManualAddForm search and range repeat contract', () => {
  it('fetches the medication fields required for route filtering and alias search', () => {
    expect(addPage).toContain('route');
    expect(addPage).toContain('category');
    expect(addPage).toContain('aliases');
    expect(addPage).toContain('brand_name_en');
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

  it('renders a DayPicker range mode with daily time and 30-day guidance', () => {
    expect(formSource).toContain('DayPicker');
    expect(formSource).toContain('mode="range"');
    expect(formSource).toContain('단일 날짜');
    expect(formSource).toContain('기간 반복');
    expect(formSource).toContain('매일 이 시간에');
    expect(formSource).toContain('최대 30일');
  });
});
