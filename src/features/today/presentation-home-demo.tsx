import {
  PresentationTestbedNav,
} from "../presentation/presentation-testbed";
import { StageHomeScreen, STAGE_KEYS, type StageKey } from "../../components/home/StageHomeScreen";

const STAGE_LABELS: Record<StageKey, string> = {
  injection: '💉 주사',
  'egg-collection': '🌼 채취',
  fertilization: '💫 수정',
  'two-cell': '🌱 2세포',
  'four-cell': '🌸 4세포',
  'eight-cell': '🌺 8세포',
  blastoid: '✨ 배반포',
  transplantation: '💗 이식일',
  'implantation-wait': '🌙 착상대기',
  'pregnancy-wait': '⭐ 임신대기',
  pregnancy: '🎉 임신확인',
  'freeze-storage': '❄️ 냉동',
};

export function PresentationHomeDemo() {
  return (
    <div
      data-testid="presentation-home-demo"
      style={{
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(1600px, 100vw)",
        minHeight: "100dvh",
        padding: "34px 18px 92px",
        background:
          "radial-gradient(circle at 14% 4%, rgba(255, 230, 218, 0.96), transparent 34%), linear-gradient(180deg, #FFFDFC 0%, #FAF4EF 100%)",
      }}
    >
      <header
        style={{
          maxWidth: 1040,
          margin: "0 auto 24px",
          display: "grid",
          gap: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--slc-muted)",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Fevio scenario testbed
        </p>
        <h1
          style={{
            margin: 0,
            color: "var(--slc-text)",
            fontSize: 34,
            lineHeight: 1.12,
            letterSpacing: "-0.06em",
          }}
        >
          로그인 없이 주요 화면을 확인해요
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--slc-muted)",
            fontSize: 15,
            lineHeight: 1.55,
            letterSpacing: "-0.03em",
            maxWidth: 720,
          }}
        >
          시술 단계별 홈 화면 디자인을 한눈에 비교합니다.
        </p>
        <PresentationTestbedNav current="home" />
      </header>

      <section
        aria-label="Fevio 단계별 홈 화면"
        style={{
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        {STAGE_KEYS.map((key) => (
          <article
            key={key}
            data-testid={`presentation-home-scenario-${key}`}
            style={{
              borderRadius: 32,
              border: "1px solid rgba(210, 198, 187, 0.64)",
              background: "rgba(255, 255, 255, 0.74)",
              boxShadow: "0 24px 70px rgba(105, 81, 68, 0.12)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px 10px" }}>
              <span
                style={{
                  display: "inline-flex",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "var(--slc-surface-warm)",
                  color: "var(--slc-muted)",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {STAGE_LABELS[key]}
              </span>
            </div>
            <div style={{ padding: "0 10px 12px" }}>
              <div
                style={{
                  height: 680,
                  overflowY: "auto",
                  overflowX: "hidden",
                  borderRadius: 26,
                  border: "1px solid #EFE7E0",
                  background: "var(--slc-bg)",
                  scrollbarWidth: "none",
                }}
              >
                <StageHomeScreen stageKey={key} />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
