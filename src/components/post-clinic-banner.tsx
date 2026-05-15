interface PostClinicBannerProps {
  readonly lastInjectionAt: string | null;
  readonly hasNextSchedule: boolean;
}

export function PostClinicBanner({ lastInjectionAt, hasNextSchedule }: PostClinicBannerProps) {
  if (hasNextSchedule) return null;
  if (!lastInjectionAt) return null;
  const elapsed = Date.now() - new Date(lastInjectionAt).getTime();
  if (elapsed < 60 * 60 * 1000) return null;

  return (
    <div
      data-testid="post-clinic-banner"
      style={{
        position: 'fixed',
        bottom: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: 'var(--slc-surface)',
        borderLeft: '3px solid var(--slc-coral)',
        zIndex: 49,
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        gap: 8,
      }}
    >
      <span style={{ flex: 1, fontSize: 13, color: 'var(--slc-text)' }}>
        병원 다녀오셨나요? 기록해두면 다음 주사 알림이 정확해져요
      </span>
      <span style={{ color: 'var(--slc-coral)' }} aria-hidden="true">›</span>
    </div>
  );
}
