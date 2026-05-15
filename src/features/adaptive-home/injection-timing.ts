export function isInInjectionCountdownWindow(scheduledAt: string | null): boolean {
  if (!scheduledAt) return false;
  const now = Date.now();
  const scheduled = new Date(scheduledAt).getTime();
  const windowStart = scheduled - 60 * 60 * 1000;
  return now >= windowStart && now < scheduled;
}

export function minutesUntilInjection(scheduledAt: string): number {
  return Math.max(0, Math.round((new Date(scheduledAt).getTime() - Date.now()) / 60_000));
}
