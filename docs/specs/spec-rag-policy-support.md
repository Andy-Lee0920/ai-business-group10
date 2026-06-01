# Fevio — 지역별 정책 RAG + 개인 자격 판단 기능 스펙

**문서 버전:** v1.0.0  
**최초 작성일:** 2026-06-01  
**상태:** Draft — 내부 검토 중  
**작성자:** Fevio Product Team

---

## 목차

1. [개요](#1-개요)
2. [문제 정의](#2-문제-정의)
3. [목표 및 성공 지표](#3-목표-및-성공-지표)
4. [사용자 플로우](#4-사용자-플로우)
5. [데이터 구조](#5-데이터-구조)
6. [RAG 파이프라인 설계](#6-rag-파이프라인-설계)
7. [자격 판단 엔진](#7-자격-판단-엔진)
8. [보건소 문의 자동화](#8-보건소-문의-자동화)
9. [AI 프롬프트 설계](#9-ai-프롬프트-설계)
10. [API 설계](#10-api-설계)
11. [UI 카드 구성](#11-ui-카드-구성)
12. [안전 원칙 및 금지 표현](#12-안전-원칙-및-금지-표현)
13. [MVP 범위](#13-mvp-범위)
14. [V1 / V2 로드맵](#14-v1--v2-로드맵)
15. [예시 응답 JSON](#15-예시-응답-json)
16. [예시 화면 문구](#16-예시-화면-문구)
17. [미결 사항](#17-미결-사항)

---

## 1. 개요

### 1.1 기능명

**지역별 정책 RAG + 개인 자격 판단**  
내부 코드명: `policy-rag`

### 1.2 한 줄 정의

사용자의 거주지와 시술 상태를 기반으로 난임 지원금 정책 정보를 검색·해석하고, 지원 가능성과 다음 행정 액션을 카드 형태로 자동 제안하는 기능.

### 1.3 핵심 가치

| 기존 사용자 경험                    | Fevio 이후                          |
| ----------------------------------- | ----------------------------------- |
| 정부24, 보건소 홈페이지를 직접 뒤짐 | 거주지 입력하면 자동으로 정책 검색  |
| 내가 받을 수 있는지 모름            | 조건별 가능성 분류 카드로 즉시 확인 |
| 뭘 준비해야 할지 모름               | 신청 체크리스트 자동 생성           |
| 보건소에 뭘 물어봐야 할지 모름      | 문의 메일 초안 자동 작성            |

### 1.4 서비스 포지셔닝

Fevio는 행정 대행 서비스가 아닙니다. 최종 지원 확정은 반드시 보건소에서 이루어지며, Fevio는 사용자가 정확한 질문을 가지고 보건소에 갈 수 있도록 준비를 돕는 역할을 합니다.

---

## 2. 문제 정의

### 2.1 사용자 페인포인트

난임 시술 환자는 지원금 신청 과정에서 다음 정보를 스스로 찾기 어렵습니다.

- 내 지역에서 지원금을 받을 수 있는지
- 시술 유형(신선배아 / 동결배아 / 인공수정)별 지원 금액
- 원외약제비, 비급여 항목, 배아동결비 지원 여부
- 지원결정통지서 발급 필요 여부 및 신청 시점
- 관할 보건소 담당자 연락처
- 예산 소진 여부 또는 접수 마감 공지
- 지금 당장 해야 할 행정 액션

### 2.2 근본 원인

- 정책 정보가 정부24, e보건소, 각 지자체 홈페이지에 분산되어 있음
- 시군구별로 정책 세부 조건이 상이함
- 정보 업데이트 주기가 불규칙하고 공식 API 없음
- 행정 용어가 어려워 사용자가 본인 해당 여부를 스스로 판단하기 어려움

---

## 3. 목표 및 성공 지표

### 3.1 정성 목표

- 사용자가 보건소에 전화하기 전에 본인 상황을 정확히 파악할 수 있어야 한다.
- AI 답변이 사용자를 오도하지 않아야 한다. (단정 금지 원칙)
- 보건소 문의 메일이 담당자에게 불필요한 부담을 주지 않아야 한다.

### 3.2 정량 지표 (MVP 기준)

| 지표                        | 목표             |
| --------------------------- | ---------------- |
| 자격 판단 카드 생성 성공률  | ≥ 95%            |
| 금지 표현 포함 응답 비율    | 0%               |
| 사용자 체크리스트 완료율    | ≥ 40% (D+7 기준) |
| 메일 초안 → 발송 전환율     | ≥ 30%            |
| 보건소 담당자 연락처 정확도 | ≥ 90%            |

---

## 4. 사용자 플로우

### 4.1 전체 플로우

```
[온보딩 완료 또는 프로필 업데이트]
        │
        ▼
[1단계] 사용자 정보 입력
  - 거주지 (시도 / 시군구)
  - 시술 유형 선택
  - 시술 예정일
  - 난임진단서 보유 여부
  - 지원결정통지서 발급 여부
  - 혼인 / 사실혼 여부
        │
        ▼
[2단계] RAG 정책 검색
  - 시도 + 시군구 기준 정책 문서 검색
  - policy_structured 테이블 조회 (구조화 데이터)
  - policy_chunks 벡터 검색 (보완 정보)
        │
        ▼
[3단계] 자격 판단 엔진 실행
  - 8개 조건 항목 체크
  - 확인됨 / 확인필요 / 즉시액션 / 불가가능성 분류
  - 전체 종합 판단 도출
        │
        ▼
[4단계] 카드 출력
  ┌──────────────────────────────────┐
  │  지원 가능성 카드                 │
  │  지원 항목 카드                   │
  │  신청 체크리스트 카드             │
  │  보건소 문의 카드                 │
  │  문의 메일 초안 카드              │
  └──────────────────────────────────┘
        │
        ▼
[5단계] 사용자 액션
  ├─ [메일 발송] → 답변 대기 카드 → 보건소 답변 요약 카드
  ├─ [서류 준비] → 체크리스트 항목 완료 처리
  ├─ [신청 완료] → 다음 액션 카드
  └─ [정보 수정] → 2단계로 돌아가 재판단
```

### 4.2 핵심 엣지 케이스

| 상황                             | 처리 방식                                |
| -------------------------------- | ---------------------------------------- |
| 해당 지역 정책 데이터 없음       | "정보 없음" 카드 + 보건소 직접 문의 유도 |
| 예산 소진 공지 있음              | 위험 배너 표시 + 즉시 확인 문의 버튼     |
| 시술 이미 시작했는데 통지서 없음 | 소급 적용 불가 위험 경고 카드            |
| 사실혼 사용자                    | 사실혼 인정 서류 확인 필요 안내          |
| 이미 지원 이력 있는 사용자       | 횟수 한도 확인 필요 안내                 |

---

## 5. 데이터 구조

### 5.1 DB 전체 구조

```
fevio_db
├── policy_documents         ← RAG 원본 문서 (크롤링 원문)
├── policy_chunks            ← 임베딩 청크 (벡터 검색용)
├── policy_structured        ← 구조화 정책 정보 (지역별 정형 데이터)
├── user_profiles            ← 사용자 기본 정보
├── user_treatment_contexts  ← 시술 맥락 정보
├── eligibility_results      ← 자격 판단 결과 캐시
├── inquiry_drafts           ← 보건소 문의 메일 초안
└── inquiry_threads          ← 문의 발송 상태 추적
```

### 5.2 `policy_documents` — 원본 문서

```sql
CREATE TABLE policy_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sido            VARCHAR(20)  NOT NULL,
  sigungu         VARCHAR(30),
  health_center   VARCHAR(50),
  source_url      TEXT         NOT NULL,
  source_type     VARCHAR(30),
  -- 'gov24' | 'e_health' | 'local_hc' | 'manual'
  raw_content     TEXT         NOT NULL,
  content_hash    VARCHAR(64),           -- SHA-256 중복 방지
  fetched_at      TIMESTAMPTZ  DEFAULT now(),
  valid_year      INT,
  is_active       BOOLEAN      DEFAULT true,
  confidence      FLOAT        DEFAULT 0.8
);
```

### 5.3 `policy_chunks` — 벡터 검색용 청크

```sql
CREATE TABLE policy_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID REFERENCES policy_documents(id) ON DELETE CASCADE,
  chunk_index     INT,
  chunk_text      TEXT         NOT NULL,
  embedding       vector(1536),         -- OpenAI text-embedding-3-small
  metadata        JSONB,
  -- { sido, sigungu, topic, tags[] }
  -- topic: '지원대상' | '지원항목' | '신청방법' | '서류' | '예산' | '연락처'
  created_at      TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX ON policy_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**청킹 전략:**

- 최대 500 토큰 / 청크, 50 토큰 오버랩
- 섹션 제목(지원 대상 / 지원 항목 / 신청 방법 등) 청크 상단에 유지
- 메타데이터 topic 태그로 필터링 가능하게 구성

### 5.4 `policy_structured` — 구조화 정책 정보

```sql
CREATE TABLE policy_structured (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id               UUID REFERENCES policy_documents(id),
  sido                      VARCHAR(20)  NOT NULL,
  sigungu                   VARCHAR(30),
  health_center_name        VARCHAR(50),
  dept_name                 VARCHAR(50),
  contact_name              VARCHAR(20),
  contact_email             VARCHAR(100),
  contact_phone             VARCHAR(20),

  -- 지원 대상
  target_married            BOOLEAN,
  target_defacto            BOOLEAN,
  target_income_criteria    VARCHAR(100),
  target_age_limit          JSONB,
  -- 예: {"female_max": 45, "male_max": null}

  -- 지원 항목 및 한도
  ivf_fresh_limit           INT,         -- 신선배아 상한 (원)
  ivf_frozen_limit          INT,         -- 동결배아 상한
  iui_limit                 INT,         -- 인공수정 상한
  drug_external_covered     BOOLEAN,     -- 원외약제비 지원 여부
  non_covered_items         JSONB,       -- 지원 가능 비급여 항목 목록
  non_covered_excluded      JSONB,       -- 지원 제외 비급여 항목 목록

  -- 신청 조건
  require_decision_notice   BOOLEAN,     -- 지원결정통지서 필요 여부
  apply_before_treatment    BOOLEAN,     -- 시술 시작 전 신청 필수 여부
  online_apply_available    BOOLEAN,
  apply_url                 TEXT,
  required_documents        JSONB,
  -- 예: ["난임진단서", "주민등록등본", "혼인관계증명서"]

  -- 예산 / 마감
  budget_exhausted          BOOLEAN      DEFAULT false,
  budget_notice             TEXT,
  budget_checked_at         TIMESTAMPTZ,

  -- 메타
  valid_from                DATE,
  valid_until               DATE,
  source_url                TEXT,
  last_verified_at          TIMESTAMPTZ,
  confidence                FLOAT        DEFAULT 0.8
);
```

### 5.5 `user_profiles` — 사용자 기본 정보

```sql
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL UNIQUE,
  sido            VARCHAR(20),
  sigungu         VARCHAR(30),
  is_married      BOOLEAN,
  is_defacto      BOOLEAN,
  reply_email     VARCHAR(100),          -- 보건소 답장 수신용 이메일
  created_at      TIMESTAMPTZ  DEFAULT now(),
  updated_at      TIMESTAMPTZ  DEFAULT now()
);
```

### 5.6 `user_treatment_contexts` — 시술 맥락

```sql
CREATE TABLE user_treatment_contexts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID         NOT NULL,
  treatment_type              VARCHAR(30),
  -- 'ivf_fresh' | 'ivf_frozen' | 'iui' | 'unknown'
  treatment_start_date        DATE,
  treatment_stage             VARCHAR(50),
  -- 'planning' | 'stimulation' | 'retrieval' | 'transfer' | 'waiting'
  has_infertility_diagnosis   BOOLEAN,
  has_decision_notice         BOOLEAN,
  support_attempt_count       INT          DEFAULT 0,
  prior_support_used          BOOLEAN      DEFAULT false,
  drug_external_occurred      BOOLEAN,
  has_receipt                 BOOLEAN,
  has_prescription            BOOLEAN,
  additional_notes            TEXT,
  created_at                  TIMESTAMPTZ  DEFAULT now(),
  updated_at                  TIMESTAMPTZ  DEFAULT now()
);
```

### 5.7 `eligibility_results` — 판단 결과 캐시

```sql
CREATE TABLE eligibility_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL,
  treatment_context_id UUID        NOT NULL,
  policy_structured_id UUID        NOT NULL,
  overall_status      VARCHAR(30),
  -- 'eligible_likely' | 'action_required' | 'uncertain' | 'likely_ineligible'
  check_results       JSONB,       -- 개별 체크 항목 배열
  missing_info        JSONB,       -- 미확인 항목 목록
  recommended_actions JSONB,       -- 추천 액션 목록
  disclaimer_text     TEXT,
  generated_at        TIMESTAMPTZ  DEFAULT now(),
  expires_at          TIMESTAMPTZ  DEFAULT now() + INTERVAL '24 hours'
);
```

### 5.8 `inquiry_threads` — 문의 상태 추적

```sql
CREATE TABLE inquiry_threads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL,
  eligibility_id      UUID         REFERENCES eligibility_results(id),
  recipient_email     VARCHAR(100),
  recipient_name      VARCHAR(50),
  health_center_name  VARCHAR(50),
  subject             TEXT,
  body_draft          TEXT,
  inquiry_purposes    JSONB,       -- 문의 목적 목록
  status              VARCHAR(20)  DEFAULT 'draft',
  -- 'draft' | 'sent' | 'replied' | 'closed'
  sent_at             TIMESTAMPTZ,
  expected_reply_by   TIMESTAMPTZ,
  reply_summary       TEXT,
  created_at          TIMESTAMPTZ  DEFAULT now(),
  updated_at          TIMESTAMPTZ  DEFAULT now()
);
```

---

## 6. RAG 파이프라인 설계

### 6.1 수집 대상 소스

| 소스                  | URL 패턴                    | 수집 주기 | 우선순위 |
| --------------------- | --------------------------- | --------- | -------- |
| 정부24                | `gov.kr/난임부부시술비지원` | 월 1회    | 상       |
| e보건소               | `e-health.go.kr`            | 월 1회    | 상       |
| 서울시 보건포털       | `health.seoul.go.kr`        | 월 1회    | 상       |
| 각 시군구 보건소 공지 | 보건소별 공지사항 페이지    | 주 1회    | 중       |
| 보건소 연락처 정보    | 직접 수집 (초기 수동)       | 분기 1회  | 중       |

### 6.2 수집 → 저장 파이프라인

```
[크롤러 / 수동 입력]
        │
        ▼
원문 저장 (policy_documents)
        │
        ▼
콘텐츠 해시 비교 → 변경 없으면 스킵
        │
        ▼
청킹 (500토큰 / 50토큰 오버랩)
        │
        ▼
임베딩 생성 (OpenAI text-embedding-3-small)
        │
        ▼
policy_chunks 저장 (embedding + metadata)
        │
        ▼
LLM으로 구조화 추출 → policy_structured 저장
        │
        ▼
수동 검증 플래그 (confidence < 0.7 이면 검토 대기)
```

### 6.3 검색 전략

사용자 쿼리 발생 시 두 가지 방식 병행:

**1) 구조화 조회 (Primary)**

```sql
SELECT * FROM policy_structured
WHERE sido = :sido AND sigungu = :sigungu
  AND is_active = true
ORDER BY last_verified_at DESC
LIMIT 1;
```

**2) 벡터 검색 (보완)**

```sql
SELECT chunk_text, metadata
FROM policy_chunks
WHERE metadata->>'sido' = :sido
  AND metadata->>'sigungu' = :sigungu
ORDER BY embedding <=> :query_embedding
LIMIT 5;
```

구조화 데이터가 없거나 confidence < 0.7이면 벡터 검색 결과를 우선 사용하고 "정보 신뢰도 낮음" 경고 표시.

---

## 7. 자격 판단 엔진

### 7.1 판단 상태 정의

| 상태 코드         | 한국어 표현    | 설명                                | UI 색상        |
| ----------------- | -------------- | ----------------------------------- | -------------- |
| `confirmed`       | 확인됨         | 사용자 입력 + 정책 조건 모두 충족   | 초록 (#3A8C6E) |
| `needs_check`     | 확인 필요      | 정보 부족 또는 보건소 확인 필요     | 노랑 (#C89A2A) |
| `action_required` | 즉시 액션 필요 | 시술 전 처리 안 하면 지원 불가 위험 | 주황 (#D4622A) |
| `risk`            | 불가 가능성    | 정책 조건 불충족 가능성             | 빨강 (#B03030) |
| `not_applicable`  | 해당 없음      | 사용자 조건에서 해당 항목 없음      | 회색           |
| `unknown`         | 정보 없음      | 정책 데이터 자체 없음               | 회색           |

### 7.2 전체 종합 판단 기준

| 조건                       | 종합 판단                                |
| -------------------------- | ---------------------------------------- |
| 모든 항목 `confirmed`      | `eligible_likely` — 지원 가능성 높음     |
| `action_required` 1개 이상 | `action_required` — 즉시 확인 필요       |
| `risk` 1개 이상            | `uncertain` — 지원 가능성 불확실         |
| `unknown` 다수             | `uncertain` — 정보 부족                  |
| `risk` + 핵심 조건 미충족  | `likely_ineligible` — 지원 어려울 가능성 |

### 7.3 개별 체크 항목 (8개)

#### CHECK-01. 거주지 매칭

```python
def check_region_match(user, policy):
    if user.sido == policy.sido and user.sigungu == policy.sigungu:
        return {
            "item": "거주지",
            "status": "confirmed",
            "note": "관할 보건소 확인됨",
            "health_center": policy.health_center_name
        }
    elif user.sido == policy.sido and not policy.sigungu:
        return {
            "item": "거주지",
            "status": "needs_check",
            "note": "시군구 단위 정책 확인 필요"
        }
    else:
        return {
            "item": "거주지",
            "status": "unknown",
            "note": "해당 지역 정책 정보 없음 — 보건소 직접 문의 필요"
        }
```

#### CHECK-02. 혼인 상태

```python
def check_marriage_status(user, policy):
    if policy.target_married and user.is_married:
        return {"item": "혼인 상태", "status": "confirmed", "note": "법적 혼인 조건 충족"}
    elif policy.target_defacto and user.is_defacto:
        return {
            "item": "혼인 상태",
            "status": "needs_check",
            "note": "사실혼 인정 서류 확인 필요 (사실혼 관계 확인서 등)"
        }
    elif not user.is_married and not user.is_defacto:
        return {"item": "혼인 상태", "status": "risk", "note": "미혼 단독 신청 불가 가능성"}
```

#### CHECK-03. 시술 유형 해당 여부

```python
def check_treatment_type(user, policy):
    type_map = {
        "ivf_fresh":  policy.ivf_fresh_limit,
        "ivf_frozen": policy.ivf_frozen_limit,
        "iui":        policy.iui_limit
    }
    limit = type_map.get(user.treatment_type)
    if limit:
        return {
            "item": "시술 유형",
            "status": "confirmed",
            "note": f"지원 상한 최대 {limit:,}원",
            "limit": limit
        }
    elif user.treatment_type == "unknown":
        return {"item": "시술 유형", "status": "needs_check", "note": "시술 유형 확정 후 재확인 필요"}
    else:
        return {"item": "시술 유형", "status": "risk", "note": "해당 시술 유형 지원 정보 없음"}
```

#### CHECK-04. 난임진단서 보유 여부

```python
def check_diagnosis_document(user, policy):
    if user.has_infertility_diagnosis:
        return {"item": "난임진단서", "status": "confirmed", "note": "서류 보유 확인됨"}
    else:
        return {
            "item": "난임진단서",
            "status": "action_required",
            "note": "신청 필수 서류 — 담당 병원에서 발급 필요"
        }
```

#### CHECK-05. 지원결정통지서

```python
def check_decision_notice(user, policy):
    if not policy.require_decision_notice:
        return {"item": "지원결정통지서", "status": "not_applicable", "note": "해당 지역 불필요"}
    elif user.has_decision_notice:
        return {"item": "지원결정통지서", "status": "confirmed", "note": "통지서 보유 확인됨"}
    elif user.treatment_start_date > today():
        return {
            "item": "지원결정통지서",
            "status": "action_required",
            "note": "시술 시작 전 발급 필수 — 즉시 보건소 신청 권장"
        }
    else:
        return {
            "item": "지원결정통지서",
            "status": "risk",
            "note": "시술 시작 후 통지서 발급은 소급 적용 불가할 수 있음"
        }
```

#### CHECK-06. 신청 타이밍

```python
def check_apply_timing(user, policy):
    days_until_treatment = (user.treatment_start_date - today()).days
    if not policy.apply_before_treatment:
        return {"item": "신청 시점", "status": "confirmed", "note": "시술 후 신청 가능"}
    elif days_until_treatment > 14:
        return {"item": "신청 시점", "status": "confirmed", "note": f"시술까지 {days_until_treatment}일 — 신청 여유 있음"}
    elif 0 < days_until_treatment <= 14:
        return {
            "item": "신청 시점",
            "status": "action_required",
            "note": f"D-{days_until_treatment} — 시술 전 신청 기한 임박"
        }
    else:
        return {
            "item": "신청 시점",
            "status": "risk",
            "note": "시술 시작일 이미 경과 — 소급 신청 가능 여부 보건소 확인 필요"
        }
```

#### CHECK-07. 예산 잔여

```python
def check_budget_status(user, policy):
    if policy.budget_exhausted:
        return {
            "item": "예산",
            "status": "risk",
            "note": "예산 소진 공지 있음 — 보건소 즉시 확인 필수"
        }
    elif policy.budget_checked_at < (now() - timedelta(days=7)):
        return {
            "item": "예산",
            "status": "needs_check",
            "note": f"예산 정보 {(now() - policy.budget_checked_at).days}일 경과 — 최신 상태 보건소 확인 권장"
        }
    else:
        return {
            "item": "예산",
            "status": "needs_check",
            "note": "예산 잔여 여부는 보건소 직접 확인 필요"
        }
```

#### CHECK-08. 지원 이력 / 횟수

```python
def check_attempt_count(user, policy):
    if user.support_attempt_count == 0:
        return {"item": "지원 횟수", "status": "confirmed", "note": "첫 번째 신청"}
    else:
        return {
            "item": "지원 횟수",
            "status": "needs_check",
            "note": f"이전 {user.support_attempt_count}회 지원 이력 — 잔여 횟수 보건소 확인 필요"
        }
```

---

## 8. 보건소 문의 자동화

### 8.1 자동화 흐름

```
자격 판단 결과 생성
        │
        ▼
needs_check / action_required / risk 항목 추출
        │
        ▼
문의 목적 자동 생성
  예: ["예산 잔여 여부", "지원결정통지서 발급 가능 여부"]
        │
        ▼
policy_structured.contact_email 조회
        │
        ▼
메일 초안 생성 (LLM 프롬프트 → 9장 참조)
        │
        ▼
사용자 확인 → 내용 수정 가능
        │
        ▼
발송 (외부 메일 앱 연동 또는 클립보드 복사)
        │
        ▼
inquiry_threads 상태 저장
  { status: 'sent', sent_at, expected_reply_by: +3영업일 }
        │
        ▼
답변 대기 카드 표시 → 사용자 답변 내용 수동 입력 → 요약 카드
```

### 8.2 문의 목적 자동 생성 규칙

| 판단 결과                      | 자동 생성 문의 목적                   |
| ------------------------------ | ------------------------------------- |
| 예산 `needs_check` 또는 `risk` | 예산 잔여 여부 확인                   |
| 통지서 `action_required`       | 지원결정통지서 발급 가능 여부 및 절차 |
| 신청 타이밍 `action_required`  | 시술 전 신청 가능 기한 확인           |
| 원외약제비 미확인              | 원외약제비 청구 가능 여부             |
| 서류 `needs_check`             | 필요 서류 목록 최신 확인              |
| 지원 횟수 `needs_check`        | 잔여 지원 횟수 확인                   |

### 8.3 개인정보 포함/제외 원칙

**포함 가능:**

- 거주 지역 (시군구 수준)
- 시술 유형
- 시술 예정 시기 (월 단위)
- 문의 목적
- 답장 받을 이메일

**절대 제외:**

- 주민등록번호
- 실명 (성씨만 선택적 허용)
- 배우자 개인정보
- 병원명 / 의사명
- 진단서 구체 내용 및 이미지
- 검사 수치
- 영수증 이미지

---

## 9. AI 프롬프트 설계

### 9.1 자격 판단 프롬프트

```
SYSTEM:
당신은 난임 지원금 정책 정보를 해석하는 전문 어시스턴트입니다.
반드시 다음 규칙을 따르세요.

[출력 규칙]
- 모든 판단은 "가능성", "확인 필요", "보건소 최종 확인 필요" 형태로 표현
- 다음 표현을 절대 사용하지 않음:
  "지원 대상입니다", "100% 받을 수 있습니다", "무조건 신청 가능합니다",
  "이 항목은 반드시 지원됩니다", "보건소에 확인하지 않아도 됩니다"
- 반드시 JSON 형식으로만 응답 (preamble 없이)
- 출처 URL 및 마지막 확인일 포함

USER:
아래 사용자 정보와 정책 정보를 비교해서 지원 가능성을 판단해주세요.

[사용자 정보]
{user_context_json}

[정책 정보]
{policy_structured_json}

[RAG 보완 정보]
{rag_chunks_text}

다음 형식의 JSON으로 응답하세요:
{eligibility_result_schema}
```

### 9.2 메일 초안 생성 프롬프트

```
SYSTEM:
당신은 난임 치료 환자를 위한 보건소 문의 메일을 작성하는 어시스턴트입니다.

[포함 가능 정보]
거주 지역(시군구), 시술 유형, 시술 예정 시기(월), 문의 목적, 답장 이메일

[절대 포함 금지]
주민등록번호, 실명, 배우자 정보, 병원명, 진단서 내용,
검사 수치, 진단서/영수증 이미지, 민감한 의료 기록

[문체 규칙]
- 정중하고 간결하게
- 담당자 업무를 배려하는 표현 포함
- 불필요한 감정 표현 없이 요점 중심

USER:
거주지: {sigungu}
시술 유형: {treatment_type_label}
시술 예정: {treatment_month}
문의 목적: {inquiry_purposes_list}
답장 이메일: {reply_email}
수신: {contact_name} 님 ({health_center_name})

위 정보로 보건소 문의 메일 초안을 작성해주세요.
제목과 본문을 분리해서 JSON으로 응답하세요.
```

---

## 10. API 설계

### 10.1 엔드포인트 목록

| 메서드  | 경로                                 | 설명                    |
| ------- | ------------------------------------ | ----------------------- |
| `POST`  | `/api/v1/eligibility/evaluate`       | 자격 판단 실행          |
| `GET`   | `/api/v1/eligibility/{result_id}`    | 판단 결과 조회          |
| `GET`   | `/api/v1/policy/search`              | 정책 검색               |
| `POST`  | `/api/v1/inquiry/draft`              | 문의 메일 초안 생성     |
| `POST`  | `/api/v1/inquiry/send`               | 문의 발송 상태 저장     |
| `PATCH` | `/api/v1/inquiry/{thread_id}/status` | 문의 상태 업데이트      |
| `GET`   | `/api/v1/user/treatment-context`     | 시술 맥락 조회          |
| `PUT`   | `/api/v1/user/treatment-context`     | 시술 맥락 저장/업데이트 |

### 10.2 `POST /api/v1/eligibility/evaluate`

**Request:**

```json
{
  "user_id": "uuid",
  "profile": {
    "sido": "서울특별시",
    "sigungu": "강남구",
    "is_married": true,
    "is_defacto": false
  },
  "treatment_context": {
    "treatment_type": "ivf_fresh",
    "treatment_start_date": "2026-06-10",
    "treatment_stage": "planning",
    "has_infertility_diagnosis": true,
    "has_decision_notice": false,
    "support_attempt_count": 0,
    "drug_external_occurred": null
  }
}
```

**Response:**

```json
{
  "result_id": "uuid",
  "overall_status": "action_required",
  "overall_label": "즉시 확인이 필요해요",
  "policy_source": {
    "health_center": "강남구보건소",
    "contact_email": "maternal@gangnam.go.kr",
    "contact_phone": "02-3423-7000",
    "last_verified_at": "2026-05-28",
    "confidence": 0.85
  },
  "checks": [
    {
      "item": "거주지",
      "status": "confirmed",
      "note": "관할 보건소 확인됨"
    },
    {
      "item": "지원결정통지서",
      "status": "action_required",
      "note": "시술 시작 전 발급 필수 — 즉시 보건소 신청 권장",
      "days_until_treatment": 9
    }
  ],
  "support_amounts": {
    "ivf_fresh_limit": 1100000,
    "drug_external_covered": null,
    "note": "원외약제비 보건소 확인 필요"
  },
  "checklist": [
    {
      "id": "cl_001",
      "label": "지원결정통지서 신청",
      "sub": "강남구보건소 또는 e보건소 온라인",
      "priority": "urgent",
      "done": false
    }
  ],
  "inquiry_purposes": [
    "예산 잔여 여부",
    "지원결정통지서 발급 가능 여부",
    "시술 전 신청 가능 여부"
  ],
  "disclaimer": "이 결과는 공식 안내 기준의 가능성 분석이며, 최종 지원 여부와 금액은 관할 보건소의 지원결정통지서 발급으로 확정됩니다.",
  "generated_at": "2026-06-01T09:00:00Z",
  "expires_at": "2026-06-02T09:00:00Z"
}
```

### 10.3 `POST /api/v1/inquiry/draft`

**Request:**

```json
{
  "user_id": "uuid",
  "eligibility_result_id": "uuid",
  "inquiry_purposes": ["예산 잔여 여부", "지원결정통지서 발급 가능 여부"],
  "reply_email": "user@example.com"
}
```

**Response:**

```json
{
  "draft_id": "uuid",
  "recipient": {
    "name": "모자보건팀",
    "email": "maternal@gangnam.go.kr",
    "health_center": "강남구보건소"
  },
  "subject": "[문의] 난임부부 시술비 지원 관련 확인 요청",
  "body": "안녕하세요.\n강남구에 거주 중이며...",
  "privacy_note": "주민등록번호, 병원명, 진단서 내용은 포함되지 않았습니다."
}
```

---

## 11. UI 카드 구성

### 11.1 카드 목록 및 표시 조건

| 카드명                | 컴포넌트             | 표시 조건                      | 우선순위 |
| --------------------- | -------------------- | ------------------------------ | -------- |
| 긴급 배너             | `UrgentBanner`       | `action_required` 항목 존재 시 | 최상단   |
| 지원 가능성 카드      | `EligibilityCard`    | 항상                           | 1        |
| 지원 항목 카드        | `SupportItemsCard`   | 정책 데이터 있을 때            | 2        |
| 신청 체크리스트 카드  | `ChecklistCard`      | 항상                           | 3        |
| 보건소 문의 카드      | `HealthCenterCard`   | 연락처 정보 있을 때            | 4        |
| 문의 메일 초안 카드   | `MailDraftCard`      | 문의 목적 1개 이상             | 5        |
| 답변 대기 카드        | `InquiryWaitingCard` | 발송 완료 후                   | 6        |
| 보건소 답변 요약 카드 | `ReplyCard`          | 사용자 답변 입력 후            | 7        |
| 다음 액션 카드        | `NextActionCard`     | 체크리스트 완료 후             | 8        |
| 정보 없음 카드        | `NoDataCard`         | 정책 데이터 없을 때            | -        |

### 11.2 체크 항목 상태 배지 규격

```
확인됨     → 배경 #EAF5F0 / 텍스트 #3A8C6E / 점 #3A8C6E
확인 필요  → 배경 #FDF6E3 / 텍스트 #C89A2A / 점 #C89A2A
즉시 필요  → 배경 #FDF0EB / 텍스트 #D4622A / 점 #D4622A
불가 가능성 → 배경 #FAEAEA / 텍스트 #B03030 / 점 #B03030
해당 없음  → 배경 #F0F0F0 / 텍스트 #888888 / 점 #888888
```

### 11.3 하단 고정 면책 문구

모든 판단 결과 화면 하단에 고정 표시:

```
이 결과는 공식 안내 기준의 가능성 분석이며,
최종 지원 여부와 금액은 관할 보건소의
지원결정통지서 발급으로 확정됩니다.
예산 잔여 여부 및 접수 가능 여부는
반드시 보건소에 직접 확인하세요.
Fevio는 행정 대행 서비스가 아닙니다.
```

---

## 12. 안전 원칙 및 금지 표현

### 12.1 서버사이드 금지 표현 필터

```python
FORBIDDEN_PHRASES = [
    "지원 대상입니다",
    "100% 받을 수 있",
    "무조건 신청 가능",
    "보건소에 확인하지 않아도",
    "반드시 지원됩니다",
    "확실히 받을 수",
    "당연히 됩니다",
    "문제없이 신청",
    "걱정하지 않아도",
    "이미 확정",
]

def safety_check(text: str) -> dict:
    violations = [p for p in FORBIDDEN_PHRASES if p in text]
    return {
        "passed": len(violations) == 0,
        "violations": violations
    }
```

금지 표현 감지 시 응답 차단 → 안전 대체 문구 반환 → 내부 알림 발송.

### 12.2 권장 표현 패턴

| 상황             | 권장 표현                                                                  |
| ---------------- | -------------------------------------------------------------------------- |
| 지원 가능성 있음 | "현재 입력 정보와 공식 안내 기준으로 지원 가능성이 있습니다"               |
| 최종 확정        | "최종 지원 여부와 금액은 관할 보건소의 지원결정통지서 발급으로 확정됩니다" |
| 예산 확인        | "예산 잔여 여부는 관할 보건소 확인이 필요합니다"                           |
| 항목 불확실      | "이 항목은 지원 가능성이 있으나, 보건소 확인이 필요합니다"                 |
| 즉시 액션        | "시술 시작 전에 반드시 보건소에 확인하시기 바랍니다"                       |

---

## 13. MVP 범위

### 포함

- 서울시 25개 자치구 정책 데이터 (수동 구조화, `policy_structured`)
- 사용자 프로필 + 시술 맥락 입력 UI
- 자격 판단 엔진 (규칙 기반, `policy_structured` 데이터 사용)
- 지원 가능성 카드 출력
- 신청 체크리스트 카드 (체크 인터랙션 포함)
- 보건소 문의 카드 (담당자 이메일/전화 표시)
- 문의 메일 초안 생성 (LLM)
- 서버사이드 금지 표현 필터
- 고정 면책 문구

### 제외 (MVP 이후)

- RAG 벡터 검색 (pgvector)
- 자동 크롤러
- 타 시도 정책 데이터
- 문의 메일 직접 발송 기능
- 보건소 답변 수신/요약 자동화
- 소득 기준 자동 판단
- 사실혼 서류 가이드

---

## 14. V1 / V2 로드맵

### V1 (MVP + 3개월)

- RAG 벡터 검색 도입 (pgvector + OpenAI embedding)
- 전국 광역시 + 도청 소재지 시군구 정책 데이터 확장
- 자동 크롤러 (정부24, e보건소) 기본 구현
- 문의 메일 직접 발송 (이메일 전송 API 연동)
- 보건소 답변 사용자 수동 입력 + 요약 카드
- 체크리스트 알림 (D-7, D-3, D-1 푸시)

### V2 (V1 + 6개월)

- 전국 시군구 정책 데이터 완성
- 소득 기준 자동 판단 (건강보험료 기준 가이드)
- 보건소 유선 문의 스크립트 자동 생성
- 지원금 신청 이력 관리 (회차별 금액 추적)
- 지역별 정책 변경 감지 알림
- 사용자 커뮤니티 정보 교차 검증 레이어

---

## 15. 예시 응답 JSON

```json
{
  "result_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "overall_status": "action_required",
  "overall_label": "즉시 확인이 필요해요",
  "overall_description": "대부분의 조건은 충족되었으나, 시술 시작 전 처리해야 할 항목이 있습니다.",
  "policy_source": {
    "health_center": "강남구보건소",
    "dept": "모자보건팀",
    "contact_email": "maternal@gangnam.go.kr",
    "contact_phone": "02-3423-7000",
    "source_url": "https://www.gangnam.go.kr/health",
    "last_verified_at": "2026-05-28",
    "confidence": 0.85
  },
  "checks": [
    {
      "id": "check_region",
      "item": "거주지",
      "status": "confirmed",
      "label": "확인됨",
      "note": "관할 보건소 확인됨"
    },
    {
      "id": "check_marriage",
      "item": "혼인 상태",
      "status": "confirmed",
      "label": "확인됨",
      "note": "법적 혼인 조건 충족"
    },
    {
      "id": "check_treatment",
      "item": "시술 유형",
      "status": "confirmed",
      "label": "확인됨",
      "note": "체외수정 신선배아 — 지원 상한 최대 1,100,000원"
    },
    {
      "id": "check_diagnosis",
      "item": "난임진단서",
      "status": "confirmed",
      "label": "확인됨",
      "note": "서류 보유 확인됨"
    },
    {
      "id": "check_notice",
      "item": "지원결정통지서",
      "status": "action_required",
      "label": "즉시 액션 필요",
      "note": "시술 시작 전 발급 필수 — 즉시 보건소 신청 권장",
      "days_until_treatment": 9
    },
    {
      "id": "check_timing",
      "item": "신청 시점",
      "status": "action_required",
      "label": "즉시 액션 필요",
      "note": "D-9 — 시술 전 신청 기한 임박"
    },
    {
      "id": "check_budget",
      "item": "예산",
      "status": "needs_check",
      "label": "확인 필요",
      "note": "예산 잔여 여부는 보건소 직접 확인 필요"
    },
    {
      "id": "check_attempt",
      "item": "지원 횟수",
      "status": "confirmed",
      "label": "확인됨",
      "note": "첫 번째 신청"
    }
  ],
  "support_amounts": {
    "ivf_fresh_limit": 1100000,
    "ivf_frozen_limit": 700000,
    "iui_limit": 300000,
    "drug_external_covered": null,
    "non_covered_possible": ["마취비", "검사비 일부"],
    "non_covered_excluded": ["배아동결비", "착상전유전검사", "선택진료비"]
  },
  "checklist": [
    {
      "id": "cl_001",
      "label": "난임진단서 발급",
      "sub": "병원에서 발급",
      "priority": "done",
      "done": true
    },
    {
      "id": "cl_002",
      "label": "지원결정통지서 신청",
      "sub": "강남구보건소 또는 e보건소 온라인",
      "priority": "urgent",
      "done": false,
      "deadline": "2026-06-09"
    },
    {
      "id": "cl_003",
      "label": "예산 잔여 여부 확인",
      "sub": "보건소 전화 또는 이메일 문의",
      "priority": "urgent",
      "done": false
    },
    {
      "id": "cl_004",
      "label": "주민등록등본 발급",
      "sub": "정부24 또는 주민센터",
      "priority": "normal",
      "done": false
    },
    {
      "id": "cl_005",
      "label": "혼인관계증명서 준비",
      "sub": "가족관계증명서 대체 가능 여부 확인",
      "priority": "normal",
      "done": false
    },
    {
      "id": "cl_006",
      "label": "통지서 병원 제출",
      "sub": "발급 후 시술 전 병원 제출",
      "priority": "normal",
      "done": false
    }
  ],
  "inquiry_purposes": [
    "예산 잔여 여부",
    "지원결정통지서 발급 가능 여부",
    "시술 전 신청 가능 기한"
  ],
  "disclaimer": "이 결과는 공식 안내 기준의 가능성 분석이며, 최종 지원 여부와 금액은 관할 보건소의 지원결정통지서 발급으로 확정됩니다. 예산 잔여 여부 및 접수 가능 여부는 반드시 보건소에 직접 확인하세요.",
  "generated_at": "2026-06-01T09:00:00Z",
  "expires_at": "2026-06-02T09:00:00Z"
}
```

---

## 16. 예시 화면 문구

### 히어로 / 상단 요약

```
[지원 가능성 높음]
"지원 신청을 검토할 수 있는 상태예요"

[즉시 확인 필요]
"시술 시작 전에 확인해야 할 일이 있어요"

[지원 가능성 불확실]
"확인이 필요한 항목이 많아요 — 보건소 문의를 추천해요"

[정보 없음]
"해당 지역 정책 정보를 찾지 못했어요
강남구보건소에 직접 문의해주세요"
```

### 긴급 배너

```
⚡ 시술 전 통지서 발급이 필요해요
강남구 보건소 확인 기준, 시술 시작 전에
지원결정통지서를 받아야 지원금 신청이 가능합니다. D-9
```

### 체크 항목 문구

```
✅ 확인됨: 관할 보건소 확인됨
✅ 확인됨: 체외수정 신선배아 — 지원 상한 최대 1,100,000원
⚡ 즉시 액션 필요: 시술 시작 전 발급 필수 — 즉시 보건소 신청 권장
❓ 확인 필요: 예산 잔여 여부는 보건소 직접 확인 필요
```

### 보건소 문의 버튼 레이블

```
💰 예산이 아직 남아있는지 확인할게요
📋 통지서 발급이 가능한지 확인할게요
📁 필요한 서류를 다시 확인할게요
💊 원외약제비 청구 가능 여부 확인
```

### 메일 초안 예시

```
수신: 강남구보건소 모자보건팀 maternal@gangnam.go.kr
제목: [문의] 난임부부 시술비 지원 관련 확인 요청

안녕하세요.
강남구에 거주 중이며, 2026년 6월경 체외수정(신선배아)
시술을 앞두고 있습니다.

아래 사항을 문의드립니다.

1. 현재 2026년도 난임부부 시술비 지원 예산 잔여 여부
2. 시술 시작 전 지원결정통지서 발급 가능 여부 및 절차
3. 시술 전 신청 시 필요한 서류 목록

답변은 아래 이메일로 받겠습니다: user@example.com

바쁘신 중에도 확인해 주셔서 감사합니다.
```

### 면책 문구 (하단 고정)

```
⚠️ 이 결과는 공식 안내 기준의 가능성 분석이며,
최종 지원 여부와 금액은 관할 보건소의
지원결정통지서 발급으로 확정됩니다.
Fevio는 행정 대행 서비스가 아닙니다.
```

---

## 17. 미결 사항

| #   | 항목                 | 결정 필요 사항                            | 담당            | 기한   |
| --- | -------------------- | ----------------------------------------- | --------------- | ------ |
| 1   | 정책 데이터 수집     | 크롤링 자동화 vs 수동 업데이트 범위 결정  | 엔지니어링      | MVP 전 |
| 2   | 이메일 발송 방식     | 직접 발송 API vs 클립보드 복사 방식       | PM              | MVP 전 |
| 3   | 사실혼 판단          | 사실혼 사용자 플로우 별도 설계 필요       | 디자인          | V1     |
| 4   | 소득 기준 자동화     | 건강보험료 조회 연동 가능 여부            | 법무/엔지니어링 | V1     |
| 5   | 정책 데이터 신뢰도   | 수동 검증 프로세스 및 담당자 지정         | 운영            | MVP 전 |
| 6   | 개인정보 처리방침    | 메일 초안 생성 시 개인정보 범위 법무 검토 | 법무            | MVP 전 |
| 7   | 보건소 연락처 정확도 | 연락처 오류 시 사용자 신고 채널 마련      | PM              | MVP 전 |

---
