import { getPresentationPartnerView } from '../../../src/lib/presentation-demo-data';
import { PartnerActionViewClient } from './PartnerActionViewClient';
import { PartnerRoleSurface } from './PartnerRoleSurface';

export default async function PartnerActionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const demoItems = token === 'demo' ? getPresentationPartnerView() : null;

  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <p className="eyebrow">파트너 케어</p>
        <h2>파트너 오늘 할 일</h2>
        <p className="lead">오늘 함께 해줄 수 있는 일만 차분히 보여드려요.</p>
        {demoItems ? <PartnerRoleSurface items={demoItems} /> : <PartnerActionViewClient token={token} />}
      </section>
    </main>
  );
}
