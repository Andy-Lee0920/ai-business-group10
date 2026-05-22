# ADR 0021 — Daily Brief: closed-beta LLM exploration, production deterministic destination

## Status

Accepted — 2026-05-21

## Context

2026-05-20 closed-beta 사용자 피드백 두 가지가 동시에 들어왔다.

1. Closed-beta interview 응답 (실제 IVF 경험자): 자발적 다운로드 동기 부재. 투약 알림은 일반 건강앱으로 대체 가능. 시험관 특화된 약·부작용 설명, 동료 사용자 커뮤니티, 임신 추적 앱의 일일 콘텐츠 형식 (예: "오늘의 편지") 류 멘탈케어 메커니즘이 retention 의 핵심 요인.
2. 평가 기준 self-review (Claude scoring): So What 2/5 — 사용자가 *반복적으로 돌아온다는 증거 부재*가 가장 큰 약점.

기존 `CONTEXT.md` 와 `mvp-target.md` 는 Fevio 를 "care-operation support webapp" 으로 정의했고 `fevio-product-north-star.md` 는 "폰 안 화면은 utility-only, 장문 설명 금지" 를 명시했다. 이 정의 자체가 retention hook 을 설계 단계에서 거부하고 있었다 — operation = 건강앱 대체, 매일 들어올 동기 없음.

Daily Brief 는 이 retention gap 을 메우기 위한 새 surface 이다. 단 IVF 는 의료 도메인이라 hallucination·임의 medical 권고가 절대 안 된다. 그래서 brief 의 content engine 과 fact ground truth, access model, cadence, 그리고 가장 중요한 *exploration 의도* 를 한 번에 박는다.

## Decision

Daily Brief 는 admin-keyed LLM 으로 생성되며, 의료 fact 는 deterministic guardrail dict 에서 주입된다. closed beta 기간 동안 LLM 사용의 1차 목적은 사용자에게 잘 통하는 phrase·톤·정보 묶음 패턴을 *관찰* 하는 것이다. 누적된 사례 중 의료 검수를 통과한 패턴은 production 에서 deterministic template pool 로 이관되며, 그 시점부터 brief 는 LLM 없이도 동작한다.

핵심 5축:

1. **Engine**: LLM 생성 + deterministic fact guardrail dict (운영팀 큐레이션).
2. **Access**: admin-keyed (운영팀 OpenRouter 키). BYOK 정책은 OCR 에만 적용, brief 에는 적용하지 않는다.
3. **Fact ground truth**: KSRM / ASRM 공개 가이드라인 (stage fact) + 식약처 e-제약 공개 API (약·부작용 fact). 의료 자문 영입 안 함.
4. **Cadence**: 매일 1회 (자정 또는 사용자 첫 접속) + CycleEvent (ADR 0011) 의 critical event (`trigger_scheduled`, `retrieval_scheduled`, `embryo_transfer_done`, `beta_test_recorded` 등) 발생 시 추가 트리거.
5. **Intent**: LLM = closed-beta exploration tool, deterministic template pool = production destination. ADR 가 직접 production goal 을 약속한다.

## Rules

1. **Brief input contract**: LLM 은 다음 input 만 받는다.
   - `confirmedPhase` (ADR 0011)
   - `phaseCareDay` (ADR 0008)
   - `dayIndexInPhase` (deterministic 계산)
   - `factDict[phase]` (guardrail dict 의 해당 phase slice)
   - 최근 24h 안의 critical CycleEvent type (값만, raw note 없음)
   Brief 는 `couple_journal_entries`, raw clinic memo, partner identity 를 절대 받지 않는다.

2. **Output constraint**: brief 는 진단·용량·예후·치료 권고·성공률 예측·약 변경 권고를 출력할 수 없다. LLM system prompt 에 negation list 명시 + 출력 후 keyword filter 로 reject.

3. **Hallucination guard**: 의료 fact (약 이름·부작용·timing·해부학) 는 `factDict` 범위 안에서만 인용. dict 밖 fact 는 출력 금지. LLM 이 어긴 출력은 reject 후 deterministic dict raw text fallback 으로 대체.

4. **Fallback**: LLM 실패 / 타임아웃 / guard reject 시 `factDict[phase]` 의 raw text 가 brief 자리에 표시된다. brief surface 자체가 사라지지 않는다. 이로써 `CONTEXT.md` "Manual P0 must work without LLM" invariant 가 brief 에도 충족된다 (LLM 없을 때 deterministic dict 가 P0 보장).

5. **Sample collection**: 매 brief 생성 시 (input, factDict slice, LLM output, user dwell time, user reflection turn 발화 여부) 를 admin-only 테이블 `brief_samples` 에 저장. closed beta 종료 시 운영팀이 좋은 패턴을 골라 deterministic template pool 로 승급.

6. **Production transition contract**: deterministic template pool 이 IVF 7 phase × `phaseCareDay` 4 모드 = 28 격자 이상 채워지면 LLM 의존을 점진 off. 본 ADR 은 production 단계에서 LLM 의존을 *영구화하지 않는다*.

7. **Cost gate**: 운영팀은 OpenRouter monthly cap (closed beta: $50/월) 설정. cap 초과 시 brief 는 fallback 모드로 자동 전환.

8. **Cadence guards**: 같은 사용자에게 같은 cycle event 로 12시간 안 두 번 fresh brief 생성 금지 (duplicate trigger 방어). 매일 1회 fresh brief 외에는 cache.

## Consequences

### Easier

- So What 2/5 약점에 retention 메커니즘 제공.
- 사용자 피드백의 "시험관 특화 콘텐츠 / 멘탈케어" 요구를 의료 안전성 위에서 수용.
- 운영팀 큐레이션 + LLM exploration 패턴이 합쳐서 의사 자문 없이도 의료 fact 신뢰성 확보.
- Production destination 이 deterministic 이라 의료 책임·재현성·QA 가능성이 산업 표준 궤도.

### Harder

- 운영팀 콘텐츠 큐레이션 책임 신규 발생 (KSRM / ASRM / 식약처 정리).
- `brief_samples` 운영 테이블 + admin UI 필요.
- 의료 검수 게이트 정의 필요 (어떤 LLM 패턴이 template pool 로 승급하는가).
- BYOK 정책이 OCR 과 brief 에서 비대칭 — 문서·코드에 명시 필요.

### Prohibited

- BYOK 를 brief 에 강제하는 것 (retention hook 을 키 장벽 뒤에 숨김).
- LLM 이 `factDict` 밖 의료 fact 를 출력하고 그대로 surface 노출.
- Brief 를 production 단계에서도 LLM 의존으로 유지하는 것 (본 ADR 의 destination 약속 위반).
- 의료 자문 없는 운영팀 큐레이션을 "의료 권고" 로 위장.
- `couple_journal_entries` 나 raw clinic memo 를 LLM input 으로 주입.

## Follow-up criteria for revisiting

1. closed beta 종료 후 deterministic template pool 의 격자 채움률이 80% 미만이면 LLM 의존 기간 연장 검토.
2. 의료 사고 또는 식약처/KFDA 가이드 변경으로 fact ground truth 가 흔들리면 본 ADR fact source 부분 revise.
3. BYOK 정책 일반화가 사용자 요청에서 반복되면 brief BYOK 확장 검토 (단 default 는 admin-keyed 유지).
4. Monthly cost cap 이 closed beta scale 대비 일관되게 초과하면 free-tier provider 전환 후속 ADR.

## Related

- ADR 0008 — TreatmentTimeline milestone-first (`phaseCareDay` 출처)
- ADR 0009 — State-driven Generative UI (governed generation 원칙 공유)
- ADR 0011 — CycleEvent state machine (`confirmedPhase` 출처)
- ADR 0014 — Medication reference image deterministic (deterministic mapping 패턴 공유)
- ADR 0018 — MVP supersedes SLC (MVP scope 위에 작성)
- ADR 0022 — Brief × Execution priority renderer
- ADR 0023 — Partner Brief separate contract
- ADR 0025 — Brief Reflection Turn ephemeral pull pattern
- `CONTEXT.md` — Daily Brief, Brief medication context term
- `docs/01-product/mvp-target.md` — Daily Brief P0 axis 명세
