export type IvfStage =
  | 'baseline_testing'
  | 'ovarian_stimulation'
  | 'egg_retrieval'
  | 'fertilization'
  | 'embryo_culture'
  | 'embryo_transfer'
  | 'pregnancy_test';

export type IvfStageIndex = '1' | '2' | '3' | '4' | '5' | '6' | '7';
export type SharingLevel = 'basic' | 'care' | 'emotional';
export type Role = 'patient' | 'partner';
export type UtilityCardType =
  | 'medication_card'
  | 'injection_log'
  | 'timeline'
  | 'result_input'
  | 'privacy_control'
  | 'support_action'
  | 'checklist'
  | 'next_step_planner';
export type UtilityStatus = 'idle' | 'active' | 'completed' | 'locked';
export type AccentTone = 'sage' | 'coral' | 'lavender';

export type UtilityCardStateSeed = {
  id: string;
  type: UtilityCardType;
  status: UtilityStatus;
  values?: Record<string, string | number | boolean>;
  completedBy?: Role;
  confirmedByPatient?: boolean;
  visibleToPartner?: boolean;
};

export type UtilityItem = {
  id: string;
  type?: UtilityCardType;
  label: string;
  title?: string;
  value?: string;
  meta?: string;
  tone?: AccentTone | 'neutral';
  requiresSharingLevel?: SharingLevel;
  stateSeed?: UtilityCardStateSeed;
};

export type StageMeta = {
  index: number;
  id: IvfStage;
  stage: IvfStage;
  label: string;
  shortLabel: string;
  description: string;
  dominantMode: string;
  accent: AccentTone;
};

export type DemoScenario = StageMeta & {
  patient: {
    phase: string;
    progress: number;
    headline: string;
    primaryAction: string;
    inputMoment: { prompt: string; answer: string; adaptation: string };
    nowStack: UtilityItem[];
    checklist: UtilityItem[];
    timeline: UtilityItem[];
    utilityCards: UtilityItem[];
    quickTools: UtilityItem[];
  };
  coreTools: UtilityItem[];
  partner: {
    role: string;
    status: string;
    sharedContext: UtilityItem[];
    actions: UtilityItem[];
    avoid: UtilityItem[];
    quickTools: UtilityItem[];
  };
};

export const STAGE_INDEX_TO_ID: Record<IvfStageIndex, IvfStage> = {
  '1': 'baseline_testing',
  '2': 'ovarian_stimulation',
  '3': 'egg_retrieval',
  '4': 'fertilization',
  '5': 'embryo_culture',
  '6': 'embryo_transfer',
  '7': 'pregnancy_test',
};

export const IVF_STAGES: StageMeta[] = [
  { index: 1, id: 'baseline_testing', stage: 'baseline_testing', label: '상담·검사', shortLabel: '검사', description: '기초 결과와 질문을 정리합니다', dominantMode: 'recap', accent: 'sage' },
  { index: 2, id: 'ovarian_stimulation', stage: 'ovarian_stimulation', label: '배란 유도', shortLabel: '주사', description: '약·주사 시간과 기록을 맞춥니다', dominantMode: 'execution', accent: 'coral' },
  { index: 3, id: 'egg_retrieval', stage: 'egg_retrieval', label: '난자 채취', shortLabel: '채취', description: '방문 준비와 회복 기록을 챙깁니다', dominantMode: 'recovery', accent: 'sage' },
  { index: 4, id: 'fertilization', stage: 'fertilization', label: '수정 준비', shortLabel: '준비', description: '필요한 일정만 조심스럽게 공유합니다', dominantMode: 'privacy', accent: 'lavender' },
  { index: 5, id: 'embryo_culture', stage: 'embryo_culture', label: '배아 배양', shortLabel: '배양', description: 'Day 업데이트와 공유 범위를 나눕니다', dominantMode: 'timeline', accent: 'lavender' },
  { index: 6, id: 'embryo_transfer', stage: 'embryo_transfer', label: '배아 이식', shortLabel: '이식', description: '약 루틴과 hCG 날짜를 고정합니다', dominantMode: 'waiting-os', accent: 'sage' },
  { index: 7, id: 'pregnancy_test', stage: 'pregnancy_test', label: '임신 확인', shortLabel: '피검', description: '결과 공유와 다음 계획을 분리합니다', dominantMode: 'protection', accent: 'lavender' },
];

function card(id: string, type: UtilityCardType, label: string, value: string, seedValues: Record<string, string | number | boolean> = {}, requiresSharingLevel?: SharingLevel): UtilityItem {
  return {
    id,
    type,
    label,
    value,
    requiresSharingLevel,
    stateSeed: { id, type, status: 'active', values: seedValues, visibleToPartner: requiresSharingLevel !== 'emotional' },
  };
}

function meta(id: IvfStage): StageMeta {
  const found = IVF_STAGES.find((stage) => stage.id === id);
  if (!found) throw new Error(`Unknown stage ${id}`);
  return found;
}

export const DEMO_SCENARIOS: Record<IvfStage, DemoScenario> = {
  baseline_testing: {
    ...meta('baseline_testing'),
    patient: {
      phase: '초진 준비', progress: 16, headline: '검사 결과와 질문 정리', primaryAction: '검사 항목 확인',
      inputMoment: { prompt: '오늘 준비', answer: 'AMH·AFC·호르몬 결과와 질문을 한곳에 모읍니다.', adaptation: '의사에게 물어볼 항목과 다음 방문일만 정리합니다.' },
      nowStack: [
        { id: 'amh', label: 'AMH', value: '입력 대기', tone: 'sage' },
        { id: 'visit', label: '다음 방문', value: '날짜 선택', tone: 'lavender' },
      ],
      checklist: [
        { id: 'baseline-checklist', type: 'checklist', label: '검사 결과 저장', meta: 'AMH·AFC·FSH·LH·E2' },
        { id: 'baseline-questions', type: 'checklist', label: '질문 목록 만들기' },
        { id: 'baseline-next-visit', type: 'checklist', label: '다음 방문일 확인' },
      ],
      timeline: [{ id: 's1-a', label: '오늘', value: '검사 정리' }, { id: 's1-b', label: '다음', value: '상담' }, { id: 's1-c', label: '이후', value: '프로토콜' }],
      utilityCards: [
        card('baseline-checklist', 'checklist', 'Baseline Checklist', '검사 결과 저장', { amh: '', afc: '', fsh: '', lh: '', e2: '' }),
        card('baseline-questions', 'checklist', '질문 목록 같이보기', '의사에게 물어볼 3가지'),
        card('baseline-next-visit', 'timeline', '다음 방문일', '날짜 입력', { next_visit: '2026-05-14' }),
      ],
      quickTools: [{ id: 'result', label: '검사결과', value: '저장' }, { id: 'question', label: '질문', value: '3개' }, { id: 'partner', label: '동행', value: '선택' }],
    },
    coreTools: [{ id: 'stage', label: '단계', value: '1/7' }, { id: 'mode', label: '모드', value: 'recap' }, { id: 'share', label: '공유', value: 'care' }],
    partner: {
      role: '준비 동행자', status: '질문 정리 중',
      sharedContext: [{ id: 'visit', label: '방문', value: '예정' }, { id: 'questions', label: '질문', value: '같이 보기' }],
      actions: [card('partner-questions', 'support_action', '질문 목록 같이보기', '확인'), card('partner-ride', 'support_action', '동행 여부 체크', '선택'), card('partner-visit', 'timeline', '방문 일정 확인', '대기')],
      avoid: [{ id: 'interpret', label: '검사 결과 해석하기' }], quickTools: [{ id: 'calendar', label: '캘린더', value: '열기' }],
    },
  },
  ovarian_stimulation: {
    ...meta('ovarian_stimulation'),
    patient: {
      phase: '실행 집중', progress: 32, headline: '21:00 고날에프 225IU', primaryAction: '주사 완료 기록',
      inputMoment: { prompt: '병원 안내', answer: '고날에프 225IU / 21:00 / 파트너 준비 확인', adaptation: '약 이름, 시간, 실제 기록자를 분리합니다.' },
      nowStack: [{ id: 'med', label: '약', value: '고날에프 225IU', tone: 'coral' }, { id: 'time', label: '시간', value: '21:00', tone: 'coral' }, { id: 'site', label: '부위', value: '아랫배', tone: 'lavender' }],
      checklist: [{ id: 'stim-medication', label: '약 이름 확인' }, { id: 'stim-prep', label: '알코올솜·폐기통 준비' }, { id: 'stim-log', label: '주사 완료 기록' }],
      timeline: [{ id: 's2-a', label: '20:50', value: '준비' }, { id: 's2-b', label: '21:00', value: '주사' }, { id: 's2-c', label: '21:05', value: '기록' }],
      utilityCards: [
        card('stim-medication', 'medication_card', 'MedicationCard', '고날에프 225IU · 21:00', { name: '고날에프', dose: '225IU', time: '21:00' }, 'care'),
        card('stim-log', 'injection_log', 'InjectionLog', 'scheduled/actual/recorded', { scheduled_time: '21:00', actual_time: '', administered_by: 'self', recorded_by: 'patient', confirmed_by_patient: false }, 'care'),
        card('stim-site', 'checklist', 'InjectionSitePicker', '아랫배 좌우 교대'),
        card('stim-symptom', 'checklist', 'SymptomTracker', '복부팽만/두통 기록', { discomfort: 2 }, 'emotional'),
      ],
      quickTools: [{ id: 'timer', label: '타이머', value: '20분' }, { id: 'partner', label: '파트너', value: '준비' }, { id: 'log', label: '기록', value: '대기' }],
    },
    coreTools: [{ id: 'stage', label: '단계', value: '2/7' }, { id: 'mode', label: '모드', value: 'execution' }, { id: 'share', label: '공유', value: 'care' }],
    partner: {
      role: '확인자', status: '주사 20분 전', sharedContext: [{ id: 'med', label: '약', value: '고날에프' }, { id: 'time', label: '시간', value: '21:00' }],
      actions: [card('partner-med-check', 'support_action', '약 이름 확인', '완료', {}, 'care'), card('partner-supply-check', 'support_action', '준비물 확인', '알코올솜·폐기통', {}, 'care'), card('stim-log', 'injection_log', '파트너가 기록', '환자 확인 대기', {}, 'care')],
      avoid: [{ id: 'rush', label: '재촉' }, { id: 'dose', label: '용량 변경 제안' }], quickTools: [{ id: 'next', label: '다음 알림', value: '켜짐' }],
    },
  },
  egg_retrieval: {
    ...meta('egg_retrieval'),
    patient: {
      phase: '방문·회복', progress: 46, headline: '채취 전후 체크', primaryAction: '회복 상태 기록',
      inputMoment: { prompt: '오늘 일정', answer: '금식, 도착 시간, 회복 상태를 순서대로 확인합니다.', adaptation: '통증·출혈·복부팽만은 판단 없이 수치로만 남깁니다.' },
      nowStack: [{ id: 'arrival', label: '도착', value: '08:30', tone: 'sage' }, { id: 'fasting', label: '금식', value: '확인', tone: 'lavender' }, { id: 'pain', label: '통증', value: '입력', tone: 'neutral' }],
      checklist: [{ id: 'retrieval-fasting', label: '금식 확인' }, { id: 'retrieval-arrival', label: '도착 시간 확인' }, { id: 'retrieval-recovery', label: '회복 기록' }],
      timeline: [{ id: 's3-a', label: '08:30', value: '도착' }, { id: 's3-b', label: '시술 후', value: '회복' }, { id: 's3-c', label: '귀가', value: '동행' }],
      utilityCards: [card('retrieval-procedure', 'checklist', 'ProcedureChecklist', '금식·도착시간', { fasting: false, arrival: '08:30' }), card('retrieval-recovery', 'checklist', 'RecoveryLog', '통증·출혈·복부팽만', { pain: 0, bleeding: 0, bloating: 0, urine: 0 }, 'emotional'), card('retrieval-count', 'result_input', '채취난자수 기록', '숫자 입력', { oocyte_count: 0 }, 'care')],
      quickTools: [{ id: 'ride', label: '귀가', value: '동행' }, { id: 'water', label: '수분', value: '준비' }, { id: 'rest', label: '휴식', value: '예약' }],
    },
    coreTools: [{ id: 'stage', label: '단계', value: '3/7' }, { id: 'mode', label: '모드', value: 'recovery' }, { id: 'share', label: '공유', value: 'care' }],
    partner: { role: '회복 지원자', status: '귀가 지원 준비', sharedContext: [{ id: 'arrival', label: '도착', value: '08:30' }, { id: 'home', label: '귀가', value: '동행' }], actions: [card('partner-ride-home', 'support_action', '귀가 지원 완료', '체크'), card('partner-meal-water', 'support_action', '식사·수분 준비', '체크'), card('partner-redflag-watch', 'support_action', '회복 상태 확인 필요', '통증 수치만 확인', {}, 'emotional')], avoid: [{ id: 'judge', label: '상태 단정하기' }], quickTools: [{ id: 'call', label: '병원 연락처', value: '보기' }] },
  },
  fertilization: {
    ...meta('fertilization'),
    patient: {
      phase: '프라이버시 조정', progress: 58, headline: '방법과 다음 알림만 정리', primaryAction: '공유 범위 조정',
      inputMoment: { prompt: '공유 범위', answer: '필요한 일정만 파트너에게 공유합니다.', adaptation: '민감한 세부값은 숨기고 준비 시간과 알림만 남깁니다.' },
      nowStack: [{ id: 'method', label: '방법', value: 'IVF/ICSI 기록', tone: 'lavender' }, { id: 'lab', label: '다음 알림', value: '내일 오전', tone: 'sage' }],
      checklist: [{ id: 'fert-method', label: 'FertilizationMethodCard' }, { id: 'fert-lab-update', label: 'NextLabUpdateCard' }, { id: 'fert-privacy', label: 'PrivacyRespectNotice' }],
      timeline: [{ id: 's4-a', label: '오늘', value: '방법 기록' }, { id: 's4-b', label: '내일', value: '알림 예정' }, { id: 's4-c', label: '공유', value: '일정만' }],
      utilityCards: [card('fert-method', 'result_input', 'FertilizationMethodCard', 'IVF / ICSI 선택 기록', { method: 'IVF' }, 'care'), card('fert-lab-update', 'timeline', 'NextLabUpdateCard', '다음 결과 알림 시간', { next_update: '내일 오전' }), card('fert-privacy', 'privacy_control', 'PrivacyRespectNotice', '일정만 공유', { sharing: 'basic' })],
      quickTools: [{ id: 'privacy', label: '공유', value: 'basic' }, { id: 'next', label: '알림', value: '예정' }, { id: 'note', label: '메모', value: '비공개' }],
    },
    coreTools: [{ id: 'stage', label: '단계', value: '4/7' }, { id: 'mode', label: '모드', value: 'privacy' }, { id: 'share', label: '공유', value: 'basic' }],
    partner: { role: '일정 확인자', status: '일정만 공유 중', sharedContext: [{ id: 'schedule', label: '준비 시간', value: '확인' }, { id: 'privacy', label: '공유', value: '일정만' }], actions: [card('partner-sample-time', 'timeline', 'SamplePreparationSchedule', '준비 시간', {}, 'basic'), card('partner-privacy-respect', 'support_action', 'PrivacyRespectNotice', '필요한 일정만 공유 중', {}, 'basic')], avoid: [{ id: 'ask-detail', label: '세부값 먼저 묻기' }], quickTools: [{ id: 'calendar', label: '일정', value: '보기' }] },
  },
  embryo_culture: {
    ...meta('embryo_culture'),
    patient: {
      phase: '업데이트 대기', progress: 68, headline: 'Day 3 업데이트', primaryAction: 'Day 상태 변경',
      inputMoment: { prompt: '배양 업데이트', answer: 'Day 1 완료, Day 3 확인 중, Day 5 예정', adaptation: '결과 세부 공유 여부를 분리합니다.' },
      nowStack: [{ id: 'day1', label: 'Day1', value: 'done', tone: 'sage' }, { id: 'day3', label: 'Day3', value: 'active', tone: 'lavender' }, { id: 'day5', label: 'Day5', value: 'upcoming', tone: 'neutral' }],
      checklist: [{ id: 'culture-timeline', label: 'EmbryoUpdateTimeline' }, { id: 'culture-result', label: 'EmbryoResultCard' }, { id: 'culture-share', label: '공유 범위 확인' }],
      timeline: [{ id: 'day1', label: 'Day 1', value: 'done' }, { id: 'day3', label: 'Day 3', value: 'active' }, { id: 'day5', label: 'Day 5', value: 'upcoming' }],
      utilityCards: [card('culture-timeline', 'timeline', 'EmbryoUpdateTimeline', 'Day1 done / Day3 active / Day5 upcoming', { day1: 'done', day3: 'active', day5: 'upcoming' }, 'care'), card('culture-result', 'result_input', 'EmbryoResultCard', '배아 수·등급·동결 여부', { embryo_count: 0, grade: '', freeze: false }, 'emotional'), card('culture-share', 'privacy_control', '공유 범위', '결과 세부값 선택', { sharing: 'care' })],
      quickTools: [{ id: 'next', label: '다음 알림', value: 'Day5' }, { id: 'share', label: '공유', value: 'care' }, { id: 'quiet', label: '질문', value: '보류' }],
    },
    coreTools: [{ id: 'stage', label: '단계', value: '5/7' }, { id: 'mode', label: '모드', value: 'timeline' }, { id: 'share', label: '공유', value: 'care' }],
    partner: { role: '조용한 지지자', status: '다음 알림 예정', sharedContext: [{ id: 'next', label: '다음', value: 'Day5' }, { id: 'mode', label: '질문', value: '먼저 묻지 않기' }], actions: [card('partner-shared-update', 'timeline', 'SharedUpdateStatus', '다음 알림 예정', {}, 'basic'), card('partner-quiet-support', 'support_action', 'QuietSupportCard', '먼저 묻지 않기', {}, 'basic'), card('partner-result-detail', 'result_input', '업데이트가 공유됐어요', '결과 세부는 케어 공유 이상', {}, 'care')], avoid: [{ id: 'ask-grade', label: '등급 먼저 묻기' }], quickTools: [{ id: 'presence', label: '곁에 있음', value: '전달' }] },
  },
  embryo_transfer: {
    ...meta('embryo_transfer'),
    patient: {
      phase: '이식 후 루틴', progress: 78, headline: '약 루틴과 피검일', primaryAction: '약 완료 기록',
      inputMoment: { prompt: '이식 요약', answer: 'FET / Day5 / 1개 / hCG 검사일 입력', adaptation: '이식 후에는 루틴과 검사 날짜만 붙잡습니다.' },
      nowStack: [{ id: 'prog', label: '프로게스테론', value: '22:00', tone: 'coral' }, { id: 'estrogen', label: '에스트로겐', value: '08:00/20:00', tone: 'sage' }, { id: 'beta', label: 'hCG', value: 'D+10', tone: 'lavender' }],
      checklist: [{ id: 'transfer-summary', label: 'TransferSummaryCard' }, { id: 'transfer-medication', label: 'LutealMedicationTracker' }, { id: 'transfer-beta-date', label: 'BetaDateCard' }],
      timeline: [{ id: 's6-a', label: '오늘', value: '이식' }, { id: 's6-b', label: '매일', value: '약 루틴' }, { id: 's6-c', label: 'D+10', value: '피검' }],
      utilityCards: [card('transfer-summary', 'result_input', 'TransferSummaryCard', 'Fresh/FET·배아일차·이식개수', { transfer_type: 'FET', embryo_day: 'Day5', count: 1 }, 'care'), card('transfer-medication', 'medication_card', 'LutealMedicationTracker', '프로게스테론 22:00 · 에스트로겐 08:00/20:00', { progesterone: false, estrogen_am: false, estrogen_pm: false }, 'care'), card('transfer-beta-date', 'timeline', 'BetaDateCard', 'hCG 검사일', { beta_date: '2026-05-29' }, 'basic')],
      quickTools: [{ id: 'med', label: '약', value: '2종' }, { id: 'beta', label: '피검', value: 'D+10' }, { id: 'rest', label: '휴식', value: '저녁' }],
    },
    coreTools: [{ id: 'stage', label: '단계', value: '6/7' }, { id: 'mode', label: '모드', value: 'waiting-os' }, { id: 'share', label: '공유', value: 'care' }],
    partner: { role: '루틴 보조자', status: '저녁 일정 비우기', sharedContext: [{ id: 'med', label: '다음 약', value: '22:00' }, { id: 'beta', label: '피검', value: 'D+10' }], actions: [card('partner-med-assist', 'support_action', 'MedicationAssistCard', '다음 약 시간 함께 확인', {}, 'care'), card('partner-schedule-guard', 'support_action', 'ScheduleGuardCard', '저녁 일정 비우기', {}, 'basic'), card('partner-beta-countdown', 'timeline', 'BetaCountdownShared', '피검일 공유', {}, 'basic')], avoid: [{ id: 'symptom-ask', label: '증상 캐묻기' }], quickTools: [{ id: 'quiet', label: '조용한 환경', value: '준비' }] },
  },
  pregnancy_test: {
    ...meta('pregnancy_test'),
    patient: {
      phase: '결과 보호', progress: 92, headline: '결과와 다음 일정 분리', primaryAction: '공유 범위 선택',
      inputMoment: { prompt: '공유 선택', answer: '다음 일정만 또는 결과까지 공유를 직접 선택합니다.', adaptation: '파트너 화면은 공유 범위에 따라 즉시 달라집니다.' },
      nowStack: [{ id: 'hcg', label: 'hCG', value: '직접 입력', tone: 'lavender' }, { id: 'next', label: '다음 검사', value: '선택', tone: 'sage' }, { id: 'share', label: '공유', value: 'basic', tone: 'neutral' }],
      checklist: [{ id: 'beta-hcg-input', label: 'BetaHcgInputCard' }, { id: 'result-visibility', label: 'ResultVisibilityControl' }, { id: 'next-step-planner', label: 'NextStepPlanner' }],
      timeline: [{ id: 's7-a', label: '오늘', value: '피검' }, { id: 's7-b', label: '다음', value: '2차 피검' }, { id: 's7-c', label: '이후', value: '초음파/약' }],
      utilityCards: [card('beta-hcg-input', 'result_input', 'BetaHcgInputCard', 'hCG 수치·검사 시간', { hcg: '', test_time: '09:00' }, 'care'), card('result-visibility', 'privacy_control', 'ResultVisibilityControl', '다음 일정만 / 결과까지 공유', { sharing: 'basic' }), card('next-step-planner', 'next_step_planner', 'NextStepPlanner', '2차 피검·초음파·약 지속', { second_beta: false, ultrasound: false, medication_continue: true }, 'basic')],
      quickTools: [{ id: 'share', label: '공유', value: '선택' }, { id: 'next', label: '다음', value: '계획' }, { id: 'protect', label: '해석', value: '금지' }],
    },
    coreTools: [{ id: 'stage', label: '단계', value: '7/7' }, { id: 'mode', label: '모드', value: 'protection' }, { id: 'share', label: '공유', value: 'basic' }],
    partner: { role: '해석하지 않는 지지자', status: '결과 공유 여부 대기', sharedContext: [{ id: 'next', label: '다음 검사', value: '공유됨' }, { id: 'result', label: '결과', value: '사용자 선택' }], actions: [card('partner-result-status', 'result_input', 'ResultSharedStatus', '결과 공유 여부', {}, 'care'), card('partner-next-appointment', 'timeline', 'NextAppointmentCard', '다음 검사일', {}, 'basic'), card('partner-do-not-interpret', 'support_action', 'DoNotInterpretCard', '수치 해석하지 않기', {}, 'basic')], avoid: [{ id: 'interpret', label: '수치 해석하기' }, { id: 'predict', label: '단정하기' }], quickTools: [{ id: 'quiet', label: '말투', value: '조용히' }] },
  },
};

export const DEMO_ORDER: IvfStage[] = IVF_STAGES.map((stage) => stage.id);

export function stageIndexFor(stage: IvfStage): IvfStageIndex {
  const index = IVF_STAGES.find((item) => item.id === stage)?.index ?? 2;
  return String(index) as IvfStageIndex;
}
