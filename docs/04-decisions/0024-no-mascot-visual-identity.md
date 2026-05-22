# ADR 0024 — No mascot visual identity; botanical / abstract only

## Status

Accepted — 2026-05-21

## Context

2026-05-20 Closed-beta interview 응답 (실제 IVF 경험자) 핵심 중 하나는, 임신 추적 앱 류의 일일 콘텐츠와 캐릭터 그래픽이 retention 의 큰 비중을 차지한다는 관찰이었다.

벤치마크 임신 추적 앱 (아띠 / 마미톡) 은 동물·태아·캐릭터를 retention hook 의 중심에 둔다. 사용자 피드백은 그 그래픽 power 를 지적했고, 팀은 "벤치마크의 캐릭터 패턴을 모방하지 않고 Fevio 만의 visual identity 를 확립한다" 는 입장을 정리했다.

`DESIGN.md` 는 Brand personality 를 "calm, precise, warm, Korean-first, low-pressure" 로 정의했지만 mascot / character 사용 정책은 비어있었다. ADR 0014 가 medication reference image 의 deterministic mapping 을 정의하지만 brand-level character 정책은 다루지 않는다.

이 결정은 Daily Brief 의 시각 시그니처, 캘린더 hero, 빈 상태, partner projection, onboarding illustration 의 base 가 된다 — 한 번 mascot 도입하면 12 surface 에 character 가 들러붙고 되돌리기 어렵다.

## Decision

Fevio 는 mascot / character 를 도입하지 않는다. Visual identity 는 다음 카테고리로 한정한다:

1. **Botanical metaphor** — 식물, 새싹, 잎, 줄기, 씨앗. 생명 메타포가 IVF 정황과 자연스럽고 임신앱의 동물 character 와 명확히 차별.
2. **Abstract form + tone** — 부드러운 도형, 그라데이션, sage / lavender / coral 톤. ADR 0009 의 `--fevio-surface-intensity` 와 호응.
3. **Material warmth** — 손·천·종이·차 등 의료 product 의 절제된 따뜻함. 캐릭터화 없는 따뜻한 사물 일러스트.

다음은 명시적으로 금지한다:

- 동물 캐릭터 (고슴도치, 토끼, 곰 등)
- 아기 / 태아 캐릭터화
- 의인화된 medical object (눈·입 달린 주사기 등)
- mascot 으로 작동하는 일관된 character 등장
- 의료적 의인화 일러스트 (난자·정자·배아의 얼굴화)

## Rules

1. **Asset registry**: `public/assets/` 의 모든 일러스트는 `SLCIllustration` 또는 후속 botanical asset registry 를 통해서만 product UI 에 노출. raw `<img>` 직사용 금지 (DESIGN.md 기존 정책 유지).

2. **Daily Brief visual signature**: 각 IVF phase 당 1개 botanical motif (예: stimulation = 새싹 두 잎, retrieval = 작은 꽃, embryo culture = 씨앗 결정, two_week_wait = 잎의 정적 모습). 7 phase × 1 motif = 7 assets, deterministic mapping. ADR 0014 패턴 동일.

3. **빈 상태 / 캘린더 / partner projection**: 모두 본 ADR 의 카테고리 안. partner projection 도 동일 brand 일관성 유지 (separate brief 콘텐츠라도 visual identity 는 한 brand).

4. **Generated imagery**: AI 이미지 생성 결과를 product UI 에 직접 노출 금지. 운영팀이 큐레이션·정제·승인한 정적 asset 만 등록.

5. **Medication reference image** (ADR 0014): 본 ADR 과 호응 — 약 reference image 도 character 없이 sage / neutral 일러스트로. cute pill character 금지.

6. **Loading / skeleton**: 단색 skeleton 또는 botanical motif 의 정적 미니버전. 동물 character 의 animated loading 금지.

7. **마케팅 / 앱스토어 / 발표 자료**: 본 ADR 은 product UI 정책이지만 마케팅 자산도 같은 brand 일관성으로 운영 권장. 예외는 별도 marketing brief 로 합의.

## Consequences

### Easier

- 임신앱 (아띠 / 마미톡) 과 명확히 차별되는 brand identity.
- 의료 product 의 절제된 톤 유지 — "cute medical app" 이미지 회피.
- Asset 생산 비용 한정 (7 phase × 1 motif = 7 assets 으로 시작 가능).
- DESIGN.md 의 sage primary (`#6F8F6E`) / lavender / warm neutral 톤이 botanical 카테고리와 자연 정합.

### Harder

- Character 의 retention pull (사용자 피드백의 핵심 관찰) 을 다른 메커니즘 (botanical asset 의 컴포지션 완성도 + Brief 콘텐츠) 으로 메워야 함.
- Botanical asset 의 일관된 brand style guide 가 필요 — illustrator 또는 운영팀의 디자인 표준화 작업.
- "그래픽이 눈에 띈다" 효과를 character 없이 달성하려면 일러스트 quality bar 가 높음.

### Prohibited

- Fevio mascot 도입 (어떤 카테고리의 character 도 포함).
- 의료 object 의인화.
- AI 생성 character 의 product UI 노출.
- 임신앱 (아띠 / 마미톡 / Babylog 등) 의 character asset 모방 / 변형 차용.
- Marketing 자산이라는 명목으로 product UI 에 character 우회 도입.

## Follow-up criteria for revisiting

1. Closed beta 사용자 retention data 가 character 부재로 *명백히 약화* 됨이 증명되고 (botanical quality 문제 배제 후), 의료 product brand 정체성이 일관되게 유지될 수 있는 mascot 디자인이 제안되면 재검토 가능.
2. 운영팀 / 마케팅이 임신앱 시장과의 차별화 어려움을 데이터로 보고하면 brand identity strategy 차원에서 후속 ADR.

## Related

- ADR 0014 — Medication reference image deterministic
- ADR 0021 — Daily Brief (botanical visual signature 적용 surface)
- ADR 0022 — Brief × Execution priority renderer (visual transition 일관성)
- ADR 0023 — Partner Brief (visual identity 동일 brand)
- `DESIGN.md` — Brand / Visual language / Imagery
- `CONTEXT.md` — Daily Brief term
