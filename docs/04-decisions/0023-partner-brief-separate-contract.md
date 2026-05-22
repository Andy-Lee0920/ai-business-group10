# ADR 0023 — Partner Brief: separate contract, not primary projection

## Status

Accepted — 2026-05-21

## Context

ADR 0021 이 Daily Brief 를 primary user 의 retention surface 로 도입했다. Partner View 가 같은 brief 를 보는가, 다른 brief 를 보는가가 정의되지 않으면 partner-link 첫 진입 흐름이 임의로 결정된다.

2026-05-20 Closed-beta interview 응답 (partner role):

- 일반 건강앱으로 투약 알림이 충분, 추가 앱 설치 마찰이 큼 → partner 동선은 minimal.
- 원래 PRD 인터뷰 B "partner 용 간결한 액션 가이드 필요" → 행동 가이드는 필요.

`fevio-product-north-star.md` L24-30: "환자에게는 기록·확인·입력·공유 제어, 파트너에게는 준비·동행·관찰·다음 행동 확인." 두 사람의 utility 가 다르다는 것이 product origin.

ADR 0009 가 이미 `PartnerSurfaceSignal` 을 정의했다:

```ts
interface PartnerSurfaceSignal {
  urgencyTier: 'critical' | 'elevated' | 'routine' | 'quiet';
  intensity: number;
  phase: 'injection' | 'clinic' | 'waiting' | 'routine';
  momentCopy: string;
}
```

`momentCopy` 가 한 줄 brief 의 단초였으나 명시적 contract 가 없었다.

## Decision

Partner View 는 Primary 의 Daily Brief 와 **완전 별개 콘텐츠** 인 Partner Brief 를 admin-keyed LLM 으로 생성한다. Primary brief 의 sanitized projection 이 아니다.

형식:

```text
Partner Brief
├── momentLine: 정서적 한 줄 (감정 톤 + partner 입장 인식)
└── helpAction: 오늘 도울 한 가지 (구체 행동 1개)
```

의료 fact, 진단, 약 이름·용량, primary 의 Brief Reflection Turn 발화, raw clinic memo, raw CycleEvent 는 입력에도 출력에도 포함되지 않는다.

## Rules

1. **분리된 LLM call**: Partner Brief 는 Primary Brief 와 별도 LLM 호출. system prompt 가 다르고 input context 가 다르다.

2. **Input contract**: Partner Brief LLM 은 다음만 받는다.
   - `confirmedPhase`
   - `phaseCareDay`
   - `urgencyTier` (`PartnerSurfaceSignal` 의 4 단계 enum)
   - `helpActionCatalog[phase]` (운영팀 큐레이션, partner 가 할 수 있는 구체 행동 목록 — 예: "약 보관 위치 확인", "병원 동행 시간 정리")
   - 본인 partner-link 의 `last_seen_at` (정서 톤 조정용, 정보 누출 아님)
   Primary 의 `dayIndexInPhase`, 약 이름, `factDict` 의료 fact, journal entry, 통증 점수, raw 한 줄 발화는 절대 입력 금지.

3. **Output constraint**:
   - 의료 fact (약 이름·부작용·용량·시간) 금지
   - 진단·예후·성공률 언급 금지
   - Primary 의 감정 발화 인용 금지
   - Partner 의 의무 / 책임 / 평가 표현 금지 ("당신이 해야 합니다" 류)
   - 길이: momentLine ≤ 2 sentence, helpAction ≤ 1 sentence + 구체 명사 + 동사

4. **No identity leak**: Primary 의 본명 / nickname 사용 금지. "오늘 본인" 같은 일반 호칭만.

5. **Cadence**: 매일 1회 + `urgencyTier` 가 `elevated` 이상으로 전환되는 CycleEvent 발생 시 추가 트리거. Primary brief 와 cadence 가 무관 (동시 갱신 강제 안 함).

6. **Visibility window**: ADR 0017 의 7-day partner share link 만료 시 Partner Brief 도 함께 만료. 만료 link 로 접근하면 expired view 표시.

7. **Sample collection**: ADR 0021 의 `brief_samples` 에 `surface='partner'` 라벨로 저장. partner sample 의 production deterministic 이관도 ADR 0021 destination 약속에 포함.

8. **Fallback**: LLM 실패 / guardrail reject 시 `helpActionCatalog[phase]` 의 가장 보편 행동 1개를 raw text 로 표시 + `momentLine` 은 운영팀 기본 카피 (phase × urgencyTier 격자).

## Consequences

### Easier

- "Same shared state. Different experience." 원칙이 brief surface 에서 구체 구현 contract 로 변환.
- Partner accountless link 동선의 friction 최소화 — 한 줄 + 행동 1개 = 30초 안 이해.
- Primary 의 sensitive emotional 자료가 partner 로 누출될 sanitize 실수 표면 자체가 없어짐 (분리된 LLM call).
- Partner role 사용자 피드백의 두 축 (minimal + 행동 가이드) 동시 충족.

### Harder

- LLM 호출 수 2배 (primary + partner 분리). 단 partner 는 cadence 가 cycle event 기반이라 평상시 호출 적음.
- `helpActionCatalog` 운영팀 큐레이션 신규 책임.
- Partner Brief 의 QA 가 별도 fixture 필요.

### Prohibited

- Primary 의 Daily Brief 를 sanitize 해서 partner 에게 표시 (정의상 sanitize 실수 위험).
- Partner Brief 안에 약 이름·용량·부작용·진단 언급.
- Partner Brief 안에 partner 의 "의무·평가·과제" 단어 사용.
- Primary 의 Brief Reflection Turn 발화나 `couple_journal_entries` 를 partner LLM 입력으로 전달.
- Partner Brief 를 push 채널로 발송 (Partner 는 read-only pull 동선; install 마찰 회피).

## Follow-up criteria for revisiting

1. Partner Brief 가 partner-link 사용자에게 retention 효과가 실제로 측정되지 않으면 (예: re-visit 이 안 나오면) helpAction 만 남기고 momentLine 제거 검토.
2. Partner 가 자기 한 줄을 입력하고 싶다는 요청이 반복되면 partner-side Brief Reflection Turn 후속 ADR.
3. Partner 가 LLM cost 의 큰 비중을 차지하면 partner brief 만 free-tier provider 로 분리.

## Related

- ADR 0009 — `PartnerSurfaceSignal` 정의 (본 ADR 의 momentLine + helpAction 가 그 contract 의 확장)
- ADR 0017 — 7-day partner share link 만료
- ADR 0019 — Couple Journal partner-link gate (Brief 와 무관; journal 만 gate)
- ADR 0021 — Daily Brief core (primary 측 contract)
- ADR 0022 — Brief × Execution priority renderer (primary home; partner home 은 별개)
- `CONTEXT.md` — Partner Brief term
