import Link from 'next/link';
import { getPrivacyContactEmail } from '../../src/config';
import { Badge, Card, Notice } from '../../src/components/ui';

export default function PrivacyPage() {
  const privacyContactEmail = getPrivacyContactEmail();

  return (
    <main className="app-shell">
      <Card aria-labelledby="privacy-title">
        <p className="eyebrow">Privacy Gate</p>
        <h2 id="privacy-title">민감정보와 의료 경계 동의</h2>
        <p className="lead">
          Fevio는 난임 치료 메모처럼 민감한 정보를 다루기 때문에, 저장 전에 수집·이용과 의료 경계를 먼저
          확인합니다.
        </p>

        <ul className="status-list" aria-label="Privacy Gate 확인 항목">
          <li>
            <Badge tone="sage">민감정보</Badge> 병원 메모와 치료 일정은 동의 후에만 저장합니다.
          </li>
          <li>
            <Badge tone="lavender">파트너 공유</Badge> 사용자가 고른 카드만 안전한 링크로 공유합니다.
          </li>
          <li>
            <Badge tone="coral">의료 경계</Badge> Fevio는 의료 판단, 용량 추천, 진단을 대신하지 않습니다.
          </li>
        </ul>

        <Notice tone="sage">
          삭제 요청은 {privacyContactEmail}로 보내주시면 접수 후 처리합니다. 자동 삭제는 v1.x 예정입니다.
        </Notice>
        <Notice tone="coral">동의 전에는 병원 메모, 할 일 카드, 파트너 공유 링크를 만들 수 없습니다.</Notice>

        <form action="/api/privacy/accept" className="cta-row" method="post">
          <button className="fevio-button fevio-button--primary" type="submit">
            동의하고 시작
          </button>
          <Link className="secondary-cta" href="/">
            동의하지 않고 돌아가기
          </Link>
        </form>
      </Card>
    </main>
  );
}
