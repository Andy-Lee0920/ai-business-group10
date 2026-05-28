"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ActionCard } from "../../components/action-card";
import { ConfirmSheet } from "../../components/confirm-sheet";
import { EmptyHomeActions } from "../../components/home/DailyBrief";
import { ReflectionTurn } from "../../components/home/ReflectionTurn";
import { InjectionCountdownArc } from "../../components/injection-countdown-arc";
import { PostClinicBanner } from "../../components/post-clinic-banner";
import { SLCIllustration } from "../../components/slc-illustration";
import { slcAssets, type SLCAsset } from "../../design/slc-assets";
import type {
  ClinicUpdate,
  InjectionSite,
  ScheduleItem,
} from "../../types/slc.types";
import { ctaLabel } from "../../types/slc.types";
import { SLC_SAFE_COPY } from "../../domain/slc-copy";
import { resolveClinicFollowUpPrompt } from "../../domain/slc-clinic-followup";
import {
  resolveHomeFocus,
  type HomeFocus,
} from "../../domain/slc-home-focus";
import {
  formatKstDateLabel,
  formatKstTime,
  isInKstDay,
} from "../../domain/kst-date";
import { resolveMedicationReferenceAsset } from "../../domain/medication-reference-assets";
import {
  isInInjectionCountdownWindow,
  secondsUntilInjection,
} from "../adaptive-home/injection-timing";
import { pickHeroSurface } from "../../lib/brief/priority";
import { FEVIO_CUSTOMER_EXPERIENCE_JOBS } from "../../product/north-star";
import { PushPermissionCta } from "./PushPermissionCta";
import styles from "./today-screen.module.css";

interface TodayScreenProps {
  dailyBrief?: string;
  initialItems: ScheduleItem[];
  userId: string;
  initialClinicUpdates?: ClinicUpdate[];
  firstScheduleSkipped?: boolean;
  hasActivePushSubscription?: boolean;
}

type DayOffset = 0 | 1 | 2;
type HeroStory =
  | {
      kind: "countdown";
      item: ScheduleItem;
      nextInjection: ScheduleItem | null;
      focus: HomeFocus;
    }
  | { kind: "overdue_backlog"; item: ScheduleItem }
  | { kind: "today_pending"; item: ScheduleItem; focus: HomeFocus }
  | { kind: "tomorrow"; item: ScheduleItem; focus: HomeFocus }
  | { kind: "quiet"; focus: HomeFocus };

const DAY_LABELS = ["오늘", "내일", "모레"] as const;
const HOME_SOFT_CORAL = "#E76551";
const HOME_SOFT_CORAL_DEEP = "#CF5847";
const HOME_SOFT_CORAL_LIGHT = "#FDE8DF";
const HOME_SOFT_WARM_MUTED = "#786B63";
const HOME_SOFT_BORDER = "rgba(219, 202, 190, 0.58)";
const HOME_EXPERIENCE_RULES = [
  {
    anchor: FEVIO_CUSTOMER_EXPERIENCE_JOBS[0],
    label: "오늘 할 일만",
    detail: "주사·약·내원·확인",
  },
  {
    anchor: FEVIO_CUSTOMER_EXPERIENCE_JOBS[3],
    label: "원문 확인 후 저장",
    detail: "AI 후보는 확정 전",
  },
  {
    anchor: FEVIO_CUSTOMER_EXPERIENCE_JOBS[4],
    label: "중요 시간 알림",
    detail: "조용하지만 강하게",
  },
  {
    anchor: FEVIO_CUSTOMER_EXPERIENCE_JOBS[5],
    label: "파트너 역할만",
    detail: "원문·민감 기록 제외",
  },
] as const;

type Cheer = {
  topEmoji: string;
  sub: string;
  bottomEmoji: string;
};

type HeroVisual = {
  bgGradient: string;
  sheetBg: string;
  cardGradient: string;
  accentColor: string;
  accentLight: string;
  textAccent: string;
  badgeEmoji: string;
  badgeLabel: string;
  asset: SLCAsset;
  heading: string;
  ddayText: string;
  ddayLabel: string;
  cheer: Cheer;
};

const CHEER: Record<string, Cheer> = {
  overdue: {
    topEmoji: "✨",
    sub: "완료 여부만 확인해 주세요",
    bottomEmoji: "💛",
  },
  clinic_soon: {
    topEmoji: "✨",
    sub: "궁금한 건 다 여쭤보세요",
    bottomEmoji: "💙",
  },
  clinic_tomorrow: {
    topEmoji: "🌙",
    sub: "필요한 것은 미리 챙겨두면 편해요",
    bottomEmoji: "💜",
  },
  medication_due: {
    topEmoji: "✨",
    sub: "기록한 시간만 기준으로 보여드려요",
    bottomEmoji: "💛",
  },
  medication_upcoming: {
    topEmoji: "✨",
    sub: "예정된 항목만 정리해요",
    bottomEmoji: "💛",
  },
  missed: {
    topEmoji: "✨",
    sub: "지금 확인하는 것만으로도 충분해요",
    bottomEmoji: "💛",
  },
  empty: {
    topEmoji: "✨",
    sub: "병원 안내 기준으로 시작해요",
    bottomEmoji: "🌙",
  },
};

function resolveHeroVisual(story: HeroStory): HeroVisual {
  // All gradients end at #FAF7F2 so the hero blends into the warm-cream actionSheet below.
  if (story.kind === "overdue_backlog") {
    return {
      bgGradient:
        "linear-gradient(to bottom, #FFE8E2 0%, #FFF0EB 55%, #FFF0EB 100%)",
      sheetBg: "rgba(255, 240, 237, 0.96)",
      cardGradient: "linear-gradient(145deg, #FFFAF8 0%, #FFF1EC 100%)",
      accentColor: "#FF6B4E",
      accentLight: "#FFD8CC",
      textAccent: "#8B3A22",
      badgeEmoji: "⚠️",
      badgeLabel: "확인 필요",
      asset: slcAssets.home.missedRecovery,
      heading: "확인이 필요한 일정이 있어요",
      ddayText: "미완료",
      ddayLabel: "확인해 주세요",
      cheer: CHEER.overdue,
    };
  }
  const { kind, heading } = story.focus;
  switch (kind) {
    case "clinic_soon":
      return {
        bgGradient:
          "linear-gradient(to bottom, #FFF5D6 0%, #FFF8E4 55%, #FFF8E4 100%)",
        sheetBg: "rgba(255, 252, 238, 0.96)",
        cardGradient: "linear-gradient(145deg, #FFFDF6 0%, #FFF8E1 100%)",
        accentColor: "#E4B014",
        accentLight: "#FFF0B0",
        textAccent: "#7A5900",
        badgeEmoji: "🌼",
        badgeLabel: "병원",
        asset: slcAssets.home.clinicWide,
        heading,
        ddayText: "오늘",
        ddayLabel: "방문일이에요",
        cheer: CHEER.clinic_soon,
      };
    case "clinic_tomorrow":
      return {
        bgGradient:
          "linear-gradient(to bottom, #E6DEFF 0%, #EDE8FF 55%, #EDE8FF 100%)",
        sheetBg: "rgba(241, 238, 255, 0.96)",
        cardGradient: "linear-gradient(145deg, #F6F2FF 0%, #EDE5FF 100%)",
        accentColor: "#8B70D4",
        accentLight: "#D8CEFF",
        textAccent: "#3A1E7A",
        badgeEmoji: "🌙",
        badgeLabel: "내일 병원",
        asset: slcAssets.home.waiting,
        heading,
        ddayText: "내일",
        ddayLabel: "내일이에요",
        cheer: CHEER.clinic_tomorrow,
      };
    case "medication_due":
      return {
        bgGradient:
          "radial-gradient(circle at 50% -4%, rgba(255, 232, 218, 0.94) 0%, rgba(255, 243, 235, 0.72) 27%, transparent 52%), radial-gradient(circle at 96% 14%, rgba(255, 239, 228, 0.76) 0%, transparent 34%), linear-gradient(180deg, #FFF8F2 0%, #F8EEE7 100%)",
        sheetBg: "rgba(255, 252, 248, 0.96)",
        cardGradient: "linear-gradient(145deg, #FFFFFF 0%, #FFF2EA 100%)",
        accentColor: HOME_SOFT_CORAL,
        accentLight: HOME_SOFT_CORAL_LIGHT,
        textAccent: HOME_SOFT_CORAL_DEEP,
        badgeEmoji: "💉",
        badgeLabel: "주사 준비",
        asset: slcAssets.home.injectionWide,
        heading,
        ddayText: "지금",
        ddayLabel: "확인해요",
        cheer: CHEER.medication_due,
      };
    case "medication_upcoming":
      return {
        bgGradient:
          "radial-gradient(circle at 50% -4%, rgba(255, 232, 218, 0.88) 0%, rgba(255, 243, 235, 0.68) 28%, transparent 54%), radial-gradient(circle at 12% 28%, rgba(255, 248, 241, 0.86) 0%, transparent 36%), linear-gradient(180deg, #FFF8F2 0%, #F8EEE7 100%)",
        sheetBg: "rgba(255, 252, 248, 0.96)",
        cardGradient: "linear-gradient(145deg, #FFFFFF 0%, #FFF3ED 100%)",
        accentColor: HOME_SOFT_CORAL,
        accentLight: HOME_SOFT_CORAL_LIGHT,
        textAccent: HOME_SOFT_CORAL_DEEP,
        badgeEmoji: "💉",
        badgeLabel: "주사 예정",
        asset: slcAssets.home.injectionWide,
        heading,
        ddayText: "예정",
        ddayLabel: "준비해요",
        cheer: CHEER.medication_upcoming,
      };
    case "missed":
      return {
        bgGradient:
          "linear-gradient(to bottom, #FFE8E2 0%, #FFF0EB 55%, #FFF0EB 100%)",
        sheetBg: "rgba(255, 240, 237, 0.96)",
        cardGradient: "linear-gradient(145deg, #FFFAF8 0%, #FFF1EC 100%)",
        accentColor: "#FF6B4E",
        accentLight: "#FFD8CC",
        textAccent: "#8B3A22",
        badgeEmoji: "⚠️",
        badgeLabel: "확인",
        asset: slcAssets.home.missedRecovery,
        heading,
        ddayText: "미완료",
        ddayLabel: "확인해 주세요",
        cheer: CHEER.missed,
      };
    default:
      return {
        bgGradient:
          "linear-gradient(to bottom, #FFE8CC 0%, #FFF2E0 55%, #FFF2E0 100%)",
        sheetBg: "rgba(255, 244, 232, 0.96)",
        cardGradient: "linear-gradient(145deg, #FFFAF5 0%, #FFF0E0 100%)",
        accentColor: "#E8894A",
        accentLight: "#FFD8A8",
        textAccent: "#7A3A00",
        badgeEmoji: "✨",
        badgeLabel: "쉬어가는 날",
        asset: slcAssets.home.waiting,
        heading,
        ddayText: "오늘",
        ddayLabel: "안정적인 날",
        cheer: CHEER.empty,
      };
  }
}

export function TodayScreen({
  dailyBrief = "오늘 확인할 일을 차분히 정리해요.",
  initialItems,
  userId: _userId,
  initialClinicUpdates = [],
  firstScheduleSkipped = false,
  hasActivePushSubscription = false,
}: TodayScreenProps) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [confirmPortal, setConfirmPortal] = useState<HTMLElement | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOffset>(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConfirmPortal(document.getElementById("fevio-confirm-portal"));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setItems((prev) => [...prev]), 1_000);
    return () => clearInterval(id);
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => isOnDay(item.scheduled_at, selectedDay)),
    [items, selectedDay],
  );

  const homeFocus = useMemo(
    () => resolveHomeFocus(visibleItems),
    [visibleItems],
  );
  const heroStory = useMemo(
    () =>
      resolveHeroStory(
        selectedDay === 0 ? items : visibleItems,
        homeFocus,
        selectedDay,
        initialClinicUpdates,
      ),
    [items, visibleItems, homeFocus, selectedDay, initialClinicUpdates],
  );
  const priority = useMemo(
    () => pickHeroSurface({ now: new Date(), cards: items }),
    [items],
  );
  const heroVisual = useMemo(() => resolveHeroVisual(heroStory), [heroStory]);
  const clinicFollowUpItem = useMemo(
    () =>
      selectedDay === 0
        ? resolveClinicFollowUpPrompt(visibleItems, initialClinicUpdates)
        : null,
    [selectedDay, visibleItems, initialClinicUpdates],
  );
  const postClinicBannerState = useMemo(
    () => resolvePostClinicBannerState(items),
    [items],
  );
  const operationalItems = useMemo(
    () =>
      visibleItems
        .slice()
        .sort(
          (left, right) =>
            new Date(left.scheduled_at).getTime() -
            new Date(right.scheduled_at).getTime(),
        ),
    [visibleItems],
  );
  const recentCompletedItem = useMemo(
    () =>
      operationalItems
        .filter((item) => item.status === "completed")
        .slice()
        .sort(
          (left, right) =>
            new Date(right.scheduled_at).getTime() -
            new Date(left.scheduled_at).getTime(),
        )[0] ?? null,
    [operationalItems],
  );
  const clinicContextItem =
    clinicFollowUpItem ??
    operationalItems.find((item) => item.type === "clinic") ??
    null;

  const handleComplete = useCallback(
    async (site?: InjectionSite) => {
      if (!activeItem) return;
      const completedId = activeItem.id;
      setActiveItem(null);
      // prettier-ignore
      setItems((prev) => prev.map((item) => item.id === completedId ? { ...item, status: 'completed' } : item));
      await fetch("/api/schedule/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleItemId: completedId,
          injectionSite: site,
        }),
      });
    },
    [activeItem],
  );

  return (
    <div
      id="home-screen"
      ref={rootRef}
      data-hero-surface={priority.heroSurface}
      data-home-experience="care-state-hero"
      data-override-reason={priority.overrideReason}
      data-proximity-minutes={priority.proximityMinutes ?? ""}
      style={{
        position: "relative",
        background: "var(--slc-bg)",
        minHeight: "100dvh",
      }}
    >
      <div
        id="home-hero"
        data-testid="home-full-bleed-hero"
        style={{
          position: "sticky",
          top: 0,
          height: "90dvh",
          zIndex: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: heroVisual.bgGradient,
          transition: "background 0.4s ease",
        }}
      >
        <Header hasActivePushSubscription={hasActivePushSubscription} />
        <HeroZone
          dailyBrief={dailyBrief}
          priority={priority.heroSurface}
          story={heroStory}
          onCta={setActiveItem}
          heroVisual={heroVisual}
        />
      </div>

      <section
        id="home-operation"
        aria-label="오늘 실행 목록"
        className={styles.actionSheet}
        data-testid="home-operation-screen"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: heroVisual.sheetBg,
          transition: "background 0.4s ease",
          backdropFilter: "blur(24px) saturate(1.15)",
          WebkitBackdropFilter: "blur(24px) saturate(1.15)",
          borderRadius: "28px 28px 0 0",
          borderTop: "0.5px solid rgba(255, 255, 255, 0.88)",
          boxShadow:
            "0 -8px 36px rgba(75, 52, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.92)",
          marginTop: 0,
          padding: "28px 18px 112px",
          minHeight: "calc(42dvh + 22px)",
        }}
      >
        <HomeSheetIntro />
        <HomeCareOpsPromise />
        <DayTabs
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
          accentColor={heroVisual.accentColor}
        />
        {clinicFollowUpItem && <ClinicUpdatePrompt item={clinicFollowUpItem} />}
        <TodayRail
          items={operationalItems}
          selectedDay={selectedDay}
          firstScheduleSkipped={firstScheduleSkipped}
        />
        <RecentRecordCard item={recentCompletedItem} />
        <ClinicNoteSummary
          item={clinicContextItem}
          hasClinicUpdates={initialClinicUpdates.length > 0}
        />
        <PartnerSyncCard />
      </section>

      <PostClinicBanner
        lastInjectionAt={postClinicBannerState.lastInjectionAt}
        hasNextSchedule={postClinicBannerState.hasNextSchedule}
      />
      {activeItem != null && confirmPortal != null
        ? createPortal(
            <ConfirmSheet
              item={activeItem}
              onComplete={handleComplete}
              onClose={() => setActiveItem(null)}
            />,
            confirmPortal,
          )
        : null}
    </div>
  );
}

function NextActionHero({
  item,
  selectedDay,
  dailyBrief,
  firstScheduleSkipped,
  onCta,
}: {
  item: ScheduleItem | null;
  selectedDay: DayOffset;
  dailyBrief: string;
  firstScheduleSkipped: boolean;
  onCta: (item: ScheduleItem) => void;
}) {
  if (!item) {
    return (
      <section
        aria-label="다음 예정 항목"
        data-testid="next-action-hero"
        style={nextActionHeroStyle}
      >
        <div>
          <p style={sectionEyebrowStyle}>다음 예정 항목</p>
          <h2 style={nextActionTitleStyle}>
            {selectedDay === 0
              ? "오늘은 예정된 일정이 없어요"
              : `${DAY_LABELS[selectedDay]}은 예정된 일정이 없어요`}
          </h2>
          <p style={nextActionDescriptionStyle}>
            {firstScheduleSkipped
              ? "병원 안내문이나 처방 문자를 넣으면 확인할 일정 후보만 정리해요."
              : dailyBrief}
          </p>
        </div>
        <div style={heroButtonRowStyle}>
          <Link href="/onboard/prescription-capture" style={primaryHeroLinkStyle}>
            병원 안내 넣기
          </Link>
          <Link href="/add" style={secondaryHeroLinkStyle}>
            직접 추가
          </Link>
        </div>
      </section>
    );
  }

  const isCompleted = item.status === "completed";
  const isMissed =
    item.status === "missed" || new Date(item.scheduled_at).getTime() < Date.now();
  const statusCopy = isCompleted
    ? "완료된 항목입니다"
    : isMissed
      ? "완료 여부 확인이 필요해요"
      : "오늘 예정된 항목입니다";
  const showCountdown =
    item.type === "injection" &&
    !isCompleted &&
    !isMissed &&
    isInInjectionCountdownWindow(item.scheduled_at);

  return (
    <section
      aria-label="다음 예정 항목"
      data-next-action-type={item.type}
      data-testid="next-action-hero"
      style={nextActionHeroStyle}
    >
      <div style={nextActionMetaRowStyle}>
        <p style={sectionEyebrowStyle}>다음 예정 항목</p>
        <span style={nextActionStatusStyle(isCompleted, isMissed)}>
          {statusCopy}
        </span>
      </div>
      <div style={nextActionBodyStyle}>
        <div style={{ minWidth: 0 }}>
          <p style={nextActionTimeStyle}>{formatScheduleTime(item.scheduled_at)}</p>
          <h2 style={nextActionTitleStyle}>{formatScheduleTitle(item)}</h2>
          <p style={nextActionDescriptionStyle}>
            {scheduleTypeLabel(item.type)}
            {item.dose && item.unit ? ` · ${item.dose} ${item.unit}` : ""}
          </p>
        </div>
        <div style={nextActionSideStyle}>
          {showCountdown ? (
            <NextActionCountdown item={item} />
          ) : (
            <MedicationReferenceImage item={item} compact />
          )}
        </div>
      </div>
      <div style={reminderRowStyle}>
        <span>알림</span>
        <strong>60분 전 · 15분 전 · 정시</strong>
      </div>
      <div style={heroButtonRowStyle}>
        {!isCompleted && (
          <button
            type="button"
            onClick={() => onCta(item)}
            style={primaryHeroButtonStyle}
          >
            완료 기록하기
          </button>
        )}
        <Link href={`/schedule/${item.id}/edit`} style={secondaryHeroLinkStyle}>
          시간 변경
        </Link>
        <Link href="/clinic-update" style={tertiaryHeroLinkStyle}>
          병원 안내 보기
        </Link>
      </div>
    </section>
  );
}

function NextActionCountdown({ item }: { item: ScheduleItem }) {
  const remaining = secondsUntilInjection(item.scheduled_at);
  return (
    <div
      aria-label="주사 카운트다운"
      data-testid="next-action-countdown"
      style={countdownPreviewStyle}
    >
      <InjectionCountdownArc
        totalSeconds={3600}
        remainingSeconds={remaining}
        size={142}
      />
      <div style={countdownTimeOverlayStyle}>
        <span style={countdownLabelStyle}>남은 시간</span>
        <strong suppressHydrationWarning style={countdownTimeStyle}>
          {formatRemainingClock(remaining)}
        </strong>
      </div>
    </div>
  );
}

function TodayRail({
  items,
  selectedDay,
  firstScheduleSkipped,
}: {
  items: ScheduleItem[];
  selectedDay: DayOffset;
  firstScheduleSkipped: boolean;
}) {
  return (
    <section aria-label="오늘의 처방/방문/확인 리스트" style={sectionCardStyle}>
      <div style={sectionTitleRowStyle}>
        <div>
          <p style={sectionEyebrowStyle}>
            {selectedDay === 0 ? "오늘 실행" : `${DAY_LABELS[selectedDay]} 일정`}
          </p>
          <h2 style={sectionTitleStyle}>오늘 확인할 항목</h2>
        </div>
        <Link href="/add" aria-label="일정 추가" style={smallTextLinkStyle}>
          추가
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState
          selectedDay={selectedDay}
          firstScheduleSkipped={firstScheduleSkipped}
          accentColor={HOME_SOFT_CORAL}
        />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => (
            <ScheduleFlowRow
              key={item.id}
              item={item}
              statusLabel={resolveScheduleStatusLabel(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HomeSheetIntro() {
  return (
    <div id="home-sheet-header" className={styles.sheetHeader}>
      <span aria-hidden="true" className={styles.sheetHandle} />
      <div>
        <p style={sectionEyebrowStyle}>실행 목록</p>
        <h2 style={sheetIntroTitleStyle}>확인할 항목은 아래에 접어뒀어요</h2>
        <p style={sheetIntroBodyStyle}>
          오늘 필요한 실행만 먼저 보고, 병원 원문은 확인 단계에서 직접
          저장해요.
        </p>
      </div>
    </div>
  );
}

function HomeCareOpsPromise() {
  return (
    <section
      aria-label="오늘 실행 기준"
      data-testid="home-care-ops-promise"
      style={careOpsPromiseStyle}
    >
      <p style={sectionEyebrowStyle}>오늘 실행 기준</p>
      <div style={careOpsGridStyle}>
        {HOME_EXPERIENCE_RULES.map((rule) => (
          <div
            key={rule.label}
            data-experience-job-index={FEVIO_CUSTOMER_EXPERIENCE_JOBS.indexOf(
              rule.anchor,
            )}
            style={careOpsRuleStyle}
          >
            <strong style={careOpsRuleLabelStyle}>{rule.label}</strong>
            <span style={careOpsRuleDetailStyle}>{rule.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentRecordCard({ item }: { item: ScheduleItem | null }) {
  return (
    <section aria-label="최근 완료 기록" style={sectionCardStyle}>
      <p style={sectionEyebrowStyle}>최근 완료 기록</p>
      {item ? (
        <div style={compactInfoRowStyle}>
          <span style={compactInfoTimeStyle}>
            {formatScheduleTime(item.scheduled_at)}
          </span>
          <strong style={compactInfoTitleStyle}>
            {formatScheduleTitle(item)}
          </strong>
          <span style={completedBadgeStyle}>완료</span>
        </div>
      ) : (
        <p style={mutedParagraphStyle}>아직 완료 기록이 없습니다.</p>
      )}
    </section>
  );
}

function ClinicNoteSummary({
  item,
  hasClinicUpdates,
}: {
  item: ScheduleItem | null;
  hasClinicUpdates: boolean;
}) {
  return (
    <section aria-label="병원 안내 기준" style={sectionCardStyle}>
      <p style={sectionEyebrowStyle}>병원 안내 기준</p>
      <h2 style={sectionTitleStyle}>
        {item
          ? "확정한 다음 실행입니다"
          : "바뀐 안내는 확인 후 반영하세요"}
      </h2>
      <p style={mutedParagraphStyle}>
        {item
          ? `${formatScheduleTime(item.scheduled_at)} · ${formatScheduleTitle(item)}`
          : "AI/OCR 후보는 원문과 비교한 뒤 저장할 때만 오늘 실행이 됩니다."}
      </p>
      <div style={clinicNoteFooterStyle}>
        <span>{hasClinicUpdates ? "업데이트 기록 있음" : "최근 업데이트 없음"}</span>
        <Link href="/clinic-update" style={smallTextLinkStyle}>
          확인 내용 남기기
        </Link>
      </div>
    </section>
  );
}

function PartnerSyncCard() {
  return (
    <section aria-label="공유 상태" style={sectionCardStyle}>
      <p style={sectionEyebrowStyle}>공유 상태</p>
      <h2 style={sectionTitleStyle}>함께 챙길 역할만 공유해요</h2>
      <p style={mutedParagraphStyle}>
        원문 없이 준비, 동행, 확인처럼 실행에 필요한 역할만 보냅니다.
        병원 원문, 검사 결과, 감정 기록은 자동 공유하지 않아요.
      </p>
      <Link href="/settings" style={smallTextLinkStyle}>
        공유 설정
      </Link>
    </section>
  );
}

function resolveScheduleStatusLabel(item: ScheduleItem) {
  if (item.status === "completed") return "완료";
  if (
    item.status === "missed" ||
    new Date(item.scheduled_at).getTime() < Date.now()
  ) {
    return "확인 필요";
  }
  return "예정";
}

const nextActionHeroStyle = {
  display: "grid",
  gap: 14,
  padding: "22px 18px 18px",
  borderRadius: 30,
  background:
    "linear-gradient(150deg, rgba(255,255,255,0.88) 0%, rgba(255,248,242,0.76) 100%)",
  border: `1px solid ${HOME_SOFT_BORDER}`,
  boxShadow: "0 20px 48px rgba(111, 77, 58, 0.08)",
} as const;

const sectionCardStyle = {
  display: "grid",
  gap: 12,
  padding: "18px 16px",
  borderRadius: 20,
  background: "rgba(255, 255, 255, 0.70)",
  border: "1px solid rgba(219, 202, 190, 0.44)",
  boxShadow: "0 10px 28px rgba(78, 61, 48, 0.04)",
} as const;

const sectionTitleRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
} as const;

const nextActionMetaRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
} as const;

const nextActionBodyStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
} as const;

const nextActionSideStyle = {
  width: 138,
  minHeight: 118,
  display: "grid",
  placeItems: "center",
} as const;

const sectionEyebrowStyle = {
  margin: 0,
  color: HOME_SOFT_WARM_MUTED,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0,
} as const;

const sectionTitleStyle = {
  margin: "4px 0 0",
  color: "var(--slc-text)",
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.25,
  letterSpacing: 0,
} as const;

const sheetIntroTitleStyle = {
  margin: "4px 0 0",
  color: "var(--slc-text)",
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1.22,
  letterSpacing: 0,
} as const;

const sheetIntroBodyStyle = {
  margin: "8px 0 0",
  color: "var(--slc-muted)",
  fontSize: 13,
  fontWeight: 750,
  lineHeight: 1.5,
  letterSpacing: 0,
  wordBreak: "keep-all",
} as const;

const careOpsPromiseStyle = {
  display: "grid",
  gap: 10,
  padding: "14px 14px 15px",
  borderRadius: 18,
  background:
    "linear-gradient(145deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 247, 241, 0.54) 100%)",
  border: "1px solid rgba(226, 203, 190, 0.48)",
  boxShadow: "0 10px 28px rgba(92, 62, 43, 0.035)",
} as const;

const careOpsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
} as const;

const careOpsRuleStyle = {
  minHeight: 58,
  display: "grid",
  alignContent: "center",
  gap: 3,
  padding: "10px 11px",
  borderRadius: 15,
  background: "rgba(255, 255, 255, 0.68)",
  border: "1px solid rgba(224, 205, 193, 0.44)",
} as const;

const careOpsRuleLabelStyle = {
  color: "var(--slc-text)",
  fontSize: 13,
  fontWeight: 930,
  lineHeight: 1.2,
  letterSpacing: 0,
  wordBreak: "keep-all",
} as const;

const careOpsRuleDetailStyle = {
  color: HOME_SOFT_WARM_MUTED,
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.25,
  letterSpacing: 0,
  wordBreak: "keep-all",
} as const;

const nextActionTitleStyle = {
  margin: "4px 0 0",
  color: "var(--slc-text)",
  fontSize: 23,
  fontWeight: 930,
  lineHeight: 1.16,
  letterSpacing: 0,
  wordBreak: "keep-all",
} as const;

const nextActionDescriptionStyle = {
  margin: "8px 0 0",
  color: "var(--slc-muted)",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5,
  wordBreak: "keep-all",
} as const;

const nextActionTimeStyle = {
  margin: 0,
  color: HOME_SOFT_CORAL_DEEP,
  fontSize: 14,
  fontWeight: 900,
} as const;

const reminderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 16,
  background: "rgba(247, 239, 233, 0.72)",
  color: "var(--slc-muted)",
  fontSize: 12,
  fontWeight: 800,
} as const;

const heroButtonRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 9,
} as const;

const primaryHeroButtonStyle = {
  flex: "1 1 156px",
  minHeight: 48,
  border: "none",
  borderRadius: 999,
  background: HOME_SOFT_CORAL,
  color: "#fff",
  fontSize: 14,
  fontWeight: 900,
  fontFamily: "inherit",
} as const;

const primaryHeroLinkStyle = {
  ...primaryHeroButtonStyle,
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
} as const;

const secondaryHeroLinkStyle = {
  flex: "0 1 122px",
  minHeight: 48,
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  border: `1px solid ${HOME_SOFT_BORDER}`,
  background: "rgba(255, 255, 255, 0.68)",
  color: "var(--slc-text)",
  fontSize: 14,
  fontWeight: 900,
  textDecoration: "none",
} as const;

const tertiaryHeroLinkStyle = {
  flex: "1 0 100%",
  minHeight: 34,
  display: "grid",
  placeItems: "center",
  color: "var(--slc-muted)",
  fontSize: 13,
  fontWeight: 900,
  textDecoration: "none",
} as const;

const countdownPreviewStyle = {
  position: "relative",
  width: 142,
  height: 98,
  display: "grid",
  placeItems: "start center",
  overflow: "hidden",
} as const;

const countdownTimeOverlayStyle = {
  position: "absolute",
  inset: "38px 0 auto",
  display: "grid",
  justifyItems: "center",
  gap: 2,
} as const;

const countdownLabelStyle = {
  color: "var(--slc-muted)",
  fontSize: 10,
  fontWeight: 800,
} as const;

const countdownTimeStyle = {
  color: "var(--slc-text)",
  fontSize: 20,
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: 0,
} as const;

const smallTextLinkStyle = {
  color: HOME_SOFT_CORAL_DEEP,
  fontSize: 13,
  fontWeight: 900,
  textDecoration: "none",
} as const;

function nextActionStatusStyle(isCompleted: boolean, isMissed: boolean) {
  return {
    flex: "0 0 auto",
    padding: "6px 10px",
    borderRadius: 999,
    background: isCompleted
      ? "#F7EFE9"
      : isMissed
        ? HOME_SOFT_CORAL_LIGHT
        : "var(--slc-surface-warm)",
    color: isCompleted
      ? HOME_SOFT_WARM_MUTED
      : isMissed
        ? HOME_SOFT_CORAL_DEEP
        : "var(--slc-muted)",
    fontSize: 11,
    fontWeight: 900,
  } as const;
}

const compactInfoRowStyle = {
  display: "grid",
  gridTemplateColumns: "54px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "12px",
  borderRadius: 16,
  background: "var(--slc-surface-warm)",
} as const;

const compactInfoTimeStyle = {
  color: "var(--slc-muted)",
  fontSize: 13,
  fontWeight: 900,
} as const;

const compactInfoTitleStyle = {
  minWidth: 0,
  color: "var(--slc-text)",
  fontSize: 14,
  fontWeight: 900,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const completedBadgeStyle = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "#F7EFE9",
  color: HOME_SOFT_WARM_MUTED,
  fontSize: 11,
  fontWeight: 900,
} as const;

const mutedParagraphStyle = {
  margin: 0,
  color: "var(--slc-muted)",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.55,
  wordBreak: "keep-all",
} as const;

const clinicNoteFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  color: "var(--slc-muted)",
  fontSize: 12,
  fontWeight: 800,
} as const;

function resolvePostClinicBannerState(items: ScheduleItem[]) {
  const now = Date.now();
  const injections = items.filter((item) => item.type === "injection");
  const pastInjections = injections
    .filter((item) => new Date(item.scheduled_at).getTime() < now)
    .sort(
      (left, right) =>
        new Date(right.scheduled_at).getTime() -
        new Date(left.scheduled_at).getTime(),
    );
  const hasNextSchedule = injections.some(
    (item) => new Date(item.scheduled_at).getTime() > now,
  );

  return {
    lastInjectionAt: pastInjections[0]?.scheduled_at ?? null,
    hasNextSchedule,
  };
}

function resolveNextInjection(
  primaryItem: ScheduleItem | null,
  items: ScheduleItem[],
) {
  if (!primaryItem) return null;
  const primaryTime = new Date(primaryItem.scheduled_at).getTime();
  return (
    items
      .filter(
        (item) =>
          item.type === "injection" &&
          item.id !== primaryItem.id &&
          new Date(item.scheduled_at).getTime() > primaryTime,
      )
      .sort(
        (left, right) =>
          new Date(left.scheduled_at).getTime() -
          new Date(right.scheduled_at).getTime(),
      )[0] ?? null
  );
}

function HeroZone({
  dailyBrief,
  priority,
  story,
  onCta,
  heroVisual,
}: {
  dailyBrief: string;
  priority: "brief" | "execution";
  story: HeroStory;
  onCta: (item: ScheduleItem) => void;
  heroVisual: HeroVisual;
}) {
  const focusKind =
    story.kind === "overdue_backlog" ? "overdue_backlog" : story.focus.kind;

  return (
    <section
      data-testid="home-hero-zone"
      data-focus-kind={focusKind}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        padding: "0 28px 10px",
        gap: 8,
      }}
    >
      {priority === "execution" && story.kind === "countdown" ? (
        <InjectionCountdownFocus
          item={story.item}
          nextInjection={story.nextInjection}
          onCta={onCta}
          accentColor={heroVisual.accentColor}
        />
      ) : priority === "execution" && story.kind === "overdue_backlog" ? (
        <OverdueBacklogHero
          item={story.item}
          onCta={onCta}
          accentColor={heroVisual.accentColor}
        />
      ) : (
        <>
          <HomeHeroCard visual={heroVisual} />
          <div style={{ margin: "10px 0" }}></div>
          <CheerCard
            visual={heroVisual}
            heading={priority === "brief" ? dailyBrief : heroVisual.heading}
          />
        </>
      )}
    </section>
  );
}

function HomeHeroCard({ visual }: { visual: HeroVisual }) {
  const isDecorative = "decorative" in visual.asset && visual.asset.decorative;
  return (
    <>
      {/* Stage badge pill */}
      <div
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 16px 7px 10px",
          borderRadius: 999,
          background: visual.accentLight,
          border: `1px solid ${visual.accentColor}30`,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>
          {visual.badgeEmoji}
        </span>
        <span
          style={{
            color: visual.textAccent,
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "-0.01em",
          }}
        >
          {visual.badgeLabel}
        </span>
      </div>

      {/* Illustration card */}
      <div
        style={{
          flex: "1 1 0",
          maxHeight: "clamp(110px, 26dvh, 170px)",
          position: "relative",
          width: "100%",
          borderRadius: 28,
          background: visual.cardGradient,
          border: "1.5px solid rgba(255,255,255,0.90)",
          boxShadow: `0 6px 24px ${visual.accentColor}22, 0 2px 8px rgba(0,0,0,0.04)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "10px 0",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 10,
            right: 16,
            fontSize: 15,
            opacity: 0.72,
            lineHeight: 1,
          }}
        >
          ✨
        </span>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            fontSize: 12,
            opacity: 0.72,
            lineHeight: 1,
          }}
        >
          ⭐
        </span>

        <div style={{ position: "relative", width: "60%", maxWidth: 200 }}>
          <Image
            src={visual.asset.src}
            width={visual.asset.width}
            height={visual.asset.height}
            alt={visual.asset.alt ?? ""}
            aria-hidden={isDecorative || undefined}
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
            priority
          />
        </div>

        {/* Status badge */}
        <div
          style={{
            position: "absolute",
            bottom: -14,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "6px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: `1.5px solid ${visual.accentLight}`,
            boxShadow: `0 4px 16px ${visual.accentColor}20`,
            whiteSpace: "nowrap",
          }}
        >
          <strong
            style={{
              color: visual.textAccent,
              fontSize: 17,
              fontWeight: 950,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              display: "block",
            }}
          >
            {visual.ddayText}
          </strong>
          <span
            style={{
              color: "#9B97B2",
              fontSize: 10,
              fontWeight: 800,
              marginTop: 2,
              display: "block",
              textAlign: "center",
            }}
          >
            {visual.ddayLabel}
          </span>
        </div>
      </div>
    </>
  );
}

function CheerCard({
  visual,
  heading,
}: {
  visual: HeroVisual;
  heading: string;
}) {
  return (
    <div
      role="note"
      aria-label="안내 메시지"
      style={{
        borderRadius: 28,
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255, 255, 255, 0.88)",
        boxShadow: `0 6px 24px ${visual.accentColor}18, inset 0 1px 0 rgba(255,255,255,0.90)`,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        textAlign: "center",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 24, lineHeight: 1 }}>
        {visual.cheer.topEmoji}
      </span>
      <p
        style={{
          margin: 20,
          color: "#4B4268",
          fontSize: 16,
          fontWeight: 800,
          lineHeight: 1.65,
          letterSpacing: "-0.02em",
          wordBreak: "keep-all",
        }}
      >
        {heading}
      </p>
      <p
        style={{
          margin: 0,
          color: "#9B97B2",
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.4,
        }}
      >
        {visual.cheer.sub}
      </p>
      {/* <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{visual.cheer.bottomEmoji}</span> */}
    </div>
  );
}

function resolveHeroStory(
  items: ScheduleItem[],
  focus: HomeFocus,
  selectedDay: DayOffset,
  initialClinicUpdates: ClinicUpdate[],
): HeroStory {
  const pending = items
    .filter((item) => item.status !== "completed")
    .slice()
    .sort(
      (left, right) =>
        new Date(left.scheduled_at).getTime() -
        new Date(right.scheduled_at).getTime(),
    );
  const countdown =
    selectedDay === 0
      ? pending.find(
          (item) =>
            item.type === "injection" &&
            isOnDay(item.scheduled_at, 0) &&
            isInInjectionCountdownWindow(item.scheduled_at),
        )
      : null;
  if (countdown) {
    return {
      kind: "countdown",
      item: countdown,
      nextInjection: resolveNextInjection(countdown, items),
      focus: { ...focus, kind: "medication_due", primaryItem: countdown },
    };
  }

  if (selectedDay === 0) {
    const missedItems = pending.filter(
      (item) =>
        item.status === "missed" ||
        (isOnDay(item.scheduled_at, 0) &&
          new Date(item.scheduled_at).getTime() < Date.now() &&
          item.status !== "completed"),
    );
    if (missedItems.length > 0) {
      return { kind: "overdue_backlog", item: missedItems[0] };
    }
  }

  const selectedFocusItem =
    focus.primaryItem && isOnDay(focus.primaryItem.scheduled_at, selectedDay)
      ? focus.primaryItem
      : null;
  const selectedPending =
    selectedFocusItem ??
    pending.find((item) => isOnDay(item.scheduled_at, selectedDay));
  if (selectedPending) {
    const selectedFocus = selectedFocusItem
      ? focus
      : resolveHomeFocus([selectedPending]);
    return {
      kind: "today_pending",
      item: selectedPending,
      focus: { ...selectedFocus, primaryItem: selectedPending },
    };
  }

  const hasCompletedToday = items.some(
    (item) => item.status === "completed" && isOnDay(item.scheduled_at, 0),
  );
  const tomorrowPending = pending.find((item) => isOnDay(item.scheduled_at, 1));
  if (selectedDay === 0 && hasCompletedToday && tomorrowPending) {
    return {
      kind: "tomorrow",
      item: tomorrowPending,
      focus: buildTomorrowFocus(tomorrowPending),
    };
  }

  return { kind: "quiet", focus };
}

function buildTomorrowFocus(item: ScheduleItem): HomeFocus {
  const isClinic = item.type === "clinic";
  return {
    kind: isClinic ? "clinic_tomorrow" : "medication_upcoming",
    badgeLabel: "내일",
    heading: isClinic ? "내일 병원 준비를 확인해요" : "다음 일정이 준비되어 있어요",
    description: `${formatScheduleTime(item.scheduled_at)} · ${isClinic ? "방문 시간만 미리 확인해요." : "준비해두세요."}`,
    primaryItem: item,
  };
}

function QuietHeroContent({
  focus,
  paddingTop = 60,
}: {
  focus: HomeFocus;
  paddingTop?: number;
}) {
  if (focus.kind === "empty") {
    return (
      <div style={{ paddingTop }}>
        <p
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "var(--slc-text)",
            lineHeight: 1.2,
            margin: "0 0 8px",
          }}
        >
          오늘은 예정된 일정이 없어요
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--slc-muted)",
            lineHeight: 1.45,
            margin: "0 0 20px",
          }}
        >
          {SLC_SAFE_COPY.noSchedule}
        </p>
        <Link
          href="/add"
          style={{
            display: "inline-block",
            padding: "11px 20px",
            borderRadius: 999,
            background: "var(--slc-coral-gradient)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          일정 추가
        </Link>
      </div>
    );
  }
  return (
    <div style={{ paddingTop }}>
      <p
        style={{
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: "var(--slc-text)",
          lineHeight: 1.2,
          margin: "0 0 8px",
        }}
      >
        {focus.heading}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--slc-muted)",
          lineHeight: 1.45,
          margin: 0,
        }}
      >
        {focus.description}
      </p>
    </div>
  );
}

function OverdueBacklogHero({
  item,
  onCta,
  accentColor,
}: {
  item: ScheduleItem;
  onCta: (item: ScheduleItem) => void;
  accentColor: string;
}) {
  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        alignContent: "center",
        gap: 16,
      }}
    >
      <div>
        <p
          style={{
            margin: "0 0 6px",
            color: "var(--slc-muted)",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          기록 확인
        </p>
        <h2
          style={{
            margin: "0 0 8px",
            color: "var(--slc-text)",
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 1.2,
          }}
        >
          확인이 필요한 일정이 있어요
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--slc-muted)",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {formatScheduleTime(item.scheduled_at)} 예정된 일정 기록이 아직
          완료되지 않았어요.
        </p>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <button
          type="button"
          onClick={() => onCta(item)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "12px 20px",
            border: 0,
            borderRadius: 999,
            background: accentColor,
            color: "#fff",
            fontSize: 14,
            fontWeight: 900,
            fontFamily: "inherit",
            textDecoration: "none",
            width: "fit-content",
            cursor: "pointer",
            transition: "background 0.4s ease",
          }}
        >
          완료로 기록
        </button>
        <Link
          href={`/schedule/${item.id}/edit`}
          style={{
            fontSize: 13,
            color: "var(--slc-muted)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          시간 수정
        </Link>
      </div>
    </div>
  );
}

function CompactHeroCard({
  focus,
  item,
  onCta,
  eyebrow = "오늘 할 일",
}: {
  focus: HomeFocus;
  item: ScheduleItem;
  onCta: (item: ScheduleItem) => void;
  eyebrow?: string;
}) {
  return (
    <div
      data-testid="home-hero-compact-card"
      style={{ display: "grid", gap: 16, paddingTop: 42 }}
    >
      <div>
        <p
          style={{
            margin: "0 0 8px",
            color: "var(--slc-muted)",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {eyebrow}
        </p>
        <QuietHeroContent focus={focus} paddingTop={0} />
      </div>
      <MedicationReferenceImage item={item} />
      <ActionCard item={item} onCta={onCta} compact showCountdown={false} />
    </div>
  );
}

function InjectionCountdownFocus({
  item,
  nextInjection,
  onCta,
  accentColor,
}: {
  item: ScheduleItem;
  nextInjection: ScheduleItem | null;
  onCta: (item: ScheduleItem) => void;
  accentColor: string;
}) {
  const remaining = secondsUntilInjection(item.scheduled_at);
  const isDueNow = remaining <= 0;

  return (
    <section
      aria-label="주사 카운트다운"
      data-testid="injection-countdown-hero"
      style={{ height: "100%", padding: "0 0 10px" }}
    >
      <div style={countdownHeroCardStyle}>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 5px",
              color: isDueNow ? "var(--slc-coral)" : "var(--slc-muted)",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {isDueNow ? "확인 필요" : "주사 준비"}
          </p>
          <strong
            style={{
              color: "var(--slc-text)",
              fontSize: 21,
              lineHeight: 1.18,
              letterSpacing: 0,
            }}
          >
            {isDueNow ? "예정 시간이 지났어요" : "천천히 준비하면 돼요"}
          </strong>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--slc-muted)",
              fontSize: 13,
              fontWeight: 800,
              lineHeight: 1.35,
            }}
          >
            {formatScheduleTime(item.scheduled_at)} ·{" "}
            {formatScheduleTitle(item)}
          </p>
        </div>
        {isDueNow ? (
          <div style={dueNowPanelStyle}>
            <span aria-hidden="true" style={{ fontSize: 22 }}>
              !
            </span>
            <span>완료 여부를 확인해 주세요.</span>
          </div>
        ) : (
          <>
            <InjectionCountdownArc
              totalSeconds={3600}
              remainingSeconds={remaining}
              size={218}
            />
            <div style={{ textAlign: "center", marginTop: -42 }}>
              <p
                style={{
                  margin: "0 0 4px",
                  color: "var(--slc-muted)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                남은 시간
              </p>
              <strong
                suppressHydrationWarning
                style={{
                  color: "var(--slc-text)",
                  fontSize: 34,
                  lineHeight: 1,
                  letterSpacing: 0,
                }}
              >
                {formatRemainingClock(remaining)}
              </strong>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => onCta(item)}
          style={heroCtaStyle(accentColor)}
        >
          {ctaLabel(item.type)}
        </button>
      </div>
    </section>
  );
}

function MedicationReferenceImage({
  item,
  compact = false,
}: {
  item: ScheduleItem;
  compact?: boolean;
}) {
  if (item.type !== "injection" && item.type !== "medication") return null;
  const asset = resolveMedicationReferenceAsset({
    medicationId: item.medication_id,
    title: item.title,
  });
  if (!asset) return null;

  return (
    <figure
      aria-label={`${asset.displayLabel} 확인을 돕는 참고 이미지`}
      data-testid="medication-reference-image"
      style={{
        margin: 0,
        display: "grid",
        gridTemplateColumns: compact ? "82px minmax(0, 1fr)" : undefined,
        alignItems: "center",
        justifyItems: compact ? "stretch" : "center",
        gap: compact ? 12 : 4,
        width: compact ? "min(100%, 294px)" : undefined,
        padding: compact ? "9px 12px" : 0,
        borderRadius: compact ? 20 : undefined,
        background: compact ? "rgba(255, 255, 255, 0.58)" : undefined,
        border: compact ? "1px solid rgba(214, 190, 178, 0.58)" : undefined,
      }}
    >
      <img
        alt={`${asset.displayLabel} 참고 이미지`}
        src={asset.assetPath}
        style={{
          width: compact ? 78 : 196,
          maxWidth: compact ? "100%" : "72%",
          height: "auto",
          borderRadius: compact ? 14 : 20,
          background: compact ? "rgba(255, 252, 249, 0.92)" : undefined,
          filter: compact
            ? "drop-shadow(0 8px 16px rgba(75,52,42,0.08))"
            : "drop-shadow(0 14px 28px rgba(75,52,42,0.12))",
        }}
      />
      <figcaption
        style={{
          color: "var(--slc-muted)",
          fontSize: compact ? 12 : 11,
          fontWeight: 800,
          lineHeight: 1.35,
          textAlign: compact ? "left" : "center",
        }}
      >
        {compact ? `${asset.displayLabel} 약명 확인` : "확인을 돕는 참고 이미지"}
      </figcaption>
    </figure>
  );
}

function CountdownInfoBlock({
  item,
  nextInjection,
}: {
  item: ScheduleItem;
  nextInjection: ScheduleItem | null;
}) {
  return (
    <div
      data-testid="countdown-info-block"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 20,
        background: "var(--slc-surface)",
        border: "1px solid var(--slc-border)",
        overflow: "hidden",
        marginTop: 2,
      }}
    >
      <CountdownInfoRow
        label="주사 시간"
        value={formatScheduleTime(item.scheduled_at)}
        href={`/schedule/${item.id}/edit`}
      />
      <CountdownInfoRow
        label="약물명"
        value={formatScheduleTitle(item)}
        href={`/schedule/${item.id}/edit`}
      />
      <CountdownInfoRow
        label="다음 주사"
        value={
          nextInjection
            ? `${formatScheduleTime(nextInjection.scheduled_at)} ${formatScheduleTitle(nextInjection)}`
            : "미정"
        }
        href={nextInjection ? `/schedule/${nextInjection.id}/edit` : "/add"}
      />
    </div>
  );
}

function CountdownInfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        minHeight: 48,
        width: "100%",
        display: "grid",
        gridTemplateColumns: "82px 1fr auto",
        alignItems: "center",
        gap: 10,
        padding: "11px 14px",
        color: "var(--slc-text)",
        borderBottom:
          label === "다음 주사" ? "none" : "1px solid var(--slc-border)",
        textDecoration: "none",
      }}
    >
      <span
        style={{ color: "var(--slc-muted)", fontSize: 12, fontWeight: 800 }}
      >
        {label}
      </span>
      <strong
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 14,
          fontWeight: 900,
        }}
      >
        {value}
      </strong>
      <span
        aria-hidden="true"
        style={{ color: "var(--slc-coral)", fontSize: 22, lineHeight: 1 }}
      >
        ›
      </span>
    </Link>
  );
}

const countdownHeroCardStyle = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: 14,
  height: "100%",
  padding: "0 0 82px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  backdropFilter: "none",
} as const;

const dueNowPanelStyle = {
  width: "100%",
  minHeight: 112,
  display: "grid",
  placeItems: "center",
  gap: 8,
  borderRadius: 24,
  background: "linear-gradient(180deg, #FFF7F3 0%, #FFFDFC 100%)",
  border: "1px solid var(--slc-border)",
  color: "var(--slc-coral)",
  fontSize: 14,
  fontWeight: 900,
} as const;

function heroCtaStyle(accentColor: string) {
  return {
    width: "min(100%, 332px)",
    minHeight: 52,
    border: "none",
    borderRadius: 999,
    background: accentColor,
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    fontFamily: "inherit",
    cursor: "pointer",
    marginTop: 4,
    transition: "background 0.4s ease",
    boxShadow: "0 16px 34px rgba(111, 77, 58, 0.14)",
  };
}

function Header({ hasActivePushSubscription }: { hasActivePushSubscription: boolean }) {
  const today = new Date();
  return (
    <header
      id="home-header"
      style={{
        padding: "54px 24px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 13,
            color: "var(--slc-muted)",
            fontWeight: 600,
            margin: "0 0 4px",
          }}
        >
          {formatKstDateLabel(today)}
        </p>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: 0,
            color: "var(--slc-text)",
            margin: 0,
          }}
        >
          오늘 실행
        </h1>
      </div>
      <PushPermissionCta hasActivePushSubscription={hasActivePushSubscription} />
    </header>
  );
}

function DayTabs({
  selectedDay,
  onSelect,
  accentColor,
}: {
  selectedDay: DayOffset;
  onSelect: (day: DayOffset) => void;
  accentColor: string;
}) {
  return (
    <nav
      aria-label="일정 날짜"
      style={{ display: "flex", gap: 8, padding: "2px 0 8px" }}
    >
      {DAY_LABELS.map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(index as DayOffset)}
          style={tabStyle(selectedDay === index, accentColor)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function EmptyState({
  selectedDay,
  firstScheduleSkipped: _firstScheduleSkipped,
  accentColor,
}: {
  selectedDay: DayOffset;
  firstScheduleSkipped: boolean;
  accentColor: string;
}) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <p
        style={{
          color: "var(--slc-text)",
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          margin: "0 0 8px",
        }}
      >
        {selectedDay === 0
          ? "오늘은 예정된 일정이 없어요"
          : `${DAY_LABELS[selectedDay]}은 예정된 일정이 없어요`}
      </p>
      <p
        style={{
          color: "var(--slc-muted)",
          fontSize: 13,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {SLC_SAFE_COPY.noSchedule}
      </p>
      <div style={emptyActionRowStyle}>
        <Link
          href="/onboard/prescription-capture"
          style={emptyLinkStyle(accentColor)}
        >
          병원 안내 넣기
        </Link>
        <Link href="/add" style={emptySecondaryLinkStyle}>
          직접 추가
        </Link>
      </div>
    </div>
  );
}

function NextItem({ item }: { item: ScheduleItem }) {
  return (
    <section aria-label="다음 일정">
      <p
        style={{
          fontSize: 12,
          color: "var(--slc-muted)",
          fontWeight: 800,
          padding: "4px 8px",
          margin: "0 0 6px",
        }}
      >
        다음
      </p>
      <ScheduleFlowRow item={item} statusLabel="예정" />
    </section>
  );
}

function ScheduleFlowRow({
  item,
  statusLabel,
}: {
  item: ScheduleItem;
  statusLabel: "예정" | "완료" | "확인 필요";
}) {
  const timeStr = formatScheduleTime(item.scheduled_at);
  return (
    <div
      data-card-emphasis="secondary"
      data-home-flow-row={item.type}
      style={{
        minHeight: 62,
        display: "grid",
        gridTemplateColumns: "54px 1fr auto auto",
        alignItems: "center",
        gap: 10,
        padding: "12px 13px",
        borderRadius: 20,
        background: "rgba(255, 255, 255, 0.58)",
        border: `1px solid ${HOME_SOFT_BORDER}`,
        boxShadow: "0 8px 20px rgba(111, 77, 58, 0.035)",
      }}
    >
      <span style={{ color: "var(--slc-text)", fontSize: 14, fontWeight: 900 }}>
        {timeStr}
      </span>
      <span style={{ minWidth: 0 }}>
        <strong
          style={{
            display: "block",
            color: "var(--slc-text)",
            fontSize: 15,
            fontWeight: 900,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {formatScheduleRowTitle(item)}
        </strong>
        <small
          style={{
            display: "block",
            color: "var(--slc-muted)",
            fontSize: 12,
            fontWeight: 700,
            marginTop: 3,
          }}
        >
          {scheduleTypeLabel(item.type)}
        </small>
      </span>
      <span
        style={{
          padding: "5px 10px",
          borderRadius: 999,
          background:
            statusLabel === "완료"
              ? "#F7EFE9"
              : statusLabel === "확인 필요"
                ? HOME_SOFT_CORAL_LIGHT
                : "var(--slc-border)",
          color:
            statusLabel === "완료"
              ? HOME_SOFT_WARM_MUTED
              : statusLabel === "확인 필요"
                ? HOME_SOFT_CORAL_DEEP
                : "var(--slc-muted)",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {statusLabel}
      </span>
      {/* prettier-ignore */}
      <Link href={`/schedule/${item.id}/edit`} aria-label="일정 수정" style={{ color: HOME_SOFT_CORAL, fontSize: 22, lineHeight: 1, fontWeight: 900, textDecoration: "none" }}>›</Link>
    </div>
  );
}

function formatScheduleRowTitle(item: ScheduleItem) {
  const suffix = item.dose && item.unit ? `${item.dose} ${item.unit}` : "";
  if (!suffix || item.title.includes(suffix)) return item.title;
  return `${item.title} ${suffix}`;
}

function formatScheduleTitle(item: ScheduleItem) {
  return formatScheduleRowTitle(item)
    .replace(/^\d{1,2}:\d{2}\s*/u, "")
    .trim();
}

function formatScheduleTime(scheduledAt: string) {
  return formatKstTime(scheduledAt);
}

function formatRemainingClock(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function scheduleTypeLabel(type: ScheduleItem["type"]) {
  if (type === "clinic") return "병원 방문";
  if (type === "medication") return "복용";
  return "주사";
}

function ClinicUpdatePrompt({ item }: { item: ScheduleItem }) {
  const timeStr = formatScheduleTime(item.scheduled_at);

  return (
    <div
      data-testid="clinic-follow-up-prompt"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 92px",
        gap: 12,
        alignItems: "center",
        padding: "16px 18px",
        background: "var(--slc-surface)",
        borderRadius: 20,
        border: "1.5px solid var(--slc-border)",
        overflow: "hidden",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 12,
            color: "var(--slc-muted)",
            fontWeight: 800,
            margin: "0 0 6px",
          }}
        >
          {timeStr} 병원
        </p>
        <p
          style={{
            fontSize: 18,
            color: "var(--slc-text)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "0 0 8px",
          }}
        >
          바뀐 게 있나요?
        </p>
        <Link
          href="/clinic-update"
          style={{
            fontSize: 14,
            color: "var(--slc-coral)",
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          업데이트
        </Link>
      </div>
      <SLCIllustration
        asset={slcAssets.home.waiting}
        size="banner"
        style={{
          width: 92,
          height: 68,
          maxHeight: 68,
          justifySelf: "end",
          opacity: 0.9,
        }}
      />
    </div>
  );
}

function isOnDay(iso: string, offset: DayOffset) {
  return isInKstDay(iso, offset);
}

function emptyLinkStyle(accentColor: string) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    background: accentColor,
    color: "#fff",
    borderRadius: 999,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 800,
    transition: "background 0.4s ease",
  };
}

const emptyActionRowStyle = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 16,
} as const;

const emptySecondaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 20px",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.72)",
  border: `1px solid ${HOME_SOFT_BORDER}`,
  color: HOME_SOFT_CORAL_DEEP,
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
} as const;

function tabStyle(active: boolean, accentColor: string) {
  return {
    minHeight: 44,
    padding: "10px 16px",
    borderRadius: 999,
    background: active ? accentColor : "rgba(219, 202, 190, 0.46)",
    color: active ? "#fff" : "var(--slc-muted)",
    border: "none",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.4s ease, color 0.4s ease",
  };
}
