import type { CoupleJournalEntryDraft } from '../types/journal.types';

export function normalizeJournalDraftForAuthor(draft: CoupleJournalEntryDraft): CoupleJournalEntryDraft {
  if (draft.authorRole !== 'partner') return draft;
  return { ...draft, painScore: null };
}
