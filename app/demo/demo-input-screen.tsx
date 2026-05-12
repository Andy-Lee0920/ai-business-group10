'use client';

import { useState } from 'react';
import styles from './dual-panel-demo.module.css';

const PHOTO_SAMPLE_MEMO = `고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인\n남편은 주사 30분 전에 준비물 확인`;

export function DemoInputScreen({ onSubmit }: { onSubmit: (input: string) => void }) {
  const [memo, setMemo] = useState('');
  const trimmedMemo = memo.trim();

  return (
    <main className={`${styles.demoShell} ${styles.memoInputShell}`} data-testid="demo-input-screen">
      <section className={styles.memoInputCard} aria-labelledby="memo-input-title">
        <p className="eyebrow">Fevio Demo</p>
        <h1 id="memo-input-title">병원 안내를 그대로 넣어주세요</h1>
        <p>약, 방문, 결과 일정이 섞여 있어도 Fevio가 실행 화면과 파트너 역할로 나눕니다.</p>

        <label className={styles.memoTextareaLabel} htmlFor="clinic-memo-input">
          병원 안내 메모
        </label>
        <textarea
          id="clinic-memo-input"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder={'예: 고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인\n남편은 주사 30분 전에 준비물 확인'}
          rows={7}
        />

        <div className={styles.memoInputActions}>
          <button type="button" className={styles.photoSampleButton} onClick={() => setMemo(PHOTO_SAMPLE_MEMO)}>
            약 봉투·메모 사진 예시로 채우기
          </button>
          <button type="button" className={styles.submitMemoButton} disabled={!trimmedMemo} onClick={() => onSubmit(trimmedMemo)}>
            Fevio에 넣기
          </button>
        </div>
        <p className={styles.photoSampleNote}>데모에서는 사진 예시가 텍스트로 채워집니다. 같은 문장이 두 역할 화면으로 나뉘는 과정을 보여줍니다.</p>
      </section>
    </main>
  );
}
