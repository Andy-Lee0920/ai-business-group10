import { buildReminderEmail, getReminderWindow, type ReminderCandidate } from '../domain/reminder-dispatch';

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

export type ReminderMailer = {
  send(input: { to: string; subject: string; text: string; html: string }): Promise<{ providerMessageId: string | null }>;
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown reminder provider error';
}
