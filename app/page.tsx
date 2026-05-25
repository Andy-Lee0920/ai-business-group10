import Link from "next/link";
import { headers } from "next/headers";
import { Card } from "../src/components/ui";
import { isPresentationHost, isPresentationMode } from "../src/config";
import { FEVIO_PRODUCT_NORTH_STAR } from "../src/product/north-star";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const requestHeaders = await headers();
  const presentationMode =
    isPresentationMode() || isPresentationHost(requestHeaders.get("host"));

  return (
    <main className="app-shell">
      <Card aria-labelledby="landing-title" className="hero-card">
        <img
          src="/logo.svg"
          alt="Fevio 페비오"
          width="256"
          height="72"
          style={{ width: "min(256px, 100%)", height: "auto" }}
        />
        <p className="eyebrow">
          {presentationMode
            ? FEVIO_PRODUCT_NORTH_STAR.presentationEyebrow
            : FEVIO_PRODUCT_NORTH_STAR.productionEyebrow}
        </p>
        <h1 id="landing-title">Fevio [페비오]</h1>
        <p className="lead">
          {presentationMode
            ? FEVIO_PRODUCT_NORTH_STAR.presentationLead
            : FEVIO_PRODUCT_NORTH_STAR.productionLead}
        </p>
        <p className="lead" data-testid="north-star-tagline">
          {FEVIO_PRODUCT_NORTH_STAR.tagline}
        </p>
        <div className="cta-row">
          {presentationMode ? (
            <>
              <Link className="primary-cta" href="/demo">
                듀얼뷰 데모 바로 보기
              </Link>
              <Link className="secondary-cta" href="/survey">
                설문 참여하기
              </Link>
            </>
          ) : (
            <>
              <Link className="primary-cta" href="/auth/sign-in">
                Google로 계속하기
              </Link>
              <Link className="secondary-cta" href="/privacy">
                개인정보 처리방침
              </Link>
            </>
          )}
        </div>
        {!presentationMode && (
          <p
            style={{
              margin: "16px 0 0",
              color: "var(--slc-muted)",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Fevio는 의료 판단을 하지 않습니다. 병원에서 받은 안내와 직접 입력한
            일정을 확인하는 도구입니다.
          </p>
        )}
      </Card>
    </main>
  );
}
