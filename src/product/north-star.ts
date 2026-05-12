export const FEVIO_PRODUCT_NORTH_STAR = {
  tagline: 'Same app. Shared state. Different experience.',
  oneSentence: 'Fevio는 하나의 IVF care cycle state를 환자와 파트너의 역할에 맞는 utility interface로 변환하는 Generative UI Care OS다.',
  productionEyebrow: 'Generative UI Care OS',
  productionLead: '하나의 IVF care state를 환자와 파트너 역할에 맞는 utility interface로 변환합니다.',
  presentationEyebrow: 'State-driven IVF demo',
  presentationLead: '하나의 shared care state가 두 사람에게 다른 utility UI로 보이는 데모입니다.',
  primaryQuestion: '이 기능은 shared care state를 더 정확하게 만드는가?',
  nonNegotiables: [
    'No static fake screen.',
    'No long explanatory phone copy.',
    'No partner copy-paste view.',
    'No medical judgment.',
    'No forced sharing.',
    'No careless wording around sensitive reproductive actions.',
    'No done without Vercel-visible product surface.',
  ],
} as const;

export const IVF_CARE_CYCLE_STAGES = [
  '사전 검사',
  '배란 유도',
  '난자 채취',
  '수정 준비',
  '배아 배양',
  '배아 이식',
  '임신 확인',
] as const;
