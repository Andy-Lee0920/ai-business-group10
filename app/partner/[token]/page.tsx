import { getPresentationPartnerView } from '../../../src/features/adaptive-home/presentation-scenarios';
import { SLCIllustration } from '../../../src/components/slc-illustration';
import { slcAssets } from '../../../src/design/slc-assets';
import { PartnerAccountJoinClient } from './PartnerAccountJoinClient';
import { PartnerActionViewClient } from './PartnerActionViewClient';
import { PartnerCommunityClient } from './PartnerCommunityClient';
import { PartnerRoleSurface } from './PartnerRoleSurface';

export default async function PartnerActionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const demoItems = token === 'demo' ? getPresentationPartnerView() : null;

  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <p className="eyebrow">파트너 케어</p>
        <SLCIllustration asset={slcAssets.partner.readonly} size="empty" priority style={{ width: 'min(58%, 178px)', marginBottom: 14 }} />
        <h2>파트너 오늘 할 일</h2>
        <p className="lead">오늘 일정만 확인할 수 있어요. 오늘 함께 해줄 수 있는 일만 차분히 보여드려요.</p>
        {demoItems ? <PartnerRoleSurface items={demoItems} /> : (
          <>
            <PartnerAccountJoinClient token={token} />
            <PartnerActionViewClient token={token} />
            <PartnerCommunityClient token={token} />
          </>
        )}
      </section>
    </main>
  );
}
