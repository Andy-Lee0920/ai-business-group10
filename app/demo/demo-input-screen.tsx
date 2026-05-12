'use client';

import { useState } from 'react';
import { DemoDeviceFrame } from './demo-device-frame';
import styles from './dual-panel-demo.module.css';

const PHOTO_SAMPLE_MEMO = `고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인\n남편은 주사 30분 전에 준비물 확인`;

export function DemoInputScreen({ onSubmit }: { onSubmit: (input: string) => void }) {
  const [memo, setMemo] = useState('');
  const trimmedMemo = memo.trim();

  return (
    <main className={`${styles.demoShell} ${styles.memoInputShell} ${styles.phoneFunnelShell}`} data-testid="demo-input-screen">
      <DemoDeviceFrame className={styles.singlePhoneFrame} ariaLabel="병원 안내 입력 전화 화면">
        <section className={`${styles.appScreen} ${styles.memoPhoneScreen}`} aria-labelledby="memo-input-title">
          <section className={styles.memoInputCard}>
            <p className={styles.memoInputKicker}>Fevio</p>
            <h1 id="memo-input-title">병원 안내 붙여넣기</h1>
            <p>약·방문·결과 일정만 읽어 케어 화면으로 나눕니다.</p>

            <label className={styles.memoTextareaLabel} htmlFor="clinic-memo-input">
              병원 안내 메모
            </label>
            <textarea
              id="clinic-memo-input"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder={'고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인'}
              rows={8}
            />

            <div className={styles.memoInputActions}>
              <button type="button" className={styles.photoSampleButton} onClick={() => setMemo(PHOTO_SAMPLE_MEMO)}>
                예시 넣기
              </button>
              <button type="button" className={styles.submitMemoButton} disabled={!trimmedMemo} onClick={() => onSubmit(trimmedMemo)}>
                케어 화면 만들기
              </button>
            </div>
          </section>
        </section>
      </DemoDeviceFrame>
    </main>
  );
}
