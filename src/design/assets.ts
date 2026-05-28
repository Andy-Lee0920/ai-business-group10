export const fevioAssets = {
  icons: {
    actionTimer: {
      path: '/assets/fevio/action-timer.svg',
      label: '시간 확인',
      role: '주사·약처럼 시간이 중요한 케어 항목',
      tone: 'coral',
    },
    careHandoff: {
      path: '/assets/fevio/care-handoff.svg',
      label: '역할 전달',
      role: '환자 카드가 파트너 역할로 번역되는 순간',
      tone: 'lavender',
    },
    clinicNote: {
      path: '/assets/fevio/clinic-note.svg',
      label: '병원 메모 초안',
      role: '병원 안내문을 확정 전 초안으로 나누는 입력',
      tone: 'sage',
    },
    quietEmpathy: {
      path: '/assets/fevio/quiet-empathy.svg',
      label: '조용한 공감',
      role: '비공개 기본 감정 기록과 선택 공유',
      tone: 'lavender',
    },
    ivfCycle: {
      path: '/assets/fevio/ivf-cycle.svg',
      label: 'IVF 회차 기록',
      role: '시술 회차와 결과를 해석 없이 보관하는 기록',
      tone: 'sage',
    },
  },
  logo: {
    path: '/logo.svg',
    label: 'Fevio wordmark',
    role: '앱 식별과 OG/아이콘 시스템의 기준 로고',
  },
} as const;

export type FevioIconAssetName = keyof typeof fevioAssets.icons;

export function getFevioIconAsset(name: FevioIconAssetName) {
  return fevioAssets.icons[name];
}
