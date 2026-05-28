import webPush, { type PushSubscription } from 'web-push';
import type { ReminderPushPayload } from '../domain/reminder-dispatch';
import type { ReminderPushSubscription, ReminderPusher } from '../services/reminder-dispatch-service';

export type WebPushConfig = {
  subject: string;
  publicKey: string;
  privateKey: string;
};

export class WebPushReminderPusher implements ReminderPusher {
  constructor(private readonly config: WebPushConfig) {
    webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  }

  async send({ subscription, payload }: { subscription: ReminderPushSubscription; payload: ReminderPushPayload }) {
    const response = await webPush.sendNotification(toWebPushSubscription(subscription), JSON.stringify(payload));
    const location = getHeader(response.headers, 'location');
    return { providerMessageId: location ?? `${response.statusCode ?? 'push'}:${subscription.endpoint}` };
  }
}

export function requireWebPushConfig(): WebPushConfig {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || process.env.WEB_PUSH_SUBJECT?.trim();
  const missing = [
    publicKey ? null : 'VAPID_PUBLIC_KEY',
    privateKey ? null : 'VAPID_PRIVATE_KEY',
    subject ? null : 'VAPID_SUBJECT',
  ].filter(Boolean);

  if (missing.length > 0) throw new Error(`Missing web push config: ${missing.join(', ')}`);
  return { publicKey: publicKey!, privateKey: privateKey!, subject: subject! };
}

function toWebPushSubscription(subscription: ReminderPushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };
}

function getHeader(headers: unknown, name: string) {
  if (!headers || typeof headers !== 'object') return null;
  const record = headers as Record<string, unknown>;
  const value = record[name] ?? record[name.toLowerCase()];
  return typeof value === 'string' && value.trim() ? value : null;
}
