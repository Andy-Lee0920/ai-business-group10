import { describe, expect, it } from 'vitest';
import {
  fetchSplitReviewByDraftId,
  isFetchableDraftId,
  type SplitReviewSupabaseClient,
} from '../../src/lib/split-review-source';

describe('split-review server source fetch', () => {
  it('fetches only draft, visit input, and split candidates for pre-confirm render', async () => {
    const tables: string[] = [];
    const client = {
      from(table: 'action_split_drafts' | 'couple_members' | 'visit_inputs' | 'split_candidates') {
        tables.push(table);
        if (table === 'action_split_drafts') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'draft-1', visit_input_id: 'visit-1', couple_id: 'couple-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'couple_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: { id: 'primary-member-1' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'visit_inputs') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'visit-1', raw_text: '오늘 밤 10시 오비드렐 주사\n남편이 준비 도와주기' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    source_text: '오늘 밤 10시 오비드렐 주사',
                    source_offset_start: 0,
                    source_offset_end: 15,
                    assigned_to: 'my_action',
                    suggested_card_type: 'injection',
                    order_index: 0,
                    scheduled_at: null,
                    care_date: null,
                    description: null,
                    user_marked_important: true,
                    partner_visible: false,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      },
    } as unknown as SplitReviewSupabaseClient;

    const review = await fetchSplitReviewByDraftId(client, 'draft-1', 'primary-user-1');

    expect(review).toMatchObject({
      draftId: 'draft-1',
      visitInputId: 'visit-1',
      rawText: '오늘 밤 10시 오비드렐 주사\n남편이 준비 도와주기',
      candidates: [
        {
          sourceText: '오늘 밤 10시 오비드렐 주사',
          sourceOffsetStart: 0,
          sourceOffsetEnd: 15,
          assignedTo: 'my_action',
          suggestedCardType: 'injection',
        },
      ],
    });
    expect(tables).toEqual(['action_split_drafts', 'couple_members', 'visit_inputs', 'split_candidates']);
    expect(tables).not.toContain('care_action_cards');
  });

  it('does not expose raw visit input text to a non-primary member even when draft RLS is couple-scoped', async () => {
    const tables: string[] = [];
    const client = {
      from(table: 'action_split_drafts' | 'couple_members' | 'visit_inputs' | 'split_candidates') {
        tables.push(table);
        if (table === 'action_split_drafts') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'draft-1', visit_input_id: 'visit-1', couple_id: 'couple-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'couple_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`raw text fetch should stop before ${table}`);
      },
    } as unknown as SplitReviewSupabaseClient;

    const review = await fetchSplitReviewByDraftId(client, 'draft-1', 'partner-user-1');

    expect(review).toBeNull();
    expect(tables).toEqual(['action_split_drafts', 'couple_members']);
    expect(tables).not.toContain('visit_inputs');
    expect(tables).not.toContain('split_candidates');
    expect(tables).not.toContain('care_action_cards');
  });

  it('does not attempt a server fetch for non-UUID local handoff draft IDs', () => {
    expect(isFetchableDraftId('split-review-fixture')).toBe(false);
    expect(isFetchableDraftId('1f0e7024-9ca1-4f4d-9f2a-8a76b563bb42')).toBe(true);
  });
});
