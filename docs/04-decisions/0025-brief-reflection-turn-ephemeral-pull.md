# ADR 0025 — Brief Reflection Turn: ephemeral pull pattern; narrow ADR 0009 reject scope

## Status

Accepted — 2026-05-21

## Context

ADR 0009 v1 scope 는 "emotionTrend active questioning" 을 영구 reject 했다. 이유는 "오늘 컨디션 어때요?" 같은 *push* prompt 가 지친 환자에게 부담이 된다는 것이었다.

2026-05-20 Closed-beta interview 응답에서, 사용자가 self-initiated 로 자기 감정을 한 줄 적고 app 이 받아주는 흐름이 retention 에 강한 효과를 만들었다는 관찰이 보고되었다.

이는 사용자가 *self-initiated* 로 입력하고 app 이 응답하는 pull 패턴이다. ADR 0009 가 reject 한 push prompt 와는 vector 가 반대다. 둘을 같은 reject 범주에 묶으면 본 retention 메커니즘 자체를 잃는다.

동시에 ADR 0015 (couple journal) 와 ADR 0019 (partner-link gate) 가 정의한 entity 들은 "둘이 보는" surface 거나 partner-link 필수다. 본 사용자 피드백의 패턴은 "혼자 적고 혼자 받는" 흐름이라 두 entity 어디에도 깔끔하게 들어가지 않는다.

## Decision

Daily Brief 안에서 사용자가 self-initiated 로 "오늘의 한 줄" CTA 를 누르면 ephemeral input → LLM reply 흐름이 작동한다. **저장하지 않는다.** 사용자 발화도 LLM 응답도 다음 페이지 이동 / 새 brief 갱신 시점에 사라진다.

ADR 0009 의 "active questioning reject" 정책은 **push prompt 에 한정** 으로 narrow 해석한다. Pull 패턴 (사용자가 self-initiate 한 후 app 이 응답) 은 본 ADR 범위에서 명시적으로 허용된다.

## Rules

1. **Self-initiated entry**: 사용자가 명시적 CTA 를 눌러야 input 이 열린다. App 이 자동으로 input 을 띄우지 않는다. Brief 안에 prompt 문구 ("오늘 어떠셨어요?", "오늘 컨디션은?") push 도 금지.

2. **No persistence**:
   - 사용자 발화는 DB 에 저장되지 않는다.
   - LLM 응답도 저장되지 않는다.
   - `couple_journal_entries`, `community_posts`, `brief_samples` 어느 테이블에도 reflection turn 내용은 들어가지 않는다.
   - 페이지 이탈 / brief refresh / 30분 idle 후 client memory 에서 폐기.

3. **Telemetry exception**: ADR 0021 의 `brief_samples` 에 발화 발생 여부 (boolean), 발화 길이 (bytes), reply 출력 후 dwell time 만 기록. **발화 내용 / 응답 내용 본문은 저장 금지**.

4. **LLM input contract**:
   - 사용자 발화 raw text (single turn)
   - `confirmedPhase`
   - `phaseCareDay`
   - 의료 fact dict 의 *empathic phrasing pool* (즉 "이 단계에서 흔히 느끼는 감정" 류 운영팀 큐레이션)
   `couple_journal_entries`, 통증 점수, 약 이름, partner identity 는 입력 금지.

5. **Output constraint**:
   - 의료 진단·조언·약 추천 금지
   - 자해 / 우울증 위험 신호 키워드 감지 시 LLM 응답 대신 "전문가 상담 안내" 정적 fallback 으로 전환 (운영팀 큐레이션 카드).
   - 길이: 2 sentence 이하.
   - 위로 톤은 절제 — "다 잘될 거에요" 같은 과잉 reassurance 금지. North Star L405 "과잉 위로 금지" 정합.

6. **Single-turn only**: 한 brief 안에서 reflection turn 은 한 번만 가능. 사용자가 추가 발화를 원하면 Records tab 의 Couple Journal 로 이동 안내 (gate 통과한 사용자만 작성 가능). 두 surface 의 역할 분리 명확.

7. **Records tab 와의 분리**: Brief Reflection Turn 은 retention surface, Couple Journal 은 기록 surface. 같은 키워드 / 같은 톤이라도 entity 가 다르다.

8. **Partner-link 무관**: ADR 0019 partner-link gate 는 적용되지 않는다 (ephemeral, partner 와 무관, 저장 없음). 따라서 partner 미연결 첫 사용자도 reflection turn 사용 가능.

## Consequences

### Easier

- 사용자 피드백이 지적한 self-initiated reflection retention 메커니즘 도입 — 저장 부담·privacy 부담 없이.
- ADR 0015 / 0019 schema 변경 불필요.
- ADR 0009 의 reject 정책이 push 와 pull 을 구별하는 더 정확한 형태로 진화 (전면 reject 가 아니라 push reject + pull allow).
- 첫 사용자 (partner-link 없는) 에게도 retention 가치 즉시 제공.

### Harder

- "ephemeral" 의 정확한 기준 (언제 폐기되는가) 을 client 구현에서 일관되게 보장해야 함.
- 자해·위험 신호 감지 로직 신규 책임 — 운영팀 fallback 카드 정의 필요.
- 발화 본문이 저장 안 되니 운영팀의 retro / pattern mining 이 제한적 (telemetry boolean / dwell time 만).

### Prohibited

- 사용자 발화 본문 / LLM reply 본문을 어떤 테이블에라도 저장.
- App 이 자동으로 reflection input 을 띄우는 push prompt 형태 (ADR 0009 reject 정책 위반).
- Reflection turn 응답이 의료 진단·약 조언을 출력.
- "다음에는 어떠셨어요?" 같은 후속 push 발화로 멀티턴 강요.
- Partner-link gate 적용 (ephemeral 이 핵심, gate 필요 없음).

## Follow-up criteria for revisiting

1. 사용자가 reflection turn 발화를 *저장하고 싶다* 는 요청이 반복되면 "기록" surface 인 Couple Journal (ADR 0015) 로 이동 안내 흐름을 우선 강화. 그래도 부족하면 self-only persistence entity 후속 ADR.
2. LLM reply quality 가 push prompt 없이도 retention pull 을 충분히 만드는지 closed beta 데이터로 검증. 만약 dwell time 이 push 패턴 대비 현저히 낮으면 본 ADR 보다는 brief 콘텐츠 자체를 개선.
3. 자해·위험 신호 fallback 이 실제 trigger 되는 빈도가 높으면 의료 자문 연계 surface 후속 ADR.

## Related

- ADR 0009 — 본 ADR 이 "active questioning reject" 정책을 push 한정으로 narrow 해석
- ADR 0015 — Couple journal (저장형 기록, reflection turn 과 명확히 분리)
- ADR 0019 — partner-link gate (본 ADR 에는 적용 안 됨)
- ADR 0021 — Daily Brief core (reflection turn 이 surface 안에 위치)
- `CONTEXT.md` — Brief Reflection Turn term
- `fevio-product-north-star.md` L405 — "과잉 위로 금지"
