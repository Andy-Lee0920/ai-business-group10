import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, Fragment } from 'react';
import { COUPLE_AVATAR_VIEWBOX, CoupleAvatarPair, PartnerAvatar, PrimaryUserAvatar } from '../../src/design/couple-avatars';

const ALLOWED_TAGS = new Set(['svg', 'circle', 'rect', 'ellipse', 'line']);

describe('Couple Avatar System', () => {
  it('renders geometric patient, partner, and couple avatars with one shared viewBox and no path data', () => {
    const markup = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        createElement(PrimaryUserAvatar),
        createElement(PartnerAvatar),
        createElement(CoupleAvatarPair),
      ),
    );

    expect(markup).not.toContain('<path');
    expect(markup).toContain(`viewBox="${COUPLE_AVATAR_VIEWBOX}"`);

    const viewBoxes = [...markup.matchAll(/viewBox="([^"]+)"/gu)].map((match) => match[1]);
    expect(viewBoxes).toEqual([COUPLE_AVATAR_VIEWBOX, COUPLE_AVATAR_VIEWBOX, COUPLE_AVATAR_VIEWBOX]);

    const tags = [...markup.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b/gu)].map((match) => match[1]);
    expect(tags.every((tag) => ALLOWED_TAGS.has(tag))).toBe(true);
    expect(markup.match(/aria-hidden="true"/gu)?.length).toBe(3);
  });

  it('can become accessible with aria-label without adding hidden title nodes', () => {
    const markup = renderToStaticMarkup(createElement(PartnerAvatar, { label: '파트너 아바타' }));

    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="파트너 아바타"');
    expect(markup).not.toContain('<title');
  });
});
