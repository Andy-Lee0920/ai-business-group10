Fevio Interview Screen Spec
목적
Fevio 인터뷰 화면은 IVF 치료 과정에서 사용자가 겪는 일정 관리, 병원 지시 이해, 파트너 공유 니즈를 간단히 파악하는 설문형 화면이다.
이 화면은 의료 판단, 진단, 용량 추천을 하지 않는다.  
사용자의 응답은 제품 이해와 온보딩 개선을 위한 참고 정보로만 사용한다.

---

Route

```txt
/survey
```

---

User Flow

```txt
Landing
→ /survey
→ Intro
→ Question Steps
→ Summary
→ Complete
→ Demo or Sign-in
```

---

MVP Screens

1. Intro
   Title

```txt
Fevio 인터뷰
```

Description

```txt
몇 가지 질문으로 IVF 치료 중 어떤 케어 운영이 가장 필요한지 알아볼게요.
Fevio는 의료 판단을 하지 않고, 병원 안내를 실행 가능한 일정으로 정리하는 데 집중합니다.
```

CTA

```txt
시작하기
```

---

2. Role
   Question

```txt
Fevio를 어떤 입장에서 보고 계신가요?
```

Options

```txt
IVF 치료 중인 환자
IVF 치료를 준비 중인 사람
파트너 / 배우자
가족 / 보호자
서비스 검토자
기타
```

---

3. IVF Stage
   Question

```txt
현재 가장 가까운 단계는 어디인가요?
```

Options

```txt
사전 검사
배란 유도
난자 채취
수정 준비
배아 배양
배아 이식
임신 확인
아직 잘 모르겠어요
해당 없음
```

---

4. Main Difficulty
   Question

```txt
치료 일정에서 가장 부담되는 부분은 무엇인가요?
```

Options

```txt
주사 시간을 놓칠까 봐 걱정됨
약 이름과 용량을 헷갈림
내원 일정이 자주 바뀜
병원 설명을 다시 확인하기 어려움
파트너에게 무엇을 부탁해야 할지 모르겠음
기록은 남기지만 나중에 찾기 어려움
```

Rule

```txt
최대 2개 선택
```

---

5. Partner Sharing
   Question

```txt
파트너에게 어떤 정보까지 공유되면 좋을까요?
```

Options

```txt
오늘 도와줄 행동만
내원 / 주사 / 약 일정
감정적 지원이 필요한 타이밍
전체 치료 흐름
아직 공유하고 싶지 않음
```

---

6. Free Text
   Question

```txt
IVF 치료 중 앱이 도와줬으면 좋겠다고 느낀 순간이 있었나요?
```

Placeholder

```txt
예: 병원에서 설명을 듣고 나왔는데, 집에 오면 몇 시에 뭘 해야 하는지 다시 헷갈렸어요.
```

Rule

```txt
선택 입력
최대 500자
```

---

7. Summary
   Title

```txt
이렇게 이해했어요
```

Content Example

```txt
현재 단계: 배란 유도
가장 큰 부담: 주사 시간을 놓치지 않는 것
공유 선호: 오늘 도와줄 행동 중심
```

CTA

```txt
제출하기
```

Secondary CTA

```txt
수정하기
```

---

8. Complete
   Title

```txt
응답이 저장되었습니다
```

Description

```txt
Fevio가 어떤 케어 운영을 도와야 하는지 이해하는 데 도움이 됩니다.
```

CTA

```txt
듀얼뷰 데모 보기
```

Link

```txt
/demo
```

---

Data Shape

```ts
export type InterviewSubmission = {
  role: string | null;
  ivfStage: string | null;
  mainDifficulties: string[];
  partnerSharingPreference: string | null;
  freeText?: string;
  submittedAt?: string;
};
```

---

Optional API

```http
POST /api/survey/interview
```

Request

```ts
{
  role: string | null;
  ivfStage: string | null;
  mainDifficulties: string[];
  partnerSharingPreference: string | null;
  freeText?: string;
}
```

Response

```ts
{
  ok: true,
  interviewId: string
}
```

---

UI Rules
모바일 우선
한 화면에 질문 하나
선택지는 카드 버튼 형태
뒤로 가기 가능
민감한 질문은 건너뛰기 가능
의료 판단처럼 보이는 문구 금지
결과를 확정적으로 말하지 않기
파트너 공유는 사용자가 직접 선택하게 하기

---

Recommended Files

```txt
app/survey/page.tsx
app/survey/interview-shell.tsx
app/survey/interview-question-card.tsx
app/survey/interview-summary.tsx
app/survey/interview-complete.tsx
```

---

Acceptance Criteria

```txt
- /survey 접속 시 인터뷰 시작 화면이 표시된다.
- 사용자는 질문에 답하고 다음 단계로 이동할 수 있다.
- 뒤로 가기 시 이전 선택값이 유지된다.
- 마지막 단계에서 응답 요약을 볼 수 있다.
- 제출 후 완료 화면이 표시된다.
- 완료 화면에서 /demo로 이동할 수 있다.
- 의료 판단, 진단, 용량 추천 문구가 노출되지 않는다.
```
