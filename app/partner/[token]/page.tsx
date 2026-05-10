import { PartnerActionViewClient } from './PartnerActionViewClient';

export default async function PartnerActionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <p className="eyebrow">Partner Action View</p>
        <h2>파트너 오늘 할 일</h2>
        <p className="lead">사용자가 확인한 실행 내용만 보여주는 읽기 전용 링크예요.</p>
        <PartnerActionViewClient token={token} />
      </section>
    </main>
  );
}
