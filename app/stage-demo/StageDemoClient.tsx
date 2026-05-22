'use client';
import { useState } from 'react';
import { StageHomeScreen, STAGE_KEYS, type StageKey } from '../../src/components/home/StageHomeScreen';

const LABELS: Record<StageKey, string> = {
  injection: '💉 주사',
  'egg-collection': '🌼 채취',
  fertilization: '💫 수정',
  'two-cell': '🌱 2세포',
  'four-cell': '🌸 4세포',
  'eight-cell': '🌺 8세포',
  blastoid: '✨ 배반포',
  transplantation: '💗 이식일',
  'implantation-wait': '🌙 착상대기',
  'pregnancy-wait': '⭐ 임신대기',
  pregnancy: '🎉 임신확인',
  'freeze-storage': '❄️ 냉동',
};

export function StageDemoClient() {
  const [stage, setStage] = useState<StageKey>('two-cell');

  return (
    <div style={wrapStyle}>
      {/* Stage picker */}
      <nav style={pickerStyle} aria-label="단계 선택">
        <p style={pickerTitleStyle}>단계 선택</p>
        <div style={pillsStyle}>
          {STAGE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={stage === key}
              onClick={() => setStage(key)}
              style={pillStyle(stage === key)}
            >
              {LABELS[key]}
            </button>
          ))}
        </div>
      </nav>

      {/* Phone frame */}
      <div style={frameOuter}>
        <div style={frameInner} aria-label={`${LABELS[stage]} 화면 미리보기`}>
          {/* Dynamic Island */}
          <div style={dynamicIslandStyle} aria-hidden />
          <div style={screenScrollStyle}>
            <StageHomeScreen stageKey={stage} />
          </div>
        </div>
      </div>
    </div>
  );
}

function pillStyle(active: boolean) {
  return {
    padding: '7px 14px',
    borderRadius: 999,
    border: active ? 'none' : '1px solid rgba(75,66,104,0.15)',
    background: active
      ? 'linear-gradient(135deg, #9B7FDB, #7B68D4)'
      : 'rgba(255,255,255,0.72)',
    color: active ? '#fff' : '#4B4268',
    fontWeight: active ? 900 : 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: active ? '0 4px 14px rgba(123,104,212,0.30)' : 'none',
    transition: 'all 180ms ease',
    whiteSpace: 'nowrap' as const,
  };
}

const wrapStyle = {
  minHeight: '100dvh',
  background: 'linear-gradient(160deg, #F4F0FF 0%, #F0EDFF 50%, #EEF2FF 100%)',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: 28,
  padding: '32px 20px 60px',
  boxSizing: 'border-box' as const,
};

const pickerStyle = {
  width: '100%',
  maxWidth: 480,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 10,
};

const pickerTitleStyle = {
  margin: 0,
  color: '#4B4268',
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  opacity: 0.6,
};

const pillsStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 8,
};

const frameOuter = {
  position: 'relative' as const,
  width: 390,
  maxWidth: '100%',
};

const frameInner = {
  width: '100%',
  borderRadius: 52,
  overflow: 'hidden',
  border: '8px solid #1A1A2E',
  boxShadow: `
    0 4px 16px rgba(26,26,46,0.10),
    0 14px 48px rgba(26,26,46,0.18),
    0 36px 96px rgba(90,70,120,0.16),
    inset 0 0 0 1px rgba(255,255,255,0.12)
  `,
  background: '#1A1A2E',
  position: 'relative' as const,
};

const dynamicIslandStyle = {
  position: 'absolute' as const,
  top: 14,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 120,
  height: 34,
  borderRadius: 99,
  background: '#0A0A16',
  zIndex: 20,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
};

const screenScrollStyle = {
  position: 'relative' as const,
  maxHeight: 820,
  overflowY: 'auto' as const,
  scrollbarWidth: 'none' as const,
};
