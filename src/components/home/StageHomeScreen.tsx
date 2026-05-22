import Image from 'next/image';
import type { CSSProperties } from 'react';

export type StageKey =
  | 'injection'
  | 'egg-collection'
  | 'fertilization'
  | 'two-cell'
  | 'four-cell'
  | 'eight-cell'
  | 'blastoid'
  | 'transplantation'
  | 'implantation-wait'
  | 'pregnancy-wait'
  | 'pregnancy'
  | 'freeze-storage';

export const STAGE_KEYS: StageKey[] = [
  'injection',
  'egg-collection',
  'fertilization',
  'two-cell',
  'four-cell',
  'eight-cell',
  'blastoid',
  'transplantation',
  'implantation-wait',
  'pregnancy-wait',
  'pregnancy',
  'freeze-storage',
];

interface StageConfig {
  stageName: string;
  badge: string;
  badgeEmoji: string;
  dday: string;
  ddayLabel: string;
  message: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  bgGradient: string;
  cardGradient: string;
  accentColor: string;
  accentLight: string;
  textAccent: string;
  cycleStep: number;
}

const CONFIGS: Record<StageKey, StageConfig> = {
  injection: {
    stageName: '과배란 유도',
    badge: '자가주사',
    badgeEmoji: '🌿',
    dday: 'D-5',
    ddayLabel: '채취까지',
    message: '잘 하고 있어요\n오늘도 수고했어요',
    imagePath: '/assets/home/superovulation_induction.png',
    imageWidth: 400,
    imageHeight: 480,
    bgGradient: 'linear-gradient(160deg, #F0FFF8 0%, #E2FFE8 60%, #F5FFF2 100%)',
    cardGradient: 'linear-gradient(145deg, #FAFFFE 0%, #EEFFF5 100%)',
    accentColor: '#52B788',
    accentLight: '#C8F0DC',
    textAccent: '#276942',
    cycleStep: 1,
  },
  'egg-collection': {
    stageName: '난자 채취',
    badge: '채취일',
    badgeEmoji: '🌼',
    dday: 'D-Day',
    ddayLabel: '오늘이에요',
    message: '소중하게 모인\n난자들이에요',
    imagePath: '/assets/home/collection_of_eggs.png',
    imageWidth: 400,
    imageHeight: 480,
    bgGradient: 'linear-gradient(160deg, #FFFAED 0%, #FFF3CE 60%, #FFFAED 100%)',
    cardGradient: 'linear-gradient(145deg, #FFFDF6 0%, #FFF8E1 100%)',
    accentColor: '#E4B014',
    accentLight: '#FFF0B0',
    textAccent: '#7A5900',
    cycleStep: 2,
  },
  fertilization: {
    stageName: '수정 확인',
    badge: '수정 완료',
    badgeEmoji: '💫',
    dday: 'D+1',
    ddayLabel: '수정일로부터',
    message: '만남의 기적이\n일어났어요',
    imagePath: '/assets/home/fertilization.png',
    imageWidth: 400,
    imageHeight: 480,
    bgGradient: 'linear-gradient(160deg, #FFF0F8 0%, #F0EEFF 60%, #FFF2FB 100%)',
    cardGradient: 'linear-gradient(145deg, #FFF8FC 0%, #F6F2FF 100%)',
    accentColor: '#E07BAC',
    accentLight: '#FFD6EC',
    textAccent: '#8B2263',
    cycleStep: 3,
  },
  'two-cell': {
    stageName: '2세포기',
    badge: '배양 1일째',
    badgeEmoji: '🌱',
    dday: 'D-4',
    ddayLabel: '이식까지',
    message: '두 개의 작은 기적이\n함께하고 있어요',
    imagePath: '/assets/home/two_cell.png',
    imageWidth: 400,
    imageHeight: 420,
    bgGradient: 'linear-gradient(160deg, #FFF4F0 0%, #FFE8E0 60%, #FFF5F1 100%)',
    cardGradient: 'linear-gradient(145deg, #FFFAF8 0%, #FFF1EC 100%)',
    accentColor: '#FF8C6E',
    accentLight: '#FFD8CC',
    textAccent: '#8B3A22',
    cycleStep: 4,
  },
  'four-cell': {
    stageName: '4세포기',
    badge: '배양 2일째',
    badgeEmoji: '🌸',
    dday: 'D-3',
    ddayLabel: '이식까지',
    message: '더욱 활발하게\n자라고 있어요',
    imagePath: '/assets/home/four_cell.png',
    imageWidth: 400,
    imageHeight: 420,
    bgGradient: 'linear-gradient(160deg, #FFF1F6 0%, #FFE4EF 60%, #FFF3F7 100%)',
    cardGradient: 'linear-gradient(145deg, #FFF8FB 0%, #FFECF4 100%)',
    accentColor: '#FF7FAA',
    accentLight: '#FFD4E8',
    textAccent: '#8B2248',
    cycleStep: 5,
  },
  'eight-cell': {
    stageName: '8세포기',
    badge: '배양 3일째',
    badgeEmoji: '🌺',
    dday: 'D-2',
    ddayLabel: '이식까지',
    message: '꾸준히 무럭무럭\n성장하고 있어요',
    imagePath: '/assets/home/eight_cell.png',
    imageWidth: 400,
    imageHeight: 420,
    bgGradient: 'linear-gradient(160deg, #F5F0FF 0%, #EBE2FF 60%, #F7F3FF 100%)',
    cardGradient: 'linear-gradient(145deg, #FAF8FF 0%, #F0EAFF 100%)',
    accentColor: '#9E7FDB',
    accentLight: '#E0D4FF',
    textAccent: '#5C2A8B',
    cycleStep: 6,
  },
  blastoid: {
    stageName: '배반포',
    badge: '배양 5일째',
    badgeEmoji: '✨',
    dday: 'D-1',
    ddayLabel: '이식까지',
    message: '완전한 형태로\n아름답게 성장했어요',
    imagePath: '/assets/home/blastoid.png',
    imageWidth: 400,
    imageHeight: 420,
    bgGradient: 'linear-gradient(160deg, #EFF0FF 0%, #E2DFFF 60%, #F0EEFF 100%)',
    cardGradient: 'linear-gradient(145deg, #F6F5FF 0%, #EBE8FF 100%)',
    accentColor: '#8B76D4',
    accentLight: '#D8CEFD',
    textAccent: '#4A1E8B',
    cycleStep: 7,
  },
  transplantation: {
    stageName: '이식일',
    badge: '이식 D-Day',
    badgeEmoji: '💗',
    dday: '오늘',
    ddayLabel: '이식일이에요',
    message: '소중한 생명이\n따뜻한 곳으로 돌아왔어요',
    imagePath: '/assets/home/transplantation_date.png',
    imageWidth: 400,
    imageHeight: 480,
    bgGradient: 'linear-gradient(160deg, #FFF0F6 0%, #FFE2F0 60%, #FFF4F8 100%)',
    cardGradient: 'linear-gradient(145deg, #FFF8FB 0%, #FFEEF6 100%)',
    accentColor: '#FF6B9E',
    accentLight: '#FFD0E6',
    textAccent: '#8B1A4A',
    cycleStep: 8,
  },
  'implantation-wait': {
    stageName: '착상 대기 중',
    badge: '착상 대기',
    badgeEmoji: '🌙',
    dday: 'D-7',
    ddayLabel: '검사까지',
    message: '조용히 기다려요\n따뜻한 마음으로',
    imagePath: '/assets/home/implantation_wait.png',
    imageWidth: 400,
    imageHeight: 500,
    bgGradient: 'linear-gradient(160deg, #EEE8FF 0%, #E2D8FF 60%, #F0ECFF 100%)',
    cardGradient: 'linear-gradient(145deg, #F6F2FF 0%, #EDE5FF 100%)',
    accentColor: '#8B70D4',
    accentLight: '#D8CEFF',
    textAccent: '#3A1E7A',
    cycleStep: 9,
  },
  'pregnancy-wait': {
    stageName: '임신 확인까지',
    badge: '임신 확인까지',
    badgeEmoji: '⭐',
    dday: 'D-3',
    ddayLabel: '검사까지',
    message: '두근두근\n조금만 더 기다려요',
    imagePath: '/assets/home/pregnancy_wait.png',
    imageWidth: 400,
    imageHeight: 500,
    bgGradient: 'linear-gradient(160deg, #EAEBFF 0%, #DDE0FF 60%, #EDF0FF 100%)',
    cardGradient: 'linear-gradient(145deg, #F4F5FF 0%, #E8EBFF 100%)',
    accentColor: '#7B80D4',
    accentLight: '#CDD0FF',
    textAccent: '#2E207A',
    cycleStep: 10,
  },
  pregnancy: {
    stageName: '임신 확인 💕',
    badge: '임신 확인',
    badgeEmoji: '🎉',
    dday: '함께해요',
    ddayLabel: '소중한 시작',
    message: '축하해요!\n따뜻한 시작이에요',
    imagePath: '/assets/home/pregnancy.png',
    imageWidth: 400,
    imageHeight: 520,
    bgGradient: 'linear-gradient(160deg, #FFF7ED 0%, #FFEFD6 60%, #FFF9F0 100%)',
    cardGradient: 'linear-gradient(145deg, #FFFCF6 0%, #FFF5E4 100%)',
    accentColor: '#FF9040',
    accentLight: '#FFD8AE',
    textAccent: '#7A3A00',
    cycleStep: 11,
  },
  'freeze-storage': {
    stageName: '냉동 보관 중',
    badge: '냉동 보관',
    badgeEmoji: '❄️',
    dday: '안전하게',
    ddayLabel: '보관 중이에요',
    message: '소중한 배아들이\n안전하게 잠들어 있어요',
    imagePath: '/assets/home/freeze_storage.png',
    imageWidth: 400,
    imageHeight: 420,
    bgGradient: 'linear-gradient(160deg, #EEF8FF 0%, #DCF0FF 60%, #F0F9FF 100%)',
    cardGradient: 'linear-gradient(145deg, #F6FBFF 0%, #E8F6FF 100%)',
    accentColor: '#3AAED8',
    accentLight: '#BDE8F9',
    textAccent: '#0A4A72',
    cycleStep: 12,
  },
};

function fmt(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function CycleProgress({ step, accent }: { step: number; accent: string }) {
  return (
    <div
      style={{ display: 'flex', gap: 5, alignItems: 'center' }}
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={12}
      aria-label={`전체 12단계 중 ${step}단계`}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: 'block',
            width: i === step - 1 ? 22 : 7,
            height: 7,
            borderRadius: 99,
            background: i < step ? accent : 'rgba(0,0,0,0.10)',
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

export function StageHomeScreen({ stageKey, date }: { stageKey: StageKey; date?: Date }) {
  const cfg = CONFIGS[stageKey];
  const today = date ?? new Date();

  const screen: CSSProperties = {
    width: '100%',
    minHeight: '100dvh',
    background: cfg.bgGradient,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: '56px 20px 40px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const header: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  };

  const dateText: CSSProperties = {
    margin: 0,
    color: '#9B97B2',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
    letterSpacing: '0.01em',
  };

  const mainTitle: CSSProperties = {
    margin: 0,
    color: '#4B4268',
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: '-0.05em',
    lineHeight: 1.1,
  };

  const bellBtn: CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: `1.5px solid ${cfg.accentLight}`,
    background: 'rgba(255,255,255,0.82)',
    display: 'grid',
    placeItems: 'center',
    fontSize: 18,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    flexShrink: 0,
    marginTop: 2,
  };

  const stagePill: CSSProperties = {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 16px 7px 10px',
    borderRadius: 999,
    background: cfg.accentLight,
    border: `1px solid ${cfg.accentColor}30`,
  };

  const pillEmoji: CSSProperties = {
    fontSize: 16,
    lineHeight: 1,
  };

  const pillText: CSSProperties = {
    color: cfg.textAccent,
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '-0.01em',
  };

  const card: CSSProperties = {
    position: 'relative',
    width: '100%',
    borderRadius: 32,
    background: cfg.cardGradient,
    border: '1.5px solid rgba(255,255,255,0.90)',
    boxShadow: `0 8px 32px ${cfg.accentColor}22, 0 2px 8px rgba(0,0,0,0.04)`,
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 44,
  };

  const sparkle: (top: number | string, left?: number | string, right?: number | string, size?: number) => CSSProperties =
    (top, left, right, size = 18) => ({
      position: 'absolute',
      top,
      left,
      right,
      fontSize: size,
      lineHeight: 1,
      pointerEvents: 'none',
      userSelect: 'none',
      opacity: 0.72,
    });

  const imgWrap: CSSProperties = {
    position: 'relative',
    width: '72%',
    maxWidth: 256,
    aspectRatio: `${cfg.imageWidth} / ${cfg.imageHeight}`,
  };

  const ddayBadge: CSSProperties = {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 28px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: `1.5px solid ${cfg.accentLight}`,
    boxShadow: `0 4px 18px ${cfg.accentColor}20, 0 1px 4px rgba(0,0,0,0.06)`,
    whiteSpace: 'nowrap',
  };

  const ddayNum: CSSProperties = {
    color: cfg.textAccent,
    fontSize: 24,
    fontWeight: 950,
    letterSpacing: '-0.05em',
    lineHeight: 1,
    display: 'block',
  };

  const ddayLbl: CSSProperties = {
    color: '#9B97B2',
    fontSize: 11,
    fontWeight: 800,
    marginTop: 2,
    display: 'block',
    textAlign: 'center',
  };

  const stageInfo: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  };

  const stageName: CSSProperties = {
    margin: 0,
    color: '#4B4268',
    fontSize: 22,
    fontWeight: 950,
    letterSpacing: '-0.04em',
    lineHeight: 1.15,
  };

  const cheer: CSSProperties = {
    borderRadius: 28,
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1.5px solid rgba(255,255,255,0.88)',
    boxShadow: `0 6px 24px ${cfg.accentColor}18, inset 0 1px 0 rgba(255,255,255,0.9)`,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    textAlign: 'center',
  };

  const cheerMsg: CSSProperties = {
    margin: 0,
    color: '#4B4268',
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.65,
    letterSpacing: '-0.02em',
  };

  const cheerSub: CSSProperties = {
    margin: 0,
    color: '#9B97B2',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.4,
  };

  const lines = cfg.message.split('\n');

  return (
    <div style={screen}>
      {/* Header */}
      <header style={header}>
        <div>
          <p style={dateText}>{fmt(today)}</p>
          <h1 style={mainTitle}>오늘의 배아</h1>
        </div>
        <button type="button" aria-label="알림" style={bellBtn}>
          🔔
        </button>
      </header>

      {/* Stage badge */}
      <div style={stagePill}>
        <span aria-hidden style={pillEmoji}>{cfg.badgeEmoji}</span>
        <span style={pillText}>{cfg.badge}</span>
      </div>

      {/* Illustration card */}
      <div style={card}>
        <span aria-hidden style={sparkle(18, undefined, 22, 20)}>✨</span>
        <span aria-hidden style={sparkle(22, 20, undefined, 16)}>⭐</span>
        <span aria-hidden style={sparkle('46%', undefined, 14, 14)}>💫</span>

        <div style={imgWrap}>
          <Image
            src={cfg.imagePath}
            width={cfg.imageWidth}
            height={cfg.imageHeight}
            alt=""
            aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            priority
          />
        </div>

        <div style={ddayBadge}>
          <strong style={ddayNum}>{cfg.dday}</strong>
          <span style={ddayLbl}>{cfg.ddayLabel}</span>
        </div>
      </div>

      {/* Stage name + progress */}
      <div style={stageInfo}>
        <h2 style={stageName}>{cfg.stageName}</h2>
        <CycleProgress step={cfg.cycleStep} accent={cfg.accentColor} />
      </div>

      {/* Encouragement card */}
      <div style={cheer} role="note" aria-label="응원 메시지">
        <span aria-hidden style={{ fontSize: 24, lineHeight: 1 }}>✨</span>
        <p style={cheerMsg}>
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
        <p style={cheerSub}>작은 생명이 무럭무럭 자라고 있어요</p>
        <span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>💕</span>
      </div>
    </div>
  );
}
