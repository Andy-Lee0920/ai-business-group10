export type JournalAuthorRole = 'primary' | 'partner';
export type JournalMood = 'calm' | 'tired' | 'worried' | 'hopeful' | 'unknown';

export interface CoupleJournalEntryDraft {
  body: string;
  mood: JournalMood | null;
  painScore: number | null;
  photoUrls: string[];
  authorRole: JournalAuthorRole;
}
