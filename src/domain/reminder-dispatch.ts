export type ReminderCandidate = {
  cardId: string;
  title: string;
  scheduledAt: string;
  recipientEmail: string;
};

export type ReminderEmail = {
  subject: string;
  text: string;
  html: string;
};

const REMINDER_LEAD_MINUTES = 30;
const WINDOW_RADIUS_MINUTES = 1;

export function getReminderWindow(now: Date) {
  const center = now.getTime() + REMINDER_LEAD_MINUTES * 60_000;
  return {
    startsAt: new Date(center - WINDOW_RADIUS_MINUTES * 60_000).toISOString(),
    endsAt: new Date(center + WINDOW_RADIUS_MINUTES * 60_000).toISOString(),
  };
}

export function shouldDispatchReminder(candidate: ReminderCandidate, now: Date) {
  const { startsAt, endsAt } = getReminderWindow(now);
  const scheduledAt = new Date(candidate.scheduledAt).getTime();
  return scheduledAt >= new Date(startsAt).getTime() && scheduledAt <= new Date(endsAt).getTime();
}

export function buildReminderEmail({
  candidate,
  appUrl,
}: {
  candidate: ReminderCandidate;
  appUrl: string;
}): ReminderEmail {
  const homeUrl = new URL('/home', normalizeBaseUrl(appUrl)).toString();
  const scheduledLabel = formatKoreanTime(candidate.scheduledAt);
  const subject = '[Fevio] 확인할 주사 시간이 가까워졌어요';
  const text = [
    'Fevio에서 확인할 시간이 가까운 케어 항목을 알려드려요.',
    '',
    `카드: ${candidate.title}`,
    `시간: ${scheduledLabel}`,
    '',
    `앱에서 확인하기: ${homeUrl}`,
    '',
    '이 메일은 사용자가 확정한 카드 기준의 1회 리마인드예요. 병원 안내와 직접 확인한 내용을 기준으로 차분히 확인해 주세요.',
  ].join('\n');

  return {
    subject,
    text,
    html: [
      '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.55;color:#1f2937">',
      '<p>Fevio에서 확인할 시간이 가까운 케어 항목을 알려드려요.</p>',
      `<p><strong>카드:</strong> ${escapeHtml(candidate.title)}<br/><strong>시간:</strong> ${escapeHtml(scheduledLabel)}</p>`,
      `<p><a href="${escapeHtml(homeUrl)}">앱에서 확인하기</a></p>`,
      '<p style="color:#6b7280;font-size:13px">이 메일은 사용자가 확정한 카드 기준의 1회 리마인드예요. 병원 안내와 직접 확인한 내용을 기준으로 차분히 확인해 주세요.</p>',
      '</div>',
    ].join(''),
  };
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

function formatKoreanTime(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '00';
  const hour24 = Number(part('hour'));
  const period = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12 || 12;
  return `${Number(part('year'))}. ${Number(part('month'))}. ${Number(part('day'))}. ${period} ${hour12}:${part('minute')}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
