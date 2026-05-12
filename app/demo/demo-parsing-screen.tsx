'use client';

import { useEffect, type CSSProperties } from 'react';
import type { ParsedClinicMemo } from '../../src/domain/clinic-memo-parser';
import styles from './dual-panel-demo.module.css';

export function DemoParsingScreen({ parsedResult, onComplete }: { parsedResult: ParsedClinicMemo; onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className={`${styles.demoShell} ${styles.parsingShell}`} data-testid="demo-parsing-screen">
      <section className={styles.parsingCard} aria-live="polite" aria-labelledby="parsing-title">
        <p className="eyebrow">병원 안내 정리 중</p>
        <h1 id="parsing-title">한 문장이 두 개의 케어 화면으로 나뉩니다</h1>
        <p className={styles.parsingSource}>{parsedResult.sourceSummary}</p>

        <div className={styles.parsingTokenStack} aria-label="읽어낸 안내">
          {parsedResult.extractedTokens.map((token, index) => (
            <div className={styles.parsingToken} style={{ '--token-delay': `${index * 140}ms` } as CSSProperties} key={`${token.label}-${token.value}`}>
              <span>{token.label}</span>
              <strong>{token.value}</strong>
            </div>
          ))}
        </div>

        {parsedResult.fallbackReason ? <p className={styles.parsingFallback}>{parsedResult.fallbackReason}</p> : null}
        <div className={styles.parsingSilhouette} aria-hidden="true">
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
