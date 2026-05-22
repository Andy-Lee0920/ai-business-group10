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
    coupleHero: asset('/assets/slc/onboarding-couple-hero.png', 388, 435, '함께 태블릿을 보는 커플 일러스트'),
    scheduleHero: asset('/assets/slc/onboarding-schedule-hero.png', 608, 672, '확인한 일정이 오늘 케어로 정리되는 일러스트'),
    patientRole: asset('/assets/slc/onboarding-couple-hero.png', 388, 435, '일정을 직접 기록하는 기록자 일러스트'),
    partnerRole: asset('/assets/slc/partner-readonly-visual.png', 483, 1086, '일정을 읽기 전용으로 확인하는 파트너 일러스트'),
  },
  home: {
    injection: decorativeAsset('/assets/slc/home-injection-bg.png', 1124, 255),
    injectionWide: decorativeAsset('/assets/home/superovulation_induction.png', 400, 480),
    clinic: decorativeAsset('/assets/slc/home-clinic-bg.png', 371, 427),
    clinicWide: decorativeAsset('/assets/home/collection_of_eggs.png', 400, 480),
    waiting: decorativeAsset('/assets/home/implantation_wait.png', 400, 500),
    empty: decorativeAsset('/assets/home/pregnancy_wait.png', 400, 500),
    missedRecovery: asset('/assets/slc/home-missed-recovery.png', 578, 526, '놓친 일정을 다시 확인하는 일러스트'),
    stageTransplantation: decorativeAsset('/assets/home/transplantation_date.png', 400, 480),
    stageFertilization: decorativeAsset('/assets/home/fertilization.png', 400, 480),
    stageTwoCell: decorativeAsset('/assets/home/two_cell.png', 400, 420),
    stageFourCell: decorativeAsset('/assets/home/four_cell.png', 400, 420),
    stageEightCell: decorativeAsset('/assets/home/eight_cell.png', 400, 420),
    stageBlastoid: decorativeAsset('/assets/home/blastoid.png', 400, 420),
    stagePregnancy: decorativeAsset('/assets/home/pregnancy.png', 400, 520),
    stageFreezeStorage: decorativeAsset('/assets/home/freeze_storage.png', 400, 420),
  },
  body: {
    abdomenFront: asset('/assets/slc/abdomen-front.png', 368, 547, '주사 위치 선택 이미지'),
  },
  empty: {
    records: asset('/assets/slc/empty-records.png', 347, 397, '기록이 없습니다'),
    medication: asset('/assets/slc/medication-entry-empty.png', 360, 540, '등록된 약 일정이 없습니다'),
    search: asset('/assets/slc/empty-search.png', 348, 399, '검색 결과가 없습니다'),
    cycle: asset('/assets/slc/empty-cycle.png', 520, 513, '아직 사이클 기록이 없습니다'),
  },
  error: {
    offline: asset('/assets/slc/offline-state.png', 524, 520, '오프라인 상태입니다'),
    syncFailed: asset('/assets/slc/sync-failed-state.png', 573, 829, '동기화에 실패했습니다'),
  },
  clinic: {
    updateBanner: decorativeAsset('/assets/slc/clinic-update-banner.png', 566, 585),
    visitClipboard: asset('/assets/slc/clinic-visit-clipboard.png', 364, 545, '병원 방문 내용을 정리하는 일러스트'),
    diff: asset('/assets/slc/clinic-update-diff.png', 347, 385, '변경된 병원 안내를 확인하는 일러스트'),
    fallback: asset('/assets/slc/manual-entry-blank.png', 558, 548, '직접 입력으로 계속 진행하는 일러스트'),
  },
  partner: {
    invite: asset('/assets/slc/partner-invite-visual.png', 483, 1086, '파트너 초대 일러스트'),
    readonly: asset('/assets/slc/partner-readonly-visual.png', 483, 1086, '파트너가 읽기 전용으로 일정을 확인하는 일러스트'),
    connectedSuccess: asset('/assets/slc/partner-connected-success.png', 815, 689, '파트너 연결 완료 일러스트'),
    syncOverview: asset('/assets/slc/partner-sync-overview.png', 689, 722, '파트너 공유 상태를 확인하는 일러스트'),
  },
} as const;
