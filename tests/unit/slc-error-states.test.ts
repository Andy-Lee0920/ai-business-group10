import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ErrorStateScreen } from '../../src/features/error-states/error-state-screen';

describe('SLC offline and sync error states', () => {
  it('renders the offline state with the canonical offline illustration and recovery action', () => {
    const markup = renderToStaticMarkup(React.createElement(ErrorStateScreen, { variant: 'offline' }));

    expect(markup).toContain('인터넷 연결을 확인해주세요');
    expect(markup).toContain('오프라인 상태입니다');
    expect(markup).toContain('오프라인 상태예요. 다시 연결되면 오늘 일정과 기록을 이어서 확인할 수 있어요.');
    expect(markup).toContain('다시 시도');
  });

  it('renders the sync-failed state with the canonical sync-failed illustration and safe retry copy', () => {
    const markup = renderToStaticMarkup(React.createElement(ErrorStateScreen, { variant: 'syncFailed' }));

    expect(markup).toContain('동기화에 실패했습니다');
    expect(markup).toContain('동기화에 실패했습니다. 잠시 후 다시 시도해주세요.');
    expect(markup).toContain('다시 시도');
    expect(markup).toContain('홈으로');
    expect(markup).toContain('href="/home"');
  });

  it('exposes URL pages through SLCIllustration and slcAssets without direct img tags', () => {
    const offlinePage = readFileSync('app/offline/page.tsx', 'utf8');
    const offlineErrorPage = readFileSync('app/error/offline/page.tsx', 'utf8');
    const syncPage = readFileSync('app/sync-failed/page.tsx', 'utf8');
    const syncErrorPage = readFileSync('app/error/sync-failed/page.tsx', 'utf8');
    const screen = readFileSync('src/features/error-states/error-state-screen.tsx', 'utf8');

    expect(offlinePage).toContain("variant=\"offline\"");
    expect(offlineErrorPage).toContain("variant=\"offline\"");
    expect(syncPage).toContain("variant=\"syncFailed\"");
    expect(syncErrorPage).toContain("variant=\"syncFailed\"");
    expect(screen).toContain('SLCIllustration');
    expect(screen).toContain('slcAssets.error.offline');
    expect(screen).toContain('slcAssets.error.syncFailed');
    expect(screen).not.toContain('<img');
  });
});
