import { SharingLinksClient } from './SharingLinksClient';

export const dynamic = 'force-dynamic';

export default function PartnerSharingSettingsPage() {
  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <p className="eyebrow">Partner sharing</p>
        <h1>파트너 공유 관리</h1>
        <p className="lead">파트너에게 보이는 범위를 환자가 직접 정하고, 필요하면 링크를 즉시 회수하세요.</p>
        <SharingLinksClient />
      </section>
    </main>
  );
}
