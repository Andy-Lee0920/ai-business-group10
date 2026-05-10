# Fevio [페비오]

**병원에서 들은 말을 오늘의 부부 실행 카드로 바꾸는 IVF care operation webapp.**

Fevio [페비오]는 난임 치료 중 병원에서 들은 복잡한 지시사항을 사용자가 직접 확인한 뒤, 오늘 내가 할 일과 파트너가 도와줄 일로 나누어 보여주는 모바일 웹앱입니다.

Fevio는 의료 판단을 대신하지 않습니다. 치료 전략, 용량, 진단, 성공률을 추천하지 않고, 사용자가 병원에서 들은 내용을 안전하게 정리하고 실행하도록 돕습니다.

---

## 한눈에 보기

| 항목 | 설명 |
|---|---|
| 제품명 | Fevio [페비오] |
| 제품 형태 | Vercel Preview로 확인 가능한 responsive webapp / PWA 지향 |
| 핵심 사용자 | IVF 1–2회차 난임 치료를 받는 맞벌이 여성과 파트너 |
| 핵심 가치 | 병원 메모를 오늘 실행할 수 있는 행동 카드로 바꾸기 |
| 핵심 차별점 | Dynamic Care Context Home — 오늘 치료 상황에 따라 홈이 바뀜 |
| 기본 원칙 | 수동 확인 우선, 의료 판단 금지, 파트너에게는 필요한 행동만 공유 |

---

## Fevio가 해결하려는 문제

난임 치료에서 어려운 것은 정보가 없어서가 아닙니다. 병원에서 정보는 전달됩니다.

진짜 어려움은 그 정보를 일상에서 실행 가능한 형태로 바꾸는 일입니다.

- 오늘 몇 시에 무엇을 해야 하는지 기억해야 함
- 어떤 내용은 병원에 다시 확인해야 함
- 파트너에게 무엇을 어떻게 부탁할지 정리해야 함
- 중요한 주사/복약/방문 일정을 놓치지 않아야 함
- 치료 정보와 감정 부담이 한 사람에게 몰림

Fevio는 이 부담을 “오늘의 실행 카드”와 “파트너가 도울 행동”으로 나누는 것을 목표로 합니다.

---

## 핵심 사용자 페르소나

### 김민지, 36세

- 맞벌이 직장인
- IVF 1–2회차
- 병원 방문 후 초음파 결과, 주사 시간, 복약 일정, 다음 방문일을 한 번에 들음
- 병원을 나오면 기억, 정리, 전달, 확인을 거의 혼자 맡게 됨
- 남편/파트너가 도와주길 바라지만, 매번 의료 내용을 다시 설명하는 것도 부담스러움

### 민지가 원하는 것

- 병원에서 들은 내용을 잊기 전에 그대로 넣고 싶음
- 오늘 할 일과 파트너가 도울 일을 빠르게 나누고 싶음
- 확실하지 않은 내용은 병원에 확인할 항목으로 분리하고 싶음
- 홈 화면만 보고 오늘의 우선순위를 알고 싶음
- 파트너에게 민감정보 전체가 아니라 필요한 행동만 공유하고 싶음

### 파트너가 원하는 것

- 앱 가입 없이 링크로 오늘 도울 일을 보고 싶음
- “무엇을 도와야 하는지”만 명확히 알고 싶음
- 감시받거나 비난받는 느낌 없이 확인하고 싶음
- 변경된 내용이 있으면 부담 없이 알 수 있으면 좋음

---

## 첫 SLC 목표

첫 제품 컷은 **Simple, Lovable, Complete**입니다.

```text
Vercel Preview URL
→ Google login
→ Privacy Gate
→ onboarding home
→ 병원 메모 입력
→ Manual Line Split
→ Confirm
→ Supabase에 visit_inputs / split_candidates / care_action_cards 생성
→ Dynamic Home이 onboarding에서 clinic/injection/routine 중 하나로 전환
```

SLC는 하나의 최종 목표입니다. TDD는 이슈별 작은 검증 루프로 진행하고, PR은 가능하면 이슈별로 분리합니다.

자세한 기준: [`docs/01_product_requirements/SLC target/SLC target.md`](<docs/01_product_requirements/SLC target/SLC target.md>)

---

## 핵심 화면

1. **Privacy Gate**
   민감정보 수집, 파트너 공유, 의료 조언 아님을 명확히 동의합니다.

2. **Onboarding Home**
   첫 사용자가 병원 메모를 넣어 오늘 할 일을 정리하도록 안내합니다.

3. **Post-Visit Capture**
   병원에서 들은 내용을 그대로 붙여넣거나 입력합니다.

4. **Manual Split Review**
   줄 단위 메모를 `내 할 일`, `파트너에게 공유`, `병원에 확인`, `제외`로 나눕니다.

5. **Dynamic Home**
   확정된 카드에 따라 오늘 홈이 주사일, 병원 방문일, 대기일, 일상 관리일로 바뀝니다.

6. **Partner Action View**
   파트너가 로그인 없이 7일 링크로 오늘 도울 일만 확인합니다.

---

## 디자인 방향

Fevio는 병원 EMR처럼 차갑게 보이면 안 되고, 임신/출산 앱처럼 과하게 핑크·베이비 톤이어도 안 됩니다.

디자인 키워드:

- 따뜻한 모바일 웹앱
- 차분한 세이지/크림/라벤더 톤
- 큰 터치 영역
- 부드러운 카드
- 한국어 우선 가독성
- 파트너에게 부담 없는 공유 화면
- AI가 판단하는 느낌보다 사용자가 확인하는 느낌

디자이너 협업 문서: [`docs/03_design_guidance/designer-brief.md`](docs/03_design_guidance/designer-brief.md)

---

## 구현 순서

먼저 #32를 완료해 앱이 열리는 기반을 만듭니다.

1. [#32 준비 0 — Vercel에서 열리는 웹앱 뼈대 만들기](https://github.com/Andy-Lee0920/ai-business-group10/issues/32)
2. [#33 준비 0.1 — SLC 성공 기준을 한 문서로 고정하기](https://github.com/Andy-Lee0920/ai-business-group10/issues/33)
3. [#34 준비 0.2 — 따뜻한 모바일 화면 규칙 만들기](https://github.com/Andy-Lee0920/ai-business-group10/issues/34)
4. [#35 준비 0.3 — 커플 데이터가 섞이지 않게 DB 규칙 세우기](https://github.com/Andy-Lee0920/ai-business-group10/issues/35)
5. [#23 진입 1 — 구글 로그인 후 개인정보 동의까지 끝내기](https://github.com/Andy-Lee0920/ai-business-group10/issues/23)
6. [#25 판단 2 — 오늘 상황에 맞는 할 일 카드 규칙 만들기](https://github.com/Andy-Lee0920/ai-business-group10/issues/25)
7. [#24 기록 3 — 병원 메모를 오늘 할 일 카드로 확정하기](https://github.com/Andy-Lee0920/ai-business-group10/issues/24)
8. [#26 홈 4 — 오늘 치료 상황에 맞춰 홈 화면 바꾸기](https://github.com/Andy-Lee0920/ai-business-group10/issues/26)
9. [#27 공유 5 — 파트너에게 7일짜리 오늘 할 일 링크 보내기](https://github.com/Andy-Lee0920/ai-business-group10/issues/27)
10. [#28 선택 6 — OpenRouter 키가 있을 때만 자동 분류 돕기](https://github.com/Andy-Lee0920/ai-business-group10/issues/28) — P1 optional

---

## 주요 문서

- Documentation map: [`docs/README.md`](docs/README.md)
- Domain language: [`CONTEXT.md`](CONTEXT.md)
- Product SLC: [`docs/01_product_requirements/SLC target/SLC target.md`](<docs/01_product_requirements/SLC target/SLC target.md>)
- PRD: [`docs/01_product_requirements/fertility-support-prd-v1.0.md`](docs/01_product_requirements/fertility-support-prd-v1.0.md)
- Architecture decisions: [`docs/adr/`](docs/adr/)
- Designer brief: [`docs/03_design_guidance/designer-brief.md`](docs/03_design_guidance/designer-brief.md)
- Issue writing rules: [`docs/02_engineering/issue-writing-rules.md`](docs/02_engineering/issue-writing-rules.md)
- TDD issue map: [`docs/02_engineering/slc-tdd-issue-map.md`](docs/02_engineering/slc-tdd-issue-map.md)
- Contributor guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## Secret policy

Do not commit real secrets.

- Commit `.env.example` only.
- Keep real `.env`, `.env.local`, `.env.production`, `.vercel/`, Supabase temp files, dumps, and credentials out of git.
- Coauthors do not need raw shared secrets in the repository.
- Coauthors who need deployment/backend access should be invited to Vercel/Supabase with least privilege.
- Frontend-only contributors can use `.env.example` with a local/dev Supabase project.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-public config, but real project values should still be managed through Vercel/Supabase environment settings instead of hardcoded source constants.
