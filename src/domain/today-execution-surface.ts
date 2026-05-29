import { pickHeroSurface, type HeroPriority } from "../lib/brief/priority";
import type { LegacyHomeScheduleItem } from "./care-action-home-projection";
import { isInKstDay } from "./kst-date";
import { resolveHomeFocus, type HomeFocus } from "./slc-home-focus";

export type DayOffset = 0 | 1 | 2;
type TodayItem = LegacyHomeScheduleItem;

export type HeroStory =
  | {
      kind: "countdown";
      item: TodayItem;
      nextInjection: TodayItem | null;
      focus: HomeFocus;
    }
  | { kind: "overdue_backlog"; item: TodayItem }
  | { kind: "today_pending"; item: TodayItem; focus: HomeFocus }
  | { kind: "tomorrow"; item: TodayItem; focus: HomeFocus }
  | { kind: "quiet"; focus: HomeFocus };

export type TodayExecutionSurface = {
  visibleItems: TodayItem[];
  homeFocus: HomeFocus;
  heroStory: HeroStory;
  priority: HeroPriority;
};

export function resolveTodayExecutionSurface({
  items,
  selectedDay,
  now = new Date(),
}: {
  items: TodayItem[];
  selectedDay: DayOffset;
  now?: Date;
}): TodayExecutionSurface {
  const visibleItems = items.filter((item) =>
    isInKstDay(item.scheduled_at, selectedDay, now),
  );
  const homeFocus = resolveHomeFocus(visibleItems, now);
  const heroStory = resolveTodayHeroStory({
    items: selectedDay === 0 ? items : visibleItems,
    focus: homeFocus,
    selectedDay,
    now,
  });
  const priorityItems = selectedDay === 0
    ? items.filter((item) => item.status === "missed" || isInKstDay(item.scheduled_at, 0, now))
    : visibleItems;
  const priority = pickHeroSurface({ now, cards: priorityItems });

  return { visibleItems, homeFocus, heroStory, priority };
}

export function resolveTodayHeroStory({
  items,
  focus,
  selectedDay,
  now = new Date(),
}: {
  items: TodayItem[];
  focus: HomeFocus;
  selectedDay: DayOffset;
  now?: Date;
}): HeroStory {
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
            isInKstDay(item.scheduled_at, 0, now) &&
            isWithinInjectionCountdownWindow(item.scheduled_at, now),
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
        (isInKstDay(item.scheduled_at, 0, now) &&
          new Date(item.scheduled_at).getTime() < now.getTime() &&
          item.status !== "completed"),
    );
    if (missedItems.length > 0) {
      return { kind: "overdue_backlog", item: missedItems[0] };
    }
  }

  const selectedFocusItem =
    focus.primaryItem &&
    isInKstDay(focus.primaryItem.scheduled_at, selectedDay, now)
      ? focus.primaryItem
      : null;
  const selectedPending =
    selectedFocusItem ??
    pending.find((item) => isInKstDay(item.scheduled_at, selectedDay, now));
  if (selectedPending) {
    const selectedFocus = selectedFocusItem
      ? focus
      : resolveHomeFocus([selectedPending], now);
    return {
      kind: "today_pending",
      item: selectedPending,
      focus: { ...selectedFocus, primaryItem: selectedPending },
    };
  }

  return { kind: "quiet", focus };
}

function resolveNextInjection(
  primaryItem: TodayItem | null,
  items: TodayItem[],
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

function isWithinInjectionCountdownWindow(scheduledAt: string, now: Date) {
  const secondsUntil = Math.max(
    0,
    Math.round((new Date(scheduledAt).getTime() - now.getTime()) / 1_000),
  );
  return secondsUntil > 0 && secondsUntil <= 3600;
}
