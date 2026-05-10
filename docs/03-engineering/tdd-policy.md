# TDD Policy — Fevio [페비오]

이 문서는 CLAUDE.md의 "Verification model"과 "Behavioral coding discipline"을 테스트 작성 수준에서 구체화한다.
모든 개발자와 Codex 에이전트는 이 정책을 PR 리뷰 기준으로 삼는다.

## 핵심 원칙

1. **Red first** — 테스트를 먼저 작성하고 실패를 확인한 뒤 구현한다.
2. **Type-level = runtime-level** — 타입 계약도 `expectTypeOf`로 검증한다. 타입이 테스트 없이 바뀌는 것은 breaking change다.
3. **경계가 의미 있는 곳에 경계 테스트를** — happy path만 있는 테스트 파일은 불완전하다.
4. **Immutability 증명** — 순수 함수는 원본을 변경하지 않음을 테스트로 증명한다.
5. **Error path는 throw 메시지까지** — `toThrow('정확한 메시지 일부')` 수준이어야 한다.

---

## 필수 테스트 체크리스트 (PR 머지 전)

도메인 순수 함수(`src/domain/`, `src/utils/`)를 변경하거나 신규 작성할 때:

### 1. Happy path

```typescript
it('함수가 예상 출력을 반환한다', () => {
  const result = myPureFunction(validInput);
  expect(result).toMatchObject(expectedShape);
});
```

### 2. Idempotency (해당 함수가 멱등성을 가져야 할 경우)

```typescript
it('동일 입력에 두 번 호출해도 결과가 같다', () => {
  const first = myPureFunction(input);
  const second = myPureFunction(input, { existing: first });
  expect(second).toBe(first); // reference equality — 새 객체 생성 금지
});
```

### 3. Immutability

```typescript
it('원본 입력을 변경하지 않는다', () => {
  const original = { ...input };
  myPureFunction(input);
  expect(input).toEqual(original);
});
```

또는 state transition 함수:

```typescript
it('반환값은 새 객체이고 원본 state는 변경되지 않는다', () => {
  const next = transition(state, event);
  expect(next).not.toBe(state);
  expect(state.field).toBeNull(); // 원본 확인
});
```

### 4. Error path

```typescript
it('잘못된 입력에서 의미 있는 에러를 던진다', () => {
  expect(() => assertX(null)).toThrow('정확한 에러 메시지 일부');
  expect(() => assertX(undefined)).toThrow('정확한 에러 메시지 일부');
});

it('정상 입력에서 throw하지 않는다', () => {
  expect(() => assertX(validInput)).not.toThrow();
});
```

### 5. 경계값 (null / undefined / 빈 문자열)

```typescript
it('null, undefined, 빈 문자열을 안전하게 처리한다', () => {
  expect(canCheck(null)).toBe(false);
  expect(canCheck(undefined)).toBe(false);
  expect(canCheck({ field: null })).toBe(false);
  // 빈 문자열이 타입상 string이지만 falsy인 경우 명시적 확인
  expect(canCheck({ field: '' as unknown as null })).toBe(false);
});
```

### 6. Type-level assertions (`expectTypeOf`)

**모든 public 함수에 최소 1개 이상.**

```typescript
import { expectTypeOf } from 'vitest';

it('반환 타입이 선언된 타입과 일치한다', () => {
  expectTypeOf(myFunction).returns.toMatchTypeOf<ExpectedReturnType>();
});

it('파라미터 타입이 올바르게 제약된다', () => {
  expectTypeOf(myFunction).parameter(0).toMatchTypeOf<InputType>();
});

it('const 리터럴 타입이 widened되지 않는다', () => {
  expectTypeOf(MY_CONST).toEqualTypeOf<'exact-literal-value'>();
});
```

---

## 타입 설계 강화 규칙

### 브랜드 타입 (도메인 식별자)

단순 `string` 대신 브랜드 타입을 사용한다. 파라미터 순서 교체 버그를 컴파일러가 잡는다.

```typescript
// ❌ 금지
type UserId = string;
type IsoTimestamp = string;

// ✅ 권장
type UserId = string & { readonly __brand: 'UserId' };
type IsoTimestamp = string & { readonly __brand: 'IsoTimestamp' };
```

> **예외**: SLC P0 단계에서 기존 코드가 이미 plain `string`을 사용하는 경우, 별도 리팩터 이슈를 생성하고 해당 이슈에서 일괄 전환한다. 브랜드 타입 추가를 위해 P0 이슈를 블로킹하지 않는다.

### Discriminated Union (상태 머신)

nullable 필드로 상태를 표현하는 대신 discriminated union을 사용한다.
컴파일러가 `canCreateSensitiveRow()` 같은 런타임 guard 없이 상태를 보장한다.

```typescript
// ❌ 금지 — nullable 필드로 상태 표현
type CoupleState = {
  privacyGateAcceptedAt: string | null;
  // ...
};

// ✅ 권장 — discriminated union
type CoupleState =
  | { phase: 'pre_privacy'; privacyGateAcceptedAt: null }
  | { phase: 'active'; privacyGateAcceptedAt: string };
```

> **예외**: 기존 `CoupleState`처럼 DB 스키마와 1:1 매핑이 필요한 경우, 런타임 guard(`canCreateSensitiveRow`)를 유지하되 type-level 테스트로 반환 타입을 검증한다.

### `satisfies` 연산자

리터럴 타입이 widened되지 않도록 `as const satisfies T`를 사용한다.

```typescript
// ✅ 권장
const CONFIG = {
  version: 'v1.0-slc',
  channel: 'email',
} as const satisfies Record<string, string>;
```

---

## E2E 테스트 기준

UI/route를 변경하거나 신규 작성할 때:

```typescript
// 반드시 포함할 것
test('보호된 route는 gate 전에 진입을 차단한다', async ({ page }) => {
  await page.goto('/protected-route');
  await expect(page).toHaveURL('/gate-route');
});

test('gate 통과 후 올바른 경로로 redirect된다', async ({ page }) => {
  // gate accept action
  await expect(page).toHaveURL('/expected-next-route');
});

test('microcopy와 핵심 UI 요소가 보인다', async ({ page }) => {
  // 화면별 acceptance criteria 텍스트/역할 확인
});
```

---

## 적용 범위

| 레이어 | 필수 테스트 종류 |
|---|---|
| `src/domain/`, `src/utils/` | happy path + 경계 + error path + idempotency/immutability + `expectTypeOf` |
| `src/services/` | integration test (실제 DB 또는 mock-db) + contract test (schema 일치) |
| `app/api/` route handlers | integration test (request/response shape) |
| `app/` page components | e2e smoke (핵심 요소 존재) + route guard |
| `src/types/` | `expectTypeOf` only (runtime test 불필요) |

---

## PR 머지 거부 기준

다음 중 하나라도 해당하면 PR을 머지하지 않는다.

- [ ] public 함수에 `expectTypeOf` 없음
- [ ] error path(`throw`/`assertX`) 미검증
- [ ] 멱등성이 요구되는 함수의 reference equality 미검증
- [ ] 순수 함수의 immutability 미검증
- [ ] 경계값(null/undefined/빈 문자열) 미검증
- [ ] `any` 사용 (strict 모드 예외 없음)
- [ ] 테스트 없이 public 함수 삭제·리네임

---

## 참고

- [Matt Pocock — Type-level testing with `expectTypeOf`](https://www.totaltypescript.com/expecttypeof)
- [Vitest `expectTypeOf` docs](https://vitest.dev/api/expect-typeof)
- CLAUDE.md — Verification model 섹션
- `tests/unit/auth-privacy.test.ts` — 참조 구현 (13개 테스트, type-level 포함)
