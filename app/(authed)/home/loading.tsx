export default function HomeLoading() {
  const skeletonBlock: React.CSSProperties = {
    background: 'rgba(32,35,31,0.06)',
    borderRadius: 'var(--fevio-radius-card)',
  };

  return (
    <main className="app-shell" aria-busy="true" aria-label="홈 로딩 중">
      <div
        style={{
          background: 'var(--fevio-card)',
          borderRadius: 'var(--fevio-radius-card)',
          boxShadow: 'var(--fevio-shadow-card)',
          padding: '28px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ ...skeletonBlock, width: '60%', height: 20 }} />
        <div style={{ ...skeletonBlock, width: '100%', height: 80 }} />
        <div style={{ ...skeletonBlock, width: '100%', height: 80 }} />
      </div>
    </main>
  );
}
