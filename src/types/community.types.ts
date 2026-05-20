export type CommunityActorRole = 'primary' | 'partner';
export type CommunityAudience = 'primary_feed' | 'partner_feed';
export type CommunityModerationStatus = 'pending' | 'approved' | 'rejected';
export type CommunitySubCategory = 'pain' | 'worry' | 'today' | 'tip';

export interface CommunityPostDraft {
  body: string;
  mood: string | null;
  subCategory: CommunitySubCategory;
  audience: CommunityAudience;
}

export interface CommunityPostListItem {
  id: string;
  body: string;
  mood: string | null;
  subCategory: CommunitySubCategory;
  audience: CommunityAudience;
  moderationStatus: CommunityModerationStatus;
  isOfficial: boolean;
  createdAt: string;
  empathyCount?: number;
  empathyActive?: boolean;
}
