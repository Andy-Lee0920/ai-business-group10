import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const form = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');
const page = readFileSync('app/(authed)/clinic-update/page.tsx', 'utf8');
const addPage = readFileSync('app/(authed)/add/page.tsx', 'utf8');

describe('Clinic Guide visual flow contract', () => {
  it('implements entry, guided interview header, search, draft, confirmation, and success states', () => {
    for (const copy of [
      "'entry'",
      'mode?: ClinicUpdateMode',
      "mode = 'memo'",
      '병원 안내를\\\\n오늘 일정으로 바꿀게요',
      '일정을 추가할게요',
      '사진, 문자, 직접 수정 중 편한 방법으로 시작하세요.',
      '사진으로 업데이트',
      '문자로 업데이트',
      '직접 수정',
      '나중에 할게요',
      'photo_processing',
      'text_paste',
      'diff_review',
      'manual_entry',
      '/api/onboard/photo-upload',
      '/api/onboard/photo-analyze',
      '/api/onboard/text-analyze',
      '/api/onboard/candidates/confirm',
      '업로드 완료',
      '분석 중',
      '후보 준비',
      '찾지 못했어요',
      '겹치는 일정이 있어요',
      '현재 일정',
      '새 후보',
      '변경사항 적용',
      '일정 적용',
      '직접 입력 form 열기',
      '✦ Clinic Guide AI',
      'aiAvailable ? <span style={badgeStyle}>✦ Clinic Guide AI</span> : null',
      'if (!available) return null',
      'answerHistory',
      'progressbar',
      '1/4',
      '2/4',
      '3/4',
      '4/4',
      '그대로',
      '바뀌었어요',
      '잘 모르겠어요',
      "type=\"search\"",
      '약 이름을 검색하세요',
      'brand_name_ko',
      'brand_name_en',
      'aliases',
      '직접 입력',
      '검색 결과가 없어요',
      '약 선택 완료',
      '다음 방문일 제안',
      '네, 표시할게요',
      '날짜 수정',
      'getFullYear',
      '정리된 내용',
      '불명확한 시간은 저장 전에 다시 확인해요',
      '저장 전 확인해주세요',
      '저장하고 업데이트',
      '✓ 오늘 일정에 반영했어요',
      '오늘 일정 미리보기',
      '파트너가 읽기 전용으로 확인 중',
    ]) {
      expect(form).toContain(copy);
    }

    expect(form).toContain('ClinicUpdateSaveResponse');
    expect(form).toContain('payload.scheduleItems');
    expect(form).toContain('INTERVIEW_PROGRESS_TOTAL = 4');
    expect(form).not.toContain('01/06');
    expect(form).not.toContain('PROGRESS_TOTAL = 6');
    expect(form).not.toContain("form.sameMedication === option.value");
    expect(form).toContain("router.push('/home')");
    expect(page).toContain('partnerConnected');
    expect(page).toContain('currentItems');
    expect(page).toContain('mode="memo"');
    expect(page).toContain("from('schedule_items')");
    expect(page).toContain("link.status === 'approved'");
    expect(page).toContain('aliases');
    expect(addPage).toContain('mode="schedule"');
    expect(addPage).toContain("from('schedule_items')");
    expect(addPage).not.toContain('ManualAddForm');
  });
});
