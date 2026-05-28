"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  enablePushReminderSubscription,
  getPwaInstallGuidance,
  type PushReminderSubscriptionStatus,
} from "../../lib/pwa-push-client";

const HOME_REMINDER_SETTING_KEY = "fevio_home_reminder_enabled";

type PwaInstallGuidance = "ios_add_to_home_screen" | "none";

export function PushPermissionCta() {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [pushSubscriptionStatus, setPushSubscriptionStatus] =
    useState<PushReminderSubscriptionStatus>("idle");
  const [pwaInstallGuidance, setPwaInstallGuidance] =
    useState<PwaInstallGuidance>("none");
  const [reminderPreferenceLoaded, setReminderPreferenceLoaded] =
    useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HOME_REMINDER_SETTING_KEY);
      if (stored === "on") setReminderEnabled(true);
      if (stored === "off") setReminderEnabled(false);
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

  const handleReminderToggle = useCallback(async () => {
    if (reminderEnabled) {
      setReminderEnabled(false);
      setPushSubscriptionStatus("idle");
      return;
    }

    if (pwaInstallGuidance === "ios_add_to_home_screen") {
      setPushSubscriptionStatus("ios_install_required");
      return;
    }

    setPushSubscriptionStatus("requesting");
    const status = await enablePushReminderSubscription();
    setPushSubscriptionStatus(status);
    if (status === "subscribed") setReminderEnabled(true);
  }, [pwaInstallGuidance, reminderEnabled]);

  const ReminderIcon = reminderEnabled ? Bell : BellOff;
  const showInstallGuidance =
    pwaInstallGuidance === "ios_add_to_home_screen" ||
    pushSubscriptionStatus === "ios_install_required";

  return (
    <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
      <button
        type="button"
        aria-pressed={reminderEnabled}
        aria-label={reminderEnabled ? "홈 알림 끄기" : "홈 알림 켜기"}
        data-reminder-state={reminderEnabled ? "on" : "off"}
        data-push-subscription-status={pushSubscriptionStatus}
        data-testid="home-reminder-toggle"
        onClick={handleReminderToggle}
        style={reminderToggleStyle(reminderEnabled)}
      >
        <ReminderIcon aria-hidden="true" size={20} strokeWidth={2.35} />
        <span
          aria-hidden="true"
          style={reminderToggleDotStyle(reminderEnabled)}
        />
      </button>
      {showInstallGuidance && (
        <p style={inlineHintStyle}>
          iPhone 알림은 홈 화면에 추가한 뒤 켤 수 있어요
        </p>
      )}
      {pushSubscriptionStatus === "permission_denied" && (
        <p style={inlineHintStyle}>
          알림 권한이 꺼져 있어요. 브라우저 설정에서 다시 켤 수 있어요
        </p>
      )}
    </div>
  );
}

function reminderToggleStyle(enabled: boolean) {
  return {
    position: "relative",
    width: 44,
    height: 44,
    border: "none",
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: enabled ? "var(--slc-text)" : "rgba(255, 255, 255, 0.72)",
    color: enabled ? "#fff" : "var(--slc-text)",
    boxShadow: enabled
      ? "0 10px 24px rgba(39, 32, 28, 0.18)"
      : "0 8px 20px rgba(111, 77, 58, 0.12)",
    cursor: "pointer",
    transition: "background 0.2s ease, color 0.2s ease",
  } as const;
}

function reminderToggleDotStyle(enabled: boolean) {
  return {
    position: "absolute",
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 999,
    background: enabled ? "#80D39B" : "var(--slc-muted)",
    border: "1.5px solid rgba(255,255,255,0.92)",
  } as const;
}

const inlineHintStyle = {
  maxWidth: 152,
  margin: 0,
  color: "var(--slc-muted)",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.35,
  textAlign: "right",
} as const;
