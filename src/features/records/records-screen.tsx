'use client';
import { useState } from 'react';
import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/mvp.types';
import type { CoupleJournalEntry } from '../../types/journal.types';
import type { CommunityActorRole, CommunityAudience, CommunityPostListItem } from '../../types/community.types';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { slcAssets } from '../../design/slc-assets';
import { RECORDS_SURFACE_COPY, countRecordsActivity, defaultRecordsTab, type RecordsTab } from '../../domain/records-surface-contract';
import { CommunityPreview } from './community/community-preview';
import { JournalPreview } from './journal/journal-preview';

interface RecordsScreenProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates?: ClinicUpdate[];
  journalEntries?: CoupleJournalEntry[];
  communityPosts?: CommunityPostListItem[];
  communityAudience?: CommunityAudience;
  actorRole?: CommunityActorRole;
  isPartnerLinked?: boolean;
  coupleId?: string | null;
  initialTab?: RecordsTab;
}

export function RecordsScreen(props: RecordsScreenProps) {
  const {
    items,
    journalEntries = [],
    communityPosts = [],
    communityAudience = 'primary_feed',
    actorRole: _actorRole = 'primary',
    isPartnerLinked = false,
    coupleId = null,
    initialTab,
  } = props;
  const recentActivityCount = countRecordsActivity({ journalEntries, communityPosts });
  const upcomingCount = items.filter((item) => item.status !== 'completed').length;
  const [activeTab, setActiveTab] = useState<RecordsTab>(initialTab ?? defaultRecordsTab(isPartnerLinked));

  return (
    <AmbientStoryBackground
      asset={slcAssets.home.missedRecovery}
      intensity="subtle"
      style={{ minHeight: '100dvh', padding: '54px 0 112px' }}
    >
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>{RECORDS_SURFACE_COPY.header.eyebrow}</p>
          <h1 style={titleStyle}>{RECORDS_SURFACE_COPY.header.title}</h1>
          <p style={leadStyle}>{RECORDS_SURFACE_COPY.header.lead(recentActivityCount)}</p>
        </div>
      </header>

      <nav aria-label="기록 화면" style={tabShellStyle}>
        <button
          type="button"
          data-testid="records-subtab-journal"
          aria-pressed={activeTab === 'journal'}
          onClick={() => setActiveTab('journal')}
          style={activeTab === 'journal' ? activeTabStyle : tabStyle}
        >
          {RECORDS_SURFACE_COPY.tabs.journal}
        </button>
        <button
          type="button"
          data-testid="records-subtab-community"
          aria-pressed={activeTab === 'community'}
          onClick={() => setActiveTab('community')}
          style={activeTab === 'community' ? activeTabStyle : tabStyle}
        >
          {RECORDS_SURFACE_COPY.tabs.community}
        </button>
      </nav>


      {activeTab === 'journal' ? (
        <JournalPreview
          entries={journalEntries}
          upcomingCount={upcomingCount}
          isPartnerLinked={isPartnerLinked}
          coupleId={coupleId}
          autoOpenCompose={isPartnerLinked && journalEntries.length === 0}
        />
      ) : (
        <CommunityPreview posts={communityPosts} audience={communityAudience} />
      )}
    </AmbientStoryBackground>
  );
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, padding: '0 24px 18px' } as const;
const eyebrowStyle = { fontSize: 13, color: '#B5A89E', fontWeight: 800, margin: '0 0 4px' } as const;
const titleStyle = { fontSize: 30, fontWeight: 950, color: 'var(--slc-text)', margin: 0, letterSpacing: '-0.06em', lineHeight: 1 } as const;
const leadStyle = { maxWidth: 310, margin: '9px 0 0', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 700, lineHeight: 1.45 } as const;
const tabShellStyle = { position: 'sticky', top: 0, zIndex: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '0 16px 14px', padding: 6, borderRadius: 999, background: 'rgba(255,255,255,0.82)', border: '1px solid var(--slc-border)', backdropFilter: 'blur(16px)' } as const;
const tabStyle = { border: 0, borderRadius: 999, background: 'transparent', color: 'var(--slc-muted)', minHeight: 42, fontSize: 14, fontWeight: 900 } as const;
const activeTabStyle = { ...tabStyle, background: 'var(--slc-coral-gradient)', color: '#fff', boxShadow: '0 10px 22px rgba(185, 97, 75, 0.18)' } as const;
