# AI/LLM 사용 정책

> "Manual P0 must work without LLM assistance."
> — CONTEXT.md Product invariants

## 핵심 원칙: LLM은 보조 도구다

Fevio에서 LLM은 **P1 optional** 기능이다. P0 케어 루프는 LLM 없이 완전히 동작해야 한다.

이것은 기술적 제약이 아니라 의도적 설계다. LLM 의존도가 높아지면:
1. LLM 오류가 사용자의 의료 행동에 직접 영향을 줄 수 있다
2. 규제 리스크 (의료기기 분류 위험)
3. 서비스 안정성 저하 (LLM API down = 앱 사용 불가)

## LLM 사용 영역별 분류

### 영역 1: Action Split (P1 Optional BYOK)

사용자가 OpenRouter API key를 Supabase Vault에 등록한 경우에만 동작.

```text
first manual split 후 soft nudge:
"다음부터 자동 분류를 사용하고 싶다면 설정에서 OpenRouter 키를 연결할 수 있어요."
```

**LLM 출력 계약:**
```ts
type LLMSplitCandidateDraft = {
  source_text: string;
  suggested_title?: string;
  suggested_assigned_to?: AssignedTo | null;  // "suggested"만
  suggested_card_type?: CardType | null;       // "suggested"만
  confidence: "high" | "needs_confirmation";
  uncertainty_reason?: string | null;
};
// assigned_to는 null — 사용자가 채워야 함
// LLM은 CareActionCards를 직접 생성하지 않음
// LLM은 display_safety_level을 설정하지 않음
```

**Key 보안:**
```
사용자 API key → Supabase Vault 저장 (암호화)
Edge Function에서만 decrypt
client에 key 반환 금지
log에 key 기록 금지
```

### 영역 2: Daily Brief (admin-keyed, closed-beta exploration)

운영팀이 관리하는 OpenRouter key로 생성. BYOK 정책 미적용.

**의도 (ADR 0021의 핵심):** LLM은 closed-beta exploration tool이다. Production destination은 deterministic template pool이다.

```text
closed-beta:
  admin-keyed LLM 생성
  → 잘 통하는 phrase/톤/정보 묶음 패턴 관찰
  → brief_samples 테이블에 저장

production (목표):
  의료 검수 통과 패턴 → deterministic template pool 승급
  28 격자 (7 phase × 4 phaseCareDay) 채워지면 LLM 의존 off
```

**Daily Brief LLM 입력 계약:**
```
허용: confirmedPhase, phaseCareDay, dayIndexInPhase, factDict[phase], critical CycleEvent type
금지: couple_journal_entries, raw clinic memo, partner identity, 약 용량, 개인 발화
```

**Hallucination guard:**
- 의료 fact는 `factDict` 범위 안에서만 인용
- dict 밖 fact 출력 → reject → deterministic dict raw text fallback
- LLM 실패시도 Brief surface 자체는 사라지지 않음

### 영역 3: Partner Brief (별개 LLM call)

Primary Brief와 완전히 분리된 LLM call. (ADR 0023)

입력: `confirmedPhase`, `phaseCareDay`, `urgencyTier`, `helpActionCatalog[phase]`, `last_seen_at`

출력 형식:
```
momentLine: 정서적 한 줄 (≤ 2 sentences)
helpAction: 오늘 도울 한 가지 (≤ 1 sentence + 구체 명사 + 동사)
```

**분리 이유:** "sanitize 실수 표면 자체를 없앤다" — Primary의 민감 정보가 Partner LLM input에 존재하지 않으면 누출될 수가 없다.

## LLM 금지 동작 (전 영역 공통)

```
❌ 의료 판단 (진단, 용량, 예후, 성공률)
❌ assigned_to 결정 (사용자만 결정)
❌ CareActionCards 직접 생성
❌ display_safety_level 설정
❌ partner-visible 범위 결정
❌ API key를 client bundle에 포함
❌ API key를 log에 기록
❌ production에서 LLM 의존을 영구화 (Daily Brief)
```

## State-driven Generative UI와 LLM의 관계 (ADR 0009)

Fevio의 화면 구성은 LLM이 임의로 결정하지 않는다.

```text
LLM → copy template 제안 가능
LLM → component 선택 불가 (고정 slot 시스템)
LLM → layout 변경 불가
LLM → partner-visible 범위 변경 불가
LLM → 의료 fact 생성 불가 (factDict만)
```

컴포넌트 선택은 TPO specificity-first rules (config/care-surface-rules.json)가 담당한다.

누적 점수 방식을 거부한 이유: 약한 신호 두 개가 우연히 합쳐져 고긴급 surface를 생성하는 것을 막기 위해.

## emotionTrend active questioning 영구 금지

"오늘 컨디션 어때요?" 스타일의 push 질문은 v1에서 영구 금지. 이유: 지친 IVF 환자에게 추가 인지 부담을 준다.

단, Brief Reflection Turn (사용자가 자발적으로 CTA를 누르는 pull 패턴)은 허용. 저장하지 않음 (ephemeral).

---

**관련 페이지:** [03-medical-boundary.md](03-medical-boundary.md) | [04-confirmation-first.md](04-confirmation-first.md) | [05-partner-projection.md](05-partner-projection.md)
