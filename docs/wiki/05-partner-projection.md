# 파트너 화면이 projection이어야 하는 이유

> "파트너 화면은 환자 화면의 복사본이 아니다."
> — fevio-product-north-star.md §8

## 핵심 선언

> "같은 치료 상태라도 두 사람이 봐야 하는 화면은 달라야 한다."
> "환자에게는 기록·확인·입력·공유 제어, 파트너에게는 준비·동행·관찰·다음 행동 확인."
> — fevio-product-north-star.md

이것은 단순한 UI 차별화가 아니다. 두 사람의 **역할과 필요가 근본적으로 다르기** 때문이다.

## 환자 vs 파트너의 역할 차이

| 환자 (Primary User) | 파트너 |
|---|---|
| 치료 상태를 기록·통제한다 | 같은 상태를 바탕으로 도울 수 있는 행동을 본다 |
| 병원 메모를 입력·확인·저장 | 오늘 자신이 도울 일만 확인 |
| 민감 정보 공유 범위 결정 | 공유된 범위 내 내용만 접근 |
| 전체 치료 맥락 접근 | 파트너용 필터링된 정보만 |

## Projection의 수식

```text
Partner View = f(
  Shared Care State,
  Sharing Level,
  Permission,
  Patient Action,
  Partner Role
)
```

코드 예시:
```ts
function getVisiblePartnerCards({ scenario, state }) {
  return scenario.partner.utilityCards.filter((card) => {
    if (card.requiresSharingLevel === "emotional") {
      return state.sharingLevel === "emotional";
    }
    if (card.requiresSharingLevel === "care") {
      return state.sharingLevel === "care" || state.sharingLevel === "emotional";
    }
    return true;
  });
}
```

파트너는 **환자가 허용한 범위**만 본다. 기본값은 `basic`, 옵트인으로 `care`, `emotional`.

## 파트너 화면에서 숨겨야 하는 것

| 숨겨야 할 것 | 이유 |
|---|---|
| raw visit input (병원 메모 원문) | 환자의 사적 기록 |
| 감정 기록 | 민감 정보 |
| 치료 전체 히스토리 | 환자의 동의 없이 공유 불가 |
| non-partner-visible cards | 환자가 파트너에게 공유하지 않은 것 |
| 약 이름·용량·부작용 (Partner Brief) | 의료 detail 노출 금지 |
| hCG 수치 (공유 범위가 "다음 일정만"인 경우) | 환자 결정 사항 |

## 파트너 화면에서 보여야 하는 것

```text
partner-visible CareActionCard:
  - title
  - scheduled_at
  - action_type
  - changed/revoked/superseded 상태
  - acknowledgement 버튼 (확인했어요 / 민지에게 물어볼게요)
```

## Partner Brief: 완전히 별개의 콘텐츠

Partner Brief는 Primary Brief를 sanitize한 버전이 아니다. **완전히 별개의 LLM call**이다. (ADR 0023)

이유: "sanitize 실수 표면 자체를 없앤다" — 분리된 LLM call이 primary 민감 자료의 누출 경로를 차단한다.

### Partner Brief 형식
```text
momentLine: 정서적 한 줄 (감정 톤 + partner 입장 인식)
helpAction: 오늘 도울 한 가지 (구체 행동 1개)
```

### Partner Brief 입력 (허용)
- `confirmedPhase`, `phaseCareDay`, `urgencyTier`
- `helpActionCatalog[phase]` (운영팀 큐레이션)
- `last_seen_at` (정서 톤 조정용)

### Partner Brief 입력 (금지)
- 약 이름·용량·부작용·시간
- 진단·예후·성공률
- Primary의 감정 발화
- raw clinic memo
- raw CycleEvent

### PartnerSurfaceSignal

파트너 화면에 전달되는 모든 신호는 이 타입을 통과해야 한다.

```ts
interface PartnerSurfaceSignal {
  urgencyTier: 'critical' | 'elevated' | 'routine' | 'quiet';
  intensity: number;
  phase: 'injection' | 'clinic' | 'waiting' | 'routine';
  momentCopy: string;
}
```

이 타입에 포함되지 않는 것: `overrideReason`, `proximityDays`, milestone 이름, 약 이름, raw clinic text, 예후, private notes.

## 기술적 구현: Server-filtered Live Projection

Partner View는 server-filtered 실시간 데이터다. Frozen snapshot이 아니다.

```text
partner raw token → 저장 안 함 (SHA-256 hash만 저장)
token validation → server-controlled code에서만
partner access → DB 직접 쿼리 불가, server endpoint만
```

파트너가 볼 수 있는 URL: `/partner/[token]`

- 7일 TTL
- explicit revocation 가능
- 만료/폐기 토큰은 안전한 상태 반환 (카드/원문 누출 없음)
- 파트너는 계정 불필요 (Google login 없음)

## 왜 copy가 아닌가: privacy-first의 구현

Stage 7에서 환자가 "다음 일정만 공유"를 선택하면, 파트너는 hCG 수치를 볼 수 없다. 파트너는 다음 검사일, 약 지속 여부, 병원 안내만 본다.

**이것이 Fevio의 privacy-first 원칙이 UI 레벨에서 구현되는 방식이다.** 환자가 공유 범위를 바꾸면 파트너 화면이 즉시 달라진다.

## 구현 파일

```
src/domain/partner-role-projection.ts  — 프로젝션 로직
app/partner/[token]/                    — 파트너 라우트
src/services/partner-view.ts            — 서버 필터링
```

---

**관련 페이지:** [02-product-identity.md](02-product-identity.md) | [03-medical-boundary.md](03-medical-boundary.md) | [08-ai-llm-policy.md](08-ai-llm-policy.md) | [07-data-model.md](07-data-model.md)
