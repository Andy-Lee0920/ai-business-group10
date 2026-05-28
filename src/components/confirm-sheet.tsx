'use client';
import type { CSSProperties } from 'react';
import type { ScheduleItem, InjectionSite } from '../types/slc.types';
import { SLCIllustration } from './slc-illustration';
import { slcAssets } from '../design/slc-assets';

const ABDOMEN_PNG_SRC = '/assets/slc/abdomen-front.png';

interface ConfirmSheetProps {
  item: ScheduleItem;
  onComplete: (site?: InjectionSite) => void;
  onClose: () => void;
}

const TOUCH_ZONES: Array<{ site: InjectionSite; label: string; style: CSSProperties }> = [
  { site: 'upper_left', label: '왼쪽 위 주사 위치', style: { left: 0, top: 0 } },
  { site: 'upper_right', label: '오른쪽 위 주사 위치', style: { right: 0, top: 0 } },
  { site: 'lower_left', label: '왼쪽 아래 주사 위치', style: { left: 0, bottom: 0 } },
  { site: 'lower_right', label: '오른쪽 아래 주사 위치', style: { right: 0, bottom: 0 } },
];

export function ConfirmSheet({ item, onComplete, onClose }: ConfirmSheetProps) {
  if (item.type !== 'injection') {
    const copy = nonInjectionConfirmCopy(item.type);
    return (
      <div className="fevio-confirm-sheet-overlay" style={overlayStyle} onClick={onClose}>
        <div style={sheetStyle} onClick={(event) => event.stopPropagation()}>
          <div style={handleStyle} />
          <h3 style={sheetTitleStyle}>{item.title}</h3>
          <p style={sheetDescriptionStyle}>{copy.description}</p>
          <button type="button" onClick={() => onComplete()} style={ctaButtonStyle}>{copy.cta}</button>
          <button type="button" onClick={onClose} style={cancelButtonStyle}>취소</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fevio-confirm-sheet-overlay" style={overlayStyle} onClick={onClose}>
      <div style={{ ...sheetStyle, paddingBottom: 40 }} onClick={(event) => event.stopPropagation()}>
        <div style={handleStyle} />
        <h3 style={{ ...sheetTitleStyle, textAlign: 'center' }}>주사 위치를 선택해 주세요</h3>
        <p style={{ ...sheetDescriptionStyle, textAlign: 'center' }}>탭하면 해당 위치로 즉시 기록됩니다</p>
        <div data-asset-src={ABDOMEN_PNG_SRC} style={abdomenFrameStyle}>
          <SLCIllustration
            asset={slcAssets.body.abdomenFront}
            style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
          />
          {TOUCH_ZONES.map(({ site, label, style }) => (
            <button
              key={site}
              type="button"
              aria-label={label}
              onClick={() => onComplete(site)}
              style={{ ...touchZoneStyle, ...style }}
            />
          ))}
        </div>
        <button type="button" onClick={onClose} style={{ ...cancelButtonStyle, marginTop: 20 }}>닫기</button>
      </div>
    </div>
  );
}

function nonInjectionConfirmCopy(type: Exclude<ScheduleItem['type'], 'injection'>) {
  if (type === 'clinic') {
    return {
      description: '병원 방문을 완료했나요?',
      cta: '방문 완료',
    };
  }

  return {
    description: '복용을 완료했나요?',
    cta: '복용 완료',
  };
}

const overlayStyle: CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(42, 31, 26, 0.48)', zIndex: 100,
  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
};

const sheetStyle: CSSProperties = {
  background: '#FFFCFA', borderRadius: '28px 28px 0 0',
  width: '100%', maxWidth: 'var(--fevio-mobile-frame-max)',
  padding: '20px var(--fevio-page-gutter) calc(28px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 0,
  boxShadow: '0 -18px 50px rgba(75, 52, 42, 0.18)',
};

const handleStyle: CSSProperties = {
  width: 40, height: 4, borderRadius: 2, background: '#E0D8D4',
  margin: '0 auto 20px', flexShrink: 0,
};

const sheetTitleStyle: CSSProperties = {
  fontSize: 17, fontWeight: 800, color: 'var(--slc-text)', margin: '0 0 6px',
};

const sheetDescriptionStyle: CSSProperties = {
  fontSize: 13, color: 'var(--slc-muted)', margin: '0 0 18px', lineHeight: 1.45,
};

const abdomenFrameStyle: CSSProperties = {
  position: 'relative', width: 230, height: 230, margin: '0 auto',
};

const touchZoneStyle: CSSProperties = {
  position: 'absolute', width: '50%', height: '50%',
  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
};

const ctaButtonStyle: CSSProperties = {
  background: 'var(--slc-coral-gradient)', color: '#fff', border: 'none', borderRadius: 999,
  padding: '14px 0', fontSize: 16, fontWeight: 800, cursor: 'pointer',
  width: '100%', fontFamily: 'inherit',
};

const cancelButtonStyle: CSSProperties = {
  background: 'transparent', color: 'var(--slc-muted)', border: 'none', borderRadius: 999,
  padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  width: '100%', fontFamily: 'inherit',
};
