const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getKstDayStart(offset = 0, now = new Date()): Date {
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  const utcMidnightForKstDate = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + offset,
  );
  return new Date(utcMidnightForKstDate - KST_OFFSET_MS);
}

export function getKstDayEnd(offset = 0, now = new Date()): Date {
  return new Date(getKstDayStart(offset + 1, now).getTime() - 1);
}

export function isInKstDay(value: string | Date, offset = 0, now = new Date()): boolean {
  const date = typeof value === 'string' ? new Date(value) : value;
  const time = date.getTime();
  if (Number.isNaN(time)) return false;
  const start = getKstDayStart(offset, now).getTime();
  return time >= start && time < start + ONE_DAY_MS;
}

export function isSameKstDate(left: string | Date, right = new Date()): boolean {
  return getKstDateKey(left) === getKstDateKey(right);
}

export function isTomorrowKstDate(value: string | Date, now = new Date()): boolean {
  return getKstDateKey(value) === getKstDateKey(getKstDayStart(1, now));
}

export function formatKstTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

export function formatKstDateLabel(value = new Date()): string {
  return value.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  });
}

function getKstDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
}
