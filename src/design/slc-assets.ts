export type SLCAssetSize = {
  width: number;
  height: number;
};

type MeaningfulSLCAsset = SLCAssetSize & {
  src: string;
  alt: string;
  decorative?: false;
};

type DecorativeSLCAsset = SLCAssetSize & {
  src: string;
  decorative: true;
  alt?: '';
};

export type SLCAsset = MeaningfulSLCAsset | DecorativeSLCAsset;

const asset = (src: string, width: number, height: number, alt: string): SLCAsset => ({ src, width, height, alt });
const decorativeAsset = (src: string, width: number, height: number): SLCAsset => ({ src, width, height, decorative: true, alt: '' });

export const slcAssets = {
  onboarding: {
    coupleHero: asset('/assets/slc/onboarding-hero.png', 482, 1086, '오늘 일정을 함께 준비하는 Fevio 일러스트'),
    scheduleHero: decorativeAsset('/assets/slc/home-injection-bg.png', 1448, 362),
    patientRole: asset('/assets/slc/onboarding-hero.png', 482, 1086, '일정을 직접 기록하는 기록자 일러스트'),
    partnerRole: asset('/assets/slc/partner-readonly-visual.png', 483, 1086, '일정을 읽기 전용으로 확인하는 파트너 일러스트'),
  },
  home: {
    injection: decorativeAsset('/assets/slc/home-injection-bg.png', 1448, 362),
    clinic: decorativeAsset('/assets/slc/home-clinic-bg.png', 1448, 362),
    waiting: decorativeAsset('/assets/slc/home-waiting-bg.png', 1448, 362),
    missedRecovery: asset('/assets/slc/home-waiting-bg.png', 1448, 362, '놓친 일정을 다시 확인하는 일러스트'),
  },
  empty: {
    records: asset('/assets/slc/medication-empty.png', 724, 1086, '기록이 없습니다'),
    medication: asset('/assets/slc/medication-empty.png', 724, 1086, '약 일정이 없습니다'),
    search: asset('/assets/slc/medication-empty.png', 724, 1086, '검색 결과가 없습니다'),
    cycle: asset('/assets/slc/home-waiting-bg.png', 1448, 362, '아직 사이클 기록이 없습니다'),
  },
  error: {
    offline: asset('/assets/slc/home-waiting-bg.png', 1448, 362, '오프라인 상태입니다'),
    syncFailed: asset('/assets/slc/home-waiting-bg.png', 1448, 362, '동기화에 실패했습니다'),
  },
  clinic: {
    updateBanner: decorativeAsset('/assets/slc/home-clinic-bg.png', 1448, 362),
    visitClipboard: asset('/assets/slc/medication-empty.png', 724, 1086, '병원 방문 내용을 정리하는 일러스트'),
    diff: asset('/assets/slc/home-clinic-bg.png', 1448, 362, '변경된 병원 안내를 확인하는 일러스트'),
    fallback: asset('/assets/slc/home-waiting-bg.png', 1448, 362, '기본 질문으로 계속 진행하는 일러스트'),
  },
  partner: {
    invite: asset('/assets/slc/partner-invite-visual.png', 483, 1086, '파트너 초대 일러스트'),
    readonly: asset('/assets/slc/partner-readonly-visual.png', 483, 1086, '파트너가 읽기 전용으로 일정을 확인하는 일러스트'),
    connectedSuccess: asset('/assets/slc/partner-readonly-visual.png', 483, 1086, '파트너 연결 완료 일러스트'),
    syncOverview: asset('/assets/slc/partner-invite-visual.png', 483, 1086, '파트너 공유 상태를 확인하는 일러스트'),
  },
} as const;
