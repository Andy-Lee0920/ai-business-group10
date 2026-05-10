export default async function PartnerActionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <p className="eyebrow">Partner View</p>
        <h2>파트너 오늘 할 일 링크 준비</h2>
        <p className="lead">#27에서 7일 링크와 sanitized action-only view를 구현합니다.</p>
        <p className="notice">현재 token placeholder: {token}</p>
      </section>
    </main>
  );
}
