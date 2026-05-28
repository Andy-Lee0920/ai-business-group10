# Fevio SLC — Codex 구현 지침

이 파일은 Codex가 `slc-today-execution-loop` 브랜치에서 GitHub 이슈를 TDD로 해결할 때 사용하는 작업 지침이다.
제품 철학과 안티패턴은 `AGENTS.md`에 있다. 이 파일은 **무엇을 어떻게 만드는가**에 집중한다.

---

## 0. 작업 목적

Fevio SLC는 IVF 치료 중인 사용자가 오늘의 투약·주사 일정을 보고, 완료를 빠르게 기록하고, 병원 방문 후 변경사항을 반영하며, 파트너가 같은 상태를 read-only로 확인할 수 있게 하는 모바일 웹앱이다.

IVF 전체를 설명하는 앱이 아니다.
오늘의 실행 혼선을 줄이는 데 집중한다.

핵심 실행 루프:

```
오늘 일정 확인
→ 주사/복용 완료
→ 기록 저장
→ 병원 변경 반영
→ 파트너 공유 상태 노출
```

---

## 1. 브랜치 및 환경

```
브랜치: slc-today-execution-loop
작업 디렉토리: ai-business-group10/
Vercel: .vercel/project.json 존재 (기존 프로젝트 연결됨)
Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수 설정됨
```

---

## 2. 이슈별 실행 순서

```
즉시 시작 가능:
  #2  chore: TS 오류 수정 + legacy imports 제거
  #3  feat: Privacy Gate + Consent 진입 루프
  #9  chore: 레거시 라우트 비활성화
  #11 chore: SLC 디자인 토큰 통일

#3 완료 후 병렬 진행:
  #4  feat: Today Execution Loop
  #5  feat: Clinic Update Loop
  #6  feat: Partner Awareness Loop
  #7  feat: Seed Mode 분리

#4 완료 후:
  #10 feat: 오늘/내일/모레 탭

전체 완료 후 (HITL):
  #8  deploy: Vercel 배포 + 12개 Acceptance Test
```

---

## 3. TDD 작업 방식

각 이슈를 아래 순서로 해결한다.

### 3.1 이슈 시작 전 체크

```bash
git status                          # 브랜치 확인
npx tsc --noEmit 2>&1 | head -20   # 기존 TS 오류 확인
```

### 3.2 Red → Green → Refactor 사이클

**Red**: 먼저 실패하는 테스트를 작성한다.

```typescript
// tests/unit/예시.test.ts
import { computeStatus } from '../../src/types/slc.types';

test('15분 이내면 due_soon 반환', () => {
  const scheduledAt = new Date(Date.now() + 10 * 60_000).toISOString();
  expect(computeStatus(scheduledAt)).toBe('due_soon');
});

test('15분 초과면 upcoming 반환', () => {
  const scheduledAt = new Date(Date.now() + 20 * 60_000).toISOString();
  expect(computeStatus(scheduledAt)).toBe('upcoming');
});
```

**Green**: 테스트를 통과시키는 최소 구현을 작성한다.

**Refactor**: 중복 제거, 200줄 제한 준수, any 제거.

### 3.3 각 이슈의 완료 기준 검증

```bash
# 타입 검사
npx tsc --noEmit

# 단위 테스트
npm test

# 빌드
npm run build
```

---

## 4. 기존 파일 상태

### 4.1 이미 존재하는 파일 — 덮어쓰지 말 것

```
src/types/slc.types.ts
src/components/countdown-ring.tsx
src/components/action-card.tsx
src/components/bottom-nav.tsx
src/components/confirm-sheet.tsx       ← placeholder div → PNG로 교체 필요 (#4)
src/features/today/today-screen.tsx
src/features/records/records-screen.tsx
src/features/clinic-update/clinic-update-form.tsx
src/features/more/more-screen.tsx
src/features/add/manual-add-form.tsx
src/features/onboarding/onboarding-screen.tsx
src/features/partner/partner-view.tsx
app/api/schedule/route.ts              ← GET only
app/api/schedule/complete/route.ts
app/api/schedule/add/route.ts
app/api/records/route.ts
app/api/clinic-update/route.ts
app/api/partner/invite/route.ts
app/api/partner/approve/route.ts
app/api/onboarding/route.ts
supabase/migrations/202605130001~6_slc_*.sql
public/assets/slc/abdomen-front.png   ← crop 완료
public/assets/slc/home-*-bg.png       ← 3종 crop 완료
public/assets/slc/partner-*.png       ← 2종 crop 완료
public/assets/slc/onboarding-hero.png
```

### 4.2 교체 대상 파일 — 반드시 Read 후 Edit/Write

```
app/(authed)/home/page.tsx             ← 기존 338줄 care-OS 완전 교체 (#4)
app/(authed)/layout.tsx                ← div wrapper → consent check + BottomNav (#3)
app/onboarding/page.tsx                ← interview → role selection (#3)
app/privacy/page.tsx                   ← 복잡한 약관 → 3문장 경량화 (#3)
```

### 4.3 빈 파일 — 내용 추가

```
app/(authed)/records/page.tsx          (#4)
app/(authed)/clinic-update/page.tsx    (#5)
app/(authed)/more/page.tsx             (#5)
app/(authed)/add/page.tsx              (#5)
app/(authed)/partner/page.tsx          (#6)
app/invite/[code]/page.tsx             (#6)
```

### 4.4 레거시 → redirect (#9)

```
app/capture/page.tsx
app/emotion/page.tsx
app/keyword-review/page.tsx
app/split-review/page.tsx
app/protocol/page.tsx
app/(authed)/settings/sharing/page.tsx
```

---

## 5. 기존 인프라 재사용

```typescript
// Supabase 클라이언트 (서버 컴포넌트)
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

// 사용 예
const supabase = await createCookieBackedSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
```

미들웨어(`middleware.ts`)가 이미 인증 리다이렉트를 처리한다.
`(authed)/layout.tsx`에 별도 auth 체크가 필요 없다.

---

## 6. 이슈별 구현 상세

### #2 — TS 오류 수정 + legacy imports 제거

**테스트 작성 불필요. 직접 수정.**

```bash
# 오류 확인
npx tsc --noEmit 2>&1

# 수정 대상
# 1. tests/unit/schedule-input-route.test.ts
#    → POST import 제거 또는 테스트 삭제
# 2. app/layout.tsx
#    → import './capture-flow.css' 제거

# 검증
npx tsc --noEmit
```

---

### #3 — Privacy Gate + Consent 진입 루프

#### 마이그레이션 추가

```sql
-- supabase/migrations/202605130007_slc_user_consents.sql
create table if not exists user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'partner')),
  consent_version text not null default 'slc-v1',
  sensitive_data_accepted_at timestamptz not null,
  medical_disclaimer_accepted_at timestamptz not null,
  partner_sharing_accepted_at timestamptz,
  created_at timestamptz default now()
);

alter table user_consents enable row level security;
create policy "own_consent" on user_consents
  for all using (auth.uid() = user_id);
```

#### /privacy 교체

3문장 + CTA 1개 + 쿠키 저장.

```
문구:
Fevio는 서비스 제공을 위해 로그인 상태와 기본 사용 설정을 저장합니다.
앱에서는 이후 사용자가 직접 입력한 일정, 약명, 완료 여부 같은 정보가 저장될 수 있습니다.
자세한 내용은 개인정보 안내에서 확인할 수 있습니다.

CTA: 확인하고 계속
쿠키: fevio_privacy_gate_v1=accepted
redirect: /onboarding (또는 next 파라미터)
```

체크박스 없음. 긴 약관 없음.

#### /onboarding 교체

기존 interview 방식 제거. role 선택 + 동의 체크박스로 교체.

```
Patient 동의 체크박스 (3개):
□ Fevio는 의료 판단을 하지 않으며, 병원에서 받은 처방과 직접 입력한 일정만 기록합니다.
□ 약명, 시간, 완료 여부, 병원 방문 일정이 저장될 수 있음을 이해했습니다.
□ 파트너를 연결하면 오늘 일정과 완료 상태가 read-only로 공유될 수 있음을 이해했습니다.

CTA: 동의하고 시작하기

Partner 동의 체크박스 (3개):
□ Fevio는 의료 판단을 하지 않으며, 치료자의 입력 정보를 read-only로 보여줍니다.
□ 나는 처방을 수정하거나 의료적 판단을 대신하지 않습니다.
□ 치료자가 공유한 오늘 일정과 완료 상태만 확인할 수 있음을 이해했습니다.

CTA: 동의하고 연결하기
```

저장:
- `user_profiles` upsert (role)
- `user_consents` insert

/onboarding은 반드시 `app/onboarding/page.tsx`에 유지. `(authed)` 그룹 밖.

#### (authed)/layout.tsx 교체

```typescript
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: consent } = await supabase
    .from('user_consents')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!consent) redirect('/onboarding');

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#FAF7F4' }}>
      <main style={{ paddingBottom: 80 }}>{children}</main>
      {consent.role === 'patient' && <BottomNav />}
    </div>
  );
}
```

#### TDD

```typescript
// tests/unit/consent-guard.test.ts
import { computeConsentRedirect } from '../../src/lib/consent-guard';

test('consent 없으면 /onboarding 반환', () => {
  expect(computeConsentRedirect(null)).toBe('/onboarding');
});

test('consent 있으면 null 반환', () => {
  expect(computeConsentRedirect({ role: 'patient' })).toBeNull();
});
```

---

### #4 — Today Execution Loop

#### home/page.tsx 교체

기존 338줄 care-OS 파일을 완전히 교체한다.

```typescript
// app/(authed)/home/page.tsx
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { TodayScreen } from '../../../src/features/today/today-screen';
import type { ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // role guard
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'partner') redirect('/partner');

  // 오늘 일정만 fetch (legacy query params 무시)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const { data: items } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('patient_id', user.id)
    .gte('scheduled_at', todayStart.toISOString())
    .lte('scheduled_at', todayEnd.toISOString())
    .order('scheduled_at', { ascending: true });

  return <TodayScreen initialItems={(items ?? []) as ScheduleItem[]} userId={user.id} />;
}
```

금지: `?care=clinic` 등 legacy query 분기.
금지: slcMode, demoMode, featureFlag prop.

#### confirm-sheet.tsx 업데이트

placeholder div 제거 → `abdomen-front.png` + 4분할 invisible touch zone.

```tsx
<div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
  <img
    src="/assets/slc/abdomen-front.png"
    alt="주사 위치 선택"
    style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' }}
    draggable={false}
  />
  {/* 4분할 invisible touch zone */}
  <button aria-label="왼쪽 위 주사 위치" onClick={() => onComplete('upper_left')}
    style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '50%',
             background: 'transparent', border: 'none', cursor: 'pointer' }} />
  <button aria-label="오른쪽 위 주사 위치" onClick={() => onComplete('upper_right')}
    style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '50%',
             background: 'transparent', border: 'none', cursor: 'pointer' }} />
  <button aria-label="왼쪽 아래 주사 위치" onClick={() => onComplete('lower_left')}
    style={{ position: 'absolute', left: 0, bottom: 0, width: '50%', height: '50%',
             background: 'transparent', border: 'none', cursor: 'pointer' }} />
  <button aria-label="오른쪽 아래 주사 위치" onClick={() => onComplete('lower_right')}
    style={{ position: 'absolute', right: 0, bottom: 0, width: '50%', height: '50%',
             background: 'transparent', border: 'none', cursor: 'pointer' }} />
</div>
```

별도 완료 버튼 없음. 위치 탭 = 즉시 완료.

SVG fallback 금지. object-position sprite 금지.

#### records page 연결

```typescript
// app/(authed)/records/page.tsx
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { RecordsScreen } from '../../../src/features/records/records-screen';

export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [itemsRes, completionsRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', user.id)
      .gte('scheduled_at', since).order('scheduled_at', { ascending: false }),
    supabase.from('completion_records').select('*').eq('patient_id', user.id)
      .gte('completed_at', since).order('completed_at', { ascending: false }),
  ]);

  return <RecordsScreen items={itemsRes.data ?? []} completions={completionsRes.data ?? []} />;
}
```

#### TDD

```typescript
// tests/unit/schedule-status.test.ts
import { computeStatus } from '../../src/types/slc.types';

test('15분 이내: due_soon', () => {
  const at = new Date(Date.now() + 10 * 60_000).toISOString();
  expect(computeStatus(at)).toBe('due_soon');
});

test('15분 초과: upcoming', () => {
  const at = new Date(Date.now() + 20 * 60_000).toISOString();
  expect(computeStatus(at)).toBe('upcoming');
});

test('시간 지남: missed', () => {
  const at = new Date(Date.now() - 60 * 60_000).toISOString();
  expect(computeStatus(at)).toBe('missed');
});
```

---

### #5 — Clinic Update Loop + Manual Add

#### clinic-update page 연결

```typescript
// app/(authed)/clinic-update/page.tsx
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { ClinicUpdateForm } from '../../../src/features/clinic-update/clinic-update-form';

export default async function ClinicUpdatePage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: medications } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, default_unit, default_cta')
    .eq('is_slc_seed', true);

  return <ClinicUpdateForm medications={medications ?? []} />;
}
```

#### 다음 방문일 prefill 로직 (TDD)

```typescript
// tests/unit/clinic-update.test.ts
import { computeNextVisitDefault } from '../../src/lib/clinic-update-helpers';

test('2일치 입력 시 2일 뒤 날짜 반환', () => {
  const base = new Date('2026-05-14');
  const result = computeNextVisitDefault(base, 2);
  expect(result).toBe('2026-05-16');
});

test('3일치 입력 시 3일 뒤 날짜 반환', () => {
  const base = new Date('2026-05-14');
  const result = computeNextVisitDefault(base, 3);
  expect(result).toBe('2026-05-17');
});
```

```typescript
// src/lib/clinic-update-helpers.ts
export function computeNextVisitDefault(from: Date, days: number): string {
  const date = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
```

---

### #6 — Partner Awareness Loop

#### invite/[code]/page.tsx 구현

```typescript
// app/invite/[code]/page.tsx
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/sign-in?next=/invite/${code}`);

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();

  if (profile) redirect('/home');

  redirect(`/onboarding?invite=${code}`);
}
```

#### partner page 연결

```typescript
// app/(authed)/partner/page.tsx
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { PartnerView } from '../../../src/features/partner/partner-view';

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'partner') redirect('/home');

  const { data: link } = await supabase
    .from('partner_links').select('patient_id, status')
    .eq('partner_id', user.id).single();

  if (!link || link.status !== 'approved') {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 17, fontWeight: 600, color: '#2A1F1A', marginBottom: 8 }}>연결 대기 중</p>
        <p style={{ fontSize: 14, color: '#9B8E86' }}>파트너가 요청을 승인하면 오늘 일정을 볼 수 있어요</p>
      </div>
    );
  }

  const patientId = link.patient_id;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const [itemsRes, completionsRes, clinicRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', patientId)
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase.from('completion_records').select('*').eq('patient_id', patientId)
      .gte('completed_at', todayStart.toISOString()),
    supabase.from('clinic_updates').select('*').eq('patient_id', patientId)
      .order('created_at', { ascending: false }).limit(1),
  ]);

  return (
    <PartnerView
      items={itemsRes.data ?? []}
      completions={completionsRes.data ?? []}
      latestClinicUpdate={clinicRes.data?.[0] ?? null}
    />
  );
}
```

---

### #7 — Seed Mode 분리

#### TDD 먼저

```typescript
// tests/unit/seed-mode.test.ts
import { getPresentationSeedItems, getProductionSeedItems } from '../../src/lib/seed-helpers';

test('presentation mode: Menopur가 10분 이내', () => {
  const items = getPresentationSeedItems('test-user');
  const menopur = items.find((it) => it.title.includes('Menopur'));
  expect(menopur).toBeDefined();
  const diff = new Date(menopur!.scheduled_at).getTime() - Date.now();
  expect(diff).toBeGreaterThan(9 * 60_000);
  expect(diff).toBeLessThan(12 * 60_000);
});

test('production mode: Menopur가 06:30', () => {
  const items = getProductionSeedItems('test-user');
  const menopur = items.find((it) => it.title.includes('Menopur'));
  expect(menopur).toBeDefined();
  const time = new Date(menopur!.scheduled_at);
  const kstOffset = 9 * 60;
  const kstMinutes = (time.getUTCHours() * 60 + time.getUTCMinutes() + kstOffset) % (24 * 60);
  expect(kstMinutes).toBe(6 * 60 + 30);
});
```

#### 구현

```typescript
// src/lib/seed-helpers.ts
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function getNextKstTimeAt(hour: number, minute: number): Date {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60_000);
  const target = new Date(kstNow);
  target.setUTCHours(hour - 9, minute, 0, 0);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
  return target;
}

export function getPresentationSeedItems(patientId: string) {
  const now = new Date();
  return [
    { patient_id: patientId, medication_id: 'menopur', type: 'injection' as const,
      title: 'Menopur 150 IU', dose: '150', unit: 'IU',
      scheduled_at: addMinutes(now, 10).toISOString(), status: 'upcoming' as const, source: 'seed' as const },
    { patient_id: patientId, medication_id: 'cetrotide', type: 'injection' as const,
      title: 'Cetrotide 0.25 mg', dose: '0.25', unit: 'mg',
      scheduled_at: addMinutes(now, 45).toISOString(), status: 'upcoming' as const, source: 'seed' as const },
  ];
}

export function getProductionSeedItems(patientId: string) {
  return [
    { patient_id: patientId, medication_id: 'menopur', type: 'injection' as const,
      title: 'Menopur 150 IU', dose: '150', unit: 'IU',
      scheduled_at: getNextKstTimeAt(6, 30).toISOString(), status: 'upcoming' as const, source: 'seed' as const },
  ];
}
```

금지: `TodayScreen`, `CountdownRing`, `ConfirmSheet` 안에서 presentationMode 분기.

---

### #9 — 레거시 라우트 비활성화

각 파일을 Read 후 아래 내용으로 교체:

```typescript
import { redirect } from 'next/navigation';
export default function Page() { redirect('/home'); }
```

대상:
- `app/capture/page.tsx`
- `app/emotion/page.tsx`
- `app/keyword-review/page.tsx`
- `app/split-review/page.tsx`
- `app/protocol/page.tsx`
- `app/(authed)/settings/sharing/page.tsx`

---

### #10 — 오늘/내일/모레 탭

home/page.tsx에서 3일치 일정을 한 번에 fetch한다:

```typescript
const dayStart = (offset: number) => {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};
const dayEnd = (offset: number) => {
  const d = new Date(); d.setHours(23, 59, 59, 999);
  d.setDate(d.getDate() + offset);
  return d;
};

const { data: items } = await supabase
  .from('schedule_items')
  .select('*')
  .eq('patient_id', user.id)
  .gte('scheduled_at', dayStart(0).toISOString())
  .lte('scheduled_at', dayEnd(2).toISOString())
  .order('scheduled_at', { ascending: true });
```

TodayScreen에서 `selectedDay` 기준으로 filter:

```typescript
const todayItems = items.filter((it) => isOnDay(it.scheduled_at, 0));
const tomorrowItems = items.filter((it) => isOnDay(it.scheduled_at, 1));
const dayAfterItems = items.filter((it) => isOnDay(it.scheduled_at, 2));
```

CountdownRing은 오늘 탭에서만.

---

### #11 — 디자인 토큰 통일

`app/globals.css` 상단에 추가:

```css
:root {
  --slc-bg: #FAF7F4;
  --slc-surface: #FCEEE8;
  --slc-coral: #C4614A;
  --slc-coral-light: #FFF0EB;
  --slc-border: #F0EDE8;
  --slc-text: #2A1F1A;
  --slc-muted: #9B8E86;
  --slc-card: #FFFFFF;
}
```

`app/layout.tsx` Viewport themeColor:

```typescript
export const viewport: Viewport = {
  themeColor: '#C4614A',
  // ...
};
```

---

## 7. 공통 코딩 규칙

### 7.1 절대 금지

```
any 타입 사용
slcMode / demoMode / presentationMode — UI 컴포넌트 안에 넣기
default export
200줄 초과 파일
빈 catch block: catch (e) {}
console.log 에러 처리
process.env 직접 참조 (src/lib/env.ts 또는 서버 컴포넌트 내부에서만)
```

### 7.2 CTA 언어 고정

| 상황 | CTA | 완료 상태 |
|------|-----|----------|
| 주사제 | 주사하기 | 주사 완료 |
| 복용약 | 복용하기 | 복용 완료 |
| 병원 일정 | 방문 확인 | 방문 완료 |
| 병원 후 변경 | 업데이트하기 | 변경 저장 |
| 직접 입력 | 일정 추가 | 일정 추가됨 |

금지: `접종하기`, `투여하기`, `처치하기`

### 7.3 파트너 문장 형식

```
오늘 06:30 Menopur 주사를 완료했어요.
다음 일정은 19:00 Cetrotide입니다.
오늘 병원 방문 후 다음 일정이 변경됐어요.
오늘은 확인만 하면 됩니다.
```

금지: `아내를 응원해주세요`, `이렇게 말하세요`, 의학 설명, 처방 편집 CTA.

### 7.4 의료 판단 금지

앱은 절대 다음을 하지 않는다:

- 약 용량 추론
- 투약 시간 추론
- 치료 단계 확정
- 의학 조언
- 병원 처방 해석

저장은 **사용자가 선택하거나 입력한 값**만.

---

## 8. 이슈 완료 기준

각 이슈 완료 전 다음 4가지를 통과해야 한다:

```bash
npx tsc --noEmit          # 타입 오류 0개
npm test                  # 단위 테스트 통과
npm run build             # 빌드 성공
```

URL-action-result 형식으로 검증 증거 첨부:

```
/home에서 patient가 '주사하기'를 탭했을 때 bottom sheet가 열린다.
/partner에서 partner가 접근했을 때 오늘 완료 상태가 read-only로 보인다.
```

---

## 9. 12개 Acceptance Criteria (최종 검증)

```
1. Patient Google Login 성공
2. Home에서 오늘 Menopur 150 IU 확인
3. 15분 전 Countdown Ring 표시
4. 주사하기 탭
5. bottom sheet 열림
6. 복부 오른쪽 아래 탭
7. completion_records insert 확인
8. Home 카드 완료 처리
9. Records에서 완료 기록 확인
10. Clinic Update 새 약 + 2일치 입력
11. 다음 방문일 2일 뒤 prefill + 수정 가능
12. Partner View 완료 상태 + 다음 일정 read-only 확인
```

Presentation mode(`NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1`)에서 #3번은 로그인 직후 확인 가능.
