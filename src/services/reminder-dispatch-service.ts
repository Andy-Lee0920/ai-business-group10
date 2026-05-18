import { buildReminderEmail, buildReminderPushPayload, getReminderPushWindows, getReminderWindow, type ReminderCandidate, type ReminderPushPayload, type ReminderPushWindow } from '../domain/reminder-dispatch';

export type ReminderDispatchWindow = {
  startsAt: string;
  endsAt: string;
};

export type ClaimedDispatch = {
  claimed: boolean;
  dispatchId?: string;
};

export type ReminderDispatchStore = {
  findDueEmailCandidates(window: ReminderDispatchWindow): Promise<ReminderCandidate[]>;
  claimEmailDispatch(input: { cardId: string; scheduledAt: string; recipientEmail: string }): Promise<ClaimedDispatch>;
  markEmailDispatchSent(input: { dispatchId: string; providerMessageId: string | null }): Promise<void>;
  markEmailDispatchFailed(input: { dispatchId: string; error: string }): Promise<void>;
};

export type ReminderPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type ReminderPushCandidate = ReminderCandidate & {
  pushSubscriptions: ReminderPushSubscription[];
};

export type ReminderPushDispatchStore = {
  findDuePushCandidates(window: ReminderPushWindow): Promise<ReminderPushCandidate[]>;
  claimPushDispatch(input: { cardId: string; scheduledAt: string; channel: ReminderPushWindow['channel'] }): Promise<ClaimedDispatch>;
  markPushDispatchSent(input: { dispatchId: string; providerMessageId: string | null }): Promise<void>;
  markPushDispatchFailed(input: { dispatchId: string; error: string }): Promise<void>;
};

export type ReminderMailer = {
  send(input: { to: string; subject: string; text: string; html: string }): Promise<{ providerMessageId: string | null }>;
};

export type ReminderPusher = {
  send(input: { subscription: ReminderPushSubscription; payload: ReminderPushPayload }): Promise<{ providerMessageId: string | null }>;
};

export type ReminderDispatchResult = {
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
};

export async function dispatchDueEmailReminders({
  store,
  mailer,
  now,
  appUrl,
}: {
  store: ReminderDispatchStore;
  mailer: ReminderMailer;
  now: Date;
  appUrl: string;
}): Promise<ReminderDispatchResult> {
  const candidates = await store.findDueEmailCandidates(getReminderWindow(now));
  const result: ReminderDispatchResult = { candidates: candidates.length, sent: 0, skipped: 0, failed: 0 };

  for (const candidate of candidates) {
    const claim = await store.claimEmailDispatch({
      cardId: candidate.cardId,
      scheduledAt: candidate.scheduledAt,
      recipientEmail: candidate.recipientEmail,
    });

    if (!claim.claimed || !claim.dispatchId) {
      result.skipped += 1;
      continue;
    }

    try {
      const email = buildReminderEmail({ candidate, appUrl });
      const provider = await mailer.send({
        to: candidate.recipientEmail,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      await store.markEmailDispatchSent({ dispatchId: claim.dispatchId, providerMessageId: provider.providerMessageId });
      result.sent += 1;
    } catch (error) {
      await store.markEmailDispatchFailed({ dispatchId: claim.dispatchId, error: errorMessage(error) });
      result.failed += 1;
    }
  }

  return result;
}

export async function dispatchDuePushReminders({
  store,
  pusher,
  now,
  appUrl,
}: {
  store: ReminderPushDispatchStore;
  pusher: ReminderPusher;
  now: Date;
  appUrl: string;
}): Promise<ReminderDispatchResult> {
  const result: ReminderDispatchResult = { candidates: 0, sent: 0, skipped: 0, failed: 0 };

  for (const window of getReminderPushWindows(now)) {
    const candidates = await store.findDuePushCandidates(window);
    result.candidates += candidates.length;

    for (const candidate of candidates) {
      const claim = await store.claimPushDispatch({
        cardId: candidate.cardId,
        scheduledAt: candidate.scheduledAt,
        channel: window.channel,
      });

      if (!claim.claimed || !claim.dispatchId) {
        result.skipped += 1;
        continue;
      }

      try {
        const payload = buildReminderPushPayload({ candidate, appUrl });
        const providerIds: string[] = [];
        for (const subscription of candidate.pushSubscriptions) {
          const provider = await pusher.send({ subscription, payload });
          if (provider.providerMessageId) providerIds.push(provider.providerMessageId);
        }
        await store.markPushDispatchSent({ dispatchId: claim.dispatchId, providerMessageId: providerIds[0] ?? null });
        result.sent += 1;
      } catch (error) {
        await store.markPushDispatchFailed({ dispatchId: claim.dispatchId, error: errorMessage(error) });
        result.failed += 1;
      }
    }
  }

  return result;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown reminder provider error';
}
