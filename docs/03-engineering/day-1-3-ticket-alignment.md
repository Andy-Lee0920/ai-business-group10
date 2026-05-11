# Fevio Day 1–3 작업 로그와 Ticket Alignment

**작성일:** 2026-05-11 KST  
**기준 브랜치:** `main`  
**기준 커밋:** `eb78263` — `Keep the presentation lane out of Google OAuth`  
**검토 범위:** GitHub issue open/closed 상태, 최근 merged PR, `docs/03-engineering/project-boards.md`, `docs/01-product/prd-v1.0.md`  
**개인정보 원칙:** 이 문서는 ticket 업데이트에 옮길 수 있도록 개인명·이메일·비공개 계정 식별자를 쓰지 않는다. 필요한 주체는 role/account label로만 표기한다.

---

## 0. 결론

Fevio를 단순한 “난임 치료 일정 앱”으로 만들면 약하다. 현재 PRD와 SLC Epic이 이미 말하는 강점은 다음 문장이다.

> **치료 상태가 바뀌면 Fevio의 화면, CTA, 파트너 역할, 알림 톤이 함께 바뀐다.**

Ticket 기준으로 보면 Day 1–2의 방향성은 꽤 많이 구현·문서화되었다. 그러나 Day 3 점검에서 드러난 핵심 문제도 그대로 남아 있다.

- SLC spine의 기능 ticket은 상당수 닫혔다.
- 하지만 발표자가 60초 안에 “calendar가 아니라 adaptive runtime”임을 보여주는 ticket은 아직 명확히 닫히지 않았다.
- 현재 남은 P0는 **실행 가능한 작업**과 **외부/제품 결정 블로커**가 섞여 있다.
- 따라서 project board는 “기능 영역”보다 **증명해야 할 제품 claim** 기준으로 재배열해야 한다.

---

## 1. 실제 GitHub 상태 Snapshot

`gh issue list --state all --limit 120` 기준.

| 구분 | 개수 | 해석 |
|---|---:|---|
| 전체 issue | 40 | 현재 추적 가능한 ticket pool |
| Closed | 20 | SLC scaffold와 핵심 spine 다수 완료 |
| Open | 20 | P0 blocker + P1 expansion이 동시에 열려 있음 |
| P0 Closed | 17 | SLC 기반은 많이 닫힘 |
| P0 Open | 5 | `#29`, `#39`, `#41`, `#52`, `#56` |
| P1 Open | 13 | 확장과 polish가 동시에 열려 있어 WIP 분산 위험 |

### Open P0의 실제 의미

| Issue | 상태 | 실제 분류 | 왜 active WIP가 아닌가 / 다음 판단 |
|---|---|---|---|
| `#29` SLC Epic | Open | Epic parent | child Red가 남아 있어 닫을 수 없음 |
| `#39` Vercel Root Directory | Open | External blocker | Vercel project admin role의 dashboard evidence 필요 |
| `#41` Vercel ownership/connection | Open | External blocker | deploy permission/env ownership 확인 필요 |
| `#52` Reminder Minimum | Open | Product decision + implementation | email provider/sender/scheduler가 Green인지 불명확. in-app-only 종료는 stakeholder decision 필요 |
| `#56` Manual QA checklist | Open | Release gate | 2026-05-13 KST에 실제 QA evidence 필요 |

---

## 2. Day 1–3 로그를 실제 Ticket과 매칭

### Day 1 — 제품 철학을 세운 날

| Day 1 작업 로그 | 매칭 ticket / doc | 현재 상태 | 평가 |
|---|---|---|---|
| Fevio를 care companion / IVF care operation system으로 정의 | `#29`, `docs/01-product/prd-v1.0.md` | `#29` Open | 방향은 고정됨. 단, Epic이 open인 이유는 release gate 미완료 |
| Adaptive Care Workspace / Care Day Frame | `#25`, `#26`, `#29` | `#25`, `#26` Closed | care day/card/home의 기초는 닫혔지만 “3-state runtime demo” ticket은 아직 별도로 없음 |
| Partner Action Translation | `#27`, `#53`, `#54`, `#61`, `#46` | P0는 Closed, `#46` Open | 링크·화이트리스트·회수 UI는 닫힘. 상태별 partner role은 아직 P1 expansion |
| AI draft-only / confirmation-first | `#24`, `#28`, `#51`, `#54` | `#24`, `#54` Closed; `#28`, `#51` Open | manual confirm spine은 닫힘. AI/protocol draft는 보류가 맞음 |
| private-by-default / 의료 경계 | `#23`, `#33`, `#35`, `#58`, `#50` | P0는 Closed; `#50` Open | P0 privacy gate/RLS/microcopy는 닫힘. 삭제/연결 해제 UX는 P1 |

**Day 1 판단:** 철학은 ticket에 남아 있고 SLC spine도 일부 구현됐다. 그러나 “Adaptive Fertility Runtime”이라는 이름의 demo proof issue가 없어서 구현 과정에서 단순 feature bundle로 흐를 위험이 있다.

---

### Day 2 — 구현 방향과 인프라를 잡은 날

| Day 2 작업 로그 | 매칭 ticket / PR | 현재 상태 | 평가 |
|---|---|---|---|
| Next.js/Supabase/Vercel 기반 | `#32`, `#35`, `#38` | Closed | 기본 뼈대와 RLS, Vercel 정리 parent는 닫힘 |
| presentation lane과 real SLC lane 분리 | `#38`, `#39`, `#41`, `#69`, PR `#77` | 혼합 | code-level guard는 PR `#77`로 merged. Vercel admin evidence는 `#39/#41` open |
| Google OAuth | `#23`, `#56` | `#23` Closed, `#56` Open | OAuth code path는 있음. 실제 end-to-end login QA는 `#56`에서 증명해야 함 |
| 발표용 backendless demo | `#69`, PR `#72`, PR `#77` | Closed / Merged | backendless demo data와 host guard는 닫힘 |
| 디자인·발표 품질 | `#68`, `#74`, `#75` | `#68` Closed; `#74/#75` Open | visual shell은 개선됐지만 phone frame/brand identity가 남음 |
| project board / issue 기반 관리 | `docs/03-engineering/project-boards.md`, PR `#76` | Docs present | board 설계는 있으나 실제 project board 운영 상태는 문서 기준 |

**Day 2 판단:** infrastructure와 demo lane 방향은 맞다. 그러나 board가 “기능 영역” 중심이라, 발표 전에는 “제품 claim proof” 중심 보드가 추가로 필요하다.

---

### Day 3 — 실패 결과를 보고 재정렬한 날

| Day 3 관찰 / 결정 | 매칭 ticket / PR | 현재 상태 | 실제 evidence |
|---|---|---|---|
| 두 Vercel 분기가 거의 동일하게 보임 | `#39`, `#41`, `#69`, PR `#77` | `#39/#41` Open, PR `#77` Merged | production presentation URL에서 Google CTA 제거 확인. admin-side evidence는 아직 open |
| Google Login은 됐지만 본질이 아님 | `#23`, `#56` | `#23` Closed, `#56` Open | real SLC `/auth/sign-in` OAuth redirect는 확인. full QA는 release gate에 남음 |
| UI가 generic SaaS처럼 보임 | `#68`, `#74`, `#75` | `#68` Closed, `#74/#75` Open | “앱처럼 보이는 PC frame”과 brand assets는 아직 open |
| LLM 조급함 8개 수정 | `.omx/plans/*`, PR `#77`, issue comments `#39/#41/#52/#56` | Plan local, PR merged, comments posted | local pass/deployed/live verified 분리. blocker와 decision gate 재분류 |
| line-split scope creep 제거 | PR `#77` scope control | Merged | PR body에 planning artifacts/unrelated refactor 제외 명시 |
| WIP max 2로 재정의 | `#74`, `#52`, `#56`, external register | 운영 규칙 | `#39/#41`을 WIP에서 제외하고 blocker로 둠 |
| `#74 > #75` triage | `#74`, `#75`, PR `#76` | 둘 다 Open | 발표 환경 기준으로 phone frame 우선 |
| final QA 날짜 고정 | `#56` | Open | 2026-05-13 KST 실행 lock comment 작성 |

**Day 3 판단:** Day 3의 성과는 기능 추가가 아니라 “무엇을 완료라고 부르면 안 되는지”를 분명히 한 것이다. 이 재정렬을 board에 반영해야 한다.

---

## 3. 진행 / 기각 / 보류를 Ticket 기준으로 재정리

### 3.1 진행된 것 — Closed / Merged evidence 있음

| 제품/운영 항목 | Ticket / PR | 상태 | 남은 주의점 |
|---|---|---|---|
| SLC target/release gate 문서화 | `#33` | Closed | 실제 QA는 `#56`에서 별도 수행 |
| Next.js/Supabase scaffold | `#32` | Closed | Vercel admin evidence는 `#39/#41` open |
| Google Auth + Privacy Gate | `#23`, `#58` | Closed | full login QA는 `#56`에서 live evidence 필요 |
| RLS / sensitive-data boundary | `#35` | Closed | P1 삭제/연결해제 UX는 `#50` open |
| Capture → Confirm | `#24` | Closed | protocol draft는 `#51` open |
| Care card model / safety display rule | `#25`, `#54` | Closed | reminder `#52`가 이 rule을 사용해야 함 |
| Dynamic Home foundation | `#26` | Closed | adaptive 3-state demo는 별도 proof로 강화 필요 |
| Partner link / whitelist / revoke | `#27`, `#53`, `#61` | Closed | 상태별 partner role은 `#46` open |
| Visual productization baseline | `#68` | Closed | phone frame `#74`, brand `#75` open |
| Presentation demo polish | `#69`, PR `#72` | Closed/Merged | PR `#77`로 host guard 추가 보정됨 |
| Presentation OAuth 제거 guard | PR `#77` | Merged | production presentation URL에서 Google CTA 제거 확인 |
| Next queue documentation | PR `#76` | Merged | queue가 board 운영으로 연결되어야 함 |

### 3.2 기각 / 수정된 것 — 계획상 방향 변경

| 기존 판단 | 수정 판단 | Ticket 영향 |
|---|---|---|
| local pass = 완료 | local pass / deployed / live verified를 분리 | PR `#77`, `#56` |
| line-split architecture refactor를 train work와 혼합 | SLC finish train 밖 scope로 제거 | PR `#77` scope control |
| `#39/#41`을 active WIP로 취급 | external blocker로 분류 | `#39`, `#41` |
| `#52` in-app-only escape hatch | stakeholder/product decision gate 필요 | `#52` |
| 날짜 없는 Finish Train | 2026-05-13 QA / 2026-05-16 발표로 고정 | `#56` |
| `#74/#75` 둘 다 must-do | `#74` 우선, `#75` fallback | `#74`, `#75` |
| “커밋하자” | scope audit → PR → review → merge → live evidence | PR `#77` |

### 3.3 보류 / 블로커 — Open ticket 기준

| Ticket | 구분 | 지금 필요한 것 |
|---|---|---|
| `#39` | External blocker | Vercel Root Directory evidence |
| `#41` | External blocker | Vercel/GitHub ownership, env, deploy permission evidence |
| `#52` | Product + implementation decision | email minimum을 SLC에 넣을지, in-app-only로 명시 수용할지 결정 |
| `#56` | Release gate | 2026-05-13 live QA evidence |
| `#74` | Demo credibility | PC 발표 환경에서 iPhone frame / mobile shell 완성 |
| `#75` | Demo credibility fallback | 최소 favicon/metadata/brand mark |
| `#44/#45/#46/#47/#48/#49/#50/#51/#60` | Expansion backlog | SLC proof 이후 순차화 필요 |

---

## 4. 현재 일정과 Ticket Reality

| 날짜 | 목표 | Ticket 기준 판단 | 통과 조건 |
|---|---|---|---|
| 2026-05-11 | presentation guard PR close | PR `#77` Merged | production presentation URL에 Google CTA 없음 |
| 2026-05-12 오전 | `#52` decision gate | `#52` Open | email minimum vs in-app-only Red 분리 결정 |
| 2026-05-12 | `#74` 우선 구현 | `#74` Open | PC에서 iPhone-like frame으로 보임 + E2E/visual evidence |
| 2026-05-12 | `#75` 최소 fallback | `#75` Open | favicon/metadata/brand mark 중 최소 세트 적용 |
| 2026-05-13 | final QA | `#56` Open | real SLC full flow + Supabase write evidence |
| 2026-05-14~15 | buffer/fix only | `#56` 결과에 따름 | 새 feature 금지, release blocker만 처리 |
| 2026-05-16 daytime | presentation | demo lane + real SLC lane | demo story가 60초 안에 전달됨 |

---

## 5. Project Board로 보면 더 일목요연한 재배열

기존 `project-boards.md`는 기능 영역별 board를 잘 정의한다. 다만 발표 전 5일에는 기능 board만으로 부족하다. 아래처럼 **Finish Train board**를 하나 더 둔다.

### 5.1 Finish Train Board 제안

| Lane | 포함 ticket | Column | Owner 표현 | Stop condition |
|---|---|---|---|---|
| Demo Credibility | `#74`, `#75`, PR `#77` | In Progress / Ready | implementation role | presentation URL에서 앱처럼 보이고 로그인 없는 demo path 확인 |
| SLC Behavior Closure | `#52`, `#56` | Decision / Ready | QA owner account / product decision role | release gate evidence 또는 명시적 Red child 분리 |
| External Deployment Blockers | `#39`, `#41` | Blocked | Vercel/GitHub admin role | non-sensitive settings/deployment evidence 첨부 |
| Expansion Parking Lot | `#44–#51`, `#60`, `#28`, `#57` | Backlog | backlog owner role | SLC Green 전 active WIP로 올리지 않음 |

### 5.2 Board column 정의

| Column | 의미 | 이슈 이동 조건 |
|---|---|---|
| Backlog | SLC proof 이후로 미룸 | 지금 발표/QA에 직접 필요 없음 |
| Ready | 지금 바로 시작 가능 | 외부 권한·제품 결정 필요 없음 |
| In Progress | 구현 중 | PR 또는 local branch 있음 |
| Review | PR open / review required | CI + reviewer comment 전에는 merge 금지 |
| Live Verify | merge 후 실제 URL 확인 중 | local pass가 아니라 URL evidence 필요 |
| Blocked | 외부 권한/제품 결정 필요 | blocker role, required action, timebox 명시 |
| Done | ticket close 가능 | live evidence 또는 명시적 out-of-scope decision 있음 |

### 5.3 WIP rule

```text
Active WIP max 2:
1. Demo Credibility
2. SLC Behavior Closure

External Deployment Blockers는 WIP가 아니라 Blocked column에 둔다.
Expansion Parking Lot은 SLC Green 전까지 Ready로 올리지 않는다.
```

---

## 6. Adaptive Fertility Runtime Gap

현재 issue들은 SLC spine을 잘게 닫는 데는 유효했다. 그러나 아래 제품 claim은 아직 ticket으로 충분히 묶이지 않았다.

> Treatment State → UI Layout → Primary CTA → Partner Role → Notification Tone

### 현재 ticket coverage

| Runtime 요소 | 기존 ticket | 상태 | Gap |
|---|---|---|---|
| Treatment State | `#25` | Closed | state type/rule은 있으나 demo transition proof 부족 |
| UI Layout | `#26`, `#68`, `#74` | Mixed | home foundation은 닫힘, phone frame은 open |
| Primary CTA | `#26`, `#69` | Mixed | state-specific CTA가 제품 claim으로 별도 검증되지 않음 |
| Partner Role | `#27`, `#53`, `#61`, `#46` | Mixed | link mechanics는 닫힘, role translation은 open |
| Notification Tone | `#52`, `#59` | Mixed | channel ADR은 닫힘, minimum reminder는 open |

### 새로 필요한 board-level proof issue

아래는 지금 바로 생성하자는 뜻이 아니라, board 정리 시 issue 제목이 기능명이 아니라 제품 증명 단위여야 한다는 기준이다.

| Proposed proof issue | 목적 | 기존 ticket과 관계 |
|---|---|---|
| Implement 3-State Adaptive Runtime Demo | Injection / Clinic / Waiting 전환을 60초 발표 흐름으로 묶음 | `#25`, `#26`, `#46`, `#52`, `#74`를 관통 |
| Verify Injection Day action structure | 투약 CTA + partner confirmation + reminder tone 증명 | `#45`, `#52`, `#46` |
| Verify Clinic Day logistics structure | 방문 checklist + logistics partner role 증명 | `#44`, `#46` |
| Verify Waiting Day calm structure | calm check-in + gentle partner update 증명 | `#47`, `#46` |
| Verify live deployment evidence for 3-state runtime | 실제 URL에서 demo proof 캡처 | `#56`, `#57` |

---

## 7. 60초 Demo Flow와 Ticket Mapping

| Demo step | 화면/행동 | 필요한 ticket 상태 | 현재 상태 |
|---|---|---|---|
| 1 | Entry | PR `#77`, `#69` | Merged / Closed |
| 2 | Today State | `#26`, `#25` | Closed |
| 3 | Injection Mode | `#25`, `#45`, `#52` | foundation Closed, `#45/#52` Open |
| 4 | Clinic Mode | `#44`, `#51` | Open |
| 5 | Waiting Mode | `#47` | Open |
| 6 | Partner role shift | `#27`, `#53`, `#61`, `#46` | mechanics Closed, role mode Open |
| 7 | Mobile presentation quality | `#74`, `#75` | Open |
| 8 | Live evidence | `#56`, `#57` | Open |

**판단:** 지금 당장 Day 4 작업을 시작한다면, 새로운 기능을 넓히기보다 `#74`를 닫고, 3-state runtime proof를 한 화면/한 demo control 안에 묶는 것이 제품 증명에 더 직접적이다.

---

## 8. 오늘 이후 Ticket Priority

### P0 — SLC close를 막는 것

| 순위 | Ticket | 목표 | 완료 기준 |
|---:|---|---|---|
| 1 | `#52` | Reminder Minimum decision | email send Green 또는 in-app-only Red child를 명시적 제품 결정으로 분리 |
| 2 | `#56` | Release QA | 2026-05-13 real SLC flow evidence |
| 3 | `#39/#41` | External deployment blockers | admin evidence 첨부 후 blocked 해제 여부 판단 |

### P1 — 발표 품질을 살리는 것

| 순위 | Ticket | 목표 | 완료 기준 |
|---:|---|---|---|
| 1 | `#74` | iPhone frame / mobile shell | PC 발표 화면에서도 앱처럼 보임 |
| 2 | `#75` | minimal brand identity | favicon/metadata/brand mark 최소 적용 |
| 3 | Proposed 3-state proof issue | Adaptive Runtime claim 증명 | Injection/Clinic/Waiting이 CTA·partner role까지 바뀜 |

### Parking Lot — SLC Green 전에는 건드리지 않음

`#28`, `#44`, `#45`, `#46`, `#47`, `#48`, `#49`, `#50`, `#51`, `#57`, `#60`

단, 3-state runtime demo를 위해 일부 내용을 **production-grade 구현이 아니라 controlled demo proof**로 얇게 끌어오는 것은 가능하다. 이 경우 반드시 새 proof issue의 child task로 묶고, 원래 expansion ticket을 닫았다고 주장하지 않는다.

---

## 9. 최종 판단

Day 1–2는 Fevio의 제품 철학과 SLC spine을 만들었다. Day 3는 그 spine이 실제 화면에서 제품 claim을 충분히 증명하지 못한다는 것을 보여줬다.

따라서 지금 board의 핵심 질문은 “몇 개 issue가 닫혔는가?”가 아니라 이것이어야 한다.

> **닫힌 ticket들이 Fevio가 Adaptive Fertility Runtime이라는 주장을 실제 URL에서 증명하는가?**

현재 답은 “부분적으로만 그렇다”이다.

- presentation guard는 PR `#77`로 Green이다.
- SLC 기능 spine은 다수 Green이다.
- 하지만 reminder, QA, phone frame, brand, 3-state runtime proof는 아직 open이다.

다음 실행은 기능 추가가 아니라, 아래 claim을 live evidence로 닫는 방향이어야 한다.

```text
치료 상태가 바뀌면
→ UI layout이 바뀌고
→ primary CTA가 바뀌고
→ partner role이 바뀌고
→ notification tone이 바뀐다.
```
