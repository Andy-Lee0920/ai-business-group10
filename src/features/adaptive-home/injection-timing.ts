export function secondsUntilInjection(scheduledAt: string): number {
  return Math.max(0, Math.round((new Date(scheduledAt).getTime() - Date.now()) / 1_000));
}

export function isInInjectionCountdownWindow(scheduledAt: string | null): boolean {
  if (!scheduledAt) return false;
  const secs = secondsUntilInjection(scheduledAt);
  return secs > 0 && secs <= 3600;
}

export function minutesUntilInjection(scheduledAt: string): number {
  return Math.ceil(secondsUntilInjection(scheduledAt) / 60);
}
