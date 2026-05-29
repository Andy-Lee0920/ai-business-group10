import { describe, expect, it } from "vitest";
import type { LegacyHomeScheduleItem } from "../../src/domain/care-action-home-projection";
import { resolveTodayExecutionSurface } from "../../src/domain/today-execution-surface";

const NOW = new Date("2026-05-28T00:00:00.000Z");

describe("resolveTodayExecutionSurface", () => {
  it("promotes a near injection into the execution countdown hero", () => {
    const items = [
      item("near-injection", 30, "injection"),
      item("next-injection", 120, "injection"),
    ];

    const surface = resolveTodayExecutionSurface({
      items,
      selectedDay: 0,
      now: NOW,
    });

    expect(surface.visibleItems.map((value) => value.id)).toEqual([
      "near-injection",
      "next-injection",
    ]);
    expect(surface.priority).toMatchObject({
      heroSurface: "execution",
      overrideReason: "within_60m",
      cardId: "near-injection",
    });
    expect(surface.heroStory.kind).toBe("countdown");
    if (surface.heroStory.kind !== "countdown") return;
    expect(surface.heroStory.item.id).toBe("near-injection");
    expect(surface.heroStory.nextInjection?.id).toBe("next-injection");
    expect(surface.heroStory.focus.kind).toBe("medication_due");
  });

  it("keeps overdue same-day work as the backlog hero before routine pending work", () => {
    const surface = resolveTodayExecutionSurface({
      items: [
        item("overdue", -5, "medication"),
        item("later", 180, "clinic"),
      ],
      selectedDay: 0,
      now: NOW,
    });

    expect(surface.priority).toMatchObject({
      heroSurface: "execution",
      overrideReason: "overdue",
      cardId: "overdue",
    });
    expect(surface.heroStory.kind).toBe("overdue_backlog");
    if (surface.heroStory.kind !== "overdue_backlog") return;
    expect(surface.heroStory.item.id).toBe("overdue");
  });

  it("keeps tomorrow out of the default today execution surface after today's work is completed", () => {
    const surface = resolveTodayExecutionSurface({
      items: [
        item("done-today", -30, "medication", "completed"),
        item("clinic-tomorrow", 24 * 60 + 90, "clinic"),
      ],
      selectedDay: 0,
      now: NOW,
    });

    expect(surface.priority.heroSurface).toBe("brief");
    expect(surface.visibleItems.map((value) => value.id)).toEqual(["done-today"]);
    expect(surface.heroStory.kind).toBe("quiet");
  });

  it("filters visible items by the selected KST day", () => {
    const surface = resolveTodayExecutionSurface({
      items: [
        item("today", 90, "medication"),
        item("tomorrow", 24 * 60 + 90, "medication"),
      ],
      selectedDay: 1,
      now: NOW,
    });

    expect(surface.visibleItems.map((value) => value.id)).toEqual(["tomorrow"]);
    expect(surface.heroStory.kind).toBe("today_pending");
    if (surface.heroStory.kind !== "today_pending") return;
    expect(surface.heroStory.item.id).toBe("tomorrow");
  });

  it("does not promote a near tomorrow card while the user is looking at today's execution surface", () => {
    const lateToday = new Date("2026-05-28T14:30:00.000Z"); // 23:30 KST
    const surface = resolveTodayExecutionSurface({
      items: [
        {
          ...item("soon-tomorrow", 0, "medication"),
          scheduled_at: new Date(lateToday.getTime() + 30 * 60_000).toISOString(),
        },
      ],
      selectedDay: 0,
      now: lateToday,
    });

    expect(surface.visibleItems).toEqual([]);
    expect(surface.priority.heroSurface).toBe("brief");
    expect(surface.heroStory.kind).toBe("quiet");
  });
});

function item(
  id: string,
  minutesFromNow: number,
  type: LegacyHomeScheduleItem["type"],
  status: LegacyHomeScheduleItem["status"] = "upcoming",
): LegacyHomeScheduleItem {
  const scheduledAt = new Date(
    NOW.getTime() + minutesFromNow * 60_000,
  ).toISOString();
  return {
    id,
    patient_id: "patient-1",
    medication_id: null,
    type,
    title: `${id} title`,
    dose: null,
    unit: null,
    scheduled_at: scheduledAt,
    status,
    source: "manual",
    created_at: NOW.toISOString(),
  };
}
