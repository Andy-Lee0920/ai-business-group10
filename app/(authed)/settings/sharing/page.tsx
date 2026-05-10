import { SharingLinksClient } from './SharingLinksClient';

export const dynamic = 'force-dynamic';

export default function PartnerSharingSettingsPage() {
  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <p className="eyebrow">Partner sharing</p>
        <h1>파트너 공유 링크</h1>
        <p className="lead">지금 열려 있는 읽기 전용 파트너 링크를 확인하고, 필요하면 즉시 회수하세요.</p>
        <SharingLinksClient />
      </section>
    </main>
  );
}
