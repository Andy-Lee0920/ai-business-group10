'use client';

import useSWR from 'swr';
import type { CommunityPostListItem } from '../../../src/types/community.types';

type PartnerCommunityPayload = {
  posts: CommunityPostListItem[];
};

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((response) => (
  response.ok ? response.json() : Promise.reject(new Error('partner_community_unavailable'))
));

export function PartnerCommunityClient({ token }: { token: string }) {
  const { data, error, isLoading } = useSWR<PartnerCommunityPayload>(
    `/api/partner/${encodeURIComponent(token)}/community`,
    fetcher,
    { refreshInterval: 30_000 },
  );

  return (
    <section className="partner-community-card" aria-labelledby="partner-community-title">
      <p className="eyebrow">커뮤니티</p>
      <h3 id="partner-community-title">오늘의 파트너 커뮤니티</h3>
      {isLoading ? <p className="lead">파트너 글을 불러오는 중이에요.</p> : null}
      {error ? <p className="notice">파트너 커뮤니티를 불러오지 못했어요.</p> : null}
      {!isLoading && !error && data?.posts.length === 0 ? (
        <p className="lead">아직 공유된 파트너 글이 없어요.</p>
      ) : null}
      <div className="partner-community-list">
        {data?.posts.map((post) => (
          <article className="partner-community-post" key={post.id}>
            <div className="partner-community-post__meta">
              <span>{labelForSubCategory(post.subCategory)}</span>
              {post.isOfficial ? <span className="badge">운영팀 안내</span> : null}
            </div>
            <p>{post.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function labelForSubCategory(value: CommunityPostListItem['subCategory']) {
  if (value === 'pain') return '통증';
  if (value === 'worry') return '걱정';
  if (value === 'tip') return '팁';
  return '오늘';
}
