'use client';
import { useEffect, type CSSProperties } from 'react';
import type { SourceContext } from '../types/care-cards.types';

interface SourceEvidenceDrawerProps {
  sourceContext: SourceContext;
  itemTitle: string;
  onClose: () => void;
}

export function SourceEvidenceDrawer({ sourceContext, itemTitle, onClose }: SourceEvidenceDrawerProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const segments = segmentRawText(sourceContext.rawText, sourceContext.sourceText);
  const hasMatch = segments.some(s => s.highlighted);

  return (
    <>
      <div role="presentation" aria-hidden="true" onClick={onClose} style={backdropStyle} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="병원 안내 원문"
        style={drawerStyle}
      >
        {/* Handle */}
        <div aria-hidden="true" style={handleStyle} />

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>병원 안내 원문</p>
            <h2 style={titleStyle}>{itemTitle}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={closeButtonStyle}>✕</button>
        </div>

        {/* Trust explanation */}
        <div style={trustBannerStyle}>
          <span aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>📋</span>
          <span style={trustTextStyle}>
            {hasMatch
              ? '아래 강조된 줄에서 이 항목을 확인했어요'
              : '입력하신 병원 안내문 전문입니다'}
          </span>
        </div>

        {/* Scrollable memo content */}
        <div style={scrollAreaStyle}>
          {segments.map((seg, i) =>
            seg.highlighted ? (
              <div key={i} style={highlightedSegmentStyle}>
                <div style={highlightedBarStyle} aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <p style={highlightedTextStyle}>{seg.text}</p>
                  <span style={highlightTagStyle}>이 줄에서 확인됨</span>
                </div>
              </div>
            ) : (
              <p key={i} style={seg.text.trim() === '' ? emptyLineStyle : normalLineStyle}>
                {seg.text || ' '}
              </p>
            )
          )}
        </div>

        {/* Disclaimer */}
        <p style={disclaimerStyle}>
          병원 안내문을 기준으로 직접 확인하세요. AI 추론은 참고용입니다.
        </p>
      </div>
    </>
  );
}

/**
 * Splits raw memo text into lines and finds the line that best matches
 * the card's source_text (which has been normalized by line-split.ts).
 * Returns each line with a highlighted flag.
 */
function segmentRawText(
  rawText: string,
  sourceText: string,
): Array<{ text: string; highlighted: boolean }> {
  const lines = rawText.split('\n');
  if (lines.length === 0) return [{ text: rawText, highlighted: false }];

  const sourceWords = sourceText
    .toLowerCase()
    .replace(/[-•*·]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (sourceWords.length === 0) return lines.map(text => ({ text, highlighted: false }));

  let bestIdx = -1;
  let bestScore = 0;

  lines.forEach((line, i) => {
    const norm = line.toLowerCase();
    const score = sourceWords.filter(w => norm.includes(w)).length / sourceWords.length;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });

  return lines.map((text, i) => ({
    text,
    highlighted: i === bestIdx && bestScore >= 0.35,
  }));
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(40, 28, 22, 0.42)',
  zIndex: 200,
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
};

const drawerStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 201,
  maxHeight: '82dvh',
  display: 'flex',
  flexDirection: 'column',
  background: '#FFFAF6',
  borderRadius: '28px 28px 0 0',
  borderTop: '1px solid rgba(219, 202, 190, 0.6)',
  boxShadow: '0 -12px 48px rgba(75, 52, 42, 0.16)',
  overflow: 'hidden',
};

const handleStyle: CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 999,
  background: 'rgba(186, 168, 156, 0.56)',
  margin: '14px auto 0',
  flexShrink: 0,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '16px 20px 12px',
  flexShrink: 0,
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 900,
  color: '#9B8E86',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 18,
  fontWeight: 900,
  color: '#2E1F18',
  letterSpacing: '-0.03em',
  lineHeight: 1.25,
  wordBreak: 'keep-all',
};

const closeButtonStyle: CSSProperties = {
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 999,
  border: '1px solid rgba(219, 202, 190, 0.6)',
  background: 'rgba(255, 255, 255, 0.72)',
  color: '#786B63',
  fontSize: 14,
  fontWeight: 900,
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const trustBannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  margin: '0 20px 12px',
  padding: '10px 14px',
  borderRadius: 14,
  background: 'rgba(90, 139, 114, 0.09)',
  border: '1px solid rgba(90, 139, 114, 0.18)',
  flexShrink: 0,
};

const trustTextStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#3D6B55',
  lineHeight: 1.4,
  wordBreak: 'keep-all',
};

const scrollAreaStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 20px 8px',
  WebkitOverflowScrolling: 'touch',
};

const normalLineStyle: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 15,
  fontWeight: 500,
  color: '#4A3D36',
  lineHeight: 1.65,
  wordBreak: 'keep-all',
};

const emptyLineStyle: CSSProperties = {
  margin: 0,
  height: 10,
};

const highlightedSegmentStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  margin: '6px 0 10px',
  padding: '12px 14px',
  borderRadius: 16,
  background: 'rgba(90, 139, 114, 0.10)',
  border: '1px solid rgba(90, 139, 114, 0.22)',
};

const highlightedBarStyle: CSSProperties = {
  width: 3,
  borderRadius: 999,
  background: '#5A8B72',
  flexShrink: 0,
  alignSelf: 'stretch',
  minHeight: 36,
};

const highlightedTextStyle: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 15,
  fontWeight: 700,
  color: '#1E3D2C',
  lineHeight: 1.6,
  wordBreak: 'keep-all',
};

const highlightTagStyle: CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 999,
  background: '#5A8B72',
  color: '#fff',
  fontSize: 11,
  fontWeight: 800,
};

const disclaimerStyle: CSSProperties = {
  margin: 0,
  padding: '12px 20px 28px',
  fontSize: 11,
  fontWeight: 700,
  color: '#B5A89E',
  lineHeight: 1.5,
  borderTop: '1px solid rgba(219, 202, 190, 0.4)',
  flexShrink: 0,
  wordBreak: 'keep-all',
};
