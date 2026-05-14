# Fevio SLC — Codex 1-Shot Implementation Prompt

## 작업 개요

브랜치 `slc-today-execution-loop`에서 Fevio SLC를 완성한다.
레포: `ai-business-group10/` (Next.js 16 App Router, Supabase, Vercel)

**DoD:** 아래 15개 파일 변경 완료 → `npm run typecheck` 통과 → Vercel preview 배포 → 12 AC 수동 검증.

---

## 이미 완성된 인프라 — 건드리지 말 것

| 파일 | 상태 |
|------|------|
| `src/types/slc.types.ts` | UserProfile, ScheduleItem, CompletionRecord, ClinicUpdate, PartnerLink, InjectionSite + computeStatus/ctaLabel/completedLabel |
| `src/features/today/today-screen.tsx` | props: `{ initialItems: ScheduleItem[], userId: string }` |
| `src/features/records/records-screen.tsx` | props: `{ items: ScheduleItem[], completions: CompletionRecord[] }` |
| `src/features/clinic-update/clinic-update-form.tsx` | props: `{ medications: Pick<Medication, 'id'\|'brand_name_ko'\|'brand_name_en'\|'default_unit'\|'default_cta'>[] }` |
| `src/features/more/more-screen.tsx` | props: `{ userId, existingLink: PartnerLink\|null, pendingRequests: Array<PartnerLink & { partner?: { email?: string }\|null }> }` |
| `src/features/add/manual-add-form.tsx` | props: `{ medications: Pick<Medication, 'id'\|'brand_name_ko'\|'default_unit'\|'default_cta'>[] }` |
| `src/features/partner/partner-view.tsx` | props: `{ items: ScheduleItem[], completions: CompletionRecord[], latestClinicUpdate: ClinicUpdate\|null }` |
| `src/components/action-card.tsx` | ✓ |
| `src/components/bottom-nav.tsx` | ✓ |
| `src/components/countdown-ring.tsx` | ✓ |
| `app/api/schedule/route.ts` | GET만 있음 (POST 없음) |
| `app/api/schedule/complete/route.ts` | POST ✓ |
| `app/api/schedule/add/route.ts` | POST ✓ |
| `app/api/clinic-update/route.ts` | ✓ |
| `app/api/partner/invite/route.ts` | POST ✓ |
| `app/api/partner/approve/route.ts` | POST ✓ |
| `supabase/migrations/202605130001~6_slc_*.sql` | 6개 완료 |
| `public/assets/slc/abdomen-front.png` | 724×1086px ✓ |
| `src/lib/server-supabase.ts` | createCookieBackedSupabaseClient() ✓ |
| `src/config/index.ts` | isPresentationMode() ✓ |
| `middleware.ts` | auth guard ✓ — 건드리지 말 것 |

---

## 이슈 목록

| # | 파일 | 액션 | 선행 조건 |
|---|------|------|----------|
| 1 | `tests/unit/schedule-input-route.test.ts` | DELETE | 없음 |
| 2 | `supabase/migrations/202605130007_slc_user_consents.sql` | CREATE | 없음 |
| 3 | `app/api/onboarding/route.ts` | EDIT: user_consents upsert + 씨드 타이밍 분기 추가 | 이슈 2 |
| 4 | `app/layout.tsx` | EDIT: capture-flow.css import 제거 | 없음 |
| 5 | `app/privacy/page.tsx` | REPLACE: 3문장 + 서버 액션 | 없음 |
| 6 | `src/features/onboarding/onboarding-screen.tsx` | REPLACE: 역할 선택 + 동의 체크박스 | 없음 |
| 7 | `app/onboarding/page.tsx` | REPLACE: 쿠키·auth 체크 후 OnboardingScreen 렌더 | 이슈 2, 6 |
| 8 | `app/(authed)/layout.tsx` | REPLACE: user_consents guard + BottomNav | 이슈 2 |
| 9 | `app/(authed)/home/page.tsx` | REPLACE: schedule fetch + TodayScreen + partner redirect | 이슈 8 |
| 10 | `app/(authed)/records/page.tsx` | CREATE | 이슈 8 |
| 11 | `app/(authed)/clinic-update/page.tsx` | CREATE | 이슈 8 |
| 12 | `app/(authed)/more/page.tsx` | CREATE | 이슈 8 |
| 13 | `app/(authed)/add/page.tsx` | CREATE | 이슈 8 |
| 14 | `app/(authed)/partner/page.tsx` | CREATE | 이슈 8 |
| 15 | `src/components/confirm-sheet.tsx` | EDIT: abdomen-front.png + 4분할 invisible zone | 없음 |
| 16 | `app/invite/[code]/page.tsx` | REPLACE: 초대 코드 검증 → onboarding 리다이렉트 | 이슈 2 |

---

## 구현 — 파일별 정확한 코드

### 이슈 1: 테스트 파일 삭제

```bash
rm tests/unit/schedule-input-route.test.ts
```

이유: `app/api/schedule/route.ts`에 POST export가 없으므로 import TS 오류 발생. 해당 테스트는 SLC 아키텍처와 무관.

---

### 이슈 2: user_consents 마이그레이션

파일 생성: `supabase/migrations/202605130007_slc_user_consents.sql`

```sql
create table if not exists public.user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'partner')),
  consent_version text not null default 'slc-v1',
  sensitive_data_accepted_at timestamptz not null,
  medical_disclaimer_accepted_at timestamptz not null,
  partner_sharing_accepted_at timestamptz,
  created_at timestamptz default now()
);

alter table public.user_consents enable row level security;

create policy "user reads own consent"
  on public.user_consents for select
  using (auth.uid() = user_id);

create policy "user inserts own consent"
  on public.user_consents for insert
  with check (auth.uid() = user_id);

create policy "user updates own consent"
  on public.user_consents for update
  using (auth.uid() = user_id);
```

**⚠ Supabase 원격 적용:** `supabase db push` 또는 Supabase 대시보드 SQL 편집기에서 직접 실행. 미적용 시 layout guard가 항상 /onboarding 리다이렉트한다.

---

### 이슈 3: onboarding API 업데이트

파일: `app/api/onboarding/route.ts`

기존 파일을 읽은 뒤 두 가지를 추가한다:
1. profile upsert 직후 user_consents upsert
2. 씨드 타이밍: isPresentationMode → now+10min/now+90min, else 06:30/19:00

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { isPresentationMode } from '../../../src/config';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { role, inviteCode } = await request.json() as { role: 'patient' | 'partner'; inviteCode?: string };

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({ id: user.id, role, display_name: user.user_metadata?.full_name ?? null });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const now = new Date().toISOString();
  const { error: consentError } = await supabase
    .from('user_consents')
    .upsert({
      user_id: user.id,
      role,
      consent_version: 'slc-v1',
      sensitive_data_accepted_at: now,
      medical_disclaimer_accepted_at: now,
      partner_sharing_accepted_at: role === 'patient' ? now : null,
    });

  if (consentError) return NextResponse.json({ error: consentError.message }, { status: 500 });

  if (role === 'partner' && inviteCode) {
    const { data: link, error: linkError } = await supabase
      .from('partner_links')
      .select('*')
      .eq('invite_code', inviteCode)
      .in('status', ['pending', 'requested'])
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: '유효하지 않은 초대 코드입니다' }, { status: 400 });
    }

    await supabase
      .from('partner_links')
      .update({ partner_id: user.id, status: 'requested' })
      .eq('id', link.id);
  }

  if (role === 'patient') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('schedule_items')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id)
      .gte('scheduled_at', todayStart.toISOString());

    if ((count ?? 0) === 0) {
      const preso = isPresentationMode();
      const seed1 = new Date();
      const seed2 = new Date();
      if (preso) {
        seed1.setTime(Date.now() + 10 * 60_000);
        seed2.setTime(Date.now() + 90 * 60_000);
      } else {
        seed1.setHours(6, 30, 0, 0);
        seed2.setHours(19, 0, 0, 0);
      }

      await supabase.from('schedule_items').insert([
        {
          patient_id: user.id,
          medication_id: null,
          type: 'injection',
          title: 'Menopur 150 IU',
          dose: '150',
          unit: 'IU',
          scheduled_at: seed1.toISOString(),
          status: 'upcoming',
          source: 'seed',
        },
        {
          patient_id: user.id,
          medication_id: null,
          type: 'injection',
          title: 'Cetrotide 0.25 mg',
          dose: '0.25',
          unit: 'mg',
          scheduled_at: seed2.toISOString(),
          status: 'upcoming',
          source: 'seed',
        },
      ]);
    }
  }

  return NextResponse.json({ ok: true, role });
}

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ profile: data ?? null });
}
```

---

### 이슈 4: app/layout.tsx — capture-flow.css 제거

`app/layout.tsx`에서 아래 한 줄 삭제:
```typescript
import './capture-flow.css';
```

다른 줄은 건드리지 말 것.

---

### 이슈 5: app/privacy/page.tsx 교체

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value === '1') redirect('/onboarding');

  async function accept() {
    'use server';
    const store = await cookies();
    store.set('fevio_privacy_accepted', '1', {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: 'lax',
    });
    redirect('/onboarding');
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', padding: '0 24px', background: '#FFFCFA' }}>
      <div style={{ width: '100%', maxWidth: 430 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 20 }}>시작 전에 확인해요</h1>
        <p style={{ fontSize: 15, color: '#5C4D45', lineHeight: 1.8, marginBottom: 12 }}>
          페비오는 병원에서 안내받은 케어 일정을 기록하고 실행을 돕습니다.
        </p>
        <p style={{ fontSize: 15, color: '#5C4D45', lineHeight: 1.8, marginBottom: 12 }}>
          입력한 정보는 부부 기기 간에만 공유되며 외부로 판매·전송되지 않습니다.
        </p>
        <p style={{ fontSize: 15, color: '#5C4D45', lineHeight: 1.8, marginBottom: 36 }}>
          이 앱은 의료 기기가 아닙니다. 모든 케어 결정은 담당 의사의 지시를 따르세요.
        </p>
        <form action={accept}>
          <button
            type="submit"
            style={{ width: '100%', padding: '16px 0', background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            확인하고 계속
          </button>
        </form>
      </div>
    </main>
  );
}
```

---

### 이슈 6: src/features/onboarding/onboarding-screen.tsx 교체

기존 파일을 아래로 완전 교체한다.

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  inviteCode?: string;
}

type Role = 'patient' | 'partner';

export function OnboardingScreen({ inviteCode }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(inviteCode ? 'partner' : null);
  const [sensitiveData, setSensitiveData] = useState(false);
  const [medicalDisclaimer, setMedicalDisclaimer] = useState(false);
  const [partnerSharing, setPartnerSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPatient = role === 'patient';
  const canSubmit =
    role !== null &&
    sensitiveData &&
    medicalDisclaimer &&
    (!isPatient || partnerSharing);

  const submit = async () => {
    if (!role || !canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, inviteCode }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? '오류가 발생했습니다');
        return;
      }
      router.push('/home');
    } finally {
      setSaving(false);
    }
  };

  const checkboxStyle = {
    marginTop: 2,
    accentColor: '#C4614A',
    width: 18,
    height: 18,
    flexShrink: 0,
  } as const;

  const checkLabelStyle = {
    display: 'flex' as const,
    gap: 12,
    alignItems: 'flex-start' as const,
    cursor: 'pointer' as const,
  };

  const checkTextStyle = {
    fontSize: 14,
    color: '#5C4D45',
    lineHeight: 1.7,
  } as const;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', padding: '0 24px', background: '#FFFCFA' }}>
      <div style={{ width: '100%', maxWidth: 430 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 8 }}>페비오를 시작해요</h1>
        <p style={{ fontSize: 14, color: '#9B8E86', marginBottom: 28 }}>역할을 선택하고 동의해 주세요</p>

        {!inviteCode && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            {(['patient', 'partner'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '16px 0', borderRadius: 16,
                  background: role === r ? '#C4614A' : '#F0EDE8',
                  color: role === r ? '#fff' : '#5C4D45',
                  border: 'none', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {r === 'patient' ? '환자 본인' : '파트너'}
              </button>
            ))}
          </div>
        )}

        {inviteCode && (
          <div style={{ background: '#FFF0EB', borderRadius: 12, padding: '12px 16px', marginBottom: 28, fontSize: 14, color: '#C4614A', fontWeight: 600 }}>
            파트너 초대 링크로 참여합니다
          </div>
        )}

        {role && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={sensitiveData} onChange={(e) => setSensitiveData(e.target.checked)} style={checkboxStyle} />
              <span style={checkTextStyle}>케어 기록과 일정이 기기 간 동기화됨을 이해합니다</span>
            </label>
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={medicalDisclaimer} onChange={(e) => setMedicalDisclaimer(e.target.checked)} style={checkboxStyle} />
              <span style={checkTextStyle}>이 앱은 의료 기기가 아니며 모든 케어 결정은 의사 지시를 따릅니다</span>
            </label>
            {isPatient && (
              <label style={checkLabelStyle}>
                <input type="checkbox" checked={partnerSharing} onChange={(e) => setPartnerSharing(e.target.checked)} style={checkboxStyle} />
                <span style={checkTextStyle}>파트너에게 오늘 일정의 일부를 공유하는 것에 동의합니다</span>
              </label>
            )}
          </div>
        )}

        {error && <p style={{ color: '#C4614A', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button
          onClick={submit}
          disabled={!canSubmit || saving}
          style={{
            width: '100%', padding: '16px 0',
            background: canSubmit ? '#C4614A' : '#E0D8D4',
            color: canSubmit ? '#fff' : '#9B8E86',
            border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'inherit',
          }}
        >
          {saving ? '저장 중...' : '시작하기'}
        </button>
      </div>
    </main>
  );
}
```

---

### 이슈 7: app/onboarding/page.tsx 교체

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';
import { OnboardingScreen } from '../../src/features/onboarding/onboarding-screen';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: existing } = await supabase
    .from('user_consents')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) redirect('/home');

  const params = await searchParams;
  const inviteCode = params?.invite;

  return <OnboardingScreen inviteCode={inviteCode} />;
}
```

---

### 이슈 8: app/(authed)/layout.tsx 교체

**주의:** Next.js 경로에 `(authed)` 괄호 포함. bash에서 따옴표 사용 필수.

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';
import { BottomNav } from '../../src/components/bottom-nav';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: consent } = await supabase
    .from('user_consents')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!consent) redirect('/onboarding');

  return (
    <div style={{ minHeight: '100svh', paddingBottom: 80 }}>
      {children}
      {consent.role === 'patient' && <BottomNav />}
    </div>
  );
}
```

---

### 이슈 9: app/(authed)/home/page.tsx 교체

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { TodayScreen } from '../../../src/features/today/today-screen';
import type { ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: consent } = await supabase
    .from('user_consents')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (consent?.role === 'partner') redirect('/partner');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from('schedule_items')
    .select('id, patient_id, medication_id, type, title, dose, unit, scheduled_at, status, source, created_at')
    .eq('patient_id', user.id)
    .gte('scheduled_at', todayStart.toISOString())
    .lte('scheduled_at', todayEnd.toISOString())
    .order('scheduled_at', { ascending: true });

  const items: ScheduleItem[] = Array.isArray(data) ? data : [];

  return <TodayScreen initialItems={items} userId={user.id} />;
}
```

---

### 이슈 10: app/(authed)/records/page.tsx 생성

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { RecordsScreen } from '../../../src/features/records/records-screen';
import type { ScheduleItem, CompletionRecord } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [{ data: itemsData }, { data: completionsData }] = await Promise.all([
    supabase
      .from('schedule_items')
      .select('id, patient_id, medication_id, type, title, dose, unit, scheduled_at, status, source, created_at')
      .eq('patient_id', user.id)
      .order('scheduled_at', { ascending: false })
      .limit(30),
    supabase
      .from('completion_records')
      .select('id, schedule_item_id, patient_id, completed_at, injection_site')
      .eq('patient_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(30),
  ]);

  return (
    <RecordsScreen
      items={(itemsData ?? []) as ScheduleItem[]}
      completions={(completionsData ?? []) as CompletionRecord[]}
    />
  );
}
```

---

### 이슈 11: app/(authed)/clinic-update/page.tsx 생성

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { ClinicUpdateForm } from '../../../src/features/clinic-update/clinic-update-form';
import type { Medication } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

type MedPick = Pick<Medication, 'id' | 'brand_name_ko' | 'brand_name_en' | 'default_unit' | 'default_cta'>;

export default async function ClinicUpdatePage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_ko');

  return <ClinicUpdateForm medications={(data ?? []) as MedPick[]} />;
}
```

---

### 이슈 12: app/(authed)/more/page.tsx 생성

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { MoreScreen } from '../../../src/features/more/more-screen';
import type { PartnerLink } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function MorePage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [{ data: linkData }, { data: pendingData }] = await Promise.all([
    supabase
      .from('partner_links')
      .select('id, patient_id, partner_id, invite_code, status')
      .eq('patient_id', user.id)
      .eq('status', 'approved')
      .maybeSingle(),
    supabase
      .from('partner_links')
      .select('id, patient_id, partner_id, invite_code, status')
      .eq('patient_id', user.id)
      .eq('status', 'requested'),
  ]);

  return (
    <MoreScreen
      userId={user.id}
      existingLink={(linkData ?? null) as PartnerLink | null}
      pendingRequests={(pendingData ?? []) as Array<PartnerLink & { partner?: { email?: string } | null }>}
    />
  );
}
```

---

### 이슈 13: app/(authed)/add/page.tsx 생성

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { ManualAddForm } from '../../../src/features/add/manual-add-form';
import type { Medication } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

type MedPick = Pick<Medication, 'id' | 'brand_name_ko' | 'default_unit' | 'default_cta'>;

export default async function AddPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data } = await supabase
    .from('medications')
    .select('id, brand_name_ko, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_ko');

  return <ManualAddForm medications={(data ?? []) as MedPick[]} />;
}
```

---

### 이슈 14: app/(authed)/partner/page.tsx 생성

파트너 역할 사용자 전용 뷰. role이 partner가 아니면 /home 리다이렉트.

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { PartnerView } from '../../../src/features/partner/partner-view';
import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: consent } = await supabase
    .from('user_consents')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (consent?.role !== 'partner') redirect('/home');

  const { data: link } = await supabase
    .from('partner_links')
    .select('patient_id')
    .eq('partner_id', user.id)
    .eq('status', 'approved')
    .maybeSingle();

  if (!link) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', padding: '0 24px', background: '#FFFCFA' }}>
        <div style={{ width: '100%', maxWidth: 430, textAlign: 'center' }}>
          <p style={{ color: '#9B8E86', fontSize: 15, lineHeight: 1.7 }}>
            파트너 초대가 아직 승인되지 않았습니다.<br />
            환자에게 승인을 요청해 주세요.
          </p>
        </div>
      </main>
    );
  }

  const { patient_id: patientId } = link;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // RLS 주의: schedule_items RLS가 partner 읽기를 허용해야 한다.
  // 허용되지 않으면 data가 null로 반환된다 (오류 없이).
  // supabase/migrations에서 partner_links.status='approved'인 파트너에게
  // schedule_items SELECT를 허용하는 정책 추가 필요.
  const [{ data: itemsData }, { data: completionsData }, { data: clinicData }] = await Promise.all([
    supabase
      .from('schedule_items')
      .select('id, patient_id, medication_id, type, title, dose, unit, scheduled_at, status, source, created_at')
      .eq('patient_id', patientId)
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('completion_records')
      .select('id, schedule_item_id, patient_id, completed_at, injection_site')
      .eq('patient_id', patientId)
      .order('completed_at', { ascending: false })
      .limit(10),
    supabase
      .from('clinic_updates')
      .select('id, patient_id, same_medication, added_medication_ids, medication_days, next_visit_at, trigger_plan, memo, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <PartnerView
      items={(itemsData ?? []) as ScheduleItem[]}
      completions={(completionsData ?? []) as CompletionRecord[]}
      latestClinicUpdate={(clinicData ?? null) as ClinicUpdate | null}
    />
  );
}
```

**⚠ RLS 추가 필요:** `schedule_items`, `completion_records`, `clinic_updates`에 파트너 읽기 정책이 없으면 위 쿼리가 빈 배열을 반환한다. 아래 SQL을 `202605130008_slc_partner_read_rls.sql`로 추가:

```sql
-- 승인된 파트너가 환자의 schedule_items를 읽을 수 있음
create policy "approved partner reads patient schedule"
  on public.schedule_items for select
  using (
    patient_id = auth.uid()
    or exists (
      select 1 from public.partner_links
      where partner_links.patient_id = schedule_items.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );

create policy "approved partner reads patient completions"
  on public.completion_records for select
  using (
    patient_id = auth.uid()
    or exists (
      select 1 from public.partner_links
      where partner_links.patient_id = completion_records.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );

create policy "approved partner reads patient clinic updates"
  on public.clinic_updates for select
  using (
    patient_id = auth.uid()
    or exists (
      select 1 from public.partner_links
      where partner_links.patient_id = clinic_updates.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );
```

---

### 이슈 15: src/components/confirm-sheet.tsx — abdomen-front.png 교체

파일에서 아래 블록을 찾아서 교체한다.

**찾을 코드 (injection 분기의 이미지 영역):**
```tsx
<div style={{
  width: '100%', height: '100%', borderRadius: 24,
  background: 'linear-gradient(180deg, #FEF6F2 0%, #FAF0EC 100%)',
  border: '1.5px solid #F0E8E4',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
  <div style={{ color: '#D4B5A8', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
    복부 실루엣
  </div>
</div>
{INJECTION_ZONES.map(({ site, label, x, y }) => (
  <button
    key={site}
    aria-label={label}
    onClick={() => onComplete(site)}
    style={{
      position: 'absolute',
      left: x, top: y,
      transform: 'translate(-50%, -50%)',
      width: 64, height: 64,
      borderRadius: '50%',
      background: 'rgba(196, 97, 74, 0.08)',
      border: '1.5px solid rgba(196, 97, 74, 0.2)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, color: '#C4614A', fontWeight: 600,
    }}
  >
    {site.includes('left') ? '왼' : '오'}{site.includes('upper') ? '위' : '아래'}
  </button>
))}
```

**교체할 코드:**
```tsx
<img
  src="/assets/slc/abdomen-front.png"
  alt="복부 주사 위치 선택"
  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, display: 'block' }}
/>
{INJECTION_ZONES.map(({ site, label }) => (
  <button
    key={site}
    aria-label={label}
    onClick={() => onComplete(site)}
    style={{
      position: 'absolute',
      left: site.includes('left') ? 0 : '50%',
      top: site.includes('upper') ? 0 : '50%',
      width: '50%',
      height: '50%',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
    }}
  />
))}
```

또한 `INJECTION_ZONES` 배열에서 `x`, `y` 필드를 제거한다:
```typescript
const INJECTION_ZONES: Array<{ site: InjectionSite; label: string }> = [
  { site: 'upper_left', label: '복부 왼쪽 위' },
  { site: 'upper_right', label: '복부 오른쪽 위' },
  { site: 'lower_left', label: '복부 왼쪽 아래' },
  { site: 'lower_right', label: '복부 오른쪽 아래' },
];
```

---

### 이슈 16: app/invite/[code]/page.tsx 교체

`app/invite/[code]/` 디렉터리가 이미 존재함. `page.tsx` 파일을 생성 또는 교체한다.

```typescript
import { redirect } from 'next/navigation';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/sign-in?next=/invite/${code}`);

  const { data: consent } = await supabase
    .from('user_consents')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (consent?.role === 'patient') {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', padding: '0 24px', background: '#FFFCFA' }}>
        <div style={{ width: '100%', maxWidth: 430, textAlign: 'center' }}>
          <p style={{ color: '#5C4D45', fontSize: 15 }}>이미 환자로 등록된 계정입니다.</p>
        </div>
      </main>
    );
  }

  if (consent?.role === 'partner') redirect('/partner');

  const { data: link } = await supabase
    .from('partner_links')
    .select('id')
    .eq('invite_code', code)
    .in('status', ['pending', 'requested'])
    .maybeSingle();

  if (!link) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', padding: '0 24px', background: '#FFFCFA' }}>
        <div style={{ width: '100%', maxWidth: 430, textAlign: 'center' }}>
          <p style={{ color: '#5C4D45', fontSize: 15 }}>유효하지 않거나 만료된 초대 링크입니다.</p>
        </div>
      </main>
    );
  }

  redirect(`/onboarding?invite=${code}`);
}
```

---

## 검증 순서

```bash
# 1. 타입체크
cd ai-business-group10 && npm run typecheck

# 2. 로컬 빌드 확인
npm run build

# 3. Supabase 마이그레이션 원격 적용 (필수)
supabase db push
# 또는 Supabase 대시보드 → SQL 편집기에서 migration 007, 008 파일 내용 직접 실행

# 4. Vercel preview 배포 (자동 — push 하면 됨)
git add -A && git commit -m "feat(slc): complete SLC today execution loop" && git push
```

---

## 12 Acceptance Criteria 수동 검증

Vercel preview URL에서 아래를 순서대로 확인:

| # | URL | 역할 | 행동 | 기대 결과 |
|---|-----|------|------|----------|
| 1 | `/privacy` | 비인증 | 페이지 열기 | 3문장 + "확인하고 계속" 버튼 보임 |
| 2 | `/privacy` | 비인증 | 버튼 클릭 | 쿠키 설정 후 `/onboarding` 이동 |
| 3 | `/onboarding` | 인증됨 | 역할 "환자 본인" + 3개 체크 | "시작하기" 버튼 활성화 |
| 4 | `/onboarding` | 인증됨 | "시작하기" 클릭 | `/home` 이동, 오늘 일정 카드 보임 |
| 5 | `/home` | 환자 | 페이지 열기 | TodayScreen, 하단 BottomNav 보임 |
| 6 | `/home` | 파트너 | 페이지 열기 | `/partner`로 리다이렉트 |
| 7 | `/records` | 환자 | 페이지 열기 | 기록 목록 렌더 |
| 8 | `/clinic-update` | 환자 | 페이지 열기 | 진료 결과 입력 폼 렌더 |
| 9 | `/add` | 환자 | 페이지 열기 | 수동 추가 폼 렌더 |
| 10 | `/more` | 환자 | 페이지 열기 | 파트너 초대 링크 생성 UI 보임 |
| 11 | `/invite/[code]` | 새 사용자 | 페이지 열기 | 초대 코드 검증 후 `/onboarding?invite=...` 이동 |
| 12 | `/partner` | 파트너 | 페이지 열기 | PartnerView 렌더 (승인 전이면 대기 메시지) |

---

## 코딩 규칙 (이 프롬프트 전체에 적용)

- Next.js `page.tsx` / `layout.tsx`: `export default` 필수 (Next.js 프레임워크 요구사항)
- 그 외 모든 컴포넌트·함수: named export only, `export default` 금지
- `any` 타입 금지. 명시적 타입 캐스트(`as Type`) 허용
- 파일 200줄 초과 금지
- `process.env` 직접 접근 금지 — `src/config/index.ts` 함수 사용
- DB 쿼리는 page 컴포넌트(서버 컴포넌트)에서만, 클라이언트 컴포넌트에서는 API route 경유
- 기존 작동 중인 파일(`src/features/*`, `src/components/action-card.tsx`, `middleware.ts`)은 이 이슈 목록에 없으면 건드리지 말 것
- 각 파일 변경 후 `npm run typecheck` 확인
