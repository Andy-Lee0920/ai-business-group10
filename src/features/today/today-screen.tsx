"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { ActionCard } from "../../components/action-card";
import { ConfirmSheet } from "../../components/confirm-sheet";
import { DailyBrief, EmptyHomeActions } from "../../components/home/DailyBrief";
import { ExecutionPreview } from "../../components/home/ExecutionPreview";
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
  getHomePendingItems,
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
import {
  enablePushReminderSubscription,
  getPwaInstallGuidance,
  type PushReminderSubscriptionStatus,
} from "../../lib/pwa-push-client";
import { pickHeroSurface } from "../../lib/brief/priority";
import styles from "./today-screen.module.css";

interface TodayScreenProps {
  dailyBrief?: string;
  initialItems: ScheduleItem[];
  userId: string;
  initialClinicUpdates?: ClinicUpdate[];
  firstScheduleSkipped?: boolean;
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
const HOME_REMINDER_SETTING_KEY = "fevio_home_reminder_enabled";

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
  overdue:             { topEmoji: '🌱', sub: '작은 한 걸음씩 잘 하고 있어요',           bottomEmoji: '💛' },
  clinic_soon:         { topEmoji: '✨', sub: '궁금한 건 다 여쭤보세요',                 bottomEmoji: '💙' },
  clinic_tomorrow:     { topEmoji: '🌙', sub: '필요한 것은 미리 챙겨두면 편해요',         bottomEmoji: '💜' },
  medication_due:      { topEmoji: '💚', sub: '오늘도 잘 하고 있어요',                   bottomEmoji: '🌿' },
  medication_upcoming: { topEmoji: '🌿', sub: '예정된 케어를 잘 챙기고 계세요',           bottomEmoji: '💚' },
  missed:              { topEmoji: '🌱', sub: '지금 확인하는 것만으로도 충분해요',         bottomEmoji: '💛' },
  empty:               { topEmoji: '✨', sub: '몸과 마음이 회복하는 중이에요',            bottomEmoji: '🌙' },
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
        ddayText: "D-1",
        ddayLabel: "내일이에요",
        cheer: CHEER.clinic_tomorrow,
      };
    case "medication_due":
      return {
        bgGradient:
          "linear-gradient(to bottom, #CCEFDF 0%, #DCF5EA 55%, #DCF5EA 100%)",
        sheetBg: "rgba(232, 251, 241, 0.96)",
        cardGradient: "linear-gradient(145deg, #FAFFFE 0%, #EAFFF4 100%)",
        accentColor: "#52B788",
        accentLight: "#C8F0DC",
        textAccent: "#276942",
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
          "linear-gradient(to bottom, #CCEFDF 0%, #DCF5EA 55%, #DCF5EA 100%)",
        sheetBg: "rgba(232, 251, 241, 0.96)",
        cardGradient: "linear-gradient(145deg, #FAFFFE 0%, #EAFFF4 100%)",
        accentColor: "#52B788",
        accentLight: "#C8F0DC",
        textAccent: "#276942",
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
          "linear-gradient(to bottom, #DCDEFF 0%, #E8E9FF 55%, #E8E9FF 100%)",
        sheetBg: "rgba(235, 236, 255, 0.96)",
        cardGradient: "linear-gradient(145deg, #F4F5FF 0%, #E8EBFF 100%)",
        accentColor: "#7B80D4",
        accentLight: "#CDD0FF",
        textAccent: "#2E207A",
        badgeEmoji: "🌿",
        badgeLabel: "쉬어가는 날",
        asset: slcAssets.home.empty,
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
}: TodayScreenProps) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [confirmPortal, setConfirmPortal] = useState<HTMLElement | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOffset>(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [pushSubscriptionStatus, setPushSubscriptionStatus] =
    useState<PushReminderSubscriptionStatus>("idle");
  const [pwaInstallGuidance, setPwaInstallGuidance] = useState<
    "ios_add_to_home_screen" | "none"
  >("none");
  const [reminderPreferenceLoaded, setReminderPreferenceLoaded] =
    useState(false);
  const [sheetLiftActive, setSheetLiftActive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConfirmPortal(document.getElementById("fevio-confirm-portal"));
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HOME_REMINDER_SETTING_KEY);
      if (stored === "off") setReminderEnabled(false);
      if (stored === "on") setReminderEnabled(true);
    } catch {
      // localStorage access can fail in restricted browser modes.
    } finally {
      setReminderPreferenceLoaded(true);
    }
  }, []);

  useEffect(() => {
    setPwaInstallGuidance(getPwaInstallGuidance());
  }, []);

  useEffect(() => {
    if (!reminderPreferenceLoaded) return;
    try {
      window.localStorage.setItem(
        HOME_REMINDER_SETTING_KEY,
        reminderEnabled ? "on" : "off",
      );
    } catch {
      // localStorage access can fail in restricted browser modes.
    }
  }, [reminderEnabled, reminderPreferenceLoaded]);

  useEffect(() => {
    const id = setInterval(() => setItems((prev) => [...prev]), 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const frame = rootRef.current?.closest<HTMLElement>(".fevio-authed-main");
    const scrollEl: Element = frame ?? document.documentElement;
    const update = () => {
      const max = scrollEl.scrollHeight - scrollEl.clientHeight;
      setSheetLiftActive(max > 0 && scrollEl.scrollTop / max > 0.55);
    };
    update();
    const target: EventTarget = frame ?? window;
    target.addEventListener("scroll", update, { passive: true });
    return () => target.removeEventListener("scroll", update);
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
  // Only suppress the hero item from the sheet when it's shown with a CTA inside the hero zone (countdown).
  const heroItemId =
    priority.heroSurface === "execution" && heroStory.kind === "countdown"
      ? heroStory.item.id
      : null;
  const pending = useMemo(
    () => getHomePendingItems(visibleItems),
    [visibleItems],
  );
  const clinicFollowUpItem = useMemo(
    () =>
      selectedDay === 0
        ? resolveClinicFollowUpPrompt(visibleItems, initialClinicUpdates)
        : null,
    [selectedDay, visibleItems, initialClinicUpdates],
  );
  const cardItems = pending.filter(
    (item) => item.id !== clinicFollowUpItem?.id && item.id !== heroItemId,
  );
  const mainItem = cardItems[0];
  const nextItem = cardItems[1];
  const hasSelectedDaySchedule =
    visibleItems.length > 0 || Boolean(clinicFollowUpItem);
  const postClinicBannerState = useMemo(
    () => resolvePostClinicBannerState(items),
    [items],
  );
  const previewItem = useMemo(
    () => pending.find((item) => item.status !== "completed") ?? null,
    [pending],
  );

  const handleReminderToggle = useCallback(async () => {
    if (reminderEnabled) {
      setReminderEnabled(false);
      setPushSubscriptionStatus("idle");
      return;
    }

    if (pwaInstallGuidance === "ios_add_to_home_screen") {
      setPushSubscriptionStatus("unsupported");
      return;
    }

    setPushSubscriptionStatus("requesting");
    const status = await enablePushReminderSubscription();
    setPushSubscriptionStatus(status);
    if (status === "subscribed") setReminderEnabled(true);
  }, [pwaInstallGuidance, reminderEnabled]);

  const handleComplete = useCallback(
    async (site?: InjectionSite) => {
      if (!activeItem) return;
      const completedId = activeItem.id;
      setActiveItem(null);
      setItems((prev) =>
        prev.map((item) =>
          item.id === completedId ? { ...item, status: "completed" } : item,
        ),
      );
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
        style={{
          position: "sticky",
          top: 0,
          height: "66dvh",
          zIndex: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: heroVisual.bgGradient,
          transition: "background 0.4s ease",
        }}
      >
        <Header
          reminderEnabled={reminderEnabled}
          onToggleReminder={handleReminderToggle}
          pushSubscriptionStatus={pushSubscriptionStatus}
          pwaInstallGuidance={pwaInstallGuidance}
        />
        <HeroZone
          dailyBrief={dailyBrief}
          priority={priority.heroSurface}
          story={heroStory}
          onCta={setActiveItem}
          heroVisual={heroVisual}
        />
      </div>

      <div
        id="home-sheet"
        className={styles.actionSheet}
        style={{
          position: "relative",
          zIndex: 1,
          background: heroVisual.sheetBg,
          transition: "background 0.4s ease",
          backdropFilter: "blur(24px) saturate(1.15)",
          WebkitBackdropFilter: "blur(24px) saturate(1.15)",
          borderRadius: "28px 28px 0 0",
          borderTop: "0.5px solid rgba(255, 255, 255, 0.88)",
          boxShadow:
            "0 -6px 32px rgba(75, 52, 42, 0.10), inset 0 1px 0 rgba(255,255,255,0.92)",
          marginTop: "-22px",
          padding:
            heroStory.kind === "countdown"
              ? "20px 0 calc(112px + 48dvh)"
              : "20px 0 112px",
          minHeight: "calc(34dvh + 22px)",
        }}
      >
        <div
          id="home-sheet-header"
          className={[
            heroStory.kind === "countdown"
              ? styles.liftedSheetHeader
              : styles.sheetHeader,
            sheetLiftActive ? styles.liftedSheetHeaderActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {heroStory.kind === "countdown" && (
            <CountdownSheetLift item={heroStory.item} />
          )}
          {priority.heroSurface === "execution" ? (
            <DailyBrief line={dailyBrief} compact />
          ) : (
            <ExecutionPreview item={previewItem} onOpen={setActiveItem} />
          )}
          <DayTabs
            selectedDay={selectedDay}
            onSelect={setSelectedDay}
            accentColor={heroVisual.accentColor}
          />
        </div>
        <section
          id="home-cards"
          style={{
            padding: "0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {clinicFollowUpItem && (
            <ClinicUpdatePrompt item={clinicFollowUpItem} />
          )}
          {!hasSelectedDaySchedule ? (
            <>
              <EmptyHomeActions accentColor={heroVisual.accentColor} />
              <ReflectionTurn />
              <EmptyState
                selectedDay={selectedDay}
                firstScheduleSkipped={firstScheduleSkipped}
                accentColor={heroVisual.accentColor}
              />
            </>
          ) : (
            <>
              {mainItem && (
                <ActionCard
                  item={mainItem}
                  onCta={setActiveItem}
                  showCountdown={selectedDay === 0}
                />
              )}
              {nextItem && <NextItem item={nextItem} />}
              <ReflectionTurn />
            </>
          )}
        </section>
      </div>

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
        padding: "4px 20px 8px",
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
          <CheerCard visual={heroVisual} heading={priority === "brief" ? dailyBrief : heroVisual.heading} />
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

        {/* D-day badge */}
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

function CheerCard({ visual, heading }: { visual: HeroVisual; heading: string }) {
  return (
    <div
      role="note"
      aria-label="응원 메시지"
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
          margin: 0,
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
    heading: "내일 준비되셨나요",
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
  const typeLabel = scheduleTypeLabel(item.type);
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
            letterSpacing: "-0.04em",
            lineHeight: 1.2,
          }}
        >
          확인이 필요한 {typeLabel}가 있어요
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--slc-muted)",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {formatScheduleTime(item.scheduled_at)} 예정된 {typeLabel} 기록이 아직
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
      style={{ height: "100%", padding: "0 0 2px" }}
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
              letterSpacing: "-0.04em",
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
            <MedicationReferenceImage item={item} compact />
            <InjectionCountdownArc
              totalSeconds={3600}
              remainingSeconds={remaining}
              size={196}
            />
            <div style={{ textAlign: "center", marginTop: -36 }}>
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
                  letterSpacing: "-0.04em",
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
        justifyItems: "center",
        gap: 4,
      }}
    >
      <img
        alt={`${asset.displayLabel} 참고 이미지`}
        src={asset.assetPath}
        style={{
          width: compact ? 168 : 196,
          maxWidth: "72%",
          height: "auto",
          borderRadius: 20,
          filter: "drop-shadow(0 14px 28px rgba(75,52,42,0.12))",
        }}
      />
      <figcaption
        style={{ color: "var(--slc-muted)", fontSize: 11, fontWeight: 700 }}
      >
        확인을 돕는 참고 이미지
      </figcaption>
    </figure>
  );
}

function CountdownSheetLift({ item }: { item: ScheduleItem }) {
  const remaining = secondsUntilInjection(item.scheduled_at);
  return (
    <div
      aria-label="상단 메뉴와 함께 올라오는 주사 카운트다운"
      className={styles.countdownSheetLift}
      data-testid="countdown-sheet-lift"
    >
      <div
        className={styles.countdownSheetArc}
        data-testid="countdown-sheet-mini-arc"
      >
        <InjectionCountdownArc
          totalSeconds={3600}
          remainingSeconds={remaining}
          size={108}
        />
      </div>
      <strong suppressHydrationWarning className={styles.countdownSheetTime}>
        {formatRemainingClock(remaining)}
      </strong>
    </div>
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
  gap: 8,
  height: "100%",
  padding: "0 0 56px",
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
    width: "100%",
    minHeight: 52,
    border: "none",
    borderRadius: 999,
    background: accentColor,
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    fontFamily: "inherit",
    cursor: "pointer",
    marginTop: 2,
    transition: "background 0.4s ease",
  };
}

function Header({
  reminderEnabled,
  onToggleReminder,
  pushSubscriptionStatus,
  pwaInstallGuidance,
}: {
  reminderEnabled: boolean;
  onToggleReminder: () => void;
  pushSubscriptionStatus: PushReminderSubscriptionStatus;
  pwaInstallGuidance: "ios_add_to_home_screen" | "none";
}) {
  const today = new Date();
  const ReminderIcon = reminderEnabled ? Bell : BellOff;
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
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: "var(--slc-text)",
            margin: 0,
          }}
        >
          오늘
        </h1>
      </div>
      <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
        <button
          type="button"
          aria-pressed={reminderEnabled}
          aria-label={reminderEnabled ? "홈 알림 끄기" : "홈 알림 켜기"}
          data-reminder-state={reminderEnabled ? "on" : "off"}
          data-push-subscription-status={pushSubscriptionStatus}
          data-testid="home-reminder-toggle"
          onClick={onToggleReminder}
          style={reminderToggleStyle(reminderEnabled)}
        >
          <ReminderIcon aria-hidden="true" size={20} strokeWidth={2.35} />
          <span
            aria-hidden="true"
            style={reminderToggleDotStyle(reminderEnabled)}
          />
        </button>
        {pwaInstallGuidance === "ios_add_to_home_screen" && (
          <p style={iosInstallHintStyle}>
            iPhone 알림은 홈 화면에 추가한 뒤 켤 수 있어요
          </p>
        )}
      </div>
    </header>
  );
}

const iosInstallHintStyle = {
  maxWidth: 132,
  margin: 0,
  color: "var(--slc-muted)",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.35,
  textAlign: "right",
} as const;

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
      style={{ display: "flex", gap: 8, padding: "0 24px 16px" }}
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
      <Link href="/add" style={emptyLinkStyle(accentColor)}>
        추가하기
      </Link>
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
  statusLabel: "예정" | "완료";
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
        padding: "12px 14px",
        borderRadius: 18,
        background: "var(--slc-surface)",
        border: "1px solid var(--slc-border)",
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
          background: statusLabel === "완료" ? "#EEF5EF" : "var(--slc-border)",
          color:
            statusLabel === "완료" ? "var(--slc-success)" : "var(--slc-muted)",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {statusLabel}
      </span>
      <Link
        href={`/schedule/${item.id}/edit`}
        aria-label={`${formatScheduleRowTitle(item)} 수정`}
        style={{
          color: "var(--slc-coral)",
          fontSize: 22,
          lineHeight: 1,
          fontWeight: 900,
          textDecoration: "none",
        }}
      >
        ›
      </Link>
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

function reminderToggleStyle(enabled: boolean) {
  return {
    width: 44,
    height: 44,
    padding: 0,
    borderRadius: 999,
    background: enabled
      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.96), var(--slc-coral-light))"
      : "rgba(255, 255, 255, 0.74)",
    border: enabled
      ? "1px solid rgba(196, 97, 74, 0.28)"
      : "1px solid var(--slc-border)",
    boxShadow: enabled
      ? "0 12px 28px rgba(196, 97, 74, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
      : "0 10px 24px rgba(42, 31, 26, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.86)",
    display: "inline-grid",
    placeItems: "center",
    color: enabled ? "var(--slc-coral)" : "var(--slc-muted)",
    fontFamily: "inherit",
    cursor: "pointer",
    position: "relative",
    backdropFilter: "blur(14px)",
  } as const;
}

function reminderToggleDotStyle(enabled: boolean) {
  return {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: enabled ? "var(--slc-coral)" : "var(--slc-muted)",
    border: "1.5px solid #fff",
    boxShadow: enabled ? "0 0 0 3px rgba(196, 97, 74, 0.12)" : "none",
  } as const;
}

function emptyLinkStyle(accentColor: string) {
  return {
    display: "inline-block",
    marginTop: 16,
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

function tabStyle(active: boolean, accentColor: string) {
  return {
    minHeight: 44,
    padding: "10px 16px",
    borderRadius: 999,
    background: active ? accentColor : "var(--slc-border)",
    color: active ? "#fff" : "var(--slc-muted)",
    border: "none",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.4s ease, color 0.4s ease",
  };
}
