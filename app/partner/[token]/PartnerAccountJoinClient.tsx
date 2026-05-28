'use client';

import { useState } from 'react';

type JoinState =
  | { status: 'idle'; message: string }
  | { status: 'loading'; message: string }
  | { status: 'joined'; message: string }
  | { status: 'signin'; message: string; href: string }
  | { status: 'error'; message: string };

type AcceptResponse = {
  joined?: unknown;
  redirectTo?: unknown;
  error?: unknown;
  signInUrl?: unknown;
};

export function PartnerAccountJoinClient({ token }: { token: string }) {
  const [state, setState] = useState<JoinState>({ status: 'idle', message: '로그인한 파트너 계정으로 연결하면 같은 cycle의 파트너 역할 화면이 유지돼요.' });

  async function acceptInvite() {
    setState({ status: 'loading', message: '파트너 계정 연결 중이에요.' });
    try {
      const response = await fetch(`/api/partner/${encodeURIComponent(token)}/accept`, { method: 'POST', cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as AcceptResponse;
      if (response.status === 401) {
        setState({ status: 'signin', message: '로그인 후 이 초대 링크를 다시 열면 연결됩니다.', href: typeof payload.signInUrl === 'string' ? payload.signInUrl : `/auth/sign-in?next=${encodeURIComponent(`/partner/${token}`)}` });
        return;
      }
      if (!response.ok || payload.joined !== true) {
        setState({ status: 'error', message: '이 초대는 만료되었거나 이미 사용됐어요.' });
        return;
      }
      setState({ status: 'joined', message: '파트너 계정이 연결됐어요. 아래 화면은 환자 화면 복사가 아니라 파트너 역할 projection입니다.' });
      if (typeof payload.redirectTo === 'string') window.history.replaceState(null, '', payload.redirectTo);
    } catch {
      setState({ status: 'error', message: '연결 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' });
    }
  }

  return (
    <section className="notice" data-testid="partner-account-join" aria-label="파트너 계정 연결">
      <p>{state.message}</p>
      {state.status === 'signin' ? <a href={state.href}>로그인으로 이동</a> : null}
      {state.status !== 'joined' && state.status !== 'signin' ? (
        <button type="button" onClick={acceptInvite} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? '연결 중' : '내 계정으로 연결'}
        </button>
      ) : null}
    </section>
  );
}
