# Fevio 다음 할 일

작성일: 2026-05-29  
출처: 사용자 요구 10개 항목 자가 검증 결과 및 현재 GitHub slice 상태

## 현재 판정

- **main+현재 변경 기준 구현도**: 약 85~90%
- **로컬 검증 기준 구현도**: 약 90%
- **실제 운영/프로덕션 기준 구현도**: 약 70~75%

핵심 구조인 `오늘 실행 보기 → 원문/후보 확인 → 확정 저장 → 중요 알림 → 파트너 역할 공유`는 대부분 자리 잡았다.  
다만 완성 판단 전에는 실기기 Push evidence와 운영 배포 확인을 분리해서 닫아야 한다.

---

## P0 — 완성 판정 전 반드시 닫을 일

### 1. 약 복용 Push 범위 검증 및 확장

**상태**  
Push 후보 RPC는 `injection`과 `medication`을 모두 포함하며, reminder copy/payload는 card type별 경계를 유지한다.

**할 일**

- [x] `reminder_dispatches` 후보 RPC/쿼리가 `injection`뿐 아니라 `medication`도 포함하는지 확인한다.
- [x] medication card도 T-60/T-15 대상이 되도록 제품 기준을 고정한다.
- [x] RPC, domain 함수, integration test를 함께 수정한다.
- [x] Push payload에 raw memo/source text가 들어가지 않는 기존 안전 조건을 유지한다.

**완료 기준**

- [x] injection과 medication 각각에 대해 T-60/T-15 dispatch test가 통과한다.
- [x] 중복 dispatch 방지 UNIQUE가 두 card type 모두에 적용된다.
- [x] payload에 원문/민감 메모가 포함되지 않는 regression test가 유지된다.

---

### 2. 실기기 PWA Push 검증

**문제**  
CI/e2e는 통과했지만, 실제 iOS/Android/PWA 환경에서 구독, revoke, 재구독, 알림 수신이 검증되지 않았다.

**할 일**

- [ ] iOS Safari Add to Home Screen 상태에서 Push permission CTA 동작을 확인한다.
- [ ] Android/Chrome PWA에서 구독 생성 및 알림 수신을 확인한다.
- [ ] revoked subscription이 재구독 CTA로 새 active subscription을 만드는지 확인한다.
- [ ] 404/410 응답 시 구독 revoke 처리, 5xx/network 실패 시 non-revoked failure 기록을 확인한다.

**완료 기준**

- [ ] 실기기 또는 브라우저 디바이스 로그가 QA evidence로 남는다.
- [ ] `/api/reminders/send-due` 실제 호출 결과가 sent/failed/revoked 경로별로 확인된다.
- [ ] production-like Supabase migration 적용 상태가 확인된다.

---

### 3. 파트너 화면 정보 노출 경계 재점검

**상태**  
Partner Brief와 Partner View 모두 역할/도움 행동 중심 계약으로 고정했고, partner action card에서 `title`/`description`을 제거했다.

**할 일**

- [x] partner-facing card projection에서 `title`/`description`이 표시되지 않도록 감사한다.
- [x] partner 화면에는 `partner_role`, `partner_action`, `avoid_prompt` 중심 copy만 노출한다.
- [x] injection/medication의 약 이름·용량·원문성 description이 partner view에 노출되지 않는 regression test를 추가한다.
- [x] 사용자가 명시적으로 파트너 공유를 허용한 정보와 기본 역할 공유를 구분한다.

**완료 기준**

- [x] raw visit note, source text, emotion note, IVF record detail은 계속 차단된다.
- [x] partner 기본 화면은 “오늘 병원 같이 가기”, “주사 준비 도와주기” 같은 역할 중심으로 보인다.
- [x] Partner Brief와 Partner View의 정보 경계가 테스트/화면 copy에서 일치한다.

---

### 4. 초심자 IVF 단계 설명 UX 보강

**상태**  
Home/onboarding에서 확인한 단계에 대한 한 줄 설명과 의료 판단 경계 문구를 제공한다.

**할 일**

- [x] Home 또는 onboarding에 “현재 단계 한 줄 설명”을 추가한다.
- [x] 채취, 배양, 이식, 판정 등 핵심 용어를 의료 조언 없이 설명하는 microcopy를 만든다.
- [x] 단계 설명은 진단/예후/치료 판단이 아니라 일정 이해 보조임을 명시한다.
- [ ] 사용자가 모르는 용어를 눌러 짧게 펼쳐볼 수 있는 lightweight UI를 검토한다.

**완료 기준**

- [ ] 초심자도 오늘의 일정이 IVF 흐름 중 어디인지 알 수 있다.
- [ ] 설명은 비의료적, 정보 보조, deterministic copy로 유지된다.
- [ ] “감정 케어 강요”나 과도한 교육 화면이 되지 않는다.

---

## P1 — MVP 신뢰도를 올리는 일

### 5. 원문/후보 확인 UX 마감

- [ ] 중요 후보는 원문 inline quote가 항상 보이도록 유지한다.
- [ ] offset이 부정확할 때 approximated marker/copy가 사용자에게 이해되는지 확인한다.
- [ ] 후보 확정 전에는 `care_action_cards`가 생성되지 않는 test를 유지한다.
- [ ] “AI가 확정한 것”처럼 보이는 문구를 제거하고 “후보/확인 필요” 표현을 유지한다.

### 6. Today Home 정보 밀도 조정

- [ ] Home 첫 화면에서 오늘 실행 항목이 다른 카드보다 우선 보이는지 모바일에서 확인한다.
- [ ] 주사/약/내원/확인할 것의 우선순위가 사용자가 납득할 순서인지 확인한다.
- [ ] 놓친 확인 항목은 강하게 표시하되 공포감/재촉감을 주지 않도록 copy를 다듬는다.

### 7. 캡처 품질 및 fallback 강화

- [x] 사진 OCR/LLM 실패 시 직접 입력 fallback이 막히지 않는지 확인한다.
- [ ] 카톡/병원 안내문/사진/메모의 대표 샘플 fixture를 늘린다.
- [ ] 시간, 용량, 빈도, 기간, 병원 방문 후보의 confidence와 needs-confirmation 상태를 점검한다.

---

## P2 — 유료 가치와 운영 준비

### 8. Cycle Pass / 유료 가치 경계 정리

- [x] 무료: 기본 일정 확인, 안전 알림, 기본 파트너 역할 공유.
- [x] 유료 후보: 사진/문자 자동 정리, 원문-후보 확인 기록, 고급 알림/재확인, 파트너 협업 편의.
- [ ] “취약성 과금”처럼 보이지 않도록 가격/카피 원칙을 문서화한다.
- [ ] 결제 구현 전, 유료 전환에 필요한 신뢰 evidence를 먼저 정의한다.

### 9. 운영 배포 체크리스트

- [ ] Phase 2 PR 머지 전 CI, typecheck, unit, integration, e2e 상태를 재확인한다.
- [ ] Supabase migration 원격 적용 여부를 확인한다.
- [ ] Vercel/production environment variable과 Vault secret을 확인한다.
- [ ] production deploy 후 smoke test: onboarding capture → confirm → home → push subscribe → partner link.

---

## 이번 라운드의 권장 순서

1. **실기기 Push QA evidence 확보**
2. **대표 캡처 fixture 확대**
3. **Phase 2 PR 머지 및 production smoke**

이 순서가 좋은 이유는, 사용자의 유료 가치와 신뢰가 결국 “중요한 것을 놓치지 않음”과 “민감정보가 새지 않음”에 가장 크게 걸려 있기 때문이다.
