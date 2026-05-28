import type { ReminderMailer } from '../services/reminder-dispatch-service';

type ResendResponse = {
  id?: string;
  message?: string;
  error?: { message?: string };
};

export class ResendReminderMailer implements ReminderMailer {
  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
  ) {}

  async send(input: { to: string; subject: string; text: string; html: string }) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as ResendResponse;
    if (!response.ok) throw new Error(payload.error?.message ?? payload.message ?? 'Resend reminder email failed');

    return { providerMessageId: payload.id ?? null };
  }
}

export function requireReminderMailerConfig(source: Record<string, string | undefined> = process.env) {
  const apiKey = source.RESEND_API_KEY?.trim();
  const fromEmail = source.REMINDER_FROM_EMAIL?.trim();
  const missing = [
    apiKey ? null : 'RESEND_API_KEY',
    fromEmail ? null : 'REMINDER_FROM_EMAIL',
  ].filter(Boolean);

  if (missing.length > 0) throw new Error(`Missing reminder email config: ${missing.join(', ')}`);
  return { apiKey: apiKey!, fromEmail: fromEmail! };
}
