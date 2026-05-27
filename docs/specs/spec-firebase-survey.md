# Spec: Firebase Survey Feedback Storage

## 목적

`/survey` 페이지에서 사용자가 피드백을 제출할 때 Firestore에 저장한다. Supabase와 무관한 독립 저장소로, 인증 없이 접근 가능한 피드백 수집 전용 경로이다.

## 범위

- Firebase SDK 초기화 (`lib/firebase.ts`)
- Firestore `survey_responses` 컬렉션 저장
- 제출 상태 처리 (저장 중 / 완료 / 오류)
- 환경변수 구성

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `lib/firebase.ts` | Firebase 앱 초기화, Firestore `db` export |
| `app/survey/page.tsx` | 피드백 폼 UI + Firestore 저장 |
| `.env.local` | Firebase 환경변수 (비공개, git 제외) |
| `.env.example` | 환경변수 템플릿 (공개) |

---

## `lib/firebase.ts`

```ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db = getFirestore(app);
```

`getApps().length === 0` 조건으로 Next.js HMR 환경에서 중복 초기화를 방지한다.

---

## Firestore 저장 구조

컬렉션: `survey_responses`

```ts
{
  focus: "execution" | "partner" | "input" | "trust";
  dailyReason: string;       // 매일 열 이유 (필수)
  concern: string;           // 우려 지점 (선택)
  submittedAt: Timestamp;    // serverTimestamp()
}
```

### 유효성 조건

- `focus`가 비어 있으면 저장하지 않는다.
- `dailyReason`이 빈 문자열이면 저장하지 않는다.
- 두 조건 모두 만족해야 버튼이 활성화된다.

---

## 제출 흐름

```
버튼 클릭
  → focus + dailyReason 유효성 검사
  → saving = true (버튼 비활성화, "저장 중…" 표시)
  → addDoc(collection(db, "survey_responses"), payload)
      성공 → submitted = true ("Firebase에 저장되었습니다" 표시)
      실패 → saveError 세팅 (오류 메시지 표시)
  → saving = false
```

---

## 환경변수

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `<project>.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

모두 `NEXT_PUBLIC_` 접두사를 사용한다. 피드백 폼은 클라이언트 컴포넌트(`"use client"`)이므로 서버 전용 키는 사용하지 않는다.

### 환경변수 설정 방법

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 설정 → 내 앱 → 웹 앱 추가
2. 표시된 `firebaseConfig` 값을 `.env.local`에 입력
3. Vercel 배포 시 동일한 키를 Vercel 환경변수에도 추가

---

## Firestore 보안 규칙

개발 초기:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /survey_responses/{doc} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

`create`만 허용하고 읽기/수정/삭제는 차단한다. 스팸 방지 강화가 필요하다면 요청 횟수 제한(rate limit)을 Cloud Functions로 추가한다.

---

## URL-action-result

- `/survey`에서 사용자가 `focus`와 `dailyReason`을 입력하고 "피드백 확인"을 누르면 Firestore `survey_responses` 컬렉션에 문서가 생성되고 "Firebase에 저장되었습니다"가 표시된다.
- 네트워크 오류 또는 Firestore 규칙 차단 시 "저장 중 오류가 발생했습니다. 다시 시도해 주세요."가 표시되고 재시도가 가능하다.

---

## 관련 파일

- `docs/specs/spec-care-action-cards.md` — Supabase 기반 케어 카드 저장 (별도 경로)
- `.env.example` — 전체 환경변수 템플릿
