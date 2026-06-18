import type { DemoScenario, IvfStage } from './demo-scenarios';

export type DemoExperienceGuide = {
  stageId: IvfStage;
  surfaceShift: string;
  patientDelta: string;
  partnerDelta: string;
  proofPoints: string[];
};

const STAGE_DELTAS: Record<IvfStage, Omit<DemoExperienceGuide, 'stageId'>> = {
  baseline_testing: {
    surfaceShift: '검사 단계에서는 질문·결과 정리 화면으로 전환됩니다.',
    patientDelta: '내 화면은 검사 결과 저장과 의사에게 물어볼 질문을 앞에 둡니다.',
    partnerDelta: '파트너 화면은 결과 해석보다 질문 목록과 동행 여부 확인에 집중합니다.',
    proofPoints: ['검사 결과 저장', '질문 목록 같이보기', '검사 결과 해석하기 금지'],
  },
  ovarian_stimulation: {
    surfaceShift: '주사 단계에서는 실행 시간·약 이름·준비 행동 화면으로 전환됩니다.',
    patientDelta: '내 화면은 약 이름, 21:00 실행, 환자 최종 확인을 가장 앞에 둡니다.',
    partnerDelta: '파트너 화면은 알코올솜·폐기통 준비와 기록 보조 역할로 바뀝니다.',
    proofPoints: ['주사 완료 기록', '파트너가 기록', '환자 확인 대기'],
  },
  egg_retrieval: {
    surfaceShift: '채취 단계에서는 방문·회복·귀가 지원 화면으로 전환됩니다.',
    patientDelta: '내 화면은 금식, 도착 시간, 회복 상태 숫자 기록을 앞에 둡니다.',
    partnerDelta: '파트너 화면은 귀가, 식사·수분, 회복 상태 확인 행동으로 바뀝니다.',
    proofPoints: ['방문 체크', '회복 기록', '상태 단정하기 금지'],
  },
  fertilization: {
    surfaceShift: '수정 준비 단계에서는 privacy-first 일정 공유 화면으로 전환됩니다.',
    patientDelta: '내 화면은 방법 기록과 공유 범위를 분리해 민감한 세부값을 보호합니다.',
    partnerDelta: '파트너 화면은 사용자가 연 일정과 준비 시간만 보도록 제한됩니다.',
    proofPoints: ['필요한 일정만 공유', '공유 범위 선택', '세부값 먼저 묻기 금지'],
  },
  embryo_culture: {
    surfaceShift: '배아 배양 단계에서는 Day 1·3·5 타임라인 화면으로 전환됩니다.',
    patientDelta: '내 화면은 Day별 상태와 결과 세부 공유 여부를 분리해 보여줍니다.',
    partnerDelta: '파트너 화면은 다음 알림과 조용한 지원 행동 중심으로 바뀝니다.',
    proofPoints: ['Day 업데이트', '공유 범위', '등급 먼저 묻기 금지'],
  },
  embryo_transfer: {
    surfaceShift: '이식 단계에서는 약 루틴과 hCG 검사일 화면으로 전환됩니다.',
    patientDelta: '내 화면은 이식 요약, 약 루틴, 피검일을 반복 가능한 체크로 고정합니다.',
    partnerDelta: '파트너 화면은 약 시간 확인과 저녁 일정 비우기 역할로 바뀝니다.',
    proofPoints: ['약 루틴', 'hCG 검사일', '증상 캐묻기 금지'],
  },
  pregnancy_test: {
    surfaceShift: '피검 결과 단계에서는 결과 보호와 공유 선택 화면으로 전환됩니다.',
    patientDelta: '내 화면은 hCG 입력, 결과 공유 범위, 다음 단계를 사용자가 고르게 합니다.',
    partnerDelta: '파트너 화면은 공유된 범위만 보고 수치 해석하지 않기 역할로 바뀝니다.',
    proofPoints: ['공유 범위 선택', '다음 단계', '수치 해석하지 않기'],
  },
};

export function buildDemoExperienceGuide(scenario: DemoScenario): DemoExperienceGuide {
  const delta = STAGE_DELTAS[scenario.stage];
  return {
    stageId: scenario.stage,
    surfaceShift: `${scenario.shortLabel}: ${delta.surfaceShift}`,
    patientDelta: delta.patientDelta,
    partnerDelta: delta.partnerDelta,
    proofPoints: delta.proofPoints,
  };
}
