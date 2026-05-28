# Spec: Reminder Dispatch (주사·복약 이메일 리마인더)

## 목적

`user_marked_important === true`이고 `scheduled_at`이 설정된 주사·복약 카드에 대해, 30분 전 ±1분 window에 이메일 리마인더를 1회 발송한다.

## 범위

- 리마인더 발송 window 계산
- 발송 대상 후보 필터
- 이메일 본문 생성 (subject, text, html)
- KST 시간 포매팅
- Resend 기반 발송 서비스

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/reminder-dispatch.ts` | 핵심 도메인 순수 함수 |
| `src/lib/reminder-dispatch-repository.ts` | DB 후보 조회 |
| `src/lib/resend-reminder-mailer.ts` | Resend API 연동 |
| `src/services/reminder-dispatch-service.ts` | 오케스트레이션 |

---

## 발송 Window

```ts
const REMINDER_LEAD_MINUTES = 30;
const WINDOW_RADIUS_MINUTES = 1;

getReminderWindow(now):
  center = now + 30min
  window = [center - 1min, center + 1min]
```

`shouldDispatchReminder(candidate, now)`:
- `candidate.scheduledAt`이 window 내에 있으면 true.

---

## 발송 대상 조건 (`ReminderCandidate`)

```ts
type ReminderCandidate = {
  cardId: string;
  title: string;
  scheduledAt: string;
  recipientEmail: string;
};
```

리포지터리 쿼리 조건 (구현 시):
- `status = 'confirmed'`
- `user_marked_important = true`
- `card_type IN ('injection', 'medication')`
- `scheduled_at` ∈ 30분 전 window

---

## 이메일 본문

```
Subject: [Fevio] 확인할 주사 시간이 가까워졌어요
```

본문 (text):
```
Fevio에서 확인할 시간이 가까운 케어 항목을 알려드려요.

카드: {title}
시간: {KST 포맷 시간}

앱에서 확인하기: {homeUrl}

이 메일은 사용자가 확정한 카드 기준의 1회 리마인드예요.
병원 안내와 직접 확인한 내용을 기준으로 차분히 확인해 주세요.
```

---

## KST 시간 포맷

`formatKoreanTime(isoString)` → `2026. 5. 19. 오후 9:00` 형식

- `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })` 사용
- 24시간 → 오전/오후 변환
- 한국어 날짜 표기 형식

---

## 의료 안전 경계

이메일 본문은 아래를 포함해서는 안 된다:
- 용량 정보
- 치료 결과 예측
- 의료 조언 문구
- "지금 맞아야 합니다" 류의 지시

---

## Reminder Fallback 상태

카드가 `needs_recheck` 상태이면 홈에서 조용한 fallback 문구를 표시한다:

```
아직 확인 안 됐어요 · 조용히 다시 확인해 주세요.
```

조건: 카드가 `user_marked_important`, 리마인더 예정 시간이 15분 이상 경과, 아직 `completed` 아님.

→ `computeReminderFallbackState(card, now)` 및 `reminderFallbackCopy(state)` 참고.

---

## 관련 결정

- `docs/04-decisions/0004-reminder-channel.md`
- `docs/04-decisions/0006-reminder-fallback-policy.md`
- `docs/03-engineering/reminder-dispatch-sop.md`
