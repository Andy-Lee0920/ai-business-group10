import type { PresentationCareParam } from '../../src/features/adaptive-home/presentation-scenarios';

export type UtilityItem = {
  id: string;
  label: string;
  value?: string;
  meta?: string;
  tone?: 'sage' | 'coral' | 'lavender' | 'neutral';
};

export type DemoScenario = {
  care: PresentationCareParam;
  label: string;
  shortLabel: string;
  accent: 'sage' | 'coral' | 'lavender';
  patient: {
    stage: string;
    phase: string;
    progress: number;
    headline: string;
    primaryAction: string;
    inputMoment: {
      prompt: string;
      answer: string;
      adaptation: string;
    };
    nowStack: UtilityItem[];
    checklist: UtilityItem[];
    timeline: UtilityItem[];
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

export const DEMO_SCENARIOS: Record<PresentationCareParam, DemoScenario> = {
  injection: {
    care: 'injection',
    label: '주사 맞는 날',
    shortLabel: '주사',
    accent: 'coral',
    patient: {
      stage: '3/4',
      phase: '시술 진행 중',
      progress: 72,
      headline: '21:00 주사 준비',
      primaryAction: '주사 준비 체크',
      inputMoment: {
        prompt: '병원 안내',
        answer: '오늘 21시 고날에프, 파트너가 같이 확인',
        adaptation: '약 이름, 시간, 준비물을 함께 확인합니다.',
      },
      nowStack: [
        { id: 'time', label: '다음 주사', value: '20분 후', meta: '고날에프', tone: 'coral' },
        { id: 'storage', label: '보관', value: '냉장', meta: '2–8℃', tone: 'sage' },
        { id: 'site', label: '부위', value: '아랫배', meta: '좌우 교대', tone: 'lavender' },
      ],
      checklist: [
        { id: 'wash', label: '손 씻기', meta: '주사 전' },
        { id: 'pen', label: '펜 용량 확인', meta: '카드와 대조' },
        { id: 'needle', label: '바늘·솜 준비', meta: '폐기통 포함' },
        { id: 'done', label: '완료 체크', meta: '파트너와 같이' },
      ],
      timeline: [
        { id: 't1', label: '20:40', value: '준비 시작' },
        { id: 't2', label: '21:00', value: '고날에프' },
        { id: 't3', label: '22:00', value: '오비트렐' },
      ],
      quickTools: [
        { id: 'timer', label: '타이머', value: '20분' },
        { id: 'partner', label: '파트너 공유', value: '켜짐' },
        { id: 'log', label: '기록', value: '대기' },
        { id: 'onboarding', label: '온보딩', value: '완료' },
      ],
    },
    coreTools: [
      { id: 'schedule', label: '일정 변경', value: '가능' },
      { id: 'alert', label: '중요 알림', value: '켜짐' },
      { id: 'done', label: '완료 체크', value: '대기' },
      { id: 'couple', label: '부부 연결', value: '공유중' },
    ],
    partner: {
      role: '확인자',
      status: '주사 20분 전',
      sharedContext: [
        { id: 'med', label: '약', value: '고날에프' },
        { id: 'time', label: '시간', value: '21:00' },
        { id: 'prep', label: '준비물', value: '솜·바늘·폐기통' },
      ],
      actions: [
        { id: 'space', label: '공간 준비' },
        { id: 'match', label: '약 이름·시간 대조' },
        { id: 'after', label: '완료 후 정리' },
      ],
      avoid: [
        { id: 'ask-late', label: '마지막 순간 질문' },
        { id: 'rush', label: '재촉' },
      ],
      quickTools: [
        { id: 'confirm', label: '확인 완료', value: '보내기' },
        { id: 'quiet', label: '말투', value: '차분히' },
      ],
    },
  },
  clinic: {
    care: 'clinic',
    label: '병원 가는 날',
    shortLabel: '병원',
    accent: 'sage',
    patient: {
      stage: '3/4',
      phase: '방문·검사',
      progress: 64,
      headline: '09:00 방문 준비',
      primaryAction: '방문 체크리스트',
      inputMoment: {
        prompt: '오늘 일정',
        answer: '오늘 병원 다녀오기',
        adaptation: '방문 시간과 다음 일정 기록을 함께 챙깁니다.',
      },
      nowStack: [
        { id: 'visit', label: '예약', value: '09:00', meta: '채혈·초음파', tone: 'sage' },
        { id: 'leave', label: '출발', value: '08:10', meta: '45분 이동', tone: 'lavender' },
        { id: 'question', label: '질문', value: '2개', meta: '메모 대기', tone: 'neutral' },
      ],
      checklist: [
        { id: 'card', label: '신분증·카드' },
        { id: 'result', label: '지난 결과지' },
        { id: 'memo', label: '질문 메모' },
        { id: 'next', label: '다음 방문일 기록' },
      ],
      timeline: [
        { id: 'c1', label: '08:10', value: '출발' },
        { id: 'c2', label: '09:00', value: '채혈' },
        { id: 'c3', label: '09:30', value: '초음파' },
      ],
      quickTools: [
        { id: 'route', label: '동선', value: '보기' },
        { id: 'memo', label: '질문', value: '2개' },
        { id: 'share', label: '결과 공유', value: '대기' },
        { id: 'onboarding', label: '온보딩', value: '완료' },
      ],
    },
    coreTools: [
      { id: 'schedule', label: '일정 변경', value: '방문' },
      { id: 'alert', label: '중요 알림', value: '출발' },
      { id: 'done', label: '완료 체크', value: '검사' },
      { id: 'couple', label: '부부 연결', value: '공유중' },
    ],
    partner: {
      role: '동행자',
      status: '출발 70분 전',
      sharedContext: [
        { id: 'visit', label: '방문', value: '09:00' },
        { id: 'tests', label: '검사', value: '채혈·초음파' },
        { id: 'note', label: '기록', value: '다음 일정' },
      ],
      actions: [
        { id: 'route', label: '이동 시간 확인' },
        { id: 'listen', label: '결과 같이 듣기' },
        { id: 'record', label: '다음 일정 기록' },
      ],
      avoid: [
        { id: 'alone', label: '혼자 기억하게 두기' },
        { id: 'judge', label: '바로 판단하기' },
      ],
      quickTools: [
        { id: 'ride', label: '동행', value: '확인' },
        { id: 'note', label: '공유 메모', value: '열기' },
      ],
    },
  },
  waiting: {
    care: 'waiting',
    label: '기다리는 날',
    shortLabel: '대기',
    accent: 'lavender',
    patient: {
      stage: '4/4',
      phase: '결과 대기',
      progress: 88,
      headline: '조용한 확인 모드',
      primaryAction: '차분한 체크인',
      inputMoment: {
        prompt: '오늘 상태',
        answer: '기다리는 중이라 알림을 줄이고 싶어요',
        adaptation: '다음 일정과 컨디션 확인만 남깁니다.',
      },
      nowStack: [
        { id: 'next', label: '다음 일정', value: '목요일', meta: '09:00', tone: 'sage' },
        { id: 'notify', label: '알림', value: '낮음', meta: '필수만', tone: 'lavender' },
        { id: 'today', label: '오늘 할 일', value: '1개', meta: '가볍게', tone: 'neutral' },
      ],
      checklist: [
        { id: 'body', label: '몸 상태 한 줄' },
        { id: 'water', label: '물 마시기' },
        { id: 'walk', label: '가벼운 산책' },
        { id: 'stop', label: '검색 멈추기' },
      ],
      timeline: [
        { id: 'w1', label: '오늘', value: '저자극' },
        { id: 'w2', label: '목', value: '병원 확인' },
        { id: 'w3', label: '이후', value: '결과 대기' },
      ],
      quickTools: [
        { id: 'calm', label: '조용 모드', value: '켜짐' },
        { id: 'share', label: '감정 공유', value: '선택' },
        { id: 'next', label: '다음 일정', value: '고정' },
        { id: 'onboarding', label: '온보딩', value: '완료' },
      ],
    },
    coreTools: [
      { id: 'schedule', label: '일정 변경', value: '다음' },
      { id: 'alert', label: '중요 알림', value: '낮음' },
      { id: 'done', label: '완료 체크', value: '가볍게' },
      { id: 'couple', label: '부부 연결', value: '공유중' },
    ],
    partner: {
      role: '곁에 있는 사람',
      status: '필수 알림만',
      sharedContext: [
        { id: 'next', label: '다음 일정', value: '목요일 09:00' },
        { id: 'mode', label: '모드', value: '조용히' },
        { id: 'ask', label: '결과 묻기', value: '멈추기' },
      ],
      actions: [
        { id: 'quiet', label: '결과 묻지 않기' },
        { id: 'meal', label: '부담 없는 식사 제안' },
        { id: 'next', label: '다음 일정만 확인' },
      ],
      avoid: [
        { id: 'search', label: '사례 공유하기' },
        { id: 'repeat', label: '괜찮을 거야 반복' },
      ],
      quickTools: [
        { id: 'presence', label: '곁에 있음', value: '전달' },
        { id: 'quiet', label: '조용 모드', value: '유지' },
      ],
    },
  },
};

export const DEMO_ORDER: PresentationCareParam[] = ['injection', 'clinic', 'waiting'];
